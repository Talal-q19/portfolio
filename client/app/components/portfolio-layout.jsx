'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { fetchPortfolio } from '@/utils/portfolio-api.mjs';
import { portfolioData } from '@/utils/portfolio';
import Navbar from './navbar';
import Footer from './footer';
import ScrollToTop from './helper/scroll-to-top';

const PortfolioContext = createContext(null);
export function usePortfolio() {
  const value = useContext(PortfolioContext);
  if (!value) throw new Error('Portfolio components require PortfolioLayout.');
  return value;
}

export default function PortfolioLayout({ children, mediaOrigin }) {
  const [state, setState] = useState({ status: 'loading', data: null });
  const [requestId, reload] = useReducer(value => value + 1, 0);
  const retry = useCallback(() => {
    setState({ status: 'loading', data: null });
    reload();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchPortfolio({ signal: controller.signal }).then(envelope => {
      if (!controller.signal.aborted) setState({ status: 'ready', data: portfolioData(envelope, mediaOrigin) });
    }).catch(() => {
      if (!controller.signal.aborted) setState({ status: 'error', data: null });
    });
    return () => controller.abort();
  }, [requestId, mediaOrigin]);

  const value = useMemo(() => ({ ...state, retry }), [state, retry]);
  return <PortfolioContext.Provider value={value}>
    <main className="min-h-screen relative mx-auto px-6 pt-[var(--nav-safe-top)] sm:px-12 lg:max-w-[70rem] xl:max-w-[76rem] 2xl:max-w-[92rem] text-white z-10 overflow-x-clip">
      <Navbar settings={state.data?.settings} sections={state.data?.sections} />
      {children}
      <ScrollToTop />
    </main>
    <Footer settings={state.data?.settings} />
  </PortfolioContext.Provider>;
}
