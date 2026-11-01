export default function SectionScenery({ kind }) {
  return (
    <div className={`pf-section-scenery pf-section-scenery--${kind}`} aria-hidden="true">
      <div className="pf-scenery-glow pf-scenery-glow--one" />
      <div className="pf-scenery-glow pf-scenery-glow--two" />
      <svg className="pf-scenery-lines" viewBox="0 0 1000 700" fill="none">
        {kind === "experience" && <>
          {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${520 + i * 45} -30 V${100 + i * 45} L${350 + i * 45} ${270 + i * 45} H1060`} />)}
          {[0, 1, 2].map((i) => <g key={i} transform={`translate(${650 + i * 95} ${180 + i * 100})`}><path d="M0 -40 65 -5 65 65 0 100 -65 65 -65 -5Z M0 30 65 -5 M0 30 -65 -5 M0 30V100" /><circle r="5" cy="30" /></g>)}
        </>}
        {kind === "skills" && <>
          {[150, 225, 300, 375].map((r) => <ellipse key={r} cx="770" cy="310" rx={r} ry={r * 0.48} transform="rotate(-25 770 310)" />)}
          <path d="M350 560 680 100 1010 560Z M350 560 680 310 1010 560 M680 100V310" />
          <circle cx="680" cy="310" r="14" /><circle cx="945" cy="214" r="7" />
        </>}
        {kind === "projects" && <>
          {[0, 1, 2, 3].map((i) => <path key={i} d={`M${560 + i * 26} ${70 + i * 48} l330 90 -110 230 -330 -90Z`} />)}
          <path d="M300 660 970 20 M450 730 1120 90" strokeDasharray="5 12" />
          <circle cx="700" cy="277" r="8" />
        </>}
        {kind === "education" && <>
          {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${460 + i * 70} ${540 - i * 75} l100 -55 170 85 -100 55Z m0 0v55l170 85 100 -55v-55 M${630 + i * 70} ${625 - i * 75}v55`} />)}
        </>}
        {kind === "contact" && <>
          {[100, 175, 250, 325, 400].map((r) => <circle key={r} cx="840" cy="350" r={r} />)}
          <path d="M380 350H1030 M840 -60V760" strokeDasharray="4 14" />
          <circle cx="665" cy="350" r="8" /><circle cx="840" cy="100" r="8" />
        </>}
      </svg>
      <div className="pf-scenery-plane pf-scenery-plane--one" />
      <div className="pf-scenery-plane pf-scenery-plane--two" />
    </div>
  );
}
