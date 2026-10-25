import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { THEME_SCRIPT } from "../utils/appearance.mjs";

test("every visit starts light before paint, ignoring OS and old saved dark preferences", () => {
  for (const previous of ["light", "dark", "system", undefined]) {
    const document = {
      documentElement: { dataset: { portfolioTheme: previous } },
    };
    vm.runInNewContext(THEME_SCRIPT, {
      document,
      matchMedia: () => ({ matches: true }),
      localStorage: { getItem: () => "dark" },
    });
    assert.equal(document.documentElement.dataset.portfolioTheme, "light");
  }
});
test("initial appearance requires neither storage nor audio access", () => {
  const document = { documentElement: { dataset: {} } };
  const forbidden = () => {
    throw new Error("Unexpected browser API access");
  };
  vm.runInNewContext(THEME_SCRIPT, {
    document,
    matchMedia: forbidden,
    localStorage: { getItem: forbidden },
    AudioContext: forbidden,
  });
  assert.equal(document.documentElement.dataset.portfolioTheme, "light");
});
