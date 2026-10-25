import { test } from "node:test";
import assert from "node:assert/strict";
import { createThemeSound } from "../utils/theme-sound.mjs";

test("sound is lazy, silent when muted, bounded and immediately cancellable", () => {
  const events = [];
  let contexts = 0;
  const param = {
    setValueAtTime() {},
    exponentialRampToValueAtTime() {},
    linearRampToValueAtTime(value) {
      events.push(["gain", value]);
    },
  };
  class Context {
    constructor() {
      contexts++;
      this.currentTime = 0;
    }
    resume() {
      events.push(["resume"]);
      return Promise.resolve();
    }
    suspend() {
      events.push(["suspend"]);
      return Promise.resolve();
    }
    close() {
      return Promise.resolve();
    }
    createOscillator() {
      return {
        frequency: param,
        connect() {},
        disconnect() {},
        start() {
          events.push(["start"]);
        },
        stop(time) {
          events.push(["stop", time]);
        },
      };
    }
    createGain() {
      return { gain: param, connect() {}, disconnect() {} };
    }
  }
  const audio = createThemeSound(() => Context);
  audio.play(false);
  audio.mute();
  assert.equal(contexts, 0);
  audio.play(true);
  audio.play(true);
  assert.equal(contexts, 1);
  assert.equal(events.filter(([name]) => name === "start").length, 2);
  assert.ok(events.some(([name, value]) => name === "gain" && value <= 0.025));
  assert.ok(events.some(([name, time]) => name === "stop" && time === 0.055));
  audio.mute();
  assert.ok(
    events.some(([name, time]) => name === "stop" && time === undefined),
  );
  assert.equal(events.at(-1)[0], "suspend");
  audio.dispose();
});

test("unsupported, rejected and failed audio cannot throw into theme interaction", async () => {
  assert.doesNotThrow(() => createThemeSound(() => undefined).play(true));
  assert.doesNotThrow(() =>
    createThemeSound(
      () =>
        class {
          constructor() {
            throw new Error("Unavailable");
          }
        },
    ).play(true),
  );
  const audio = createThemeSound(
    () =>
      class {
        resume() {
          return Promise.reject(new Error("Denied"));
        }
      },
  );
  assert.doesNotThrow(() => audio.play(true));
  await Promise.resolve();
});
