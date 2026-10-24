
/* =========================================================
   OUR SWEET LITTLE JOURNEY — its_TIE
   Responsive romantic surprise maker
   ========================================================= */

"use strict";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const screens = $$(".screen");

const state = {
  creator: "",
  receiver: "",
  occasion: "anniversary",
  relationship: "partner",
  date: "",
  title: "",
  message: "",
  language: "en",
  darkMode: false,
  floatingEffects: true,
  autoplay: true,
  musicPlaying: false,
  completed: false,
  heartsOpened: 0,
  photos: [],
  videos: [],
  decorations: [],
  songUrl: "",
  shareUrl: ""
};

let counterTimer = null;
let melodyContext = null;
let melodyTimer = null;
let melodyStep = 0;
let localPhotoUrls = [];
let localVideoUrls = [];
let localDecorationUrls = [];

const storageKeys = {
  theme: "osl_theme",
  language: "osl_language",
  completions: "osl_completions",
  draft: "osl_draft"
};

/* -------------------- TRANSLATIONS -------------------- */

const translations = {
  en: {
    welcomeEyebrow: "A LITTLE WORLD MADE WITH LOVE",
    welcomeTitle: "Every love story deserves a little magic.",
    welcomeDescription: "Create a personal surprise filled with memories, music, heartfelt words and little moments of magic.",
    startButton: "Create Your Surprise",
    modeTitle: "What would you like to do?",
    modeDescription: "Create a new surprise or open one made especially for you.",
    creatorMode: "Create a Surprise",
    creatorModeDescription: "Make something personal for someone special.",
    receiverMode: "Open a Surprise",
    receiverModeDescription: "Enjoy a surprise made just for you.",
    setupTitle: "Create your own love story",
    setupDescription: "Every detail can be personal. Choose what feels right for you.",
    creatorNameLabel: "Your name",
    receiverNameLabel: "Their name",
    messageLabel: "Your personal message"
  },
  bn: {
    welcomeEyebrow: "BHALOBASHA DIYE TOIRI EKTI CHOTO PRITHIBI",
    welcomeTitle: "Prottek bhalobashar golpo ektu magic deserve kore.",
    welcomeDescription: "Smriti, gaan, moner kotha ar choto choto surprise diye nijer moto ekta surprise banao.",
    startButton: "Tomar Surprise Banao",
    modeTitle: "Tumi ki korte chao?",
    modeDescription: "Notun surprise banao ba tomar jonno banano surprise kholo.",
    creatorMode: "Surprise Banao",
    creatorModeDescription: "Prio manusher jonno nijer moto kichu banao.",
    receiverMode: "Surprise Khulo",
    receiverModeDescription: "Tomar jonno banano surprise upobhog koro.",
    setupTitle: "Nijer bhalobashar golpo banao",
    setupDescription: "Prottekta detail nijer moto kore sajate paro.",
    creatorNameLabel: "Tomar naam",
    receiverNameLabel: "Tar naam",
    messageLabel: "Tomar nijer message"
  },
  bl: {
    welcomeEyebrow: "A LITTLE WORLD MADE WITH LOVE",
    welcomeTitle: "Prottek love story ektu magic deserve kore.",
    welcomeDescription: "Memories, music, moner kotha ar cute surprises diye nijer moto surprise banao.",
    startButton: "Create Your Surprise",
    modeTitle: "Tumi ki korte chao?",
    modeDescription: "Notun surprise banao, ba tomar jonno banano surprise kholo.",
    creatorMode: "Surprise Create Koro",
    creatorModeDescription: "Special manusher jonno personal kichu banao.",
    receiverMode: "Surprise Khulo",
    receiverModeDescription: "Tomar jonno banano surprise enjoy koro.",
    setupTitle: "Tomader nijeder love story banao",
    setupDescription: "Sob detail nijer moto customize korte parbe.",
    creatorNameLabel: "Tomar naam",
    receiverNameLabel: "Tar naam",
    messageLabel: "Tomar personal message"
  }
};

/* -------------------- SCREEN NAVIGATION -------------------- */

function showScreen(screenId) {
  const target = document.getElementById(screenId);
  if (!target) return;

  screens.forEach((screen) => {
    screen.classList.toggle("active", screen === target);
    screen.setAttribute("aria-hidden", screen === target ? "false" : "true");
  });

  window.scrollTo({ top: 0, behavior: "smooth" });

  if (screenId === "milestoneScreen") {
    startCounter();
  } else {
    stopCounter();
  }

  if (screenId === "shareScreen") {
    updateSharePreview();
  }

  if (screenId === "memoriesScreen") {
    renderMemoryGallery();
  }
}

$("#startButton")?.addEventListener("click", () => {
  showScreen("modeScreen");
});

$("#creatorModeButton")?.addEventListener("click", () => {
  showScreen("setupScreen");
});

$("#receiverModeButton")?.addEventListener("click", () => {
  loadSurpriseFromLink();
});

$$("[data-back]").forEach((button) => {
  button.addEventListener("click", () => {
    showScreen(button.dataset.back);
  });
});

/* -------------------- DARK / LIGHT MODE -------------------- */

function applyTheme(dark) {
  state.darkMode = Boolean(dark);

  document.body.classList.toggle("dark-mode", state.darkMode);
  document.documentElement.dataset.theme = state.darkMode ? "dark" : "light";

  const icon = $("#themeIcon");
  if (icon) icon.textContent = state.darkMode ? "☀️" : "🌙";

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.content = state.darkMode ? "#171421" : "#fff1f5";
  }

  try {
    localStorage.setItem(storageKeys.theme, state.darkMode ? "dark" : "light");
  } catch (_) {}
}

$("#themeToggle")?.addEventListener("click", () => {
  applyTheme(!state.darkMode);
});

try {
  applyTheme(localStorage.getItem(storageKeys.theme) === "dark");
} catch (_) {
  applyTheme(false);
}

/* -------------------- LANGUAGE SWITCHER -------------------- */

function setLanguage(language) {
  if (!translations[language]) language = "en";

  state.language = language;

  $$("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    const translated = translations[language][key];

    if (translated) {
      element.textContent = translated;
    }
  });

  const selector = $("#languageSelect");
  if (selector) selector.value = language;

  try {
    localStorage.setItem(storageKeys.language, language);
  } catch (_) {}
}

$("#languageSelect")?.addEventListener("change", (event) => {
  setLanguage(event.target.value);
});

try {
  setLanguage(localStorage.getItem(storageKeys.language) || "en");
} catch (_) {
  setLanguage("en");
}

/* -------------------- FLOATING HEARTS / FLOWERS -------------------- */

const floatingSymbols = [
  "♡", "♥", "💕", "💗", "🌸", "🌷", "✿", "✨"
];

function createFloatingSymbol() {
  if (!state.floatingEffects) return;

  const container = $("#floatingDecor");
  if (!container) return;

  const symbol = document.createElement("span");
  symbol.className = "floating-particle";
  symbol.textContent =
    floatingSymbols[Math.floor(Math.random() * floatingSymbols.length)];

  symbol.style.left = `${Math.random() * 96}%`;
  symbol.style.animationDuration = `${8 + Math.random() * 10}s`;
  symbol.style.fontSize = `${14 + Math.random() * 17}px`;
  symbol.style.opacity = `${0.3 + Math.random() * 0.5}`;

  container.appendChild(symbol);

  window.setTimeout(() => symbol.remove(), 19000);
}

window.setInterval(createFloatingSymbol, 1200);

$("#floatingEffects")?.addEventListener("change", (event) => {
  state.floatingEffects = event.target.checked;

  const container = $("#floatingDecor");
  if (container) container.style.display = state.floatingEffects ? "" : "none";
});

/* -------------------- DATE / OCCASION -------------------- */

function syncOccasionFields() {
  const occasion = $("#occasionType")?.value || "anniversary";
  const dateField = $("#dateField");
  const dateInput = $("#anniversaryDate");

  state.occasion = occasion;

  if (dateField) {
    dateField.style.display = occasion === "anniversary" ? "" : "";
  }

  if (dateInput) {
    dateInput.required = false;
  }

  const heading = $("#coupleHeading");

  if (heading) {
    const receiver = state.receiver || "your special person";

    const headings = {
      anniversary: `${state.creator || "You"} & ${receiver} ♡`,
      proposal: `A question for ${receiver} 💍`,
      confession: `Something from ${state.creator || "your heart"} 💌`,
      justbecause: `A little surprise for ${receiver} 🌷`
    };

    heading.textContent = headings[occasion] || headings.anniversary;
  }
}

$("#occasionType")?.addEventListener("change", syncOccasionFields);

/* -------------------- PERSONALIZED FORM -------------------- */

$("#surpriseForm")?.addEventListener("submit", (event) => {
  event.preventDefault();

  state.creator = $("#creatorName")?.value.trim() || "";
  state.receiver = $("#receiverName")?.value.trim() || "";
  state.occasion = $("#occasionType")?.value || "anniversary";
  state.relationship = $("#relationshipType")?.value || "partner";
  state.date = $("#anniversaryDate")?.value || "";
  state.title = $("#surpriseTitle")?.value.trim() || "";
  state.message = $("#loveMessage")?.value.trim() || "";
  state.autoplay = $("#autoplayMusic")?.checked ?? true;
  state.floatingEffects = $("#floatingEffects")?.checked ?? true;

  if (!state.creator || !state.receiver) {
    alert("Please enter both names first. ♡");
    return;
  }

  if (state.date && new Date(`${state.date}T00:00:00`) > new Date()) {
    if (state.occasion === "anniversary") {
      alert("Please choose a date that is today or earlier.");
      return;
    }
  }

  state.completed = false;
  state.heartsOpened = 0;

  const heading = $("#coupleHeading");
  if (heading) {
    heading.textContent = `${state.creator} & ${state.receiver} ♡`;
  }

  updateMilestoneMessage();
  syncOccasionFields();
  saveDraft();

  showScreen("milestoneScreen");

  if (state.autoplay) {
    // Browsers may block autoplay until the user interacts.
    startMusic().catch(() => {});
  }
});

function updateMilestoneMessage() {
  const title = $("#milestoneTitle");
  const message = $("#milestoneMessage");

  const occasionContent = {
    anniversary: {
      title: "Every second with you matters. ♡",
      message: "May your story keep growing with kindness, laughter and love."
    },
    proposal: {
      title: "A question from the heart 💍",
      message: "Some feelings are too beautiful to keep inside. This little surprise is made just for you."
    },
    confession: {
      title: "There is something I want you to know 💌",
      message: "Sometimes the bravest thing is simply telling someone how special they are."
    },
    justbecause: {
      title: "No special day needed 🌷",
      message: "You deserve a little happiness today, tomorrow and every ordinary day."
    }
  };

  const content = occasionContent[state.occasion] || occasionContent.anniversary;

  if (title) title.textContent = state.title || content.title;
  if (message) message.textContent = state.message || content.message;

  const finalGreeting = $("#finalGreeting");
  if (finalGreeting) {
    finalGreeting.textContent = `A little surprise for ${state.receiver || "you"} 💗`;
  }

  const finalMessage = $("#finalMessage");
  if (finalMessage) {
    finalMessage.textContent = state.message ||
      `${state.creator || "Someone special"} made this little world just for you.`;
  }

  const finalNote = $("#finalNote");
  if (finalNote) {
    if (state.occasion === "proposal") {
      finalNote.textContent = "Would you make this story even more beautiful by saying yes? 💍";
    } else if (state.occasion === "confession") {
      finalNote.textContent = "No pressure, just a little truth from the heart. 💌";
    } else {
      finalNote.textContent = "You make ordinary moments feel extraordinary. ♡";
    }
  }
}

/* -------------------- RELATIONSHIP COUNTER -------------------- */

function calculateDuration(dateString) {
  if (!dateString) return null;

  const start = new Date(`${dateString}T00:00:00`);
  const now = new Date();

  if (Number.isNaN(start.getTime()) || start > now) return null;

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months--;
    const previousMonthDays = new Date(
      now.getFullYear(),
      now.getMonth(),
      0
    ).getDate();

    days += previousMonthDays;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const elapsedMilliseconds = now - start;
  const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
    hours: Math.floor(elapsedSeconds / 3600) % 24,
    minutes: Math.floor(elapsedSeconds / 60) % 60,
    seconds: elapsedSeconds % 60,
    totalDays: Math.floor(elapsedMilliseconds / 86400000)
  };
}

function startCounter() {
  stopCounter();

  function update() {
    const duration = calculateDuration(state.date);

    if (!duration) {
      const title = $("#milestoneTitle");
      const message = $("#milestoneMessage");

      if (state.occasion === "anniversary" && !state.date) {
        if (title) title.textContent = "Every moment can become a memory. ♡";
        if (message) message.textContent =
          "Add your special date when creating your surprise to start the live counter.";
      }

      [
        "yearsCount", "monthsCount", "daysCount",
        "hoursCount", "minutesCount", "secondsCount"
      ].forEach((id) => {
        const element = document.getElementById(id);
        if (element) element.textContent = "0";
      });

      return;
    }

    const values = {
      yearsCount: duration.years,
      monthsCount: duration.months,
      daysCount: duration.days,
      hoursCount: duration.hours,
      minutesCount: duration.minutes,
      secondsCount: duration.seconds
    };

    Object.entries(values).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = String(value);
    });

    const title = $("#milestoneTitle");
    const message = $("#milestoneMessage");

    if (duration.totalDays >= 365) {
      if (title) title.textContent = `${duration.years} year(s) of memories ♡`;
      if (message) message.textContent =
        "Every day is another page in your story. Keep making it beautiful.";
    } else if (duration.totalDays >= 180) {
      if (title) title.textContent = "Six months and countless little moments 💗";
      if (message) message.textContent =
        "A beautiful milestone: thank you for every laugh, every memory and every little thing.";
    } else if (duration.totalDays >= 30) {
      if (title) title.textContent = "Your story is growing beautifully 🌷";
      if (message) message.textContent =
        "One month at a time, one memory at a time, one little forever at a time.";
    }
  }

  update();
  counterTimer = window.setInterval(update, 1000);
}

function stopCounter() {
  if (counterTimer) {
    clearInterval(counterTimer);
    counterTimer = null;
  }
}

$("#continueToHearts")?.addEventListener("click", () => {
  showScreen("heartsScreen");
});

/* -------------------- MUSIC ENGINE -------------------- */

/*
  Creates a gentle synthesized instrumental melody.
  This does not require an external song file.
*/

const melodyNotes = [
  261.63, 329.63, 392.00, 329.63,
  293.66, 349.23, 440.00, 349.23,
  261.63, 329.63, 392.00, 523.25,
  440.00, 392.00, 329.63, 293.66
];

function playSoftNote(frequency, startTime, duration = 1.1, gainAmount = 0.035) {
  if (!melodyContext) return;

  const oscillator = melodyContext.createOscillator();
  const gain = melodyContext.createGain();
  const filter = melodyContext.createBiquadFilter();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startTime);

  filter.type = "lowpass";
  filter.frequency.value = 1200;

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(
    gainAmount,
    startTime + 0.15
  );
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    startTime + duration
  );

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(melodyContext.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.05);
}

function updateMusicButton() {
  const button = $("#musicButton");
  if (!button) return;

  button.textContent = state.musicPlaying ? "Ⅱ" : "▶";
  button.setAttribute(
    "aria-label",
    state.musicPlaying ? "Pause music" : "Play music"
  );
}

async function startMusic() {
  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  // Use the user's own uploaded song if available.
  if (state.songUrl && $("#backgroundMusic")) {
    const audio = $("#backgroundMusic");

    audio.src = state.songUrl;
    audio.loop = true;
    audio.volume = 1.0; // Maximum volume: 100%

    try {
        await audio.play();

        state.musicPlaying = true;
        stopRomanticMelody();
        updateMusicButton();

        return;
    } catch (error) {
        console.warn("Music play korte pareni:", error);

        state.musicPlaying = false;
        updateMusicButton();

        // Browser music block korle user-ke button-e click korte hobe
        return;
    }
}

  if (!AudioContextClass) {
    alert("This browser does not support the built-in melody.");
    return;
  }

  if (!melodyContext) {
    melodyContext = new AudioContextClass();
  }

  await melodyContext.resume();

  if (melodyTimer) {
    state.musicPlaying = true;
    updateMusicButton();
    return;
  }

  melodyStep = 0;

  function playNextNote() {
    if (!melodyContext || melodyContext.state !== "running") return;

    const note = melodyNotes[melodyStep % melodyNotes.length];
    const now = melodyContext.currentTime;

    playSoftNote(note, now, 1.35, 0.035);

    if (melodyStep % 4 === 0) {
      playSoftNote(note / 2, now, 1.55, 0.018);
    }

    melodyStep++;
  }

  playNextNote();
  melodyTimer = window.setInterval(playNextNote, 850);

  state.musicPlaying = true;
  updateMusicButton();
}

function stopRomanticMelody() {
  if (melodyTimer) {
    clearInterval(melodyTimer);
    melodyTimer = null;
  }
}

async function pauseMusic() {
  if (state.songUrl && $("#backgroundMusic")) {
    $("#backgroundMusic").pause();
  }

  stopRomanticMelody();

  if (melodyContext && melodyContext.state === "running") {
    await melodyContext.suspend();
  }

  state.musicPlaying = false;
  updateMusicButton();
}

async function toggleMusic() {
  try {
    if (state.musicPlaying) {
      await pauseMusic();
    } else {
      await startMusic();
    }
  } catch (error) {
    console.error("Music playback error:", error);
    alert("Music start korte Play button-e abar click koro. Browser sound block korte pare.");
  }
}

$("#musicButton")?.addEventListener("click", toggleMusic);

/* User-uploaded music */
$("#songFile")?.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("audio/")) {
    alert("Please choose an audio file.");
    event.target.value = "";
    return;
  }

  if (state.songUrl) URL.revokeObjectURL(state.songUrl);

  state.songUrl = URL.createObjectURL(file);

  const audio = $("#backgroundMusic");
  if (audio) {
    audio.src = state.songUrl;
    audio.loop = true;
    audio.load();
  }

  alert("Your song is ready! Start the surprise and tap Play to listen. ♡");
});

/* -------------------- HEART GAME -------------------- */

const heartSurprises = {
  letter: {
    title: "A tiny love letter 💌",
    message: "If I could save one thing from every day, it would be the little moments that remind me of you."
  },
  compliment: {
    title: "Something beautiful about you 💗",
    message: "You have a special way of making ordinary moments feel a little more magical."
  },
  question: {
    title: "A little question 💝",
    message: "If we could create one unforgettable memory together, what would you want us to do?"
  }
};

$$("[data-surprise]").forEach((button) => {
  button.addEventListener("click", () => {
    const surprise = heartSurprises[button.dataset.surprise];
    if (!surprise) return;

    state.heartsOpened++;

    const title = $("#revealTitle");
    const message = $("#revealMessage");

    if (title) title.textContent = surprise.title;
    if (message) message.textContent = surprise.message;

    button.classList.add("heart-opened");
    button.disabled = true;
  });
});

$("#continueToMemories")?.addEventListener("click", () => {
  showScreen("memoriesScreen");
});

$("#continueToGift")?.addEventListener("click", () => {
  showScreen("giftScreen");
});

/* -------------------- MEDIA PREVIEWS -------------------- */

function revokeUrls(urls) {
  urls.forEach((url) => URL.revokeObjectURL(url));
  urls.length = 0;
}

function renderFilePreviews(inputId, previewId, type) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);

  if (!input || !preview) return;

  input.addEventListener("change", () => {
    const files = [...(input.files || [])];

    const urlMap = {
      photoFiles: localPhotoUrls,
      videoFiles: localVideoUrls,
      decorFiles: localDecorationUrls
    };

    const urls = urlMap[inputId];
    revokeUrls(urls);
    preview.replaceChildren();

    files.forEach((file) => {
      if (type === "image" && !file.type.startsWith("image/")) return;
      if (type === "video" && !file.type.startsWith("video/")) return;

      const url = URL.createObjectURL(file);
      urls.push(url);

      const item = document.createElement("div");
      item.className = "media-preview-item";

      if (type === "image") {
        const image = document.createElement("img");
        image.src = url;
        image.alt = file.name;
        item.appendChild(image);
      } else {
        const video = document.createElement("video");
        video.src = url;
        video.controls = true;
        video.playsInline = true;
        video.preload = "metadata";
        item.appendChild(video);
      }

      const caption = document.createElement("small");
      caption.textContent = file.name;
      item.appendChild(caption);

      preview.appendChild(item);
    });
  });
}

renderFilePreviews("photoFiles", "photoPreview", "image");
renderFilePreviews("videoFiles", "videoPreview", "video");
renderFilePreviews("decorFiles", "decorPreview", "image");

function renderMemoryGallery() {
  const gallery = $("#memoryGallery");
  if (!gallery) return;

  gallery.replaceChildren();

  const photoFiles = [...($("#photoFiles")?.files || [])];
  const videoFiles = [...($("#videoFiles")?.files || [])];
  const decorationFiles = [...($("#decorFiles")?.files || [])];

  const allFiles = [
    ...photoFiles.map((file) => ({ file, type: "image" })),
    ...videoFiles.map((file) => ({ file, type: "video" })),
    ...decorationFiles.map((file) => ({ file, type: "image" }))
  ];

  if (allFiles.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-gallery";
    empty.innerHTML = "<span>🌸</span><p>Your memories will appear here.</p>";
    gallery.appendChild(empty);
    return;
  }

  allFiles.forEach(({ file, type }) => {
    const card = document.createElement("div");
    card.className = "memory-card";

    const url = URL.createObjectURL(file);

    if (type === "image") {
      const image = document.createElement("img");
      image.src = url;
      image.alt = file.name;
      image.loading = "lazy";
      card.appendChild(image);
    } else {
      const video = document.createElement("video");
      video.src = url;
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      card.appendChild(video);
    }

    const caption = document.createElement("p");
    caption.textContent = file.name;
    card.appendChild(caption);

    gallery.appendChild(card);
  });
}

/* -------------------- GIFT REVEAL -------------------- */

$("#giftBoxButton")?.addEventListener("click", () => {
  const reveal = $("#finalReveal");
  if (reveal) reveal.hidden = false;

  const button = $("#giftBoxButton");
  if (button) {
    button.classList.add("gift-opened");
    button.innerHTML = "<span>💖</span><small>Your gift is open!</small>";
    button.disabled = true;
  }

  state.completed = true;

  try {
    const previous = Number(localStorage.getItem(storageKeys.completions) || 0);
    localStorage.setItem(storageKeys.completions, String(previous + 1));
  } catch (_) {}

  updateDashboard();
  showScreen("shareScreen");
});

$("#restartButton")?.addEventListener("click", () => {
  state.completed = false;
  state.heartsOpened = 0;

  $$("[data-surprise]").forEach((button) => {
    button.disabled = false;
    button.classList.remove("heart-opened");
  });

  if ($("#finalReveal")) $("#finalReveal").hidden = true;

  if ($("#giftBoxButton")) {
    $("#giftBoxButton").disabled = false;
    $("#giftBoxButton").innerHTML = "<span>🎁</span><small>Tap to open</small>";
    $("#giftBoxButton").classList.remove("gift-opened");
  }

  showScreen("welcomeScreen");
});

/* -------------------- SHARE LINK GENERATION -------------------- */

function getSurprisePayload() {
  return {
    version: 1,
    creator: state.creator,
    receiver: state.receiver,
    occasion: state.occasion,
    relationship: state.relationship,
    date: state.date,
    title: state.title,
    message: state.message,
    language: state.language,
    floatingEffects: state.floatingEffects
  };
}

function updateSharePreview() {
  const heading = $("#shareHeading");
  const description = $("#shareDescription");

  if (heading) {
    heading.textContent = state.title ||
      `A little surprise for ${state.receiver || "someone special"} ♡`;
  }

  if (description) {
    description.textContent =
      `${state.creator || "Someone special"} made this surprise with love.`;
  }
}

$("#generateLinkButton")?.addEventListener("click", () => {
  const payload = getSurprisePayload();

  try {
    const encoded = btoa(
      unescape(encodeURIComponent(JSON.stringify(payload)))
    );

    // The generated link contains text/settings only.
    // Local photos, videos and music are not uploaded by this code.
    const url = new URL(window.location.href);
    url.hash = `surprise=${encoded}`;

    state.shareUrl = url.toString();

    const linkInput = $("#shareLink");
    const area = $("#shareLinkArea");

    if (linkInput) linkInput.value = state.shareUrl;
    if (area) area.hidden = false;

    const status = $("#copyStatus");
    if (status) {
      status.textContent =
        "Link created! Photos, videos and local music need online hosting to be shared.";
    }
  } catch (error) {
    console.error("Link generation failed:", error);
    alert("Link create kora jayni. Abar try koro.");
  }
});

$("#copyLinkButton")?.addEventListener("click", async () => {
  const link = $("#shareLink")?.value;
  if (!link) return;

  try {
    await navigator.clipboard.writeText(link);

    const status = $("#copyStatus");
    if (status) status.textContent = "Link copied! Ebar partner-ke pathao. 💗";
  } catch (_) {
    const input = $("#shareLink");
    if (input) {
      input.focus();
      input.select();

      const copied = document.execCommand("copy");
      const status = $("#copyStatus");

      if (status) {
        status.textContent = copied
          ? "Link copied! 💗"
          : "Link select kora hoyeche. Ctrl+C press koro.";
      }
    }
  }
});

$("#previewSurpriseButton")?.addEventListener("click", () => {
  showScreen("milestoneScreen");
});

/* -------------------- OPEN A PERSONALIZED LINK -------------------- */

function decodeSurprise(encoded) {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const data = JSON.parse(json);

    if (!data || data.version !== 1) return false;

    state.creator = String(data.creator || "");
    state.receiver = String(data.receiver || "");
    state.occasion = String(data.occasion || "anniversary");
    state.relationship = String(data.relationship || "partner");
    state.date = String(data.date || "");
    state.title = String(data.title || "");
    state.message = String(data.message || "");
    state.language = String(data.language || "en");
    state.floatingEffects = data.floatingEffects !== false;

    const allowedOccasions = [
      "anniversary", "proposal", "confession", "justbecause"
    ];

    if (!allowedOccasions.includes(state.occasion)) {
      state.occasion = "anniversary";
    }

    if ($("#creatorName")) $("#creatorName").value = state.creator;
    if ($("#receiverName")) $("#receiverName").value = state.receiver;
    if ($("#occasionType")) $("#occasionType").value = state.occasion;
    if ($("#relationshipType")) $("#relationshipType").value = state.relationship;
    if ($("#anniversaryDate")) $("#anniversaryDate").value = state.date;
    if ($("#surpriseTitle")) $("#surpriseTitle").value = state.title;
    if ($("#loveMessage")) $("#loveMessage").value = state.message;
    if ($("#floatingEffects")) $("#floatingEffects").checked = state.floatingEffects;

    setLanguage(state.language);
    updateMilestoneMessage();
    syncOccasionFields();

    return true;
  } catch (error) {
    console.error("Could not decode the surprise link:", error);
    return false;
  }
}

function loadSurpriseFromLink() {
  const hash = window.location.hash;

  if (!hash.startsWith("#surprise=")) {
    alert("Surprise link open korte hole complete link-ti browser-e paste koro. ♡");
    return;
  }

  const encoded = hash.slice("#surprise=".length);

  if (!decodeSurprise(encoded)) {
    alert("Ei surprise link-ta valid noy ba damaged hoyeche.");
    return;
  }

  showScreen("milestoneScreen");

  if (state.autoplay) {
    // Browser may require the receiver to tap the music button.
    startMusic().catch(() => {});
  }
}

/* -------------------- LOCAL DRAFT / DASHBOARD -------------------- */

function saveDraft() {
  try {
    localStorage.setItem(storageKeys.draft, JSON.stringify({
      creator: state.creator,
      receiver: state.receiver,
      occasion: state.occasion,
      relationship: state.relationship,
      date: state.date,
      title: state.title,
      message: state.message,
      language: state.language,
      floatingEffects: state.floatingEffects
    }));
  } catch (_) {}
}

function updateDashboard() {
  let completions = 0;

  try {
    completions = Number(localStorage.getItem(storageKeys.completions) || 0);
  } catch (_) {}

  if ($("#completionCount")) {
    $("#completionCount").textContent = String(completions);
  }

  // A local estimate only, not a real global visitor count.
  if ($("#visitorCount")) {
    $("#visitorCount").textContent = "1";
  }

  if ($("#dashboardInfo")) {
    $("#dashboardInfo").textContent =
      "These figures belong to this browser only. Global active users require a server.";
  }
}

$("#backToShare")?.addEventListener("click", () => {
  showScreen("shareScreen");
});

/* -------------------- CLEANUP -------------------- */

window.addEventListener("beforeunload", () => {
  stopCounter();
  stopRomanticMelody();

  if (state.songUrl) {
    URL.revokeObjectURL(state.songUrl);
  }

  revokeUrls(localPhotoUrls);
  revokeUrls(localVideoUrls);
  revokeUrls(localDecorationUrls);
});

/* -------------------- INITIALIZATION -------------------- */

function initializeApp() {
  const currentHash = window.location.hash;

  updateDashboard();
  syncOccasionFields();

  if (currentHash.startsWith("#surprise=")) {
    const encoded = currentHash.slice("#surprise=".length);

    if (decodeSurprise(encoded)) {
      showScreen("welcomeScreen");

      const startButton = $("#startButton");
      if (startButton) {
        startButton.textContent = "Open Your Surprise ♡";
        startButton.onclick = () => showScreen("milestoneScreen");
      }
    } else {
      showScreen("welcomeScreen");
    }
  } else {
    showScreen("welcomeScreen");
  }
}

initializeApp();
