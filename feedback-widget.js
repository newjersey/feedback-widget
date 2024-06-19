function logGoogleEvent(action, label = undefined) {
  if (typeof window.gtag === "function") {
    window.gtag("event", action, {
      event_category: "Page feedback",
      event_label: label,
    });
  }
}

const LANG_TO_CONTENT = {
  en: {
    ratingPrompt: "Did you find what you were looking for on this page?",
    ratingPositive: "Yes",
    ratingNegative: "No",
    commentPromptPositive:
      "Great! We're looking for ways to improve this page — what ideas come to mind?",
    commentPromptNegative:
      "Sorry to hear that. What were you looking for today?",
    commentPromptDisclaimer:
      "Your feedback helps improve this web page. For specific questions about your situation, ",
    commentPromptDisclaimerLink: "contact us",
    commentSubmit: "Send feedback",
    commentSubmitLoading: "Sending...",
    commentConfirmation: "Thanks for sharing your thoughts!",
    emailPrompt:
      "To hear about paid feedback opportunities in the future, join our user testing list.",
    emailLabel: "Email address",
    emailSubmit: "Join the list",
    emailSubmitLoading: "Joining...",
    errorMessage:
      "Try again, please. We didn't get your answer because of a technical issue.",
    emailConfirmation: "Thanks for signing up!",
  },
  es: {
    ratingPrompt: "¿Encontraste lo que buscabas en esta página?",
    ratingPositive: "Sí",
    ratingNegative: "No",
    commentPromptPositive:
      "¡Excelente! Estamos buscando formas de mejorar esta página. ¿Qué ideas se te ocurren?",
    commentPromptNegative:
      "Lamentamos escuchar eso. ¿De que se trataba su búsqueda?",
    commentPromptDisclaimer:
      "Sus comentarios nos ayudan a mejorar nuestro sitio de web. Si tiene preguntas específicas sobre su situación, ",
    commentPromptDisclaimerLink: "por favor póngase en contacto con nosotros",
    commentSubmit: "Enviar comentarios",
    commentSubmitLoading: "Enviando...",
    commentConfirmation: "¡Gracias por compartir tus ideas!",
    emailPrompt:
      "Para conocer mas oportunidades de comentarios pagados en el futuro, sea parte de nuestra lista de prueba de usuarios.",
    emailLabel: "Dirección de correo electrónico",
    emailSubmit: "Sea parte de la lista",
    emailSubmitLoading: "Enviando...",
    errorMessage:
      "Por favor, inténtalo de nuevo. No obtuvimos su respuesta debido a un problema técnico.",
    emailConfirmation: "¡Gracias por registrarte!",
  },
};

const API_URL = "https://innovation.nj.gov/app/feedback/dev";
const JSON_HEADER = {
  "Content-Type": "application/json",
};

class NJFeedbackWidget extends window.HTMLElement {
  constructor() {
    super();
    this.rating = false;
    this.feedbackId = undefined;
    this.retryRating = false;
    this.language = new URL(window.location).searchParams.get("lang") ?? "en";
  }

  connectedCallback() {
    this.innerHTML = this.getHTML();
    this.applyListeners();
    this.addStyling();
    document.addEventListener(
      "changeLanguage",
      this.handleChangeLanguage.bind(this)
    );
  }

  disconnectedCallback() {
    document.removeEventListener(
      "changeLanguage",
      this.handleChangeLanguage.bind(this)
    );
  }

  handleChangeLanguage(e) {
    this.language = e.detail;
    this.innerHTML = this.getHTML();
    this.applyListeners();
  }

  applyListeners() {
    this.querySelector("#yesButton").addEventListener("click", (_e) => {
      this.handleRating(true);
    });

    this.querySelector("#noButton").addEventListener("click", (_e) => {
      this.handleRating(false);
    });

    const commentForm = this.querySelector("#commentForm");
    commentForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const submitButton = document.getElementById("commentSubmit");
      submitButton.disabled = true;
      submitButton.textContent =
        LANG_TO_CONTENT[this.language].commentSubmitLoading;
      this.hideElement("#commentSubmitError");

      const comment = e.target.elements.comment.value;
      const postData =
        this.retryRating || this.feedbackId == null
          ? { comment, rating: this.rating, pageURL: window.location.href }
          : {
              feedbackId: this.feedbackId,
              comment,
            };
      fetch(`${API_URL}/comment`, {
        method: "POST",
        headers: JSON_HEADER,
        body: JSON.stringify(postData),
      })
        .then((response) => response.json())
        .then((data) => {
          if (this.feedbackId == null) {
            this.feedbackId = data.feedbackId;
          }
          if (data.message === "Success" && this.feedbackId != null) {
            this.hideElement("#commentPrompt");
            this.showElement("#emailPrompt");
          } else {
            this.showElement("#commentSubmitError");
          }
        })
        .catch((e) => {
          this.showElement("#commentSubmitError");
        })
        .finally(() => {
          submitButton.disabled = false;
          submitButton.textContent =
            LANG_TO_CONTENT[this.language].commentSubmit;
        });
    });

    const emailForm = this.querySelector("#emailForm");
    emailForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const submitButton = document.getElementById("emailSubmit");
      submitButton.disabled = true;
      submitButton.textContent =
        LANG_TO_CONTENT[this.language].emailSubmitLoading;
      this.hideElement("#emailSubmitError");

      const postData = {
        feedbackId: this.feedbackId,
        email: e.target.elements.email.value,
      };
      fetch(`${API_URL}/email`, {
        method: "POST",
        headers: JSON_HEADER,
        body: JSON.stringify(postData),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.message === "Success" && data.feedbackId != null) {
            this.hideElement("#emailPrompt");
            this.showElement("#emailConfirmation", "flex");
          } else {
            this.showElement("#emailSubmitError");
          }
        })
        .catch((e) => {
          this.showElement("#emailSubmitError");
        })
        .finally(() => {
          submitButton.disabled = false;
          submitButton.textContent = LANG_TO_CONTENT[this.language].emailSubmit;
        });
    });
  }

  handleRating(rating) {
    this.rating = rating;
    if (!rating) {
      this.querySelector("#commentPromptText").innerText =
        LANG_TO_CONTENT[this.language].commentPromptNegative;
    }
    this.hideElement("#ratingPrompt");
    this.showElement("#commentPrompt");

    let onlySaveRatingToAnalytics = false;
    if (this.hasAttribute("only-save-rating-to-analytics")) {
      onlySaveRatingToAnalytics =
        this.getAttribute("only-save-rating-to-analytics") === "true";
    }

    if (onlySaveRatingToAnalytics) {
      logGoogleEvent("Clicked initial button", rating ? "Yes" : "No");
    } else {
      document.getElementById("commentSubmit").disabled = true;
      const postData = {
        pageURL: window.location.href,
        rating,
      };
      fetch(`${API_URL}/rating`, {
        method: "POST",
        headers: JSON_HEADER,
        body: JSON.stringify(postData),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.message === "Success" && data.feedbackId != null) {
            this.feedbackId = data.feedbackId;
            logGoogleEvent("Clicked initial button", rating ? "Yes" : "No");
          } else {
            this.retryRating = true;
          }
        })
        .catch((e) => {
          this.retryRating = true;
        })
        .finally(() => {
          document.getElementById("commentSubmit").disabled = false;
        });
    }
  }

  showElement(selector, displayType = "block") {
    this.querySelector(selector).style.display = displayType;
  }

  hideElement(selector) {
    this.querySelector(selector).style.display = "none";
  }

  getHTML() {
    const content = LANG_TO_CONTENT[this.language];
    const contactLink = this.hasAttribute("contact-link")
      ? this.getAttribute("contact-link")
      : "https://www.nj.gov/nj/feedback.html";

    let showCommentDisclaimer = true;
    if (
      this.hasAttribute("show-comment-disclaimer") &&
      this.getAttribute("show-comment-disclaimer") === "false"
    ) {
      showCommentDisclaimer = false;
    }

    const html = /*html*/ `
    <div class="feedback-container">
      <div id="ratingPrompt" class="flex-box">
        <span class="feedback-text">${content.ratingPrompt}</span>
        <div class="feedback-button-group">
          <button id="yesButton" class="feedback-button">
            ${content.ratingPositive}
          </button>
          <button id="noButton" class="feedback-button">
            ${content.ratingNegative}
          </button>
        </div>
      </div>
      <div id="commentPrompt">
        <form id="commentForm">
          <div class="grid-box">
            <div>
              <label id="commentPromptText" for="comment" class="feedback-text"
                >${content.commentPromptPositive}</label
              >
              ${
                showCommentDisclaimer
                  ? `<p class="disclaimer-text">
                      ${content.commentPromptDisclaimer}<a
                      target="_blank"
                      rel="noopener noreferrer"
                      href="${contactLink}"
                      >${content.commentPromptDisclaimerLink}</a
                      >.
                    </p>`
                  : ""
              }
            </div>
            <div>
              <textarea
                type="text"
                id="comment"
                name="comment"
                class="feedback-input"
                required
              ></textarea>
              <div id="commentSubmitError" class="error-text">
                ${content.errorMessage}
              </div>
              <button
                id="commentSubmit"
                class="feedback-button float-right submit-button"
                type="submit"
              >
                ${content.commentSubmit}
              </button>
            </div>
          </div>
        </form>
      </div>
      <div id="emailPrompt">
        <form id="emailForm">
          <div class="grid-box">
            <div>
              <div class="feedback-text">${content.commentConfirmation}</div>
              <p class="disclaimer-text">${content.emailPrompt}</p>
            </div>
            <div>
              <label for="email" class="email-label">${
                content.emailLabel
              }</label>
              <input
                type="email"
                id="email"
                name="email"
                class="feedback-input email-input"
                required
              />
              <div id="emailSubmitError" class="error-text">
                ${content.errorMessage}
              </div>
              <button
                id="emailSubmit"
                class="feedback-button float-right submit-button"
                type="submit"
              >
                ${content.emailSubmit}
              </button>
            </div>
          </div>
        </form>
      </div>
      <div id="emailConfirmation" class="email-confirmation">
        <img
          src="https://beta.nj.gov/files/feedback-widget/check_icon.svg"
          alt=""
        />
        <div class="email-confirmation-text">${content.emailConfirmation}</div>
      </div>
    </div>
    `;
    return html;
  }

  addStyling() {
    const style = document.createElement("style");
    style.textContent = /*css*/ `
      .feedback-container {
        background-color: #f0f0f0;
        padding: 1.9rem 2.5rem;
      }
      
      .flex-box {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1.5rem;
      }
      
      .grid-box {
        display: grid;
        grid-template-columns: 1fr 1fr;
        column-gap: 1.5rem;
      }
      
      @media screen and (max-width: 765px) {
        .flex-box {
          justify-content: center;
        }
      
        .grid-box {
          grid-template-columns: 1fr;
        }
      }
      
      .feedback-text {
        font-weight: 600;
        font-size: 22px;
        color: #1b1b1b;
      }
      
      .disclaimer-text {
        margin: 1rem 0;
      }
      
      .email-label {
        font-weight: 600;
        margin: 0.5rem 0;
      }

      .email-input {
        margin-bottom: 0.5rem;
      }

      .error-text {
        font-size: 14px;
        color: #D63E04;
        margin-bottom: 0.75rem;
      }

      .submit-button {
        margin-top: 0.75rem;
      }

      .email-confirmation {
        display: flex;
        align-items: center;
      }

      .email-confirmation-text {
        font-weight: 600;
        font-size: 22px;
        margin-left: 1rem;
      }
      
      .feedback-button-group {
        display: flex;
        gap: 1.25rem;
        flex-wrap: wrap;
      }
      
      .feedback-button {
        font-family: inherit;
        font-weight: 600;
        font-size: 16px;
        color: #1b1b1b !important;
        background-color: #ffffff;
        border-style: solid;
        border-width: 2px;
        border-color: #1b1b1b;
        border-radius: 4px;
        padding: 0.75rem 3rem;
        cursor: pointer;
        text-decoration: none;
        text-align: center;
      }
      
      .feedback-button.float-right {
        float: right;
      }
      
      .feedback-button:hover {
        border-color: #3d4551;
        background-color: #3d4551;
        color: #ffffff !important;
        text-decoration: none;
      }
      
      .feedback-button:disabled {
        opacity: 0.65;
      }
      
      @media screen and (max-width: 450px) {
        .feedback-button-group {
          justify-content: center;
        }
      
        .feedback-button {
          width: 100%;
        }
      }
      
      .feedback-input {
        width: 100%;
        border: 1px solid #a9aeb1;
        border-radius: 0px;
        padding: 0.5rem;
      }
      
      .feedback-input:focus {
        outline: none;
        border-color: #86b7fe;
        box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
      }
      
      #commentPrompt,
      #emailPrompt,
      #emailFormSubmitted,
      #commentSubmitError,
      #emailSubmitError,
      #emailConfirmation {
        display: none;
      }
    `;
    document.querySelector("head").appendChild(style);
  }
}

window.customElements.define("feedback-widget", NJFeedbackWidget);
