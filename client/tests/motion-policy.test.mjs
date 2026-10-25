import { test } from "node:test";
import assert from "node:assert/strict";
import { motionPolicy } from "../utils/motion-policy.mjs";

const capable = {
  desktop: true,
  reduced: false,
  fine: true,
  hidden: false,
  webgl: true,
  simple: false,
  slow: false,
  cores: 8,
  memory: 8,
  saveData: false,
};
test("decorative GPU effects stop for every motion, visibility and performance fallback", () => {
  assert.equal(motionPolicy(capable).gpu, true);
  for (const change of [
    { reduced: true },
    { hidden: true },
    { webgl: false },
    { simple: true },
    { slow: true },
    { cores: 2 },
    { memory: 2 },
    { saveData: true },
  ]) {
    assert.equal(
      motionPolicy({ ...capable, ...change }).gpu,
      false,
      JSON.stringify(change),
    );
  }
});
test("touch cannot enable a cursor, while mobile and reduced motion use static presentation", () => {
  assert.equal(motionPolicy({ ...capable, fine: false }).fine, false);
  assert.equal(motionPolicy({ ...capable, desktop: false }).desktop, false);
  for (const change of [{ reduced: true }, { simple: true }]) {
    const result = motionPolicy({ ...capable, ...change });
    assert.equal(result.desktop, false);
    assert.equal(result.fine, false);
  }
});

test("hiding a document pauses GPU work without discarding supported renderers", () => {
  const hidden = motionPolicy({ ...capable, hidden: true });
  assert.equal(hidden.gpu, false);
  assert.equal(hidden.supported, true);
  assert.equal(motionPolicy({ ...capable, webgl: false }).supported, false);
});
