const { NJFeedbackWidget, LANG_TO_CONTENT } = require("./feedback-widget.js");
require("@testing-library/jest-dom");
const { screen, fireEvent } = require("@testing-library/dom");
const userEvent = require("@testing-library/user-event").default;

beforeAll(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve({ message: "Success", feedbackId: "test123" }),
    })
  );
});

beforeEach(() => {
  const widget = new NJFeedbackWidget();
  document.body.appendChild(widget);
});

afterEach(() => {
  document.body.innerHTML = "";
});

const assertOnlyLabelOnCommentTextarea = (activeLabel) => {
  const textarea = screen.getByLabelText(activeLabel);
  expect(textarea).toBeVisible();
  expect(textarea.labels).toHaveLength(1);
};

it("does not associate either comment prompt label with the textarea before a rating is chosen", () => {
  expect(
    screen.queryByLabelText(LANG_TO_CONTENT.en.commentPromptPositive)
  ).not.toBeInTheDocument();
  expect(
    screen.queryByLabelText(LANG_TO_CONTENT.en.commentPromptNegative)
  ).not.toBeInTheDocument();
});

describe("feedbackWidget", () => {
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

      assertOnlyLabelOnCommentTextarea(
        LANG_TO_CONTENT.en.commentPromptPositive
      );
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

      assertOnlyLabelOnCommentTextarea(
        LANG_TO_CONTENT.en.commentPromptNegative
      );
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
