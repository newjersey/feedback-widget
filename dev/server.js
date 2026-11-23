// Local development server for the feedback widget.
//
// Serves the widget and a dev page, and stands in for the Feedback API
// (https://github.com/newjersey/feedback-api) so the full rating -> comment ->
// email flow works without AWS access and without writing to the prod sheet.
//
// The widget source is not modified: when feedback-widget.js (or .min.js) is
// served, the production API_URL is swapped for the local mock at /api.
//
// Usage: npm run dev -- [--port=3000] [--fail=rating,comment,email]
//                       [--fail-mode=error|network] [--delay=ms]

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

// Matches `const API_URL = "..."` in the source and `API_URL="..."` in the
// minified build. The value is replaced whatever it is, so this keeps working
// if the production URL changes.
const API_URL_DECLARATION = /(\bAPI_URL\s*=\s*)"[^"]*"/;
const MOCK_API_PATH = "/api";
const ROOT = path.resolve(__dirname, "..");
const ENDPOINTS = ["rating", "comment", "email"];
const FAIL_MODES = ["error", "network"];

// Only these files are served, so nothing else in the repo is exposed.
const STATIC_FILES = {
  "/": { file: "dev/index.html", type: "text/html" },
  "/feedback-widget.html": { file: "feedback-widget.html", type: "text/html" },
  "/feedback-widget.js": {
    file: "feedback-widget.js",
    type: "text/javascript",
    rewriteApiUrl: true,
  },
  "/feedback-widget.min.js": {
    file: "feedback-widget.min.js",
    type: "text/javascript",
    rewriteApiUrl: true,
  },
};

// Matches the headers the real API returns (see feedback-api responseUtils.ts)
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const log = (message) => {
  process.stdout.write(`${message}\n`);
};

const parseArgs = (argv) => {
  const options = { port: 3000, fail: [], failMode: "error", delay: 0 };
  for (const arg of argv) {
    const [key, value = ""] = arg.replace(/^--/, "").split("=");
    if (key === "port") {
      options.port = Number(value);
    } else if (key === "fail") {
      options.fail = value.split(",").filter(Boolean);
    } else if (key === "fail-mode") {
      options.failMode = value;
    } else if (key === "delay") {
      options.delay = Number(value);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  const unknownEndpoints = options.fail.filter((e) => !ENDPOINTS.includes(e));
  if (unknownEndpoints.length > 0) {
    const accepted = ENDPOINTS.join(", ");
    throw new Error(
      `--fail accepts ${accepted}; got ${unknownEndpoints.join(", ")}`
    );
  }
  if (!FAIL_MODES.includes(options.failMode)) {
    throw new Error(`--fail-mode must be one of ${FAIL_MODES.join(", ")}`);
  }
  if (!Number.isInteger(options.port) || options.port < 0) {
    throw new Error("--port must be a non-negative integer");
  }
  if (!Number.isFinite(options.delay) || options.delay < 0) {
    throw new Error("--delay must be a non-negative number of milliseconds");
  }
  return options;
};

class ValidationError extends Error {}

// In-memory stand-in for the Google Sheet. Like the real API, feedbackId is
// the sheet row number, and row 1 is the header row.
const createStore = () => {
  const rows = new Map();
  let nextId = 2;

  return {
    rows,
    create(record) {
      const id = nextId++;
      rows.set(id, { timestamp: new Date().toISOString(), ...record });
      return id;
    },
    // The real API writes to whatever row it is given, even an empty one, so
    // unknown IDs are accepted here too.
    update(id, field, value) {
      rows.set(id, { ...rows.get(id), [field]: value });
      return id;
    },
  };
};

// Mirrors the validation in feedback-api src/functions/*.ts
const HANDLERS = {
  rating(store, { pageURL, rating }) {
    if (pageURL == null) {
      throw new ValidationError("Submission is missing page URL");
    }
    if (rating == null) {
      throw new ValidationError("Submission is missing rating value");
    }
    return store.create({ pageURL, rating });
  },
  comment(store, { feedbackId, comment, pageURL, rating }) {
    if (comment == null) {
      throw new ValidationError("Submission is missing comment");
    }
    if (feedbackId != null) {
      return store.update(Number(feedbackId), "comment", comment.trim());
    }
    if (pageURL != null && rating != null) {
      return store.create({ pageURL, rating, comment: comment.trim() });
    }
    throw new ValidationError(
      "If submission is missing feedbackId, then it must include pageURL and rating."
    );
  },
  email(store, { email, feedbackId }) {
    if (feedbackId == null) {
      throw new ValidationError("Submission is missing feedback ID");
    }
    if (email == null) {
      throw new ValidationError("Submission is missing email value");
    }
    return store.update(Number(feedbackId), "email", email);
  },
};

const sendJson = (res, statusCode, body) => {
  res.writeHead(statusCode, {
    ...CORS_HEADERS,
    "Content-Type": "application/json",
  });
  res.end(JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });

const serveStatic = ({ res, entry, logger }) => {
  let content = fs.readFileSync(path.join(ROOT, entry.file), "utf8");
  if (entry.rewriteApiUrl) {
    if (!API_URL_DECLARATION.test(content)) {
      // Fail loudly rather than silently sending requests to production.
      const message = `${entry.file} no longer declares API_URL as a string; update API_URL_DECLARATION in dev/server.js`;
      logger(`[error] ${message}`);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(message);
      return;
    }
    content = content.replace(API_URL_DECLARATION, `$1"${MOCK_API_PATH}"`);
  }
  res.writeHead(200, {
    "Content-Type": `${entry.type}; charset=utf-8`,
    "Cache-Control": "no-store",
  });
  res.end(content);
};

const handleApi = async ({ req, res, endpoint, store, options, logger }) => {
  const rawBody = await readBody(req);
  logger(`[api] POST /${endpoint} ${rawBody}`);

  if (options.delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, options.delay));
  }

  if (options.fail.includes(endpoint)) {
    if (options.failMode === "network") {
      logger(`[api] /${endpoint} -> simulated network failure`);
      req.socket.destroy();
      return;
    }
    logger(`[api] /${endpoint} -> 500 (simulated)`);
    sendJson(res, 500, {
      message: `Failed to save ${endpoint}: Simulated failure`,
    });
    return;
  }

  try {
    const feedbackId = HANDLERS[endpoint](store, JSON.parse(rawBody));
    logger(
      `[api] /${endpoint} -> 200 feedbackId=${feedbackId} ${JSON.stringify(
        store.rows.get(feedbackId)
      )}`
    );
    sendJson(res, 200, { message: "Success", feedbackId });
  } catch (e) {
    // The real API returns 500 for every error, including bad input.
    const message = e instanceof Error ? e.message : "No further details";
    logger(`[api] /${endpoint} -> 500 ${message}`);
    sendJson(res, 500, { message: `Failed to save ${endpoint}: ${message}` });
  }
};

const createServer = (options = parseArgs([]), logger = log) => {
  const store = createStore();

  const server = http.createServer((req, res) => {
    const { pathname } = new URL(req.url, "http://localhost");

    if (pathname.startsWith(`${MOCK_API_PATH}/`)) {
      const endpoint = pathname.slice(MOCK_API_PATH.length + 1);
      if (!ENDPOINTS.includes(endpoint)) {
        sendJson(res, 404, { message: "Not found" });
        return;
      }
      if (req.method === "OPTIONS") {
        res.writeHead(204, CORS_HEADERS);
        res.end();
        return;
      }
      if (req.method !== "POST") {
        sendJson(res, 405, { message: "Method not allowed" });
        return;
      }
      handleApi({ req, res, endpoint, store, options, logger }).catch((e) => {
        logger(`[error] ${e instanceof Error ? e.message : e}`);
        if (!res.headersSent) {
          sendJson(res, 500, { message: "Mock server error" });
        }
      });
      return;
    }

    const entry = STATIC_FILES[pathname];
    if (entry != null && req.method === "GET") {
      serveStatic({ res, entry, logger });
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  });

  server.store = store;
  return server;
};

if (require.main === module) {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (e) {
    process.stderr.write(`${e.message}\n`);
    process.exit(1);
  }

  // Only listen on this machine, not on every network interface.
  createServer(options).listen(options.port, "localhost", () => {
    log(`Feedback widget dev server: http://localhost:${options.port}`);
    log(`Mock API: http://localhost:${options.port}${MOCK_API_PATH}`);
    if (options.fail.length > 0) {
      log(`Failing: ${options.fail.join(", ")} (${options.failMode})`);
    }
    if (options.delay > 0) {
      log(`Delaying API responses by ${options.delay}ms`);
    }
  });
}

module.exports = { createServer, parseArgs, MOCK_API_PATH };
