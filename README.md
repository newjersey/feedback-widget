# New Jersey Feedback Widget

## About this component

A generic, reusable [web component](https://developer.mozilla.org/en-US/docs/Web/Web_Components) that can be added to any New Jersey page to get quick, in-page feedback from the user. This is inspired by the [CA Design System's similar component](https://designsystem.webstandards.ca.gov/components/page-feedback/readme/). It is mobile-responsive, accessible (tested with [axe](https://www.deque.com/axe/) tool), and supports English and Spanish language. See the [Feedback API](https://github.com/newjersey/feedback-api) Github repository for the code that handles and saves this data.

### User flow

1. _Rating_: At the bottom of a webpage, the widget asks user to rate their experience of the page with "Yes" and "No" buttons. Upon clicking an option, the rating is saved to a Google Sheet and Google Analytics (page URL, datetime, and selection). Note: See `only-save-rating-to-analytics` attribute below for customization.
2. _Comment_: Widget asks user to optionally share feedback in a free text field. Upon submitting, this text is recorded to Google Sheets. Note: Users often have specific questions about their situation rather than feedback. Note: See `contact-link` attribute below for customization.
3. _Email_: Widget asks user to optionally share their email to join a user testing group. Upon submitting, this email is recorded to Google Sheets.

### Spanish content

The component supports English and Spanish content and switching between the two. To switch the language of the component's content, use JavaScript to send a custom event using the code below. For example, we can send this event in a click handler for a button.

```javascript
document.getElementById("languageButton").addEventListener("click", (e) => {
  const customEvent = new CustomEvent("changeLanguage", {
    detail: "es" /* "en" for English or "es" for Spanish */,
    bubbles: true,
  });
  e.target.dispatchEvent(customEvent);
});
```

### Where it's used

- NJ DOL, TDI/FLI, MyLeaveBenefits, [Maternity Timeline Tool (Welcome)](https://nj.gov/labor/myleavebenefits/worker/maternity/timeline-welcome.shtml)
- NJ DOL, TDI/FLI, MyLeaveBenefits, [Maternity Timeline Tool (Tool)](https://nj.gov/labor/myleavebenefits/worker/maternity/timeline-tool.shtml)
- NJ DOL, TDI/FLI, MyLeaveBenefits, [What happens after I apply?](https://nj.gov/labor/myleavebenefits/worker/resources/claims-status.shtml)
- NJ DOL, TDI/FLI, MyLeaveBenefits, [Announcing a new way to log in](https://www.nj.gov/labor/myleavebenefits/worker/resources/login-update.shtml)
- NJ DOL, UI, [Claim Status](https://uistatus.dol.state.nj.us/)

### Customizable attributes

- `contact-link` - Assign to a string with the URL that you want to direct users to if they have a specific question. By default, a the following URL will be used: https://nj.gov/nj/feedback.html.
- `only-save-rating-to-analytics` - Rather than saving ratings without comments to the Google Sheets database, you can choose to only save to Google Analytics (whichever property is added to your site) with the value `"true"`. `"true"` is recommended if expecting high traffic. Defaults to `"false"`.
- `show-comment-disclaimer` - This can be `"true"` or `"false"` to determine whether to display the disclaimer text underneath Step 2 of the form where we prompt users to submit an open-ended comment. The disclaimer directs users to a separate contact form link (see `contact-link` above) if they have specific questions. Defaults to `"true"` if not provided.

## For users: how to add this to your website

### With Node/NPM

1. Install the latest version via the command `npm i @newjersey/feedback-widget --save`.
2. In the file you want to refer to the widget (for example, `App.tsx`/`App.jsx` in Create React App), import the JavaScript file to be used.

```javascript
import "@newjersey/feedback-widget/feedback-widget.min.js";
```

3. If using TypeScript, add the following type definition to the same file that you imported

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

## For developers: how to improve this component

### Minifying the JS file

Before pushing changes to `feedback-widget.js`, make sure you update the minified file (this will be automated eventually).

1. `npm install uglify-js -g` (global install, not part of npm project)
2. `cd feedback-widget && nvm use 16`
3. `uglifyjs feedback-widget.js -c -o feedback-widget.min.js`

### Publishing a new version of the package

1. Go the the [Draft Release action](https://github.com/newjersey/feedback-widget/actions/workflows/draft-release.yml), click "Run workflow" (you need write permissions to do this). Choose the branch (`main`) and the semver level of the new version (patch, minor, major).
2. Confirm this worked by checking that `package.json` version has been bumped and a draft release for this version is available in the [Releases page](https://github.com/newjersey/feedback-widget/releases).
3. Click to Edit the new release, and update the description if needed. Click "Publish." This will trigger the publish-release Github Actions workflow.
4. Once the workflow is completed, confirm that the package is updated on [NPM registry](https://www.npmjs.com/package/@newjersey/feedback-widget).
