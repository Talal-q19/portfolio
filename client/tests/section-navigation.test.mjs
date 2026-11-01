import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { PORTFOLIO_START_SCRIPT, sectionScrollTarget, scrollToPortfolioSection } from "../utils/section-navigation.mjs";

const screen = { viewportHeight: 900, navHeight: 100, pageHeight: 5000 };

test("short sections center in the usable space below the navbar", () => {
  assert.equal(sectionScrollTarget({ ...screen, top: 1200, height: 400 }), 900);
});

test("tall sections keep their headings below the fixed navbar", () => {
  assert.equal(sectionScrollTarget({ ...screen, top: 1200, height: 1100 }), 1080);
});

test("first and last sections stay within document bounds without extra footer space", () => {
  assert.equal(sectionScrollTarget({ ...screen, top: 0, height: 400 }), 0);
  assert.equal(sectionScrollTarget({ ...screen, top: 4600, height: 400 }), 4100);
});

test("reload clears an old section hash, preserves query parameters, and disables scroll restoration", () => {
  const calls = [];
  const listeners = {};
  const history = { state: { visit: 1 }, scrollRestoration: "auto", replaceState: (...args) => calls.push(args) };
  const location = { pathname: "/", search: "?preview=1", hash: "#contact" };
  const scrolls = [];
  vm.runInNewContext(PORTFOLIO_START_SCRIPT, {
    location, history,
    window: { scrollTo: (options) => scrolls.push(options), addEventListener: (event, handler) => { listeners[event] = handler; } },
  });
  assert.equal(history.scrollRestoration, "manual");
  assert.equal(calls[0][2], "/?preview=1");
  assert.equal(scrolls[0].top, 0);
  assert.equal(scrolls[0].behavior, "instant");
  listeners.pageshow();
  assert.equal(scrolls.length, 2);
});

test("public startup reset leaves admin navigation untouched", () => {
  vm.runInNewContext(PORTFOLIO_START_SCRIPT, { location: { pathname: "/admin" } });
});

test("navbar jumps use stable layout offsets and do not animate through intervening sections", (t) => {
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  t.after(() => {
    globalThis.window = oldWindow;
    globalThis.document = oldDocument;
  });
  let scroll;
  const section = { offsetHeight: 400, offsetTop: 40, offsetParent: { offsetTop: 1160, offsetParent: null } };
  globalThis.document = {
    getElementById: () => ({ classList: { contains: () => true }, querySelector: () => section }),
    querySelector: () => ({ getBoundingClientRect: () => ({ height: 100 }) }),
    documentElement: { scrollHeight: 5000 },
  };
  globalThis.window = { innerHeight: 900, matchMedia: () => ({ matches: false }), scrollTo: (options) => { scroll = options; } };
  assert.equal(scrollToPortfolioSection("contact"), true);
  assert.equal(scroll.top, 900);
  assert.equal(scroll.behavior, "instant");
});
