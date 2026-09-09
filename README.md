Solventum Player Pulse — Sports Day 2026

A lightweight standalone microsite for the Solventum Sports Day 2026 Player Pulse quiz and RSVP.

Project structure

Solventum_Player_Pulse/
├── index.html
├── styles.css
├── app.js
├── google-apps-script.gs
└── README.md

The website uses HTML, CSS and Vanilla JavaScript. RSVP submissions are handled by Google Apps Script and stored in Google Sheets.

How it works

Website
   ↓
Google Apps Script Web App
   ↓
Google Spreadsheet
   ↓
RSVP Responses - 10 Oct 2026

Google Sheet

Spreadsheet ID:

1zFuvY4THnh0eubl_9U29STcr9UgSQpeAaVLbdbE2Hys

Response sheet/tab:

RSVP Responses - 10 Oct 2026

The Apps Script opens the spreadsheet using its ID and creates the response tab if it does not already exist.

Google Apps Script setup

Open https://script.google.com/

Create a new standalone Apps Script project.

Open Code.gs.

Replace its contents with google-apps-script.gs from this project.

Save the project.

Run setupRsvpSheet() once and approve the requested Google permissions.

Go to Deploy → New deployment.

Choose Web app.

Set Execute as to Me.

Set Who has access to Anyone.

Deploy and copy the URL ending in /exec.

Current Apps Script Web App URL

https://script.google.com/macros/s/AKfycbwsp0tCz87cPhaklCo-XAF6v4Shz4q4Q9OSidNFPRiCbmlDORHtIlzhc8hJEGTZZoyw/exec

If the deployment URL changes, update GOOGLE_SCRIPT_URL at the top of app.js.

Website configuration

At the top of app.js:

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwsp0tCz87cPhaklCo-XAF6v4Shz4q4Q9OSidNFPRiCbmlDORHtIlzhc8hJEGTZZoyw/exec";

const BACKEND_VERSION =
  "solventum-rsvp-standalone-v1";

The website already sends the RSVP data expected by the backend.

RSVP fields stored in Google Sheets

Column

Description

Submitted At

Submission timestamp

Reference

Unique SP-XXXXXXXX RSVP reference

Full Name

Employee name

Solventum Email ID

Must end with @solventum.com

Business Group/Function

MedSurg, HIS or GCC

Player Personality

Power, Speed, Precision or Strategy

Sport

Employee's selected sport

Bringing Kid(s)

Yes or No

Kids' Name

Required when bringing kid(s)

Age Group

Below 8 or Above 8

Lunch Preference

Veg or Non-veg

Bringing Spouse

Yes or No

Spouse Name

Required when bringing spouse

Spouse Sport

Required when bringing spouse

Kid(s) Sport

Required only when the age group is Above 8

Email restriction

Only @solventum.com email addresses are accepted.

The restriction is enforced both by the website and by Google Apps Script.

Examples:

name@solventum.com        ✅
name@gmail.com            ❌
name@3m.com               ❌
name@solventum.co.in      ❌

Backend validation

The Apps Script validates:

Full name

Solventum email

Business Group/Function

Player Personality

Employee sport

Spouse details when applicable

Kids details when applicable

Kid sport for Above 8

Lunch preference

It also prevents duplicate employee email registrations, validates RSVP references, handles concurrent submissions with a script lock, blocks the honeypot field and protects Sheet cells from formula injection.

Testing

Open the website.

Complete the Player Pulse quiz.

Select one employee sport.

Submit a test RSVP using an authorised @solventum.com email.

Confirm an SP-XXXXXXXX reference appears on the success screen.

Confirm the new row appears in RSVP Responses - 10 Oct 2026.

Test spouse = Yes.

Test kids = Yes + Below 8.

Test kids = Yes + Above 8.

Test a non-Solventum email and confirm it is rejected.

Test duplicate email and confirm it is rejected.

Delete test records after validation if authorised.

Hosting

The frontend is static and can be hosted on GitHub Pages, Vercel, Netlify, Azure Static Web Apps or another static web server.

No build command is required.

For local testing:

python -m http.server 8000

Then open:

http://localhost:8000

Backend version

solventum-rsvp-standalone-v1

The website and Apps Script must use the same backend version.

Privacy

The RSVP form collects employee information and optional family-member information. Restrict the Google Sheet to authorised event administrators and follow the applicable Solventum privacy, security and retention requirements. Do not place passwords or private API keys in the frontend.
