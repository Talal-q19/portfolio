"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { fetchPortfolio } from "@/utils/portfolio-api.mjs";
import { portfolioData } from "@/utils/portfolio";
import { AppearanceControls } from "./public/appearance";

const PortfolioContext = createContext(null);
export function usePortfolio() {
  const value = useContext(PortfolioContext);
  if (!value) throw new Error("Portfolio components require PortfolioLayout.");
  return value;
}

export default function PortfolioLayout({ children, mediaOrigin }) {
  const [state, setState] = useState({ status: "loading", data: null });
  const [requestId, reload] = useReducer((value) => value + 1, 0);
  const retry = useCallback(() => {
    setState({ status: "loading", data: null });
    reload();
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
  return (
    <PortfolioContext.Provider value={value}>
      <div className="portfolio" id="top">
        <a className="pf-skip" href="#portfolio-content">
          Skip to content
        </a>
        <header className="pf-nav">
          <a className="pf-brand" href="#top">
            <strong>TQ</strong>
            <span>{state.data?.settings?.displayName || "Portfolio"}</span>
          </a>
          <nav aria-label="Main navigation">
            {state.data?.settings?.navigation
              ?.filter((n) =>
                state.data.sections.some(
                  (s) => s.visible && n.url === `#${s.key}`,
                ),
              )
              .map((n) => (
                <a key={n.url} href={n.url}>
                  {n.label}
                </a>
              ))}
          </nav>
          <AppearanceControls />
          <details className="pf-mobile-nav">
            <summary>Menu</summary>
            <nav aria-label="Mobile navigation">
              {state.data?.settings?.navigation
                ?.filter((n) =>
                  state.data.sections.some(
                    (s) => s.visible && n.url === `#${s.key}`,
                  ),
                )
                .map((n) => (
                  <a
                    key={n.url}
                    href={n.url}
                    onClick={(e) =>
                      e.currentTarget.closest("details").removeAttribute("open")
                    }
                  >
                    {n.label}
                  </a>
                ))}
            </nav>
          </details>
        </header>
        <main id="portfolio-content">{children}</main>
        <footer className="pf-footer">
          <span>{state.data?.settings?.footerText}</span>
          <a href="#top">Back to top ↑</a>
        </footer>
      </div>
    </PortfolioContext.Provider>
  );
}
