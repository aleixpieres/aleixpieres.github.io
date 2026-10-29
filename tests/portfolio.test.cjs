const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "js/portfolio.js"), "utf8");
function page(setup = () => {}) {
  const dom = new JSDOM(html, {
    url: "https://aleixpieres.github.io/",
    runScripts: "outside-only",
  });
  setup(dom.window);
  dom.window.eval(script);
  return dom;
}

test("every local link and asset exists, every anchor resolves, and IDs are unique", () => {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const ids = [...doc.querySelectorAll("[id]")].map((el) => el.id);
  assert.equal(ids.length, new Set(ids).size);
  for (const el of doc.querySelectorAll("[href], [src]")) {
    const url = el.getAttribute("href") || el.getAttribute("src");
    if (url.startsWith("#")) assert.ok(doc.getElementById(url.slice(1)), url);
    else if (!/^[a-z]+:/i.test(url))
      assert.ok(fs.existsSync(path.join(root, url)), url);
  }
  for (const el of doc.querySelectorAll("[aria-labelledby], [aria-controls]")) {
    for (const id of (
      el.getAttribute("aria-labelledby") || el.getAttribute("aria-controls")
    ).split(" ")) {
      assert.ok(doc.getElementById(id), id);
    }
  }
  assert.equal(
    doc.querySelector('a[href^="mailto:"]').getAttribute("href"),
    "mailto:aleixpierescarrasco@gmail.com",
  );
  dom.window.close();
});

test("essential content and native disclosures work without JavaScript", () => {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  assert.equal(doc.querySelectorAll(".project-card:not([hidden])").length, 3);
  assert.equal(doc.querySelectorAll("details > summary").length, 4);
  assert.ok(doc.querySelector("#deal-project").hidden);
  assert.ok(doc.querySelector(".filters").hidden);
  assert.ok(doc.querySelector(".menu-toggle").hidden);
  assert.ok(!doc.querySelector(".nav-links").hidden);
  assert.ok(
    doc.querySelector("a[download]").getAttribute("href").endsWith(".pdf"),
  );
  dom.window.close();
});

test("project filters expose matching projects and announce the result", () => {
  const dom = page();
  const doc = dom.window.document;
  for (const category of ["systems", "software", "all"]) {
    doc.querySelector(`[data-filter="${category}"]`).click();
    const visible = [...doc.querySelectorAll(".project-card")].filter(
      (el) => !el.hidden,
    );
    assert.equal(visible.length, { systems: 2, software: 1, all: 3 }[category]);
    assert.ok(
      visible.every(
        (el) => category === "all" || el.dataset.category === category,
      ),
    );
    assert.equal(
      doc.querySelectorAll('[data-filter][aria-pressed="true"]').length,
      1,
    );
    assert.match(
      doc.querySelector("#filter-status").textContent,
      new RegExp(`${visible.length} projects shown`),
    );
  }
  dom.window.close();
});

test("mobile menu closes on navigation, outside click, and Escape with focus restored", () => {
  const dom = page();
  const doc = dom.window.document;
  const toggle = doc.querySelector(".menu-toggle");
  toggle.click();
  assert.equal(toggle.getAttribute("aria-expanded"), "true");
  assert.ok(doc.querySelector(".nav-links").classList.contains("is-open"));
  doc.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape" }));
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  assert.equal(doc.activeElement, toggle);
  toggle.click();
  doc.querySelector(".nav-links a").click();
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  toggle.click();
  doc.querySelector("h1").click();
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  dom.window.close();
});

test("copy email writes the correct address and announces success", async () => {
  let copied;
  const dom = page((win) => {
    Object.defineProperty(win, "isSecureContext", { value: true });
    Object.defineProperty(win.navigator, "clipboard", {
      value: {
        writeText: async (text) => {
          copied = text;
        },
      },
    });
  });
  const button = dom.window.document.querySelector("#copy-email");
  assert.equal(button.hidden, false);
  button.click();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(copied, "aleixpierescarrasco@gmail.com");
  assert.match(button.textContent, /Copied/);
  assert.match(
    dom.window.document.querySelector("#copy-status").textContent,
    /copied/,
  );
  dom.window.close();
});

test("clipboard failure falls back to selecting the email address", async () => {
  const dom = page((win) => {
    Object.defineProperty(win, "isSecureContext", { value: true });
    Object.defineProperty(win.navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("Denied");
        },
      },
    });
  });
  dom.window.document.querySelector("#copy-email").click();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(
    dom.window.getSelection().toString(),
    "aleixpierescarrasco@gmail.com",
  );
  assert.match(
    dom.window.document.querySelector("#copy-status").textContent,
    /Copy unavailable/,
  );
  dom.window.close();
});

test("metadata is valid and outbound tabs use safe link attributes", () => {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  assert.equal(doc.querySelectorAll("h1").length, 1);
  assert.equal(
    JSON.parse(
      doc.querySelector('script[type="application/ld+json"]').textContent,
    )["@type"],
    "Person",
  );
  assert.ok(doc.querySelector('meta[name="description"]').content.length > 50);
  for (const link of doc.querySelectorAll('a[target="_blank"]'))
    assert.ok(link.rel.includes("noopener"));
  dom.window.close();
});

test("dealing chooses a visible project without immediate repeats and moves keyboard focus", () => {
  const dom = page();
  const doc = dom.window.document;
  doc.querySelector('[data-filter="systems"]').click();
  let previous;
  for (let i = 0; i < 4; i++) {
    doc.querySelector("#deal-project").click();
    const chosen = doc.querySelector(".is-dealt");
    assert.ok(chosen);
    assert.equal(chosen.hidden, false);
    assert.equal(chosen.dataset.category, "systems");
    assert.notEqual(chosen, previous);
    assert.equal(doc.activeElement, chosen.querySelector("h3"));
    assert.ok(
      doc
        .querySelector("#deal-status")
        .textContent.includes(chosen.querySelector("h3").textContent),
    );
    previous = chosen;
  }
  doc.querySelector('[data-filter="software"]').click();
  assert.equal(doc.querySelector(".is-dealt"), null);
  assert.equal(doc.querySelector("#deal-status").textContent, "");
  dom.window.close();
});

test("dealing respects reduced-motion preference", () => {
  let scrollOptions;
  const dom = page((win) => {
    win.matchMedia = () => ({ matches: true });
    win.HTMLElement.prototype.scrollIntoView = (options) => {
      scrollOptions = options;
    };
  });
  dom.window.document.querySelector("#deal-project").click();
  assert.equal(scrollOptions.behavior, "instant");
  dom.window.close();
});

test("professional portfolio excludes hobby content and links only the reviewed public project repositories", () => {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  assert.doesNotMatch(
    doc.body.textContent,
    /\b(games?|gaming|checkers|SpaceDestroyer|Unity|3D\s+print\w*)\b/i,
  );
  const reviewed = [
    "https://github.com/aleixpieres/Terraform-http-loadbalancer",
    "https://github.com/aleixpieres/PyPhantom",
    "https://github.com/aleixpieres/UDPserver",
  ];
  assert.deepEqual(
    [...doc.querySelectorAll(".project-card .repo-link")].map(
      (link) => link.href,
    ),
    reviewed,
  );
  const work = doc.querySelector("#work-section");
  assert.equal(work.querySelectorAll(".work-card").length, 3);
  assert.equal(work.querySelectorAll(".repo-link").length, 0);
  assert.doesNotMatch(
    work.textContent,
    /https?:\/\/|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b(?:\d{1,3}\.){3}\d{1,3}\b/i,
  );
  dom.window.close();
});

test("dealing handles a filter with a single project", () => {
  const dom = page();
  const doc = dom.window.document;
  doc.querySelector('[data-filter="software"]').click();
  for (let i = 0; i < 2; i++) {
    doc.querySelector("#deal-project").click();
    const selected = doc.querySelector(".is-dealt");
    assert.equal(selected.querySelector("h3").textContent, "PyPhantom");
    assert.equal(selected.hidden, false);
    assert.equal(doc.querySelectorAll(".is-dealt").length, 1);
  }
  dom.window.close();
});
