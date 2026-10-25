# React Bits sources and local adapters

Retrieved from the official [React Bits repository](https://github.com/DavidHDev/react-bits) on 25 October 2026. The original license is included as `LICENSE.react-bits`. These are local source copies, not a new package dependency. OGL was already installed; no retained dependency versions were changed.

| Component | Official source | Local runtime changes |
| --- | --- | --- |
| Crystalized Ball | [JS](https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/CrystalizedBall/CrystalizedBall.jsx), adjacent CSS and demo | DPR capped at 1; hidden/offscreen frame guard; explicit local `onFailure` callback for renderer/frame failures. App boundary disposes it when inactive or failed and leaves a CSS fallback. The shader still receives one `color`; lilac/glass are CSS only. |
| Circular Carousel | [JS](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/CircularCarousel/CircularCarousel.jsx), adjacent CSS and demo | Explicit local `controlRef` exposes existing `focusIndex`/`stepBy`; `initialIndex` initializes angle and active state once, including responsive remounts. Accessible name “Projects” and `aria-controls` point at the selected DOM card. No controlled-index or previous/next props are attributed to upstream. |
| Glow Cursor | [JS](https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/GlowCursor/GlowCursor.jsx), adjacent CSS and demo | GPU-pass helper renamed `use` → `bindPass` to avoid React 19 hook lint misidentification. Local `onFailure` catches asynchronous render failure. App policy handles pointer type, motion, visibility, performance, focus, form/media targeting, dialogs and crystal exclusion. Original light `normal` / dark `screen` canvas blending retained. |
| Scroll Expand | [JS](https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/ScrollExpand/ScrollExpand.jsx), adjacent CSS and demo | Stock source is retained in `docs/ScrollExpand.source.reference.txt` for inspection, not shipped as unused runtime code. `BoundedCode` in `../motion.jsx` adapts its smoothstep interpolation to the live code frame. The existing hero is the track; first 160px of hero scroll drives 97.1%/96.3% → 100%/100%, radius 24, smoothing 0.08s. There is no sticky stage, added height, scrim, media zoom, or invented upstream prop. |

Original demo snapshots are in `docs/*Demo.reference.txt`. Demo Chakra controls were inspected and were not installed. Imperative upstream source has file-scoped lint exceptions for ref settings and effect synchronization; application components and adapters retain normal lint rules.

App fallbacks: static mobile/reduced-motion presentation, WebGL2 probe, low-memory/CPU/data-saver policy, startup frame-pressure sampling, optional persisted “Reduce visual effects”, hidden-document/offscreen teardown, context-loss handling and an error boundary. Mobile crystal is 64px; desktop is 176px. The normal system cursor remains visible. Hardware profiling beyond this machine is not claimed.

The Experience Threads direction is a contained static SVG illustration, matching the approved wave motif without allocating another shader. Lamp pull, preview entrance, and theme click audio are local application implementations, not React Bits props.

The scoped public image reset explicitly preserves the carousel photo's original max-width: none. Its curved strip renderer requires full-size images inside narrow clipped tiles; constraining them to each tile would shrink/corrupt the media.
