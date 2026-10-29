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
  dom.window.matchMedia = () => ({ matches: true });
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
  assert.ok(doc.querySelector("#project-slot").hidden);
  assert.ok(doc.querySelector(".menu-toggle").hidden);
  assert.ok(!doc.querySelector(".nav-links").hidden);
  assert.ok(
    doc.querySelector("a[download]").getAttribute("href").endsWith(".pdf"),
  );
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

test("projects stay hidden until a spin, then each appears exactly once per round", () => {
  const dom = page();
  const doc = dom.window.document;
  const cards = [...doc.querySelectorAll(".project-card")];
  assert.ok(cards.every((card) => card.hidden));
  assert.equal(doc.querySelector("#project-slot").hidden, false);
  assert.equal(doc.querySelector("#slot-remaining").textContent, "3 / 3");
  for (let round = 0; round < 3; round++) {
    const seen = new Set();
    for (let spin = 0; spin < cards.length; spin++) {
      doc.querySelector("#spin-project").click();
      const visible = cards.filter((card) => !card.hidden);
      assert.equal(visible.length, 1);
      assert.ok(!seen.has(visible[0]));
      seen.add(visible[0]);
      assert.equal(
        doc.querySelector("#slot-remaining").textContent,
        `${cards.length - spin - 1} / ${cards.length}`,
      );
      assert.ok(
        doc
          .querySelector("#slot-status")
          .textContent.includes(visible[0].querySelector("h3").textContent),
      );
    }
    assert.equal(seen.size, cards.length);
    assert.match(
      doc.querySelector("#slot-status").textContent,
      /Round complete/,
    );
  }
  dom.window.close();
});

test("every project is eligible for the first spin", () => {
  for (const [random, expected] of [
    [0, 0],
    [0.5, 1],
    [0.999, 2],
  ]) {
    const dom = page((win) => {
      win.Math.random = () => random;
    });
    const cards = [...dom.window.document.querySelectorAll(".project-card")];
    dom.window.document.querySelector("#spin-project").click();
    assert.equal(
      cards.findIndex((card) => !card.hidden),
      expected,
    );
    dom.window.close();
  }
});

test("animated spins lock out repeated clicks and reveal only on completion", () => {
  const timers = [];
  const dom = page((win) => {
    win.matchMedia = () => ({ matches: false });
    win.setTimeout = (callback) => {
      timers.push(callback);
      return timers.length;
    };
  });
  const doc = dom.window.document;
  const button = doc.querySelector("#spin-project");
  button.focus();
  button.click();
  assert.equal(button.disabled, true);
  assert.equal(
    doc.querySelector("#project-results").getAttribute("aria-busy"),
    "true",
  );
  assert.ok(
    [...doc.querySelectorAll(".project-card")].every((card) => card.hidden),
  );
  button.dispatchEvent(new dom.window.MouseEvent("click"));
  assert.equal(timers.length, 1);
  timers.shift()();
  assert.equal(button.disabled, false);
  assert.equal(doc.querySelector("#slot-remaining").textContent, "2 / 3");
  assert.equal(
    [...doc.querySelectorAll(".project-card")].filter((card) => !card.hidden)
      .length,
    1,
  );
  assert.equal(
    doc.querySelector("#project-results").getAttribute("aria-busy"),
    "false",
  );
  assert.ok(doc.activeElement.matches(".project-card h3"));
  const symbols = [...doc.querySelectorAll(".reel-cell")].map(
    (cell) => cell.textContent,
  );
  assert.equal(symbols.length, 3);
  assert.equal(new Set(symbols).size, 1);
  button.click();
  assert.equal(timers.length, 1);
  timers.shift()();
  assert.equal(doc.querySelector("#slot-remaining").textContent, "1 / 3");
  dom.window.close();
});

test("reduced motion reveals immediately without an animation timer", () => {
  let timers = 0;
  const dom = page((win) => {
    win.setTimeout = () => {
      timers++;
    };
  });
  dom.window.document.querySelector("#spin-project").click();
  assert.equal(timers, 0);
  assert.equal(
    dom.window.document.querySelector("#spin-project").disabled,
    false,
  );
  assert.equal(
    [...dom.window.document.querySelectorAll(".project-card")].filter(
      (card) => !card.hidden,
    ).length,
    1,
  );
  dom.window.close();
});

test("the pool adapts to one, zero, and more than three projects", () => {
  for (const size of [0, 1, 5]) {
    const dom = page((win) => {
      const grid = win.document.querySelector(".project-grid");
      const template = grid.firstElementChild.cloneNode(true);
      grid.replaceChildren();
      for (let i = 0; i < size; i++) {
        const card = template.cloneNode(true);
        card.querySelector("h3").textContent = `Project ${i}`;
        grid.append(card);
      }
    });
    const doc = dom.window.document;
    if (!size) {
      assert.equal(doc.querySelector("#project-slot").hidden, true);
      doc.querySelector("#spin-project").click();
    } else {
      for (let round = 0; round < 2; round++) {
        const seen = new Set();
        for (let i = 0; i < size; i++) {
          doc.querySelector("#spin-project").click();
          const visible = [...doc.querySelectorAll(".project-card")].filter(
            (card) => !card.hidden,
          );
          assert.equal(visible.length, 1);
          seen.add(visible[0]);
        }
        assert.equal(seen.size, size);
      }
    }
    dom.window.close();
  }
});

test("finishing a spin does not steal focus after the visitor tabs away", () => {
  let finish;
  const dom = page((win) => {
    win.matchMedia = () => ({ matches: false });
    win.setTimeout = (callback) => {
      finish = callback;
    };
  });
  const doc = dom.window.document;
  doc.querySelector("#spin-project").click();
  const other = doc.querySelector(".nav-links a");
  other.focus();
  finish();
  assert.equal(doc.activeElement, other);
  dom.window.close();
});
