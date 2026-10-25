import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { THEME_SCRIPT } from "../utils/appearance.mjs";

function resolve(preference, dark, unavailable = false) {
  const document = { documentElement: { dataset: {} } };
  const sandbox = {
    document,
    matchMedia: () => ({ matches: dark }),
    localStorage: {
      getItem: () => {
        if (unavailable) throw new Error("Storage denied");
        return preference;
      },
    },
    AudioContext: class {
      constructor() {
        throw new Error("Theme restoration must not initialize audio");
      }
    },
  };
  vm.runInNewContext(THEME_SCRIPT, sandbox);
  return document.documentElement.dataset;
}

test("before-paint appearance honors explicit preference independently of the OS", () => {
  assert.equal(resolve("light", true).portfolioTheme, "light");
  assert.equal(resolve("dark", false).portfolioTheme, "dark");
});

test("System, missing, invalid and inaccessible storage resolve without audio or a crash", () => {
  for (const preference of ["system", null, "unexpected"]) {
    assert.equal(resolve(preference, true).portfolioTheme, "dark");
    assert.equal(resolve(preference, false).portfolioTheme, "light");
    assert.equal(resolve(preference, false).portfolioPreference, "system");
  }
  assert.equal(resolve(null, true, true).portfolioTheme, "dark");
  assert.equal(resolve(null, false, true).portfolioPreference, "system");
});
