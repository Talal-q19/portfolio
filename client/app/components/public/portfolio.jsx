"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CircularCarousel from "./effects/CircularCarousel";
import PreviewDialog from "./dialog";
import {
  BoundedCode,
  ContactCrystal,
  PublicCursor,
  useMotionPolicy,
} from "./motion";
import ContactForm from "../homepage/contact/contact-form";

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
            {{ github: "GitHub", linkedIn: "LinkedIn", instagram: "Instagram" }[
              link.label
            ] || link.label}{" "}
            ↗
          </a>
        ))}
    </div>
  );
}
function Heading({ section, number, fallback }) {
  return (
    <header className="pf-heading">
      <p className="pf-eyebrow">
        {String(number).padStart(2, "0")} / {section.eyebrow || fallback}
      </p>
      <h2>{section.heading || fallback}</h2>
      {section.introduction && <p>{section.introduction}</p>}
    </header>
  );
}

function CodeEditor({ hero, policy, skills }) {
  const [tab, setTab] = useState(0);
  const [typed, setTyped] = useState(0);
  const [replay, setReplay] = useState(0);
  const [mode, setMode] = useState("normal");
  const panel = hero.panels?.[tab] || hero.panels?.[0];
  const count = (panel?.lines || []).reduce(
    (n, line) =>
      n + line.tokens.reduce((m, token) => m + (token.text || "").length, 0),
    0,
  );
  useEffect(() => {
    let characters = 0;
    const tick = () => {
      if (!document.hidden) {
        characters = Math.min(count, characters + 3);
        setTyped(characters);
      }
      if (characters >= count) clearInterval(timer);
    };
    const timer = setInterval(tick, 30);
    return () => clearInterval(timer);
  }, [tab, count, replay]);
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
              setTab(i);
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
                    {policy.desktop
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
      {mode === "closed" ? (
        <button type="button" onClick={() => setMode("normal")}>
          Restore coding preview ↗
        </button>
      ) : (
        <BoundedCode enabled={policy.desktop}>
          <div
            className={`pf-code ${mode === "expanded" ? "pf-code-expanded" : ""}`}
          >
            <div className="pf-code-controls">
              <button
                type="button"
                onClick={() => setMode("closed")}
                aria-label="Close coding preview"
              >
                ×
              </button>
              <button
                type="button"
                onClick={() =>
                  setMode(mode === "minimized" ? "normal" : "minimized")
                }
                aria-label="Minimize coding preview"
                aria-pressed={mode === "minimized"}
              >
                −
              </button>
              <button
                type="button"
                onClick={() =>
                  setMode(mode === "expanded" ? "normal" : "expanded")
                }
                aria-label="Expand coding preview"
                aria-pressed={mode === "expanded"}
              >
                ↗
              </button>
            </div>
            <div hidden={mode === "minimized"}>{content}</div>
          </div>
        </BoundedCode>
      )}
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
function Hero({ data, policy }) {
  const { hero, personalData: personal, settings } = data;
  const words = hero.heading?.split(" ") || [];
  return (
    <section id="about" className="pf-section pf-hero">
      <div>
        <p className="pf-eyebrow">
          {hero.eyebrow} / {hero.location}
        </p>
        <div className="pf-identity">
          <Media src={personal.profile} alt={personal.name} priority />
          <div>
            <strong>{personal.name}</strong>
            <small>{hero.availability}</small>
          </div>
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
        <p className="pf-availability">
          <span />
          {hero.availability}
        </p>
        <SocialLinks settings={settings} />
      </div>
      <CodeEditor
        hero={hero}
        policy={policy}
        skills={data.skillCategories.flatMap((group) => group.skills)}
      />
    </section>
  );
}
function Experience({ items, section }) {
  const [selected, setSelected] = useState(items[0]?.id);
  const active = items.find((item) => item.id === selected) || items[0];
  return (
    <section id="experience" className="pf-section pf-alternate">
      <div className="pf-inner">
        <Heading section={section} number={2} fallback="Experiences" />
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
              <div className="pf-threads" aria-hidden="true">
                <span>Event-driven, by design.</span>
                <svg viewBox="0 0 320 160" fill="none">
                  {Array.from({ length: 14 }, (_, i) => (
                    <path
                      key={i}
                      d={`M-20 ${60 + i * 3} C90 ${220 - i * 4}, 160 ${-90 + i * 6}, 340 ${90 + i * 2}`}
                      stroke="currentColor"
                      opacity={0.1 + i * 0.025}
                    />
                  ))}
                </svg>
                <small>Java　 Kafka　 PostgreSQL</small>
              </div>
            </aside>
            <article id="pf-career" className="pf-panel" aria-live="polite">
              <p className="pf-meta">
                {active.duration}
                {active.location &&
                  !active.duration?.includes(active.location) &&
                  ` · ${active.location}`}
              </p>
              <h3>{active.title}</h3>
              <p className="pf-accent">{active.company}</p>
              {active.description &&
                !active.highlights?.includes(active.description) && (
                  <p>{active.description}</p>
                )}
              <ul>
                {active.highlights?.filter(Boolean).map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
            </article>
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
    <section id="skills" className="pf-section">
      <Heading section={section} number={3} fallback="Skills" />
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
          <p className="pf-eyebrow">{active.eyebrow || active.name}</p>
          {active.description &&
            !active.highlights?.includes(active.description) && (
              <p>{active.description}</p>
            )}
          {list(active)}
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
    <section id="projects" className="pf-section pf-projects">
      <div className="pf-inner">
        <Heading section={section} number={4} fallback="Projects" />
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
                    depthFade={0.15}
                    fadeColor="#0F1014"
                    innerShade={0.08}
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
              <p>{selected.name}</p>
              <div className="pf-carousel-controls">
                <button
                  type="button"
                  aria-label="Previous project"
                  onClick={() => select(index - 1)}
                >
                  ←
                </button>
                <label>
                  Choose project
                  <select
                    value={selected.id}
                    onChange={(e) =>
                      select(
                        items.findIndex((p) => String(p.id) === e.target.value),
                      )
                    }
                  >
                    {items.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  aria-label="Next project"
                  onClick={() => select(index + 1)}
                >
                  →
                </button>
              </div>
            </div>
            <article
              className="pf-project-card"
              id="pf-selected-project"
              aria-label="Selected project details"
            >
              <h3>{selected.name}</h3>
              <div className="pf-project-summary">
                <Media
                  src={selected.images?.[0]}
                  alt={selected.gallery?.[0]?.alt || selected.name}
                  className={selected.imageKind === "logo" ? "pf-logo" : ""}
                />
                <div>
                  <p>{selected.role}</p>
                  <p className="pf-project-outcome">
                    {selected.outcome || selected.description}
                  </p>
                  <p className="pf-eyebrow">{selected.status}</p>
                  <button type="button" className="pf-primary" onClick={open}>
                    Preview ↗
                  </button>
                </div>
              </div>
            </article>
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
    <section id="education" className="pf-section pf-alternate">
      <div className="pf-inner">
        <Heading section={section} number={5} fallback="Educations" />
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
function Contact({ data, section, policy, onVisibility }) {
  const p = data.personalData;
  return (
    <section id="contact" className="pf-section">
      <Heading section={section} number={6} fallback="Contact me" />
      <div className="pf-contact-grid">
        <div>
          <p className="pf-contact-intro">
            {data.settings?.contactIntroduction}
          </p>
          <address>
            <a className="pf-accent" href={`mailto:${p.email}`}>
              {p.email} ↗
            </a>
            {p.phone && <a href={`tel:${p.phone}`}>{p.phone}</a>}
            {p.address && <p>{p.address}</p>}
          </address>
          <div className="pf-contact-bottom">
            <SocialLinks settings={data.settings} />
            <div>
              <ContactCrystal policy={policy} onVisibility={onVisibility} />
              <small>{data.hero?.availability}</small>
            </div>
          </div>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}

export default function Portfolio({ data }) {
  const policy = useMotionPolicy();
  const [crystalVisible, setCrystalVisible] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const renderers = {
    about: () =>
      data.hero && data.personalData && <Hero data={data} policy={policy} />,
    experience: (s) => <Experience items={data.experiences} section={s} />,
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
      data.personalData && (
        <Contact
          data={data}
          section={s}
          policy={policy}
          onVisibility={setCrystalVisible}
        />
      ),
  };
  return (
    <>
      <PublicCursor
        policy={policy}
        crystalVisible={crystalVisible}
        overlay={overlay}
      />
      {data.sections
        .filter((s) => s.visible)
        .toSorted((a, b) => a.order - b.order)
        .map((s) => (
          <div key={s.key}>{renderers[s.key]?.(s)}</div>
        ))}
      {!data.sections.length && (
        <p className="pf-empty">Portfolio content will be available soon.</p>
      )}
    </>
  );
}
