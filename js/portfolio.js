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

document.querySelector(".filters").hidden = false;
const filters = document.querySelectorAll("[data-filter]");
const projects = document.querySelectorAll("[data-category]");
const dealButton = document.querySelector("#deal-project");
const dealStatus = document.querySelector("#deal-status");
let lastDealt = null;
dealButton.hidden = false;
dealButton.addEventListener("click", () => {
  const visible = [...projects].filter((project) => !project.hidden);
  if (!visible.length) return;
  const candidates =
    visible.length > 1
      ? visible.filter((project) => project !== lastDealt)
      : visible;
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  projects.forEach((project) => project.classList.remove("is-dealt"));
  chosen.classList.add("is-dealt");
  lastDealt = chosen;
  const heading = chosen.querySelector("h3");
  heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: true });
  const reducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  chosen.scrollIntoView?.({
    behavior: reducedMotion ? "instant" : "smooth",
    block: "center",
  });
  dealStatus.textContent = `Your project: ${heading.textContent}`;
  dealButton.innerHTML =
    'Deal another project <span aria-hidden="true">&#9856;</span>';
});
filters.forEach((button) =>
  button.addEventListener("click", () => {
    const category = button.dataset.filter;
    filters.forEach((item) => {
      item.classList.toggle("is-active", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    });
    let count = 0;
    projects.forEach((project) => {
      project.classList.remove("is-dealt");
      project.hidden =
        category !== "all" && project.dataset.category !== category;
      if (!project.hidden) count++;
    });
    document.querySelector("#filter-status").textContent =
      `${count} projects shown: ${button.textContent}.`;
    dealStatus.textContent = "";
  }),
);

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
