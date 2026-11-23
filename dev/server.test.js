/**
 * @jest-environment node
 */
const { createServer, parseArgs, MOCK_API_PATH } = require("./server.js");

let server;
let baseUrl;

const start = async (args = []) => {
  server = createServer(parseArgs(args), () => {});
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://localhost:${server.address().port}`;
};

const post = async (endpoint, body) => {
  const response = await fetch(`${baseUrl}${MOCK_API_PATH}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
};

afterEach(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe("dev server", () => {
  it("serves the widget with the API URL pointed at the mock", async () => {
    await start();
    for (const file of ["feedback-widget.js", "feedback-widget.min.js"]) {
      const response = await fetch(`${baseUrl}/${file}`);
      const source = await response.text();
      expect(response.status).toBe(200);
      expect(source).toMatch(/\bAPI_URL\s*=\s*"\/api"/);
      expect(source).not.toMatch(/innovation\.nj\.gov\/app\/feedback/);
    }
  });

  it("does not serve files outside the allowlist", async () => {
    await start();
    const response = await fetch(`${baseUrl}/package.json`);
    expect(response.status).toBe(404);
  });

  it("supports the full rating -> comment -> email flow", async () => {
    await start();
    const rating = await post("rating", { pageURL: "x.com", rating: true });
    expect(rating).toEqual({
      status: 200,
      body: { message: "Success", feedbackId: 2 },
    });

    const comment = await post("comment", { feedbackId: 2, comment: " hi " });
    expect(comment.body.feedbackId).toBe(2);

    const email = await post("email", { feedbackId: 2, email: "a@b.com" });
    expect(email.body.feedbackId).toBe(2);

    expect(server.store.rows.get(2)).toMatchObject({
      pageURL: "x.com",
      rating: true,
      comment: "hi",
      email: "a@b.com",
    });
  });

  it("creates a record from a comment when the rating was not saved", async () => {
    await start();
    const comment = await post("comment", {
      comment: "hi",
      pageURL: "x.com",
      rating: false,
    });
    expect(comment.body).toEqual({ message: "Success", feedbackId: 2 });
  });

  it("returns 500 for invalid submissions, like the real API", async () => {
    await start();
    const comment = await post("comment", { comment: "hi" });
    expect(comment.status).toBe(500);
    expect(comment.body.message).toMatch(/must include pageURL and rating/);
  });

  it("simulates error responses for the endpoints passed to --fail", async () => {
    await start(["--fail=rating"]);
    const rating = await post("rating", { pageURL: "x.com", rating: true });
    expect(rating.status).toBe(500);
    expect(rating.body.message).toBe(
      "Failed to save rating: Simulated failure"
    );

    const comment = await post("comment", {
      comment: "hi",
      pageURL: "x.com",
      rating: true,
    });
    expect(comment.status).toBe(200);
  });

  it("simulates network failures", async () => {
    await start(["--fail=email", "--fail-mode=network"]);
    await expect(
      post("email", { feedbackId: 2, email: "a" })
    ).rejects.toThrow();
  });
});

describe("parseArgs", () => {
  it("rejects unknown endpoints and options", () => {
    expect(() => parseArgs(["--fail=ratings"])).toThrow(/--fail accepts/);
    expect(() => parseArgs(["--fail-mode=slow"])).toThrow(/--fail-mode/);
    expect(() => parseArgs(["--verbose"])).toThrow(/Unknown option/);
  });
});
