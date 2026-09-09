const BACKEND_VERSION = "solventum-rsvp-standalone-v1";
const SHEET_NAME = "RSVP Responses - 10 Oct 2026";
const STATUS_TTL_SECONDS = 21600;

const HEADERS = [
  "Submitted At",
  "Reference",
  "Full Name",
  "Solventum Email ID",
  "Business Group/Function",
  "Player Personality",
  "Sport",
  "Bringing Kid(s)",
  "Kids' Name",
  "Age Group",
  "Lunch Preference",
  "Bringing Spouse",
  "Spouse Name",
  "Spouse Sport",
  "Kid(s) Sport"
];

const ALLOWED_PERSONALITIES = ["power", "speed", "precision", "strategy"];
const ALLOWED_SPORTS = ["Football", "Cricket", "Badminton", "Pool", "Throwball"];
const ALLOWED_BUSINESS_GROUPS = ["MedSurg", "HIS", "GCC"];
const ALLOWED_AGE_GROUPS = ["Below 8", "Above 8"];
const ALLOWED_LUNCH_PREFERENCES = ["Veg", "Non-veg"];

/**
 * Run this once from the Apps Script editor to create/format the response tab.
 */
function setupRsvpSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setValues([HEADERS])
    .setFontWeight("bold")
    .setBackground("#01332B")
    .setFontColor("#FFFFFF");
  sheet.setFrozenRows(1);
  return sheet;
}

/**
 * Health and submission-status endpoint. JSONP is used because the microsite
 * may be hosted on a different domain from Google Apps Script.
 */
function doGet(e) {
  const action = clean_(e && e.parameter && e.parameter.action, 20);
  if (action === "status") {
    const reference = clean_(e && e.parameter && e.parameter.reference, 20).toUpperCase();
    if (!/^SP-[A-Z0-9]{8}$/.test(reference)) {
      return webResponse_(e, { ok: false, error: "Invalid RSVP reference." });
    }
    const cached = CacheService.getScriptCache().get(statusKey_(reference));
    if (!cached) return webResponse_(e, { ok: false, pending: true });
    try {
      return webResponse_(e, JSON.parse(cached));
    } catch (error) {
      return webResponse_(e, { ok: false, error: "Could not read RSVP status." });
    }
  }

  return webResponse_(e, {
    ok: true,
    version: BACKEND_VERSION,
    message: "Solventum RSVP service is active."
  });
}

/**
 * Receives the microsite RSVP, validates every field and appends one Sheet row.
 */
function doPost(e) {
  let reference = "";
  let lock;
  let locked = false;

  try {
    const rawBody = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    const payload = JSON.parse(rawBody);
    reference = clean_(payload.reference, 20).toUpperCase();

    if (!/^SP-[A-Z0-9]{8}$/.test(reference)) throw new Error("Invalid RSVP reference.");
    if (payload.version !== BACKEND_VERSION) throw new Error("The RSVP form version is out of date. Please refresh and try again.");
    if (clean_(payload.website, 200)) throw new Error("This submission could not be accepted.");

    const registration = validateRegistration_(payload);

    lock = LockService.getScriptLock();
    lock.waitLock(30000);
    locked = true;

    const sheet = setupRsvpSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const rowCount = lastRow - 1;
      const existingReferences = sheet.getRange(2, 2, rowCount, 1).getDisplayValues().flat();
      if (existingReferences.indexOf(reference) !== -1) {
        const duplicateStatus = { ok: true, duplicate: true, reference: reference };
        saveStatus_(reference, duplicateStatus);
        return jsonResponse_(duplicateStatus);
      }

      const existingEmails = sheet.getRange(2, 4, rowCount, 1).getDisplayValues().flat()
        .map(function (value) { return String(value).trim().toLowerCase(); });
      if (existingEmails.indexOf(registration.officialEmail) !== -1) {
        throw new Error("This Solventum Email ID is already registered.");
      }
    }

    sheet.appendRow([
      registration.submittedAt,
      reference,
      safeCell_(registration.name),
      registration.officialEmail,
      registration.businessGroup,
      registration.personality,
      registration.sport,
      registration.bringingKids ? "Yes" : "No",
      safeCell_(registration.kidsName),
      registration.kidsAgeGroup,
      registration.lunchPreference,
      registration.bringingSpouse ? "Yes" : "No",
      safeCell_(registration.spouseName),
      registration.spouseSport,
      registration.kidsSport
    ]);
    SpreadsheetApp.flush();

    const successStatus = { ok: true, reference: reference };
    saveStatus_(reference, successStatus);
    return jsonResponse_(successStatus);
  } catch (error) {
    const message = error && error.message ? error.message : "We could not save your RSVP. Please try again.";
    const failureStatus = { ok: false, reference: reference, error: message };
    if (/^SP-[A-Z0-9]{8}$/.test(reference)) saveStatus_(reference, failureStatus);
    return jsonResponse_(failureStatus);
  } finally {
    if (locked && lock) lock.releaseLock();
  }
}

function validateRegistration_(payload) {
  const name = clean_(payload.name, 80);
  const officialEmail = clean_(payload.officialEmail, 120).toLowerCase();
  const businessGroup = clean_(payload.businessGroup, 40);
  const personality = clean_(payload.personality, 20);
  const sport = clean_(payload.sport, 40);
  const bringingSpouse = payload.bringingSpouse;
  const spouseName = bringingSpouse === true ? clean_(payload.spouseName, 100) : "";
  const spouseSport = bringingSpouse === true ? clean_(payload.spouseSport, 40) : "";
  const bringingKids = payload.bringingKids;
  const kidsName = bringingKids === true ? clean_(payload.kidsName, 160) : "";
  const kidsAgeGroup = bringingKids === true ? clean_(payload.kidsAgeGroup, 20) : "";
  const kidsSport = bringingKids === true && kidsAgeGroup === "Above 8" ? clean_(payload.kidsSport, 40) : "";
  const lunchPreference = clean_(payload.lunchPreference, 20);
  const submittedAt = normaliseTimestamp_(payload.submittedAt);

  if (name.length < 2) throw new Error("Please enter your full name.");
  if (!/^[^\s@]+@solventum\.com$/i.test(officialEmail)) throw new Error("Please enter a valid Solventum Email ID ending in @solventum.com.");
  if (ALLOWED_BUSINESS_GROUPS.indexOf(businessGroup) === -1) throw new Error("Choose a valid Business Group/Function.");
  if (ALLOWED_PERSONALITIES.indexOf(personality) === -1) throw new Error("Player Pulse result is invalid.");
  if (ALLOWED_SPORTS.indexOf(sport) === -1) throw new Error("Choose one valid sport.");
  if (typeof bringingSpouse !== "boolean") throw new Error("Please tell us if you are bringing your spouse.");
  if (bringingSpouse && spouseName.length < 2) throw new Error("Please enter your spouse's name.");
  if (bringingSpouse && ALLOWED_SPORTS.indexOf(spouseSport) === -1) throw new Error("Choose a valid sport for your spouse.");
  if (typeof bringingKids !== "boolean") throw new Error("Please tell us if you are bringing your kid(s).");
  if (bringingKids && kidsName.length < 2) throw new Error("Please enter your kid(s)' name.");
  if (bringingKids && ALLOWED_AGE_GROUPS.indexOf(kidsAgeGroup) === -1) throw new Error("Choose a valid age group.");
  if (bringingKids && kidsAgeGroup === "Above 8" && ALLOWED_SPORTS.indexOf(kidsSport) === -1) throw new Error("Choose a valid sport for your kid(s).");
  if (ALLOWED_LUNCH_PREFERENCES.indexOf(lunchPreference) === -1) throw new Error("Choose a valid lunch preference.");

  return {
    submittedAt: submittedAt,
    name: name,
    officialEmail: officialEmail,
    businessGroup: businessGroup,
    personality: personality,
    sport: sport,
    bringingSpouse: bringingSpouse,
    spouseName: spouseName,
    spouseSport: spouseSport,
    bringingKids: bringingKids,
    kidsName: kidsName,
    kidsAgeGroup: kidsAgeGroup,
    kidsSport: kidsSport,
    lunchPreference: lunchPreference
  };
}

function clean_(value, maxLength) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";
}

function normaliseTimestamp_(value) {
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function safeCell_(value) {
  const text = String(value || "");
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function statusKey_(reference) {
  return "rsvp_status_" + reference;
}

function saveStatus_(reference, value) {
  CacheService.getScriptCache().put(statusKey_(reference), JSON.stringify(value), STATUS_TTL_SECONDS);
}

function webResponse_(e, value) {
  const callback = clean_(e && e.parameter && e.parameter.callback, 90);
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$]{0,89}$/.test(callback)) {
    return ContentService.createTextOutput(callback + "(" + JSON.stringify(value) + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return jsonResponse_(value);
}

function jsonResponse_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
