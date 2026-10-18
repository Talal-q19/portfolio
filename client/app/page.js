'use client';

import ContactSection from './components/homepage/contact';
import Education from './components/homepage/education';
import Experience from './components/homepage/experience';
import HeroSection from './components/homepage/hero-section';
import Projects from './components/homepage/projects';
import Skills from './components/homepage/skills';
import { usePortfolio } from './components/portfolio-layout';

export default function Home() {
  const { data, status, retry } = usePortfolio();
  if (status === 'loading') return <div role="status" aria-live="polite" className="py-24 text-center text-slate-300">Loading portfolio...</div>;
  if (status === 'error') return <div role="alert" className="py-24 text-center">
    <p>Portfolio content is temporarily unavailable.</p>
    <button type="button" onClick={retry} className="mt-4 rounded border border-white/30 px-5 py-3">Try again</button>
  </div>;
  const renderers = {
    experience: section => <Experience experiences={data.experiences} section={section} />,
    skills: section => data.skillCategories.length > 0 && <Skills skillCategories={data.skillCategories} section={section} />,
    projects: section => <Projects projectsData={data.projectsData} section={section} />,
    education: section => <Education educations={data.educations} section={section} />,
    contact: section => data.personalData && <ContactSection personalData={data.personalData} section={section} introduction={data.settings.contactIntroduction} />,
  };
  return <div>
    {data.settings && <>
      <title>{data.settings.seoTitle}</title>
      <meta name="description" content={data.settings.seoDescription} />
      <meta property="og:title" content={data.settings.seoTitle} />
      <meta property="og:description" content={data.settings.seoDescription} />
      <meta property="og:image" content={data.settings.profileImage.url} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={data.settings.seoTitle} />
      <meta name="twitter:description" content={data.settings.seoDescription} />
      <meta name="twitter:image" content={data.settings.profileImage.url} />
    </>}
    {data.hero && data.personalData && data.sections.some(s => s.key === 'about' && s.visible) && <HeroSection hero={data.hero} personalData={data.personalData} />}
    {!data.hero && data.sections.length === 0 && <p className="py-24 text-center">Portfolio content will be available soon.</p>}
    {[...data.sections].filter(s => s.visible).sort((a, b) => a.order - b.order).map(s => <div key={s.key}>{renderers[s.key]?.(s)}</div>)}
  </div>;
}
