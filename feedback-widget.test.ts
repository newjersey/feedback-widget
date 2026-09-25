import { LANG_TO_CONTENT, NJFeedbackWidget } from "./feedback-widget";
import "@testing-library/jest-dom";
import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

beforeAll(() => {
  globalThis.fetch = jest.fn(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve({ message: "Success", feedbackId: "test123" }),
    })
  ) as jest.Mock;
});

let widget: NJFeedbackWidget;

beforeEach(() => {
  widget = new NJFeedbackWidget();
  document.body.appendChild(widget);
});

afterEach(() => {
  document.body.innerHTML = "";
});

it("only one comment prompt label is associated with the comment textarea", () => {
  expect(screen.getByText(LANG_TO_CONTENT.en.ratingPrompt)).toBeVisible();

  const commentTextarea = screen.getByRole("textbox", {
    name: RegExp(LANG_TO_CONTENT.en.commentPromptPositive),
    hidden: true,
  }) as HTMLTextAreaElement;
  expect(commentTextarea.labels).toHaveLength(1);
});

describe("feedbackWidget", () => {
  describe("showElement", () => {
    it("defaults to display: block when no options are passed", () => {
      widget.showElement("#emailPrompt");

      expect(widget.querySelector("#emailPrompt")).toHaveStyle(
        "display: block"
      );
    });

    it("defaults to display: block when an empty options object is passed", () => {
      widget.showElement("#emailPrompt", {});

      expect(widget.querySelector("#emailPrompt")).toHaveStyle(
        "display: block"
      );
    });

    it("uses the given display value when one is passed", () => {
      widget.showElement("#emailPrompt", { display: "flex" });

      expect(widget.querySelector("#emailPrompt")).toHaveStyle("display: flex");
    });
  });

  describe("handleRating", () => {
    it("shows positive prompt text when 'Yes' is clicked", async () => {
      const yesButton = screen.getByRole("button", {
        name: LANG_TO_CONTENT.en.ratingPositive,
      });
      await userEvent.click(yesButton);

      expect(
        screen.getByText(LANG_TO_CONTENT.en.ratingPrompt)
      ).not.toBeVisible();
      expect(
        screen.getByText(LANG_TO_CONTENT.en.commentPromptNegative)
      ).not.toBeVisible();

      const commentTextarea = screen.getByRole("textbox", {
        name: LANG_TO_CONTENT.en.commentPromptPositive,
      }) as HTMLTextAreaElement;
      expect(commentTextarea).toBeVisible();
      expect(commentTextarea.labels).toHaveLength(1);
    });

    it("shows negative prompt text when 'No' is clicked", async () => {
      const noButton = screen.getByRole("button", {
        name: LANG_TO_CONTENT.en.ratingNegative,
      });
      await userEvent.click(noButton);

      expect(
        screen.getByText(LANG_TO_CONTENT.en.ratingPrompt)
      ).not.toBeVisible();
      expect(
        screen.getByText(LANG_TO_CONTENT.en.commentPromptPositive)
      ).not.toBeVisible();

      const commentTextarea = screen.getByRole("textbox", {
        name: LANG_TO_CONTENT.en.commentPromptNegative,
      }) as HTMLTextAreaElement;
      expect(commentTextarea).toBeVisible();
      expect(commentTextarea.labels).toHaveLength(1);
    });
  });

  describe("aria-disabled", () => {
    it("sets aria-disabled on comment form button when clicked", async () => {
      const yesButton = screen.getByRole("button", {
        name: LANG_TO_CONTENT.en.ratingPositive,
      });
      await userEvent.click(yesButton);

      const commentForm = screen.getByTestId("commentForm");

      const commentSubmitButton = screen.getByRole("button", {
        name: LANG_TO_CONTENT.en.commentSubmit,
      });
      expect(commentSubmitButton.getAttribute("aria-disabled")).toBe(null);
      fireEvent.submit(commentForm);
      expect(commentSubmitButton.getAttribute("aria-disabled")).toBe("true");
      const commentSubmitLoading = screen.getByText(
        LANG_TO_CONTENT.en.commentSubmitLoading
      );
      expect(commentSubmitLoading).toBeVisible();
    });

    it("sets aria-disabled on email submit button when clicked", async () => {
      const yesButton = screen.getByRole("button", {
        name: LANG_TO_CONTENT.en.ratingPositive,
      });
      await userEvent.click(yesButton);

      const commentTextarea = screen.getByRole("textbox", {
        name: LANG_TO_CONTENT.en.commentPromptPositive,
      });
      await userEvent.type(commentTextarea, "Test");

      const commentSubmitButton = screen.getByRole("button", {
        name: LANG_TO_CONTENT.en.commentSubmit,
      });
      await userEvent.click(commentSubmitButton);

      const emailForm = screen.getByTestId("emailForm");

      const emailSubmitButton = screen.getByRole("button", {
        name: LANG_TO_CONTENT.en.emailSubmit,
      });

      expect(emailSubmitButton.getAttribute("aria-disabled")).toBe(null);
      fireEvent.submit(emailForm);
      expect(emailSubmitButton.getAttribute("aria-disabled")).toBe("true");
      const emailSubmitLoading = screen.getByText(
        LANG_TO_CONTENT.en.emailSubmitLoading
      );
      expect(emailSubmitLoading).toBeVisible();
    });
  });
});
