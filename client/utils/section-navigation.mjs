export function sectionScrollTarget({ top, height, viewportHeight, navHeight, pageHeight }) {
  const available = Math.max(0, viewportHeight - navHeight);
  const offset = Math.max(20, (available - height) / 2);
  return Math.max(0, Math.min(top - navHeight - offset, Math.max(0, pageHeight - viewportHeight)));
}

// Run before paint so restored scroll positions and old section hashes cannot
// put the loading screen or first hero animation halfway down the document.
export const PORTFOLIO_START_SCRIPT = `if(location.pathname==="/"){history.scrollRestoration="manual";if(location.hash)history.replaceState(history.state,"",location.pathname+location.search);window.scrollTo({top:0,left:0,behavior:"instant"});window.addEventListener("pageshow",function(){if(location.pathname==="/")window.scrollTo({top:0,left:0,behavior:"instant"})})}`;

export function scrollToPortfolioSection(key, behavior = "instant") {
  const anchor = document.getElementById(key);
  if (!anchor?.classList.contains("pf-section-anchor")) return false;
  const section = anchor.querySelector(".pf-section") || anchor;
  // Layout offsets remain stable while GSAP transforms the section in 3D.
  let top = 0;
  for (let element = section; element; element = element.offsetParent) top += element.offsetTop;
  const navbar = document.querySelector(".pf-nav");
  const nav = navbar?.getBoundingClientRect();
  const navHeight = navbar?.dataset?.docked === "true"
    ? Number.parseFloat(document.documentElement.style.getPropertyValue("--nav-safe-top")) || 88
    : nav?.bottom ?? nav?.height ?? 0;
  window.scrollTo({
    top: sectionScrollTarget({ top, height: section.offsetHeight, viewportHeight: window.innerHeight, navHeight, pageHeight: document.documentElement.scrollHeight }),
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : behavior,
  });
  return true;
}
