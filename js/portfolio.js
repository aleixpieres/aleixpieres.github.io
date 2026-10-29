"use strict";

document.documentElement.classList.add("js");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
menuToggle.hidden = false;
function closeMenu() {
  menuToggle.setAttribute("aria-expanded", "false");
  navLinks.classList.remove("is-open");
}
menuToggle.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(open));
  navLinks.classList.toggle("is-open", open);
});
navLinks.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    menuToggle.getAttribute("aria-expanded") === "true"
  ) {
    closeMenu();
    menuToggle.focus();
  }
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".nav")) closeMenu();
});

// Draw without replacement. The pool refills only after a complete round.
const projects = [...document.querySelectorAll(".project-card")];
const slotMachine = document.querySelector("#project-slot");
const spinButton = document.querySelector("#spin-project");
const slotStatus = document.querySelector("#slot-status");
const remainingLabel = document.querySelector("#slot-remaining");
const results = document.querySelector("#project-results");
const strips = [...document.querySelectorAll(".reel-strip")];
const emptyResult = document.querySelector("#slot-empty");
let remaining = [];
let spinning = false;
function updateRemaining() {
  remainingLabel.textContent = remaining.length + " / " + projects.length;
}
if (projects.length) {
  remaining = [...projects];
  projects.forEach((project) => {
    project.hidden = true;
  });
  results.classList.add("slot-results");
  slotMachine.hidden = false;
  updateRemaining();
}
spinButton.addEventListener("click", () => {
  if (spinning || !projects.length) return;
  spinning = true;
  spinButton.disabled = true;
  spinButton.textContent = "Spinning...";
  if (!remaining.length) remaining = [...projects];
  updateRemaining();
  const chosenIndex = Math.floor(Math.random() * remaining.length);
  const chosen = remaining.splice(chosenIndex, 1)[0];
  const symbol = String(projects.indexOf(chosen) + 1).padStart(2, "0");
  const reducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  projects.forEach((project) => {
    project.hidden = true;
  });
  results.setAttribute("aria-busy", "true");
  emptyResult.hidden = false;
  emptyResult.textContent = "Choosing your next project...";
  slotStatus.textContent = "Spinning. A project will be revealed shortly.";
  strips.forEach((strip, reel) => {
    strip.replaceChildren();
    const cells = reducedMotion ? 1 : 15;
    for (let i = 0; i < cells; i++) {
      const cell = document.createElement("span");
      cell.className = "reel-cell";
      cell.textContent =
        i === cells - 1
          ? symbol
          : String(((i + reel) % projects.length) + 1).padStart(2, "0");
      strip.append(cell);
    }
  });
  const reveal = () => {
    slotMachine.classList.remove("is-spinning");
    strips.forEach((strip) => {
      const cell = document.createElement("span");
      cell.className = "reel-cell";
      cell.textContent = symbol;
      strip.replaceChildren(cell);
    });
    chosen.hidden = false;
    emptyResult.hidden = true;
    results.setAttribute("aria-busy", "false");
    updateRemaining();
    const title = chosen.querySelector("h3");
    title.setAttribute("tabindex", "-1");
    // Respect a visitor who tabs elsewhere while the reels are moving.
    if (
      document.activeElement === spinButton ||
      document.activeElement === document.body
    ) {
      title.focus({ preventScroll: true });
    }
    slotStatus.textContent =
      title.textContent +
      " revealed. " +
      (remaining.length
        ? remaining.length +
          " of " +
          projects.length +
          " projects left in this round."
        : "Round complete. Your next spin starts a fresh round.");
    spinButton.textContent = remaining.length
      ? "Spin again"
      : "New round / Spin again";
    spinButton.disabled = false;
    spinning = false;
  };
  if (reducedMotion) reveal();
  else {
    slotMachine.classList.add("is-spinning");
    window.setTimeout(reveal, 1450);
  }
});

const copyButton = document.querySelector("#copy-email");
const copyStatus = document.querySelector("#copy-status");
if (navigator.clipboard && window.isSecureContext) {
  copyButton.hidden = false;
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("aleixpierescarrasco@gmail.com");
      copyButton.textContent = "Copied ✓";
      copyStatus.textContent = "Email address copied to clipboard.";
      copyButton.disabled = true;
      window.setTimeout(() => {
        copyButton.textContent = "Copy ⧉";
        copyButton.disabled = false;
      }, 2400);
    } catch {
      copyStatus.textContent =
        "Copy unavailable. Select the email address to copy it, or use the email link.";
      copyButton.textContent = "Select email";
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(document.querySelector(".email-line > a"));
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });
}

document.querySelector("#year").textContent = new Date().getFullYear();
if ("IntersectionObserver" in window) {
  const sections = document.querySelectorAll(
    "#work-section, #resume-section, #projects-section, #about-section, #contact-section",
  );
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.querySelectorAll("a").forEach((link) => {
          if (link.hash === `#${entry.target.id}`)
            link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    },
    { rootMargin: "-15% 0px -55% 0px" },
  );
  sections.forEach((section) => observer.observe(section));
}
