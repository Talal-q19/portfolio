"use client";

import Image from "next/image";
import {
  FaGithub,
  FaLinkedinIn,
  FaInstagram,
  FaArrowUpRightFromSquare,
} from "react-icons/fa6";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CircularCarousel from "./effects/CircularCarousel";
import { useScrollWorld } from "./scroll-world";
import SectionScenery from "./section-scenery";
import { scrollToPortfolioSection } from "@/utils/section-navigation.mjs";
import LogoLoop from "./effects/LogoLoop";
import PortraitLanyard from "./portrait-lanyard";
import PreviewDialog from "./dialog";
import ProjectChooser from "./project-chooser";
import {
  ContactCrystal,
  ExperienceThreads,
  PublicCursor,
  useMotionPolicy,
} from "./motion";
import ContactForm from "../homepage/contact/contact-form";
import { useReducedMotion } from "../../hooks/use-reduced-motion";

function Media({ src, alt, className = "", ...rest }) {
  return src ? (
    <Image
      src={src}
      alt={alt || ""}
      width={600}
      height={400}
      className={className}
      {...rest}
    />
  ) : (
    <div className={`pf-no-media ${className}`}>Media unavailable</div>
  );
}
export function SocialLinks({ settings }) {
  return (
    <div className="pf-socials">
      {settings?.socialLinks
        ?.filter((link) => link.url)
        .map((link) => (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="pf-social-icon" aria-hidden="true">
              {link.label === "github" ? (
                <FaGithub />
              ) : link.label === "linkedIn" ? (
                <FaLinkedinIn />
              ) : link.label === "instagram" ? (
                <FaInstagram />
              ) : (
                <FaArrowUpRightFromSquare />
              )}
            </span>
            {{ github: "GitHub", linkedIn: "LinkedIn", instagram: "Instagram" }[
              link.label
            ] || link.label}{" "}
            ↗
          </a>
        ))}
    </div>
  );
}
function Heading({ section, fallback }) {
  return (
    <header className="pf-heading">
      <p className="pf-eyebrow">
        {section.eyebrow || fallback}
      </p>
      <h2>{section.heading || fallback}</h2>
      {section.introduction && <p>{section.introduction}</p>}
    </header>
  );
}

function CodeEditor({ hero, skills, typingReady }) {
  const [tab, setTab] = useState(0);
  const [typed, setTyped] = useState(0);
  const [replay, setReplay] = useState(0);
  const [typing, setTyping] = useState(true);
  const reducedMotion = useReducedMotion();

  const panel = hero.panels?.[tab] || hero.panels?.[0];
  const count = (panel?.lines || []).reduce(
    (n, line) =>
      n + line.tokens.reduce((m, token) => m + (token.text || "").length, 0),
    0,
  );
  useEffect(() => {
    if (!typingReady || !typing || reducedMotion) return;
    let characters = 0;
    const tick = () => {
      if (!document.hidden) {
        characters = Math.min(count, characters + 3);
        setTyped(characters);
      }
      if (characters >= count) {
        clearInterval(timer);
        setTyping(false);
      }
    };
    const timer = setInterval(tick, 30);
    return () => clearInterval(timer);
  }, [tab, count, replay, typingReady, typing, reducedMotion]);
  let consumed = 0;
  const content = (
    <>
      <div className="pf-code-tabs">
        {hero.panels?.map((p, i) => (
          <button
            type="button"
            key={p.title}
            aria-pressed={tab === i}
            onClick={() => {
              setTyped(0);
              setTyping(true);
              setTab(i);
              setReplay((value) => value + 1);
            }}
          >
            {p.title}
          </button>
        ))}
      </div>
      <div className="pf-code-lines">
        <pre aria-label={panel?.title}>
          {panel?.lines?.map((line, i) => (
            <div key={i}>
              {line.tokens.map((token, j) => {
                const start = consumed;
                consumed += (token.text || "").length;
                return (
                  <span
                    key={j}
                    className={`pf-token-${token.tone || "default"}`}
                  >
                    {typing && !reducedMotion
                      ? (token.text || "").slice(0, Math.max(0, typed - start))
                      : token.text}
                  </span>
                );
              })}
            </div>
          ))}
        </pre>
      </div>
      <div className="pf-code-status">
        <button
          type="button"
          onClick={() => {
            setTyped(0);
            setTyping(true);
            setReplay((value) => value + 1);
          }}
        >
          Replay typing ↻
        </button>
        <span>⌘ · UTF-8</span>
      </div>
    </>
  );
  return (
    <div className="pf-atmosphere">
      <p className="pf-eyebrow">Backend engineering / in focus</p>
      <h3>Code with intent.</h3>
      <div className="pf-code-frame">
        <div className="pf-code">{content}</div>
      </div>
      <div className="pf-code-stack">
        {["Java", "Spring Boot", "PostgreSQL"]
          .map((name) => skills.find((skill) => skill.name === name))
          .filter(Boolean)
          .map((skill) => (
            <span key={skill.id}>
              <Media src={skill.icon} alt="" />
              {skill.name}
            </span>
          ))}
      </div>
      <small>Secure services. Thoughtful interfaces.</small>
    </div>
  );
}
function Hero({ data, policy, entered, typingReady }) {
  const { hero, personalData: personal, settings } = data;
  const words = hero.heading?.split(" ") || [];
  return (
    <section className="pf-section pf-hero">
      <div className="pf-hero-intro">
        <p className="pf-eyebrow">
          <strong className="pf-hero-name">{personal.name}</strong>
          <span>{hero.eyebrow} / {hero.location}</span>
        </p>
        <div className="pf-identity">
          <PortraitLanyard
            src={personal.profile}
            name={personal.name}
            policy={policy}
            entered={entered}
          />
        </div>
        <h1>
          {words.slice(0, -1).join(" ")}
          <span>{words.at(-1)}</span>
        </h1>
        <h3>{hero.role}</h3>
        <p className="pf-hero-copy">{personal.description}</p>
        <div className="pf-actions">
          {hero.buttons?.map((b, i) => (
            <a
              key={b.label}
              className={i === 0 ? "pf-primary" : i === 1 ? "pf-secondary" : ""}
              href={i === 2 ? personal.resume : b.url}
            >
              {b.label} {i === 1 ? "↓" : "↗"}
            </a>
          ))}
        </div>
        {!hero.buttons?.some((b, i) => i === 2) && personal.resume && (
          <a href={personal.resume}>Get Resume ↗</a>
        )}

        <SocialLinks settings={settings} />
      </div>
      <CodeEditor
        hero={hero}
        typingReady={typingReady}
        skills={data.skillCategories.flatMap((group) => group.skills)}
      />
    </section>
  );
}
function Experience({ items, section, policy }) {
  const [selected, setSelected] = useState(items[0]?.id);
  const active = items.find((item) => item.id === selected) || items[0];
  return (
    <section className="pf-section pf-alternate">
      <SectionScenery kind="experience" />
      <div className="pf-inner">
        <Heading section={section} fallback="Experiences" />
        {active ? (
          <div className="pf-experience-grid">
            <aside>
              <div className="pf-selectors" aria-label="Choose experience">
                {items.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    aria-pressed={item.id === active.id}
                    aria-controls="pf-career"
                    onClick={() => setSelected(item.id)}
                  >
                    <Media src={item.image} alt="" />
                    <span>
                      {item.company}
                      <small>{item.title}</small>
                    </span>
                  </button>
                ))}
              </div>
              <ExperienceThreads policy={policy} />
            </aside>
            <div id="pf-career" className="pf-choice-stack pf-experience-details" aria-live="polite">
            {items.map((item) => (
            <article key={item.id} className="pf-panel pf-choice-pane" data-active={item.id === active.id} aria-hidden={item.id !== active.id} inert={item.id !== active.id}>
              <p className="pf-meta">
                {item.duration}
                {item.location &&
                  !item.duration?.includes(item.location) &&
                  ` · ${item.location}`}
              </p>
              <h3>{item.title}</h3>
              <p className="pf-accent">{item.company}</p>
              {item.description &&
                !item.highlights?.includes(item.description) && (
                  <p>{item.description}</p>
                )}
              <ul>
                {item.highlights?.filter(Boolean).map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
            </article>
            ))}
            </div>
          </div>
        ) : (
          <p>No published experience yet.</p>
        )}
      </div>
    </section>
  );
}
function Skills({ items, section }) {
  const [selected, setSelected] = useState(items[0]?.id);
  const [all, setAll] = useState(false);
  const [paused, setPaused] = useState(false);
  const active = items.find((item) => item.id === selected) || items[0];
  const list = (group) => (
    <div className="pf-skills">
      {group.skills?.map((skill) => (
        <div key={skill.id}>
          <Media src={skill.icon} alt="" />
          <span>{skill.name}</span>
        </div>
      ))}
    </div>
  );
  return (
    <section className="pf-section">
      <SectionScenery kind="skills" />
      <Heading section={section} fallback="Skills" />
      <div className="pf-skills-bar">
        <div className="pf-pills" aria-label="Choose skill group">
          {items.map((group) => (
            <button
              type="button"
              key={group.id}
              aria-pressed={active?.id === group.id}
              onClick={() => setSelected(group.id)}
            >
              {group.title}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="pf-text-button"
          onClick={() => setAll(true)}
        >
          All skills ↗
        </button>
      </div>
      {active && (
        <>
          <div className="pf-choice-stack pf-skills-content">
          {items.map((group) => {
            const isActive = group.id === active.id;
            const rowCount = Math.ceil((group.skills?.length || 0) / 6);
            const rowSize = Math.ceil((group.skills?.length || 0) / Math.max(1, rowCount));
            return (
          <div key={group.id} className="pf-choice-pane" data-active={isActive} aria-hidden={!isActive} inert={!isActive}>
          <p className="pf-eyebrow">{group.eyebrow || group.name}</p>
          {group.description &&
            !group.highlights?.includes(group.description) && (
              <p>{group.description}</p>
            )}
          <div className="pf-skill-loops">
            {Array.from({ length: rowCount }, (_, row) => (
              isActive ? (
              <LogoLoop
                key={row}
                className="pf-skill-loop-row"
                logos={group.skills
                  .slice(row * rowSize, row * rowSize + rowSize)
                  .map((skill) => ({
                    src: skill.icon,
                    alt: skill.name,
                    title: skill.name,
                  }))}
                speed={paused ? 0 : 18}
                direction={row % 2 ? "right" : "left"}
                logoHeight={28}
                gap={16}
                labels="inline"
                fadeOutWidth={0.04}
                pauseOnHover
                draggable={false}
                intro={false}
                ariaLabel={`${group.title}, skills row ${row + 1}`}
              />
              ) : <div key={row} className="pf-skill-loop-row" />
            ))}
          </div>
          </div>
            );
          })}
          </div>
          <button
            type="button"
            className="pf-text-button pf-skill-pause"
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? "Resume skill animation" : "Pause skill animation"}
          </button>
        </>
      )}
      {all && (
        <PreviewDialog title="All skills" onClose={() => setAll(false)}>
          {items.map((group) => (
            <div key={group.id}>
              <h3>{group.title}</h3>
              {group.description && <p>{group.description}</p>}
              {list(group)}
            </div>
          ))}
        </PreviewDialog>
      )}
    </section>
  );
}

function ProjectPreview({ project, slide, setSlide }) {
  const images = project.images || [];
  return (
    <>
      <p className="pf-meta">
        {project.role} {project.status && ` · ${project.status}`}
      </p>
      <div className="pf-gallery" data-no-glow>
        <Media
          className={project.imageKind === "logo" ? "pf-logo" : ""}
          src={images[slide]}
          alt={
            project.gallery?.[slide]?.alt ||
            `${project.name}, image ${slide + 1}`
          }
        />
        {images.length > 1 && (
          <div className="pf-gallery-controls">
            <button
              type="button"
              aria-label="Previous gallery image"
              onClick={() =>
                setSlide((slide + images.length - 1) % images.length)
              }
            >
              ←
            </button>
            <span aria-live="polite">
              {slide + 1} / {images.length}
            </span>
            <button
              type="button"
              aria-label="Next gallery image"
              onClick={() => setSlide((slide + 1) % images.length)}
            >
              →
            </button>
          </div>
        )}
      </div>
      <p className="pf-gallery-caption">{project.gallery?.[slide]?.caption}</p>
      <p>{project.description}</p>
      {project.outcome && (
        <div className="pf-outcome">
          <strong>Outcome</strong>
          <p>{project.outcome}</p>
        </div>
      )}
      <details className="pf-disclosure">
        <summary>Engineering details</summary>
        <ul>
          {project.details?.map((text, i) => (
            <li key={i}>{text}</li>
          ))}
        </ul>
      </details>
      <details className="pf-disclosure">
        <summary>Technologies · {project.techStack?.length || 0}</summary>
        <div className="pf-tags">
          {project.techStack?.map((tech, i) => (
            <span key={`${tech}-${i}`}>{tech}</span>
          ))}
        </div>
      </details>
      <div className="pf-actions">
        {project.code && (
          <a href={project.code} target="_blank" rel="noopener noreferrer">
            View source ↗
          </a>
        )}
        {project.demo && (
          <a href={project.demo} target="_blank" rel="noopener noreferrer">
            Visit project ↗
          </a>
        )}
      </div>
    </>
  );
}
function Projects({ items, section, policy, onOverlay }) {
  const [selectedId, setSelectedId] = useState(items[0]?.id);
  const [preview, setPreview] = useState(false);
  const [slides, setSlides] = useState({});
  const carousel = useRef(null);
  const index = Math.max(
    0,
    items.findIndex((p) => p.id === selectedId),
  );
  const selected = items[index];
  const assets = useMemo(
    () =>
      items.map((p) => ({
        src: p.images?.[0] || "",
        alt: p.name,
        title: p.name,
      })),
    [items],
  );
  const select = (next) => {
    const i = (next + items.length) % items.length;
    setSelectedId(items[i].id);
    carousel.current?.focusIndex(i);
  };
  const open = () => {
    setPreview(true);
    onOverlay(true);
  };
  const close = () => {
    setPreview(false);
    onOverlay(false);
  };
  const change = useCallback(
    (i) => {
      if (items[i]) setSelectedId(items[i].id);
    },
    [items],
  );
  return (
    <section className="pf-section pf-projects">
      <SectionScenery kind="projects" />
      <div className="pf-inner">
        <Heading section={section} fallback="Projects" />
        {selected ? (
          <div className="pf-project-grid">
            <div className="pf-project-selection">
              {policy.desktop ? (
                <div className="pf-carousel">
                  <CircularCarousel
                    controlRef={carousel}
                    initialIndex={index}
                    items={assets}
                    preset="cylinder"
                    intro="none"
                    cardWidth={152}
                    aspectRatio={1.58}
                    gap={24}
                    curve={0.1}
                    tilt={-2}
                    perspective={2600}
                    autoplay="off"
                    speed={0}
                    momentum={0.12}
                    snap
                    focusOnClick
                    parallax={0}
                    stretch={0}
                    depthFade={0}
                    fadeColor="transparent"
                    innerShade={1}
                    captions={false}
                    onChange={change}
                    onItemClick={(_, i) => select(i)}
                  />
                </div>
              ) : null}
              <p className="pf-meta" aria-live="polite">
                {String(index + 1).padStart(2, "0")} /{" "}
                {String(items.length).padStart(2, "0")} · Selected project
              </p>
              <div className="pf-choice-stack pf-project-name" aria-live="polite">
                {items.map((project) => (
                  <p key={project.id} className="pf-choice-pane" data-active={project.id === selected.id} aria-hidden={project.id !== selected.id} inert={project.id !== selected.id}>{project.name}</p>
                ))}
              </div>
              <div className="pf-carousel-controls">
                <button
                  type="button"
                  aria-label="Previous project"
                  onClick={() => select(index - 1)}
                >
                  ←
                </button>
                <ProjectChooser
                  projects={items}
                  selected={selected}
                  onSelect={select}
                />
                <button
                  type="button"
                  aria-label="Next project"
                  onClick={() => select(index + 1)}
                >
                  →
                </button>
              </div>
            </div>
            <div
              className="pf-choice-stack pf-project-details"
              id="pf-selected-project"
              aria-label="Selected project details"
            >
            {items.map((project) => (
            <article key={project.id} className="pf-project-card pf-choice-pane" data-active={project.id === selected.id} aria-hidden={project.id !== selected.id} inert={project.id !== selected.id}>
              <h3>{project.name}</h3>
              <div className="pf-project-summary">
                <Media
                  src={project.images?.[0]}
                  alt={project.gallery?.[0]?.alt || project.name}
                  className={project.imageKind === "logo" ? "pf-logo" : ""}
                />
                <div>
                  <p>{project.role}</p>
                  <p className="pf-project-outcome">
                    {project.outcome || project.description}
                  </p>
                  <p className="pf-eyebrow">{project.status}</p>
                  <button type="button" className="pf-primary" onClick={open}>
                    Preview ↗
                  </button>
                </div>
              </div>
            </article>
            ))}
            </div>
          </div>
        ) : (
          <p>No published projects yet.</p>
        )}
        {preview && selected && (
          <PreviewDialog title={selected.name} onClose={close}>
            <ProjectPreview
              project={selected}
              slide={Math.min(
                slides[selected.id] || 0,
                Math.max(0, selected.images.length - 1),
              )}
              setSlide={(slide) =>
                setSlides((current) => ({ ...current, [selected.id]: slide }))
              }
            />
          </PreviewDialog>
        )}
      </div>
    </section>
  );
}
function Education({ items, section }) {
  const [active, setActive] = useState(null);
  return (
    <section className="pf-section pf-alternate">
      <SectionScenery kind="education" />
      <div className="pf-inner">
        <Heading section={section} fallback="Educations" />
        <div className="pf-education-grid">
          {items.map((item) => (
            <article className="pf-panel" key={item.id}>
              <p className="pf-eyebrow">{item.credential}</p>
              <h3>{item.title}</h3>
              <p className="pf-accent">{item.institution}</p>
              <p className="pf-meta">
                {item.duration}
                {item.location && ` · ${item.location}`}
              </p>
              <p>{item.details?.[0]}</p>
              <button
                type="button"
                className="pf-text-button"
                onClick={() => setActive(item)}
              >
                View credential & details ↗
              </button>
            </article>
          ))}
        </div>
        {active && (
          <PreviewDialog title={active.title} onClose={() => setActive(null)}>
            <p>
              {active.institution} · {active.duration}
              {active.location &&
                !active.duration?.includes(active.location) &&
                ` · ${active.location}`}
            </p>
            <Media
              className="pf-credential"
              src={active.image}
              alt={`${active.title} credential`}
            />
            <ul>
              {active.details?.map((text, i) => (
                <li key={i}>{text}</li>
              ))}
            </ul>
          </PreviewDialog>
        )}
      </div>
    </section>
  );
}
function Contact({ data, section, policy }) {
  const p = data.personalData;
  return (
    <section className="pf-section">
      <SectionScenery kind="contact" />
      <Heading section={section} fallback="Contact me" />
      <div className="pf-contact-grid">
        <div className="pf-contact-copy">
          <div className="pf-contact-details">
            <p className="pf-contact-intro">
              {data.settings?.contactIntroduction}
            </p>
            <address>
              {p.email && (
                <a className="pf-accent" href={`mailto:${p.email}`}>
                  {p.email} ↗
                </a>
              )}
              {p.phone && <a href={`tel:${p.phone}`}>{p.phone}</a>}
              {p.address && <p>{p.address}</p>}
            </address>
          </div>
          <div className="pf-contact-lower">
            <div className="pf-contact-feature">
              <ContactCrystal policy={policy} />
            </div>
            <SocialLinks settings={data.settings} />
          </div>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
export default function Portfolio({ data, entered = true, typingReady = entered }) {
  const policy = useMotionPolicy();
  const motionRoot = useRef(null);
  useScrollWorld(motionRoot, entered, data.sections);

  const [overlay, setOverlay] = useState(false);
  useEffect(() => {
    if (!entered) return;
    const align = () => {
      const key = window.location.hash.slice(1);
      if (data.sections.some((section) => section.visible && section.key === key))
        scrollToPortfolioSection(key, "instant");
    };
    window.addEventListener("popstate", align);
    window.addEventListener("hashchange", align);
    return () => {
      window.removeEventListener("popstate", align);
      window.removeEventListener("hashchange", align);
    };
  }, [data.sections, entered]);

  const renderers = {
    about: () =>
      data.hero && data.personalData && <Hero data={data} policy={policy} entered={entered} typingReady={typingReady} />,
    experience: (s) => (
      <Experience items={data.experiences} section={s} policy={policy} />
    ),
    skills: (s) => <Skills items={data.skillCategories} section={s} />,
    projects: (s) => (
      <Projects
        items={data.projectsData}
        section={s}
        policy={policy}
        onOverlay={setOverlay}
      />
    ),
    education: (s) => <Education items={data.educations} section={s} />,
    contact: (s) =>
      data.personalData && <Contact data={data} section={s} policy={policy} />,
  };
  return (
    <>
      <PublicCursor
        policy={policy}

        overlay={overlay}
      />
      <div ref={motionRoot} className="pf-scroll-world" inert={!entered}>
      {data.sections
        .filter((s) => s.visible && Object.hasOwn(renderers, s.key))
        .toSorted((a, b) => Number(b.key === "about") - Number(a.key === "about") || Number(a.key === "contact") - Number(b.key === "contact") || a.order - b.order)
        .map((s, index) => (
          <div
            key={s.key}
            id={s.key}
            className="pf-section-anchor"
            data-surface={index % 2 === 0 ? "primary" : "alternate"}
          >
            {renderers[s.key]?.(s)}
          </div>
        ))}
      </div>
      {!data.sections.length && (
        <p className="pf-empty">Portfolio content will be available soon.</p>
      )}
    </>
  );
}
