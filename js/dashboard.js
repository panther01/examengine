// ============================
// DASHBOARD PAGE
// ============================

const user = JSON.parse(localStorage.getItem("currentUser"));

if (!user) {
  location.href = "index.html";
}

document.getElementById("welcome").innerHTML =
  "Welcome, " + user.name + " 👋";

const d = new Date();
document.getElementById("today").innerHTML = d.toDateString();

document.getElementById("logoutBtn").onclick = function () {
  localStorage.removeItem("currentUser");
  location.href = "index.html";
};

// ---------- Subject registry (question bank sizes) ----------
// Keys match the ids used across dashboard.html / subjects.html / quiz.html
const SUBJECT_TOTALS = {
  polity: 954,
  history: 1886,
  science: 1382,
  geography: 1527,
  economics: 1364,
  environment: 482
};
const SUBJECTS = Object.keys(SUBJECT_TOTALS);

// ---------- Pull real data from Storage, with a safe fallback ----------
// (keeps the page from breaking if js/storage.js hasn't wired
// up Storage.getDashboard() yet)
function getDashboardData() {
  try {
    if (typeof Storage !== "undefined" && Storage.getDashboard) {
      const d = Storage.getDashboard();
      if (d) return d;
    }
  } catch (e) {
    console.warn("Storage.getDashboard() failed, using empty defaults:", e);
  }

  const fallback = {
    summary: { attempted: 0, accuracy: 0, bookmarks: 0, streak: 0 }
  };
  SUBJECTS.forEach(key => {
    fallback[key] = { attempted: 0, progress: 0 };
  });
  return fallback;
}

const dashboard = getDashboardData();
const summary = dashboard.summary || { attempted: 0, accuracy: 0, bookmarks: 0, streak: 0 };

// ---------- Totals across every subject ----------
const totalQuestions = SUBJECTS.reduce((sum, key) => sum + SUBJECT_TOTALS[key], 0);
const totalAttempted = SUBJECTS.reduce((sum, key) => {
  const s = dashboard[key] || {};
  return sum + (s.attempted || 0);
}, 0);
const overallPercent = totalQuestions
  ? Math.round((totalAttempted / totalQuestions) * 100)
  : 0;

// ---------- Top stat cards ----------
animateNumber("questionsSolved", summary.attempted || 0);
document.getElementById("questionsTotal").innerHTML =
  "of " + totalQuestions.toLocaleString() + " total";

animateNumber("accuracy", summary.accuracy || 0, "%");
const correctCount = Math.round(((summary.accuracy || 0) / 100) * (summary.attempted || 0));
document.getElementById("accuracyFraction").innerHTML =
  correctCount.toLocaleString() + " correct of " + (summary.attempted || 0).toLocaleString();

animateNumber("bookmarks", summary.bookmarks || 0);
animateNumber("streak", summary.streak || 0);

// ---------- Hero gauge ----------
setTimeout(() => {
  const circumference = 590.6; // 2 * PI * 94, matches CSS
  const offset = circumference - (circumference * overallPercent) / 100;
  document.getElementById("gaugeFill").style.strokeDashoffset = offset;
  document.getElementById("overallPercent").innerHTML = overallPercent + "%";
  document.getElementById("overallFraction").innerHTML =
    totalAttempted.toLocaleString() + " / " + totalQuestions.toLocaleString() + " questions attempted";
}, 250);

// ---------- Per-subject cards ----------
SUBJECTS.forEach(loadSubject);

function loadSubject(key) {
  const total = SUBJECT_TOTALS[key];
  const s = dashboard[key] || { attempted: 0, progress: 0 };
  const attempted = s.attempted || 0;
  const pct = total ? Math.round((attempted / total) * 100) : (s.progress || 0);

  setTimeout(() => {
    document.getElementById(key + "Bar").style.width = pct + "%";
  }, 250);

  document.getElementById(key + "Text").innerHTML = pct + "%";
  document.getElementById(key + "Fraction").innerHTML =
    attempted.toLocaleString() + " / " + total.toLocaleString();
}

function animateNumber(id, target, suffix = "") {
  let current = 0;
  const el = document.getElementById(id);
  if (!el) return;
  const step = Math.max(1, Math.ceil(target / 60));
  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.innerHTML = current + suffix;
  }, 20);
}

function gotoSubject(subject) {
  window.location.href = "quiz.html?subject=" + subject;
}

// ---------- Lightweight 3D tilt (mouse only, respects reduced motion) ----------
const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (supportsHover && !prefersReducedMotion) {
  document.querySelectorAll("[data-tilt]").forEach(el => {
    el.addEventListener("mousemove", e => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform =
        `perspective(800px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 7).toFixed(2)}deg) translateY(-4px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  });
}
