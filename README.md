# Solventum Player Pulse — standalone microsite

This folder contains the complete static microsite and its Google Apps Script RSVP backend. It does not require React, Node.js, a database or a build step, and it has not been deployed by ChatGPT.

## Technology and file formats

| Part | Technology | Files |
| --- | --- | --- |
| Page structure | HTML5 | `index.html` |
| Styling and responsive layout | CSS3 | `styles.css` |
| Quiz, form logic, submission and Player Card | Vanilla JavaScript ES6+ and Canvas API | `app.js` |
| RSVP backend | Google Apps Script, V8 JavaScript runtime | `google-apps-script/Code.gs` |
| Apps Script settings | JSON | `google-apps-script/appsscript.json` |
| RSVP storage | Google Sheets | Existing Google Sheet |
| Brand assets | PNG, SVG and WOFF2 | `assets/` |

## Before uploading the website

The static website cannot safely contain a secret webhook token. This package instead uses a direct Google Apps Script endpoint with strict server-side validation and a status check. Replace the older Apps Script code and redeploy it before testing the standalone site.

### 1. Install the Google Apps Script backend

1. Open the [Solventum Player Pulse RSVP Sheet](https://docs.google.com/spreadsheets/d/1zFuvY4THnh0eubl_9U29STcr9UgSQpeAaVLbdbE2Hys/edit).
2. Select **Extensions → Apps Script**.
3. Open `Code.gs` in the Apps Script editor.
4. Replace all existing code with the contents of `google-apps-script/Code.gs` from this package.
5. Save the project.
6. From the function menu, select `setupRsvpSheet`, click **Run**, and complete Google's permission prompt. This creates or formats the response tab and its 15 columns.
7. Select **Deploy → Manage deployments**.
8. Edit the current Web App deployment or create a new one. Choose **New version**, set **Execute as** to **Me**, and set access to **Anyone** (or the broadest audience approved by Solventum).
9. Deploy and copy the URL ending in `/exec`.

The current Web App URL is already entered near the top of `app.js`:

```text
https://script.google.com/macros/s/AKfycbxbVpi6i9YmsXpheS9lRgldi3x1nSwoKLioxdsanYTXhM1QttKGCNJprBZAWoFpid5MFQ/exec
```

If Google gives you a different URL, replace the value of `GOOGLE_SCRIPT_URL` at the top of `app.js`. Never put passwords, API keys or Apps Script property values in `app.js`.

### 2. Test the Apps Script deployment

Open the `/exec` URL in a browser. It should display JSON containing:

```json
{"ok":true,"version":"solventum-rsvp-standalone-v1"}
```

If it does not show that version, the Web App is still serving older code. Return to **Deploy → Manage deployments**, select **Edit**, choose **New version**, and deploy again.

### 3. Host the static files

Upload the contents of this folder to the document root of any static host, for example a Solventum-managed web server, Azure Static Web Apps, AWS S3/CloudFront, Netlify or Vercel. Keep the folder structure unchanged and configure `index.html` as the home page.

No build command is required. For a local check, run a small static server from this folder instead of double-clicking `index.html`; browser security rules can prevent local `file://` pages from loading fonts or generating the Player Card correctly.

## RSVP fields written to the Sheet

The Apps Script creates and writes these columns in this exact order:

| Sheet column | Source/condition |
| --- | --- |
| Submitted At | Browser submission time, normalised by Apps Script |
| Reference | Unique `SP-XXXXXXXX` RSVP reference |
| Full Name | Required |
| Solventum Email ID | Required and must end in `@solventum.com` |
| Business Group/Function | MedSurg, HIS or GCC |
| Player Personality | Power, Speed, Precision or Strategy result code |
| Sport | Employee's one selected sport |
| Bringing Kid(s) | Yes or No |
| Kids' Name | Required when bringing kid(s) |
| Age Group | Below 8 or Above 8; required when bringing kid(s) |
| Lunch Preference | Veg or Non-veg |
| Bringing Spouse | Yes or No |
| Spouse Name | Required when bringing a spouse |
| Spouse Sport | Required when bringing a spouse |
| Kid(s) Sport | Shown and required only when the selected age group is Above 8 |

The allowed sports are Football, Cricket, Badminton, Pool and Throwball. The backend validates all values again before writing them to the Sheet. It also prevents duplicate employee-email registrations and neutralises values that could otherwise be interpreted as spreadsheet formulas.

## Recommended test

1. Submit one RSVP using an authorised test `@solventum.com` address.
2. Confirm that the success screen shows an `SP-XXXXXXXX` reference.
3. Confirm that all 15 Sheet cells in the new row contain the expected data.
4. Test spouse **Yes** and verify spouse name and sport are recorded.
5. Test kid(s) **Yes** with **Below 8** and confirm no kid sport is requested or stored.
6. Test kid(s) **Yes** with **Above 8** and verify the kid sport is required and stored.
7. Delete only the test rows after validation, if authorised.

## Privacy and security notes

- This form collects employee PII and optional family-member PII. Obtain the required Solventum privacy/security approval, provide an approved privacy notice, and collect only data the event team is authorised to use.
- Restrict the Google Sheet to authorised event administrators, define a retention/deletion period, and avoid forwarding or exporting attendee data unnecessarily.
- A public static website cannot protect a shared secret. The Apps Script endpoint is therefore publicly reachable and protected by allow-list validation, a honeypot, duplicate checks, formula-injection protection and Sheet locking—not by employee authentication.
- If Solventum policy requires verified employee identity, SSO, rate limiting, audit logs or regional processing guarantees, place the form behind an approved authenticated company service or server-side proxy before launch.
- Google Apps Script and Google Sheets process/store data under the organisation's Google Workspace configuration and agreement. Confirm the applicable data region, retention settings, DPA and subcontractors with the Solventum Google Workspace administrator.

## Files in this package

```text
Solventum_Player_Pulse_Standalone/
├── index.html
├── styles.css
├── app.js
├── README.md
├── assets/
│   ├── favicon.svg
│   ├── solventum-logo.png
│   ├── solventum-mark.png
│   └── fonts/
│       ├── Solve-Pro-Regular.woff2
│       ├── Solve-Pro-Medium.woff2
│       ├── Solve-Pro-Bold.woff2
│       └── Solve-Pro-Extrabold.woff2
└── google-apps-script/
    ├── Code.gs
    └── appsscript.json
```

The Solventum logo and font files are included for this authorised microsite package. Confirm internal brand-asset usage permissions before distributing the files outside Solventum or its approved vendors.
