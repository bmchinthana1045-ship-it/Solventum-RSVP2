"use strict";

// After deploying google-apps-script/Code.gs as a Web App, paste its /exec URL here.
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwsp0tCz87cPhaklCo-XAF6v4Shz4q4Q9OSidNFPRiCbmlDORHtIlzhc8hJEGTZZoyw/exec";
const BACKEND_VERSION = "solventum-rsvp-standalone-v1";

const questions = [
  {
    eyebrow: "The pressure is on",
    question: "Your team is one point behind. What is your move?",
    answers: [
      { label: "Go all in", detail: "One bold play changes everything", type: "power", icon: "⚡" },
      { label: "Move first", detail: "Create an opening before they react", type: "speed", icon: "💨" },
      { label: "Pick the gap", detail: "Wait for the cleanest shot", type: "precision", icon: "◎" },
      { label: "Reset the plan", detail: "Read the field and call the move", type: "strategy", icon: "♟" }
    ]
  },
  {
    eyebrow: "Choose your advantage",
    question: "What do teammates rely on you for?",
    answers: [
      { label: "Big-match energy", detail: "I lift the whole team", type: "power", icon: "🔥" },
      { label: "Relentless pace", detail: "I keep the pressure moving", type: "speed", icon: "↗" },
      { label: "A steady hand", detail: "I deliver when accuracy matters", type: "precision", icon: "✦" },
      { label: "The smart call", detail: "I see the next move early", type: "strategy", icon: "◇" }
    ]
  },
  {
    eyebrow: "Game-day instinct",
    question: "Which moment feels the most satisfying?",
    answers: [
      { label: "The winning strike", detail: "Clean, powerful, undeniable", type: "power", icon: "🏏" },
      { label: "The sudden break", detail: "Zero to full speed", type: "speed", icon: "🏃" },
      { label: "The perfect placement", detail: "Exactly where it needed to go", type: "precision", icon: "🎯" },
      { label: "The clever comeback", detail: "Turning pressure into an advantage", type: "strategy", icon: "🧠" }
    ]
  },
  {
    eyebrow: "Your rhythm",
    question: "Pick your ideal way to compete.",
    answers: [
      { label: "Loud and fearless", detail: "I feed off the atmosphere", type: "power", icon: "📣" },
      { label: "Fast and fluid", detail: "Keep moving, keep creating", type: "speed", icon: "≈" },
      { label: "Calm and focused", detail: "Block out noise and execute", type: "precision", icon: "◉" },
      { label: "Patient and tactical", detail: "Every move has a reason", type: "strategy", icon: "▦" }
    ]
  },
  {
    eyebrow: "Final pulse check",
    question: "Choose the game-face emoji that feels most like you.",
    answers: [
      { label: "Bring it on", detail: "😤", type: "power", icon: "P" },
      { label: "Catch me if you can", detail: "😎", type: "speed", icon: "S" },
      { label: "Locked in", detail: "🧐", type: "precision", icon: "P" },
      { label: "I have a plan", detail: "🤓", type: "strategy", icon: "M" }
    ]
  }
];

const profiles = {
  power: {
    title: "Power Player",
    kicker: "Bold. Competitive. All in.",
    description: "You bring momentum, lift the team and never hide from a high-pressure moment.",
    games: ["Cricket", "Football"],
    code: "01"
  },
  speed: {
    title: "Speedster",
    kicker: "Quick. Energetic. Uncatchable.",
    description: "You act fast, create openings and keep the competition chasing your next move.",
    games: ["Football", "Badminton"],
    code: "02"
  },
  precision: {
    title: "Precision Pro",
    kicker: "Focused. Accurate. Composed.",
    description: "You stay calm when it matters and make every move count with control and accuracy.",
    games: ["Badminton", "Pool"],
    code: "03"
  },
  strategy: {
    title: "Mastermind",
    kicker: "Calm. Tactical. Two moves ahead.",
    description: "You read the room, spot the opening and turn a smart plan into a winning one.",
    games: ["Pool", "Cricket"],
    code: "04"
  }
};

const personalityOrder = ["power", "speed", "precision", "strategy"];
const sports = ["Football", "Cricket", "Badminton", "Pool", "Throwball"];

const state = {
  screen: "intro",
  questionIndex: 0,
  answers: [],
  direction: "next",
  personality: "power",
  selectedSport: "",
  reference: "",
  cardUrl: "",
  formLoadedAt: Date.now()
};

const app = document.querySelector("#app");
const form = document.querySelector("#rsvp-form");
const errorBox = document.querySelector("#form-error");
const submitButton = document.querySelector("#submit-rsvp");

function showScreen(screen) {
  state.screen = screen;
  document.querySelectorAll(".screen-panel").forEach((panel) => {
    panel.hidden = panel.dataset.screen !== screen;
  });
  app.className = `app-shell screen-${screen}`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function startQuiz() {
  state.questionIndex = 0;
  state.answers = [];
  state.direction = "next";
  state.selectedSport = "";
  renderQuestion();
  showScreen("quiz");
}

function renderQuestion() {
  const current = questions[state.questionIndex];
  document.querySelector("#question-number").textContent = String(state.questionIndex + 1).padStart(2, "0");
  document.querySelector("#quiz-progress").style.width = `${((state.questionIndex + 1) / questions.length) * 100}%`;
  document.querySelector("#question-eyebrow").textContent = current.eyebrow;
  document.querySelector("#question-text").textContent = current.question;

  const questionCard = document.querySelector("#question-card");
  questionCard.classList.remove("motion-next", "motion-back");
  void questionCard.offsetWidth;
  questionCard.classList.add(state.direction === "back" ? "motion-back" : "motion-next");

  const answersGrid = document.querySelector("#answers-grid");
  answersGrid.replaceChildren();
  current.answers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-card";
    button.innerHTML = `<span class="answer-number">${String(index + 1).padStart(2, "0")}</span><span class="answer-icon"></span><span class="answer-copy"><strong></strong><small></small></span><span class="answer-arrow">↗</span>`;
    button.querySelector(".answer-icon").textContent = answer.icon;
    button.querySelector("strong").textContent = answer.label;
    button.querySelector("small").textContent = answer.detail;
    button.addEventListener("click", () => chooseAnswer(answer.type));
    answersGrid.append(button);
  });
}

function chooseAnswer(type) {
  state.answers = [...state.answers.slice(0, state.questionIndex), type];
  if (state.questionIndex === questions.length - 1) {
    state.personality = calculatePersonality();
    renderProfile();
    showScreen("result");
    return;
  }
  state.questionIndex += 1;
  state.direction = "next";
  renderQuestion();
}

function goBack() {
  if (state.questionIndex === 0) {
    showScreen("intro");
    return;
  }
  state.questionIndex -= 1;
  state.direction = "back";
  renderQuestion();
}

function calculatePersonality() {
  const score = { power: 0, speed: 0, precision: 0, strategy: 0 };
  state.answers.forEach((answer) => { score[answer] += 1; });
  const lastAnswer = state.answers.at(-1);
  return personalityOrder.reduce((best, current) => {
    if (score[current] > score[best]) return current;
    if (score[current] === score[best] && current === lastAnswer) return current;
    return best;
  }, personalityOrder[0]);
}

function renderProfile() {
  const profile = profiles[state.personality];
  document.querySelectorAll("[data-profile-code]").forEach((element) => { element.textContent = profile.code; });
  document.querySelectorAll("[data-profile-title]").forEach((element) => { element.textContent = profile.title; });
  document.querySelectorAll("[data-profile-kicker]").forEach((element) => { element.textContent = profile.kicker; });
  document.querySelectorAll("[data-profile-description]").forEach((element) => { element.textContent = profile.description; });

  const resultIdentity = document.querySelector("#result-identity");
  const rsvpProfile = document.querySelector("#rsvp-profile");
  [resultIdentity, rsvpProfile].forEach((element) => {
    element.classList.remove("identity-power", "identity-speed", "identity-precision", "identity-strategy");
    element.classList.add(`identity-${state.personality}`);
  });

  const recommendations = document.querySelector("#recommended-games");
  recommendations.replaceChildren();
  profile.games.forEach((game) => {
    const item = document.createElement("strong");
    item.textContent = game;
    recommendations.append(item);
  });
  renderSports();
}

function renderSports() {
  const container = document.querySelector("#employee-sports");
  container.replaceChildren();
  document.querySelector("#sport-count").textContent = state.selectedSport ? "1/1 selected" : "0/1 selected";
  const recommended = profiles[state.personality].games;
  sports.forEach((sport, index) => {
    const selected = state.selectedSport === sport;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `sport-option${selected ? " selected" : ""}`;
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", String(selected));
    button.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><strong></strong>${recommended.includes(sport) ? "<small>Recommended</small>" : ""}<i></i>`;
    button.querySelector("strong").textContent = sport;
    button.querySelector("i").textContent = selected ? "✓" : "+";
    button.addEventListener("click", () => {
      state.selectedSport = sport;
      document.querySelector("#sport-count").textContent = "1/1 selected";
      renderSports();
    });
    container.append(button);
  });
}

function setConditionalFields(groupName, fieldsSelector, enabled) {
  const fields = document.querySelector(fieldsSelector);
  fields.hidden = !enabled;
  fields.querySelectorAll("input, select").forEach((control) => {
    control.required = enabled;
    if (!enabled) control.value = "";
  });
  if (groupName === "kids" && !enabled) {
    document.querySelector("#kids-sport-field").hidden = true;
    document.querySelector("#kids-sport").required = false;
  } else if (groupName === "kids") {
    updateKidsSport();
  }
}

function updateKidsSport() {
  const isAboveEight = document.querySelector("#kids-age-group").value === "Above 8";
  const field = document.querySelector("#kids-sport-field");
  const select = document.querySelector("#kids-sport");
  field.hidden = !isAboveEight;
  select.required = isAboveEight;
  if (!isAboveEight) select.value = "";
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
  errorBox.scrollIntoView({ behavior: "smooth", block: "center" });
}

function clearError() {
  errorBox.textContent = "";
  errorBox.hidden = true;
}

function clean(value, maxLength) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function createReference() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return `SP-${window.crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  }
  const fallback = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`.slice(-8).toUpperCase();
  return `SP-${fallback}`;
}

function selectedRadio(name) {
  return form.querySelector(`input[name="${name}"]:checked`)?.value || "";
}

function jsonp(parameters, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const callbackName = `__solventum_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => finish(new Error("The RSVP service did not respond.")), timeoutMs);

    function finish(error, value) {
      window.clearTimeout(timeout);
      script.remove();
      try { delete window[callbackName]; } catch (_) { window[callbackName] = undefined; }
      if (error) reject(error); else resolve(value);
    }

    window[callbackName] = (value) => finish(null, value);
    script.onerror = () => finish(new Error("Could not reach the RSVP service."));
    const query = new URLSearchParams({ ...parameters, callback: callbackName, _: String(Date.now()) });
    script.src = `${GOOGLE_SCRIPT_URL}?${query.toString()}`;
    document.head.append(script);
  });
}

async function ensureBackend() {
  if (!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(GOOGLE_SCRIPT_URL)) {
    throw new Error("The Google Apps Script URL has not been configured. See README.md.");
  }
  const health = await jsonp({ action: "health" });
  if (!health || health.ok !== true || health.version !== BACKEND_VERSION) {
    throw new Error("The Google Apps Script needs to be updated and redeployed. Follow README.md.");
  }
}

async function postRegistration(payload) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30000);
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      cache: "no-store",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

async function waitForSubmission(reference) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => window.setTimeout(resolve, 650 + attempt * 250));
    const status = await jsonp({ action: "status", reference });
    if (status && status.pending === true) continue;
    if (status && status.ok === true) return status;
    if (status && status.error) throw new Error(status.error);
  }
  throw new Error("We could not confirm that your RSVP reached the Sheet. Please try again before closing this page.");
}

async function submitRsvp(event) {
  event.preventDefault();
  clearError();

  if (!state.selectedSport) {
    showError("Choose one sport to continue.");
    return;
  }
  if (!form.reportValidity()) return;

  const bringingSpouse = selectedRadio("bringingSpouse") === "yes";
  const bringingKids = selectedRadio("bringingKids") === "yes";
  const email = clean(document.querySelector("#official-email").value, 120).toLowerCase();
  if (!/^[^\s@]+@solventum\.com$/i.test(email)) {
    showError("Please use your @solventum.com email address.");
    return;
  }

  const reference = createReference();
  const payload = {
    version: BACKEND_VERSION,
    reference,
    submittedAt: new Date().toISOString(),
    formLoadedAt: new Date(state.formLoadedAt).toISOString(),
    website: document.querySelector("#website").value,
    name: clean(document.querySelector("#full-name").value, 80),
    officialEmail: email,
    businessGroup: document.querySelector("#business-group").value,
    personality: state.personality,
    sport: state.selectedSport,
    bringingSpouse,
    spouseName: bringingSpouse ? clean(document.querySelector("#spouse-name").value, 100) : "",
    spouseSport: bringingSpouse ? document.querySelector("#spouse-sport").value : "",
    bringingKids,
    kidsName: bringingKids ? clean(document.querySelector("#kids-name").value, 160) : "",
    kidsAgeGroup: bringingKids ? document.querySelector("#kids-age-group").value : "",
    kidsSport: bringingKids && document.querySelector("#kids-age-group").value === "Above 8" ? document.querySelector("#kids-sport").value : "",
    lunchPreference: selectedRadio("lunchPreference")
  };

  submitButton.disabled = true;
  submitButton.firstChild.textContent = "Confirming your RSVP… ";
  try {
    await ensureBackend();
    await postRegistration(payload);
    await waitForSubmission(reference);
    state.reference = reference;
    document.querySelector("#reference").textContent = reference;
    showScreen("success");
    await generateAndDisplayCard(payload.name, state.personality, [state.selectedSport], reference);
  } catch (error) {
    const message = error && error.name === "AbortError"
      ? "The RSVP service timed out. Please check your connection and try again."
      : (error.message || "We could not save your RSVP. Please try again.");
    showError(message);
  } finally {
    submitButton.disabled = false;
    submitButton.firstChild.textContent = "Complete RSVP & generate card ";
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

function fitText(context, text, maxWidth, startSize, weight = 800) {
  let size = startSize;
  while (size > 30) {
    context.font = `${weight} ${size}px "Solve Pro", Arial, sans-serif`;
    if (context.measureText(text).width <= maxWidth) return size;
    size -= 2;
  }
  return size;
}

function roundedRectangle(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

async function makePlayerCard(name, personality, selectedGames, reference) {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const logo = await loadImage("assets/solventum-logo.png");
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1500;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Player Card generation is not supported in this browser.");

  const profile = profiles[personality];
  const accent = personality === "power" ? "#05dd4d" : personality === "speed" ? "#70dcc3" : personality === "precision" ? "#d8f2e8" : "#a7e26a";
  context.fillStyle = "#f7faf8";
  context.fillRect(0, 0, 1200, 1500);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, 1200, 175);
  context.fillStyle = "#05dd4d";
  context.fillRect(0, 175, 24, 1325);

  context.drawImage(logo, 78, 48, 330, 83);
  context.fillStyle = "#01332b";
  context.font = "700 20px 'Solve Pro', Arial, sans-serif";
  context.letterSpacing = "4px";
  context.fillText("SPORTS DAY · 2026", 850, 102);

  context.fillStyle = accent;
  context.beginPath();
  context.arc(950, 500, 285, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(1,51,43,.18)";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(935, 515, 360, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = "#01332b";
  context.font = "900 220px 'Solve Pro', Arial, sans-serif";
  context.textAlign = "center";
  context.fillText(profile.code, 950, 575);
  context.textAlign = "left";

  context.fillStyle = "#0a7b6b";
  context.font = "800 20px 'Solve Pro', Arial, sans-serif";
  context.letterSpacing = "5px";
  context.fillText("PLAYER ACTIVATED", 78, 295);
  context.fillStyle = "#01332b";
  context.font = "900 96px 'Solve Pro', Arial, sans-serif";
  context.letterSpacing = "-4px";
  context.fillText(profile.title.toUpperCase(), 78, 405, 650);

  context.fillStyle = "#01332b";
  context.font = `900 ${fitText(context, name.toUpperCase(), 1040, 105, 900)}px "Solve Pro", Arial, sans-serif`;
  context.letterSpacing = "-3px";
  context.fillText(name.toUpperCase(), 78, 910);
  context.fillStyle = "rgba(1,51,43,.66)";
  context.font = "600 30px 'Solve Pro', Arial, sans-serif";
  context.letterSpacing = "0px";
  context.fillText(profile.kicker, 82, 965);

  context.strokeStyle = "rgba(1,51,43,.18)";
  context.beginPath();
  context.moveTo(78, 1035);
  context.lineTo(1122, 1035);
  context.stroke();
  context.fillStyle = "#01332b";
  context.font = "800 19px 'Solve Pro', Arial, sans-serif";
  context.letterSpacing = "4px";
  context.fillText("MY GAME", 78, 1100);
  selectedGames.forEach((game, index) => {
    const y = 1160 + index * 78;
    context.fillStyle = index === 0 ? "#01332b" : "#ffffff";
    context.strokeStyle = "#01332b";
    context.lineWidth = 2;
    roundedRectangle(context, 78, y, 490, 58, 29);
    context.fill();
    context.stroke();
    context.fillStyle = index === 0 ? "#ffffff" : "#01332b";
    context.font = "750 24px 'Solve Pro', Arial, sans-serif";
    context.letterSpacing = "0px";
    context.fillText(game, 108, y + 38);
  });

  context.fillStyle = "#01332b";
  context.font = "800 25px 'Solve Pro', Arial, sans-serif";
  context.fillText("10 OCTOBER 2026", 800, 1162);
  context.font = "500 21px 'Solve Pro', Arial, sans-serif";
  context.fillStyle = "rgba(1,51,43,.64)";
  context.fillText("10 A.M. – 3 P.M.", 800, 1202);
  context.fillText("XLR8 · BENGALURU", 800, 1240);
  context.font = "700 18px 'Solve Pro', Arial, sans-serif";
  context.fillText(reference, 800, 1310);

  context.fillStyle = "#01332b";
  context.fillRect(0, 1420, 1200, 80);
  context.fillStyle = "#05dd4d";
  context.font = "800 20px 'Solve Pro', Arial, sans-serif";
  context.letterSpacing = "4px";
  context.fillText("SPORTS MODE: ACTIVATED", 78, 1471);
  return canvas.toDataURL("image/png", 1);
}

async function generateAndDisplayCard(name, personality, selectedGames, reference) {
  try {
    state.cardUrl = await makePlayerCard(name, personality, selectedGames, reference);
    const image = document.querySelector("#generated-card");
    image.src = state.cardUrl;
    image.alt = `${name}'s ${profiles[personality].title} player card`;
    image.hidden = false;
    document.querySelector("#card-loading").hidden = true;
    document.querySelector("#download-card").disabled = false;
    document.querySelector("#share-card").disabled = false;
  } catch (error) {
    document.querySelector("#card-loading").textContent = "Your RSVP is saved, but the Player Card could not be generated in this browser.";
  }
}

function downloadCard() {
  if (!state.cardUrl) return;
  const link = document.createElement("a");
  const name = clean(document.querySelector("#full-name").value, 80);
  link.href = state.cardUrl;
  link.download = `${name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-player-card.png`;
  link.click();
}

async function shareCard() {
  if (!state.cardUrl) return;
  try {
    const blob = await (await fetch(state.cardUrl)).blob();
    const file = new File([blob], "solventum-player-card.png", { type: "image/png" });
    if (!navigator.share || (navigator.canShare && !navigator.canShare({ files: [file] }))) {
      downloadCard();
      return;
    }
    await navigator.share({
      title: "My Solventum Player Card",
      text: `I am a ${profiles[state.personality].title}. Sports Mode: Activated!`,
      files: [file]
    });
  } catch (error) {
    if (error && error.name !== "AbortError") downloadCard();
  }
}

document.querySelector("#start-quiz").addEventListener("click", startQuiz);
document.querySelector("#quiz-back").addEventListener("click", goBack);
document.querySelector("#continue-rsvp").addEventListener("click", () => {
  clearError();
  state.formLoadedAt = Date.now();
  renderProfile();
  showScreen("rsvp");
});
document.querySelector("#retake-quiz").addEventListener("click", startQuiz);
document.querySelector("#rsvp-back").addEventListener("click", () => showScreen("result"));
document.querySelectorAll("input[name='bringingSpouse']").forEach((input) => {
  input.addEventListener("change", () => setConditionalFields("spouse", "#spouse-fields", input.value === "yes"));
});
document.querySelectorAll("input[name='bringingKids']").forEach((input) => {
  input.addEventListener("change", () => setConditionalFields("kids", "#kids-fields", input.value === "yes"));
});
document.querySelector("#kids-age-group").addEventListener("change", updateKidsSport);
form.addEventListener("submit", submitRsvp);
document.querySelector("#download-card").addEventListener("click", downloadCard);
document.querySelector("#share-card").addEventListener("click", shareCard);

renderSports();
