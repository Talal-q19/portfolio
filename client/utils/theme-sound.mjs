// Called only by intentional appearance actions, never by restoration or OS events.
export function createThemeSound(
  getContext = () => globalThis.AudioContext || globalThis.webkitAudioContext,
) {
  let context;
  const voices = new Set();
  const silence = () => {
    for (const voice of voices) {
      try {
        voice.oscillator.stop();
        voice.oscillator.disconnect();
        voice.gain.disconnect();
      } catch {}
    }
    voices.clear();
  };
  return {
    play(enabled) {
      if (!enabled) return;
      try {
        const Context = getContext();
        if (!Context) return;
        context ||= new Context();
        void context.resume().catch(() => {});
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const voice = { oscillator, gain };
        voices.add(voice);
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(620, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
          160,
          context.currentTime + 0.045,
        );
        gain.gain.setValueAtTime(0, context.currentTime);
        gain.gain.linearRampToValueAtTime(0.025, context.currentTime + 0.004);
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          context.currentTime + 0.05,
        );
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.onended = () => {
          voices.delete(voice);
          oscillator.disconnect();
          gain.disconnect();
        };
        oscillator.start();
        oscillator.stop(context.currentTime + 0.055);
      } catch {
        silence();
      }
    },
    mute() {
      silence();
      try {
        void context?.suspend().catch(() => {});
      } catch {}
    },
    dispose() {
      silence();
      try {
        void context?.close().catch(() => {});
      } catch {}
    },
  };
}
