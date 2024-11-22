# New Jersey Feedback Widget

## About this component

A generic, reusable [web component](https://developer.mozilla.org/en-US/docs/Web/Web_Components) that can be added to any New Jersey page to get quick, in-page feedback from the user. This is inspired by the [CA Design System's similar component](https://designsystem.webstandards.ca.gov/components/page-feedback/readme/). It is mobile-responsive, accessible (tested with [axe](https://www.deque.com/axe/) tool), and supports English and Spanish language. See the [Feedback API](https://github.com/newjersey/feedback-api) Github repository for the code that handles and saves this data.

### User flow

1. _Rating_: At the bottom of a webpage, the widget asks user to rate their experience of the page with "Yes" and "No" buttons. Upon clicking an option, the rating is saved to a Google Sheet and Google Analytics (along with page URL, and submission datetime).

    **Note:** See `only-save-rating-to-analytics` attribute below for customization.
2. **[OPTIONAL]** _Comment_: Widget asks user to optionally share feedback in a free text field. Upon submitting, this text is recorded to Google Sheets.

    **Note:** Users often have specific questions about their situation rather than feedback.
    
    **Note:** See `contact-link` attribute below for customization.
3. **[OPTIONAL]** _Email_: Widget asks user to optionally share their email to join a user testing group. Upon submitting, this email is recorded to Google Sheets.

| User Submission Type | Required? | Saved to Google Analytics? | Saved to Google Sheets?
| ------- | ------- | ------- | ------ |
| **Rating** | Yes | Yes | Yes, customizable | 
| **Comment** | No | No | Yes | 
| **Email** | No | No | Yes |

### Spanish content

The component supports both English and Spanish content and offers users the ability to toggle between the two. To switch the language used within the component, use JavaScript to send a custom event using the code below:

```javascript
// sending a custom changeLanguage event in a click handler for a language toggle button

document.getElementById("languageButton").addEventListener("click", (e) => {
  const customEvent = new CustomEvent("changeLanguage", {
    detail: "es" /* "en" for English or "es" for Spanish */,
    bubbles: true,
  });
  e.target.dispatchEvent(customEvent);
});
```

### Customizable attributes

| Attribute | Description | Possible values | Defaults to | Example | Recommendations
| --------- | ----------- | --------------- | ----------- | ------- | ---------------
| `contact-link` | A string that can be used to set a custom URL that users are directed to if they have a specific question that they would like to have addressed. | Any URL | [NJ Contact Us page URL](https://nj.gov/nj/feedback.html) | [innovation homepage repo](https://github.com/newjersey/innovation.nj.gov/blob/de88f1e11f5b0260cd0a74125876ab127a4164f3/_includes/footer.html#L8) | N/A | 
| `only-save-rating-to-analytics` | A boolean that can be used to save ratings without comments only to Google Analytics rather than saving to the Google Sheets database | `"true"` or `"false"` | `"false"` | [UI Claim Status web app repo](https://github.com/newjersey/dol-ui-claim-status-web-app/blob/d293ff3df8bcc3c6c03bfb2aac4976787012d6b7/src/NJFooter.tsx#L42) | Setting to `"true"` is recommended for high traffic pages
| `show-comment-disclaimer` | A boolean that can be used to determine whether disclaimer text should be displayed in the feedback widget when users are prompted to submit a comment. This disclaimer will direct users to a separate contact form link if they have specific questions. | `"true"` or `"false"` | `"true"` | N/A | N/A
| `skip-email-step` | A boolean that can be used to determine whether to prompt the user to enter their email to join a testing group after submitting a comment. | `"true"` or `"false"` | `"false"` | N/A | N/A

## How to add this to your website

### With Node/NPM

1. Install the latest version of the widget via the command `npm i @newjersey/feedback-widget --save`.
2. In the file where you would like to add a reference to the widget (likely `App.tsx`/`App.jsx` in a Create React App project), import the Javascript file to be used:

```javascript
import "@newjersey/feedback-widget/feedback-widget.min.js";
```

3. If using TypeScript, add the following type definition to the same file you imported

```typescript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "feedback-widget": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}
```

4. Render the feedback widget by adding the following to your HTML/JSX

```html
<feedback-widget
  contact-link="https://www.example.com/contact"
></feedback-widget>
```

### For website without NPM

1. Load the JS file from a CDN link by adding a script tag to your HTML. You can change the version number after the @ sign to match your desired release (https://github.com/newjersey/feedback-widget/releases).

```javascript
<script
  src="https://unpkg.com/@newjersey/feedback-widget@0.2.0/feedback-widget.min.js"
  defer
></script>
```

2. Render the feedback widget by adding the following tag in your HTML (likely at the bottom of the page). It's just like using any other HTML tag.

```html
<feedback-widget
  contact-link="https://www.example.com/contact"
></feedback-widget>
```

## [FOR DEVELOPERS] How to improve this component

### Minifying the JS file

Before pushing changes to `feedback-widget.js`, make sure you update the minified file:

1. `npm install uglify-js -g` (global install, not part of npm project)
2. `cd feedback-widget && nvm use 16`
3. `uglifyjs feedback-widget.js -c -o feedback-widget.min.js`

### Publishing a new version of the package

1. Go the the [Draft Release action](https://github.com/newjersey/feedback-widget/actions/workflows/draft-release.yml), click "Run workflow" (you need write permissions to do this). Choose the branch (`main`) and the semver level of the new version (patch, minor, major).
2. Confirm this worked by checking that `package.json` version has been bumped and a draft release for this version is available in the [Releases page](https://github.com/newjersey/feedback-widget/releases).
3. Click to Edit the new release, and update the description if needed. Click "Publish." This will trigger the publish-release Github Actions workflow.
4. Once the workflow is completed, confirm that the package is updated on [NPM registry](https://www.npmjs.com/package/@newjersey/feedback-widget).
