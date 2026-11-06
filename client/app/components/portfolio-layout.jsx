"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { fetchPortfolio } from "@/utils/portfolio-api.mjs";
import { portfolioData } from "@/utils/portfolio";
import { AppearanceControls } from "./public/appearance";
import { scrollToPortfolioSection } from "@/utils/section-navigation.mjs";
import PortfolioNavigation from "./public/portfolio-navigation";

const PortfolioContext = createContext(null);
export function usePortfolio() {
  const value = useContext(PortfolioContext);
  if (!value) throw new Error("Portfolio components require PortfolioLayout.");
  return value;
}

export default function PortfolioLayout({ children, mediaOrigin }) {
  const navbar = useRef(null);
  const [state, setState] = useState({ status: "loading", data: null });
  const [requestId, reload] = useReducer((value) => value + 1, 0);
  const retry = useCallback(() => {
    setState({ status: "loading", data: null });
    reload();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.getPropertyValue("--nav-safe-top");
    const measure = () =>
      root.style.setProperty(
        "--nav-safe-top",
        `${navbar.current.getBoundingClientRect().bottom}px`,
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(navbar.current);
    return () => {
      observer.disconnect();
      if (previous) root.style.setProperty("--nav-safe-top", previous);
      else root.style.removeProperty("--nav-safe-top");
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchPortfolio({ signal: controller.signal })
      .then((envelope) => {
        if (!controller.signal.aborted)
          setState({
            status: "ready",
            data: portfolioData(envelope, mediaOrigin),
          });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setState({ status: "error", data: null });
      });
    return () => controller.abort();
  }, [requestId, mediaOrigin]);

  const value = useMemo(() => ({ ...state, retry }), [state, retry]);
  const navigation = useMemo(() => state.data?.settings?.navigation
    ?.filter((item) => state.data.sections.some((section) => section.visible && item.url === `#${section.key}`))
    .map((item) => ({ label: item.label, href: item.url })) || [], [state.data]);
  const navigate = (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const hash = event.currentTarget.hash;
    if (!document.getElementById(hash.slice(1))) return;
    event.preventDefault();
    event.currentTarget.closest("details")?.removeAttribute("open");
    if (scrollToPortfolioSection(hash.slice(1))) {
      window.dispatchEvent(new CustomEvent("portfolio:navigate", { detail: { key: hash.slice(1) } }));
      if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    }
  };
  return (
    <PortfolioContext.Provider value={value}>
      <div className="portfolio" id="top">
        <a className="pf-skip" href="#portfolio-content">
          Skip to content
        </a>
        <header ref={navbar} className="pf-nav">
          <a className="pf-brand" href="#top">
            <strong>TQ</strong>
            <span>{state.data?.settings?.displayName || "Portfolio"}</span>
          </a>
          <div className="pf-nav-slot">
            <PortfolioNavigation items={navigation} onNavigate={navigate} />
          </div>
          <AppearanceControls />
        </header>
        <main id="portfolio-content">{children}</main>
        <footer className="pf-footer">
          <div className="pf-footer-inner">
            <span>{state.data?.settings?.footerText || "© Talal Qasim"}</span>
            <a href="#top">Back to top</a>
          </div>
        </footer>
      </div>
    </PortfolioContext.Provider>
  );
}
