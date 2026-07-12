/* =========================================================
   UPPSC PYQ — Quiz App (multi-subject)
   All data lives in QUIZ_DATA, loaded dynamically per subject
   (see the loader script in index.html), grouped by chapter,
   in strict book order. Each question has a globally unique,
   sequential `id` that IS the book order — so sorting/iterating
   by id reproduces the exact order of the physical book.

   This file only runs the quiz once a subject has been chosen
   on the front screen. If no subject/data is loaded, it does
   nothing and the subject-picker screen stays visible.
   ========================================================= */

// ---------- Subject registry ----------
// Add a new subject here + a data-<key>.js file + a card in
// index.html's #subjectScreen to extend to more subjects.
const SUBJECT_META = {
  polity: {
    title: "Indian Polity PYQ",
    seal: "भा",
    storageKey: "polityQuizState_v1",
    exportName: "polity-quiz-progress.json",
    promptSection: "Indian Polity",
    promptConcept: "constitutional/political concept thoroughly, mention relevant articles/provisions if applicable,",
  },
  geography: {
    title: "Geography PYQ",
    seal: "भू",
    storageKey: "geoQuizState_v1",
    exportName: "geography-quiz-progress.json",
    promptSection: "Geography",
    promptConcept: "geographical concept thoroughly (physical, economic, or world geography as relevant), mention relevant facts/data/locations if applicable,",
  },
  science: {
    title: "General Science PYQ",
    seal: "तत्व",
    storageKey: "scienceQuizState_v1",
    exportName: "science-quiz-progress.json",
    promptSection: "General Science",
    promptConcept: "scientific concept thoroughly (physics, chemistry, or biology as relevant), mention relevant laws/formulae/facts if applicable,",
  },
economics: {
  title: "Indian Economy PYQ",
  seal: "अ",
  storageKey: "economicsQuizState_v1",
  exportName: "economics-quiz-progress.json",
  promptSection: "Indian Economy",
  promptConcept: "economic concept thoroughly, explain relevant schemes, policies, reports, indices, institutions, and economic implications where applicable,",
},

environment: {
  title: "Environment & Ecology PYQ",
  seal: "प",
  storageKey: "environmentQuizState_v1",
  exportName: "environment-quiz-progress.json",
  promptSection: "Environment & Ecology",
  promptConcept: "environmental/ecological concept thoroughly, mention relevant conventions, protected areas, species, laws, policies, and scientific principles where applicable,",
},
  history: {
    title: "Histroy PYQ",
    seal: "इतिहास",
    storageKey: "historyQuizState_v1",
    exportName: "history-quiz-progress.json",
    promptSection: "History",
    promptConcept: "historical concept thoroughly mention important dates, events, causes, consequences, and historical significance wherever applicable,",
  }
};

if (typeof QUIZ_DATA !== "undefined" && SUBJECT_META[window.CURRENT_SUBJECT]) {
  startQuiz(SUBJECT_META[window.CURRENT_SUBJECT]);
}

function startQuiz(meta) {

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.onclick = function () {

        Storage.logout();

        location.replace("index.html");

    };

}  

// const STORAGE_KEY = meta.storageKey;

// ---------- Flatten data, preserving book order ----------
const ALL_Q = [];
const CHAPTERS = QUIZ_DATA; // [{chapter, chapterIndex, questions:[...]}]
CHAPTERS.forEach(ch => ch.questions.forEach(q => ALL_Q.push(q)));
ALL_Q.sort((a, b) => a.id - b.id);
const Q_BY_ID = {};
ALL_Q.forEach((q, i) => { Q_BY_ID[q.id] = q; q._pos = i; });
const TOTAL_Q = ALL_Q.length;

// ---------- Initialize quiz screen ----------
const subjectScreen = document.getElementById("subjectScreen");
if (subjectScreen) {
    subjectScreen.style.display = "none";
}

const appScreen = document.getElementById("appScreen");
appScreen.style.display = "block";

document.title = `${meta.title} · UPPSC Quiz`;

document.querySelector("#appScreen .seal").textContent = meta.seal;
document.querySelector("#appScreen .brand h1").textContent = meta.title;
document.querySelector("#appScreen .brand p").textContent =
    `UPPSC · ${TOTAL_Q} Questions`;

document.getElementById("spText").textContent =
    `0 / ${TOTAL_Q}`;

// ---------- State ----------
function defaultState() {
  return {
    currentId: ALL_Q[0].id,

    answers: {},

    bookmarks: {},

    optionOrder: {},

    theme: "light",

    shuffle: false,

    autoAdvance: false,

    // ---------- Analytics ----------

    totalStudyTime: 0,

    sessionStart: Date.now(),

    lastVisit: Date.now(),

    streak: 1,

    lastStudyDate: new Date().toDateString(),

    history: [],

    chapterStats: {}
  };
}
let state = loadState();
state.sessionStart = Date.now();

function loadState() {

  const savedState = Storage.load(window.CURRENT_SUBJECT);

  if (!savedState) {
    return defaultState();
  }

  return Object.assign(defaultState(), savedState);

}
function saveState(){

Storage.save(

window.CURRENT_SUBJECT,

state

);

}

// ---------- DOM refs ----------
const $ = sel => document.querySelector(sel);
const qcard = $("#qcard");
const chapterListEl = $("#chapterList");
const toastEl = $("#toast");

// ---------- Theme ----------
function applyTheme() {
  document.body.setAttribute("data-theme", state.theme);
  $("#themeBtn").textContent = state.theme === "dark" ? "☀️" : "🌙";
  $("#themeToggle").checked = state.theme === "dark";
}
$("#themeBtn").addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  saveState(); applyTheme();
});
$("#themeToggle").addEventListener("change", e => {
  state.theme = e.target.checked ? "dark" : "light";
  saveState(); applyTheme();
});

// ---------- Toast ----------
let toastTimer = null;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
}

// ---------- Sidebar: chapter list + index chips ----------
const chipMap = {}; // id -> element
let openChapterIndex = null;

function buildSidebar() {
  chapterListEl.innerHTML = "";
  CHAPTERS.forEach((ch, ci) => {
    const item = document.createElement("div");
    item.className = "chapter-item";

    const head = document.createElement("button");
    head.className = "chapter-head";
    head.innerHTML = `<span class="num">${String(ci + 1).padStart(2, "0")}</span>
      <span class="name">${escapeHtml(ch.chapter)}</span>
      <span class="count">${ch.questions.length}</span>
      <span class="chev">▸</span>`;
    head.addEventListener("click", () => toggleChapter(ci));

    const grid = document.createElement("div");
    grid.className = "qgrid";
    ch.questions.forEach(q => {
      const chip = document.createElement("div");
      chip.className = "qchip";
      chip.textContent = q.qNoInChapter;
      chip.title = q.question.slice(0, 60);
      chip.addEventListener("click", () => { goTo(q.id); if (window.innerWidth <= 880) closeSidebar(); });
      grid.appendChild(chip);
      chipMap[q.id] = chip;
    });

    item.appendChild(head);
    item.appendChild(grid);
    chapterListEl.appendChild(item);
  });
}

function toggleChapter(ci, forceOpen) {
  const items = chapterListEl.querySelectorAll(".chapter-item");
  items.forEach((item, i) => {
    const head = item.querySelector(".chapter-head");
    const grid = item.querySelector(".qgrid");
    if (i === ci) {
      const shouldOpen = forceOpen !== undefined ? forceOpen : !head.classList.contains("open");
      head.classList.toggle("open", shouldOpen);
      grid.classList.toggle("open", shouldOpen);
      if (shouldOpen) openChapterIndex = ci;
    } else if (forceOpen !== false) {
      head.classList.remove("open");
      grid.classList.remove("open");
    }
  });
}

function refreshChipStyles() {
  ALL_Q.forEach(q => {
    const chip = chipMap[q.id];
    if (!chip) return;
    chip.classList.remove("correct", "wrong", "current", "bookmarked");
    const a = state.answers[q.id];
    if (a) chip.classList.add(a.disputed ? "" : (a.isCorrect ? "correct" : "wrong"));
    if (state.bookmarks[q.id]) chip.classList.add("bookmarked");
    if (q.id === state.currentId) chip.classList.add("current");
  });
}

function highlightActiveChapter(ci) {
  chapterListEl.querySelectorAll(".chapter-head").forEach((h, i) => {
    h.classList.toggle("active", i === ci);
  });
}

// ---------- Overall progress ----------
function updateProgressUI() {
  const answered = Object.keys(state.answers).length;
  $("#spText").textContent = `${answered} / ${TOTAL_Q}`;
  $("#spFill").style.width = `${(answered / TOTAL_Q * 100).toFixed(1)}%`;
  let correct = 0, wrong = 0;
  Object.values(state.answers).forEach(a => { if (!a.disputed) { a.isCorrect ? correct++ : wrong++; } });
  $("#correctCount").textContent = correct;
  $("#wrongCount").textContent = wrong;
}

// ---------- Rendering a question ----------
function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function getOptionOrder(q) {
  if (!state.shuffle) return q.options.map(o => o.key);
  if (state.optionOrder[q.id]) return state.optionOrder[q.id];
  const keys = q.options.map(o => o.key);
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [keys[i], keys[j]] = [keys[j], keys[i]];
  }
  state.optionOrder[q.id] = keys;
  saveState();
  return keys;
}

function renderQuestion(id, animate = true) {

    if (!animate) {
        renderQuestionContent(id);
        return;
    }

    qcard.classList.add("hide");

    setTimeout(() => {

        renderQuestionContent(id);

        qcard.classList.remove("hide");

        qcard.classList.add("show");

        setTimeout(() => {

            qcard.classList.remove("show");

        }, 1);

    }, 1);

}
function renderQuestionContent(id) {
  const q = Q_BY_ID[id];
  if (!q) return;
  state.currentId = id;
  saveState();

  const ci = q.chapterIndex - 1;
  $("#crumb").textContent = `${q.chapter} · Question ${q.qNoInChapter} of ${CHAPTERS[ci].questions.length} · (#${q._pos + 1} of ${TOTAL_Q} overall)`;
  $("#topTitle").textContent = q.chapter;
  highlightActiveChapter(ci);
  if (openChapterIndex !== ci) toggleChapter(ci, true);
  refreshChipStyles();
  const activeChip = chipMap[id];
  if (activeChip) activeChip.scrollIntoView({ block: "nearest" });

  const answered = state.answers[id];
  const bookmarked = !!state.bookmarks[id];
  const optKeys = getOptionOrder(q);
  const optionByKey = {}; q.options.forEach(o => optionByKey[o.key] = o.text);

  let optsHtml = "";
  optKeys.forEach(key => {
    const text = optionByKey[key];
    let cls = "option";
    if (answered) {
      cls += " locked";
      if (!answered.disputed) {
        if (q.answer.includes(key)) cls += " is-correct";
        else if (key === answered.selected) cls += " is-wrong";
        else cls += " faded";
      } else {
        if (key === answered.selected) cls += " selected";
      }
    }
    optsHtml += `<button class="${cls}" data-key="${key}" ${answered ? "disabled" : ""}>
      <span class="key">${key.toUpperCase()}</span><span>${escapeHtml(text)}</span>
    </button>`;
  });

  let resultHtml = "";
  let explanationHtml = "";
  let bonusHtml = "";
  let readMoreHtml = "";

  if (answered) {
    if (answered.disputed) {
      resultHtml = `<div class="result-banner disputed">
        <div class="seal-stamp">?</div>
        <div class="result-text"><b>Answer disputed in source</b>The book flags this question as having an ambiguous or contested official answer.</div>
      </div>`;
    } else if (answered.isCorrect) {
      resultHtml = `<div class="result-banner correct">
        <div class="seal-stamp">✓</div>
        <div class="result-text"><b>Correct</b>Well done — that matches the book's answer key.</div>
      </div>`;
    } else {
      resultHtml = `<div class="result-banner wrong">
        <div class="seal-stamp">✗</div>
        <div class="result-text"><b>Not quite</b>The correct option is highlighted above.</div>
      </div>`;
    }
    explanationHtml = `<div class="panel">
      <h4>📖 Explanation</h4>
      <p>${escapeHtml(q.explanation || "No explanation available for this question in the source.")}</p>
    </div>`;
    if (q.bonus) {
      bonusHtml = `<div class="panel bonus">
        <h4>📌 Related fact from the book</h4>
        <p>${escapeHtml(q.bonus)}</p>
      </div>`;
    }
    readMoreHtml = `<button class="btn primary" id="readMoreBtn">🔗 Read more — copy prompt for ChatGPT</button>`;
  }

  qcard.innerHTML = `
    <div class="qmeta">
      <span class="badge">Ch. ${ci + 1} · Q${q.qNoInChapter}</span>
      ${q.source ? `<span class="badge source">${escapeHtml(q.source)}</span>` : ""}
      ${answered && answered.disputed ? `<span class="badge">disputed</span>` : ""}
      <button class="bookmark-btn ${bookmarked ? "active" : ""}" id="bookmarkBtn" title="Bookmark for revision">${bookmarked ? "★" : "☆"}</button>
    </div>
    <h3 class="qstem">${escapeHtml(q.question)}</h3>
    <div class="options">${optsHtml}</div>
    ${resultHtml}
    ${explanationHtml}
    ${bonusHtml}
    <div class="actions-row">${readMoreHtml}</div>
    <div class="nav-row">
      <button class="btn" id="prevBtn" ${q._pos === 0 ? "disabled" : ""}>← Previous</button>
      <button class="btn" id="skipBtn">Skip to unattempted →</button>
      <button class="btn primary" id="nextBtn" ${q._pos === TOTAL_Q - 1 ? "disabled" : ""}>Next →</button>
    </div>
  `;

  if (!answered) {
    qcard.querySelectorAll(".option").forEach(btn => {
      btn.addEventListener("click", () => selectOption(q, btn.dataset.key));
    });
  }
  $("#bookmarkBtn").addEventListener("click", () => toggleBookmark(id));
  $("#prevBtn").addEventListener("click", () => goRelative(-1));
  $("#nextBtn").addEventListener("click", () => goRelative(1));
  $("#skipBtn").addEventListener("click", goToNextUnattempted);
  const rmBtn = $("#readMoreBtn");
  if (rmBtn) rmBtn.addEventListener("click", () => copyReadMore(q));
}

function selectOption(q, key) {
  const disputed = !q.answer || q.answer.length === 0;
  const isCorrect = !disputed && q.answer.includes(key);
  state.answers[q.id] = { selected: key, isCorrect, disputed };
  state.history.push({

questionId:q.id,

chapter:q.chapter,

correct:isCorrect,

date:Date.now()

});

if(!state.chapterStats[q.chapter]){

    state.chapterStats[q.chapter]={

        attempted:0,

        correct:0

    };

}

state.chapterStats[q.chapter].attempted++;

if(isCorrect){

    state.chapterStats[q.chapter].correct++;

}

  saveState();
  Storage.recordStudyActivity(); // marks today as a study day for the global streak
  updateProgressUI();
  renderQuestion(q.id, false);
  if (state.autoAdvance && q._pos < TOTAL_Q - 1) {
    setTimeout(() => goRelative(1), 1500);
  }
}

function toggleBookmark(id) {
  if (state.bookmarks[id]) delete state.bookmarks[id];
  else state.bookmarks[id] = true;
  saveState();
  renderQuestion(id);
}

function goTo(id) { renderQuestion(id); }
function goRelative(delta) {
  const q = Q_BY_ID[state.currentId];
  const newPos = Math.min(TOTAL_Q - 1, Math.max(0, q._pos + delta));
  renderQuestion(ALL_Q[newPos].id);
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function goToNextUnattempted() {
  const cur = Q_BY_ID[state.currentId];
  for (let i = cur._pos + 1; i < TOTAL_Q; i++) {
    if (!state.answers[ALL_Q[i].id]) return renderQuestion(ALL_Q[i].id);
  }
  for (let i = 0; i < cur._pos; i++) {
    if (!state.answers[ALL_Q[i].id]) return renderQuestion(ALL_Q[i].id);
  }
  showToast("You've attempted every question! 🎉");
}

// ---------- Read More → copy ChatGPT prompt ----------
function copyReadMore(q) {
  const optLines = q.options.map(o => `(${o.key}) ${o.text}`).join("\n");
  const prompt = `I'm preparing for the UPPSC (Uttar Pradesh Public Service Commission) exam, ${meta.promptSection} section. Please explain the topic behind this previous-year question from basics, at UPSC/UPPCS preparation depth — as if teaching someone who has never studied it before. Identify the correct option with reasoning, explain the underlying ${meta.promptConcept} and note any commonly confused related facts.

Question: ${q.question}
${optLines}
${q.source ? `\n(Asked in: ${q.source})` : ""}`;

  copyToClipboard(prompt).then(() => {
    showToast("Prompt copied! Paste it into ChatGPT or any AI chat. 📋");
  }).catch(() => {
    showManualCopyModal(prompt);
  });
}

function showManualCopyModal(text) {
  const box = $("#searchResults");
  $("#searchTitle").textContent = "Copy this prompt";
  $("#searchSub").textContent = "Couldn't copy automatically — select all and copy manually:";
  box.innerHTML = `<textarea readonly style="width:100%;height:220px;font-family:var(--mono);font-size:12px;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--ink);">${escapeHtml(text)}</textarea>`;
  openModal("searchModal");
  box.querySelector("textarea").select();
}

function fallbackCopy(text) {
  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error("execCommand copy failed"));
    } catch (e) { reject(e); }
  });
}
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  }
  return fallbackCopy(text);
}

// ---------- Sidebar open/close (mobile) ----------
function openSidebar() { $("#sidebar").classList.add("open"); $("#sidebarBackdrop").classList.add("show"); }
function closeSidebar() { $("#sidebar").classList.remove("open"); $("#sidebarBackdrop").classList.remove("show"); }
$("#menuBtn").addEventListener("click", openSidebar);
$("#sidebarBackdrop").addEventListener("click", closeSidebar);

// ---------- Search ----------
$("#searchInput").addEventListener("keydown", e => {
  if (e.key === "Enter") runSearch(e.target.value.trim());
});
function runSearch(term) {
  if (!term) return;
  const lower = term.toLowerCase();
  const results = ALL_Q.filter(q => q.question.toLowerCase().includes(lower)).slice(0, 60);
  $("#searchTitle").textContent = "Search results";
  $("#searchSub").textContent = `${results.length} match(es) for "${term}"`;
  const box = $("#searchResults");
  box.innerHTML = "";
  if (results.length === 0) {
    box.innerHTML = `<div class="empty-state"><div class="icon">🔍</div>No questions found.</div>`;
  }
  results.forEach(q => {
    const row = document.createElement("div");
    row.style.cssText = "padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer;";
    row.innerHTML = `<div style="font-size:11px;font-family:var(--mono);color:var(--ink-faint);margin-bottom:3px;">${escapeHtml(q.chapter)} · Q${q.qNoInChapter}</div>
      <div style="font-size:13.5px;">${escapeHtml(q.question.slice(0, 130))}${q.question.length > 130 ? "…" : ""}</div>`;
    row.addEventListener("click", () => { goTo(q.id); closeModal("searchModal"); if (window.innerWidth <= 880) closeSidebar(); });
    box.appendChild(row);
  });
  openModal("searchModal");
}

// ---------- Modals ----------
function openModal(id) { $("#" + id).classList.add("show"); }
function closeModal(id) { $("#" + id).classList.remove("show"); }
document.querySelectorAll(".modal-close").forEach(btn => btn.addEventListener("click", () => closeModal(btn.dataset.close)));
document.querySelectorAll(".modal-overlay").forEach(ov => ov.addEventListener("click", e => { if (e.target === ov) ov.classList.remove("show"); }));

// ---------- Stats modal ----------
$("#statsBtn").addEventListener("click", () => {
  const answered = Object.values(state.answers);
  const attempted = answered.length;
  const correct = answered.filter(a => !a.disputed && a.isCorrect).length;
  const wrong = answered.filter(a => !a.disputed && !a.isCorrect).length;
  const acc = attempted ? Math.round((correct / (correct + wrong || 1)) * 100) : 0;
  $("#statGrid").innerHTML = `
    <div class="stat-box"><div class="n">${attempted}</div><div class="l">Attempted</div></div>
    <div class="stat-box"><div class="n">${TOTAL_Q - attempted}</div><div class="l">Remaining</div></div>
    <div class="stat-box"><div class="n" style="color:var(--correct)">${correct}</div><div class="l">Correct</div></div>
    <div class="stat-box"><div class="n" style="color:var(--wrong)">${wrong}</div><div class="l">Incorrect</div></div>
    <div class="stat-box"><div class="n">${acc}%</div><div class="l">Accuracy</div></div>
    <div class="stat-box"><div class="n">${Object.keys(state.bookmarks).length}</div><div class="l">Bookmarked</div></div>
  `;
  const barsEl = $("#chapterBars");
  barsEl.innerHTML = "";
  CHAPTERS.forEach(ch => {
    const total = ch.questions.length;
    const done = ch.questions.filter(q => state.answers[q.id]).length;
    const pct = Math.round((done / total) * 100);
    const row = document.createElement("div");
    row.className = "chapter-bar-row";
    row.innerHTML = `<div class="name" title="${escapeHtml(ch.chapter)}">${escapeHtml(ch.chapter)}</div>
      <div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>
      <div class="pct">${done}/${total}</div>`;
    barsEl.appendChild(row);
  });
  openModal("statsModal");
});

// ---------- Settings modal ----------
$("#settingsBtn").addEventListener("click", () => {
  $("#shuffleToggle").checked = state.shuffle;
  $("#autoAdvanceToggle").checked = state.autoAdvance;
  openModal("settingsModal");
});
$("#shuffleToggle").addEventListener("change", e => { state.shuffle = e.target.checked; state.optionOrder = {}; saveState(); renderQuestion(state.currentId); });
$("#autoAdvanceToggle").addEventListener("change", e => { state.autoAdvance = e.target.checked; saveState(); });
$("#resetBtn").addEventListener("click", () => {
  if (confirm("This will erase all your answers, bookmarks and stats on this device. Continue?")) {
    state = defaultState();
    saveState();
    location.reload();
  }
});
$("#exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = meta.exportName;
  a.click();
  showToast("Progress exported.");
});
$("#importBtn").addEventListener("click", () => $("#importFile").click());
$("#importFile").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      state = Object.assign(defaultState(), imported);
      saveState();
      location.reload();
    } catch (err) { showToast("Invalid backup file."); }
  };
  reader.readAsText(file);
});

// ---------- Keyboard shortcuts ----------
document.addEventListener("keydown", e => {
  const tag = (document.activeElement && document.activeElement.tagName) || "";
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  const k = e.key.toLowerCase();
  if (["1", "2", "3", "4", "a", "b", "c", "d"].includes(k)) {
    const map = { "1": "a", "2": "b", "3": "c", "4": "d" };
    const key = map[k] || k;
    const btn = qcard.querySelector(`.option[data-key="${key}"]:not(.locked)`);
    if (btn) btn.click();
  } else if (k === "arrowright" || k === "n") { goRelative(1); }
  else if (k === "arrowleft" || k === "p") { goRelative(-1); }
  else if (k === "s") { toggleBookmark(state.currentId); }
  else if (k === "r") { const btn = $("#readMoreBtn"); if (btn) btn.click(); }
  else if (k === "escape") { document.querySelectorAll(".modal-overlay.show").forEach(m => m.classList.remove("show")); }
});

// ---------- Switch subject ----------
const switchBtn = $("#switchSubjectBtn");

if (switchBtn) {

    switchBtn.onclick = function () {

        window.location.replace("dashboard.html");

    };

}

// ---------- Init ----------
function init() {
  applyTheme();
  buildSidebar();
  updateProgressUI();
  renderQuestion(state.currentId);
}
init();

} // end startQuiz()

// window.addEventListener("beforeunload", () => {

//     const seconds = Math.floor(

//         (Date.now() - state.sessionStart)

//         /1000

//     );

//     state.totalStudyTime += seconds;

//     state.lastVisit = Date.now();

//     saveState();

// });
