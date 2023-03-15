# NJ Feedback widget

A generic, reusable [web component](https://developer.mozilla.org/en-US/docs/Web/Web_Components) that can be added to any New Jersey page to get quick, in-page feedback from the user. This is inspired by the [CA Design System's similar component](https://designsystem.webstandards.ca.gov/components/page-feedback/readme/). It is mobile-responsive, accessible (tested with [axe](https://www.deque.com/axe/) tool), and supports English and Spanish language.

## How to use it

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

## How it works

When the user interacts with the feedback widget, our Feedback API (https://github.com/newjersey/feedback-api) will then add data (see below) to our Google Sheets database, which can then be visualized in Looker Studio.

### User flow

1. Widget will ask user if they found what they were looking for on page. User can select "Yes" or "No". (Data recorded: page URL, time of interaction, and Yes/No selection)
2. Widget will ask user if they want to share an open-ended feedback. User can submit freeform text. (Data recorded: submitted comment) Note: If you'd like to direct users' specific/personal questions to a special form or website, provide the URL for that with the `contact-link` attribute. This will be used on Step 2 in the User flow below. If not given, a default link will be used (https://nj.gov/nj/feedback.html).
3. Widget will ask user if they want to share their email to join a user testing group. User can submit email address. (Data recorded: email address)
4. Widget will thank user for sharing

### Multi-language support

The component supports English and Spanish content and switching between the two. If you'd like to switch the language of the component's content, use JavaScript to send a custom event using the code below. For example, we can send this event in a click handler for a button.

```javascript
document.getElementById("languageButton").addEventListener("click", (e) => {
  const customEvent = new CustomEvent("changeLanguage", {
    detail: "es" /* "en" for English or "es" for Spanish */,
    bubbles: true,
  });
  e.target.dispatchEvent(customEvent);
});
```

## Where it's used

- NJ DOL, MyLeaveBenefits, Maternity Timeline Tool (Welcome) - https://nj.gov/labor/myleavebenefits/worker/maternity/timeline-welcome.shtml
- NJ DOL, MyLeaveBenefits, Maternity Timeline Tool (Tool) - https://nj.gov/labor/myleavebenefits/worker/maternity/timeline-tool.shtml
- NJ DOL, MyLeaveBenefits, What happens after I apply? - https://nj.gov/labor/myleavebenefits/worker/resources/claims-status.shtml
- NJ DOL, MyLeaveBenefits, Announcing a new way to log in - https://www.nj.gov/labor/myleavebenefits/worker/resources/login-update.shtml
- NJ DOL, UI Claim Status - https://uistatus.dol.state.nj.us/

## How to publish new version of package

1. Go the the Draft Release action at https://github.com/newjersey/feedback-widget/actions/workflows/draft-release.yml, click Run workflow (you need write permissions to do this). Choose the branch (`main`) and the semver level of the new version (patch, minor, major).
2. Confirm this worked by checking that `package.json` version has been bumped and a draft release for this version is available in the https://github.com/newjersey/feedback-widget/releases page.
3. On the releases page, click to Edit the release, and update the description if needed. Click Publish. This will trigger the publish-release Github Actions workflow.
4. Once the workflow is completed, confirm that the package is updated on NPM registry. https://www.npmjs.com/package/@newjersey/feedback-widget

### Minifying the JS file

Before pushing changes to `feedback-widget.js`, make sure you update the minified file (this will be automated eventually).

1. `npm install uglify-js -g` (global install, not part of npm project)
2. `cd feedback-widget && nvm use 16`
3. `uglifyjs feedback-widget.js -c -o feedback-widget.min.js`
