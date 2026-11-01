"use client";
import { usePortfolio } from "./components/portfolio-layout";
import Portfolio from "./components/public/portfolio";
import { useCallback, useState } from "react";
import Preloader from "./components/public/preloader";

export default function Home() {
  const { data, status, retry } = usePortfolio();
  const [entered, setEntered] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const enter = useCallback(() => setEntered(true), []);
  const reveal = useCallback(() => setRevealing(true), []);
  if (status === "error")
    return (
      <div role="alert" className="pf-empty">
        <p>Portfolio content is temporarily unavailable.</p>
        <button type="button" className="pf-primary" onClick={retry}>
          Try again
        </button>
      </div>
    );
  const settings = data?.settings;
  return (
    <>
      {settings && (
        <>
          <title>{settings.seoTitle}</title>
          <meta name="description" content={settings.seoDescription} />
          <meta property="og:title" content={settings.seoTitle} />
          <meta property="og:description" content={settings.seoDescription} />
          {settings.profileImage?.url && (
            <meta property="og:image" content={settings.profileImage.url} />
          )}
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content={settings.seoTitle} />
          <meta name="twitter:description" content={settings.seoDescription} />
        </>
      )}
      {status === "ready" && (
        <Portfolio data={data} entered={revealing || entered} />
      )}
      {!entered && (
        <Preloader
          status={status}
          profile={data?.personalData?.profile}
          onReveal={reveal}
          onComplete={enter}
        />
      )}
    </>
  );
}
