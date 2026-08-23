import ContactSection from "./components/homepage/contact";
import Education from "./components/homepage/education";
import Experience from "./components/homepage/experience";
import HeroSection from "./components/homepage/hero-section";
import Projects from "./components/homepage/projects";
import Skills from "./components/homepage/skills";
import SmoothScrollProvider from "./components/helper/smooth-scroll-provider";
import {
  HeroBigTransition,
  ExperienceBigTransition,
  SkillsBigTransition,
  ProjectsBigTransition,
  EducationBigTransition,
  ContactBigTransition,
} from "./components/helper/section-transitions";

export default function Home() {
  return (
    <SmoothScrollProvider>
      <div suppressHydrationWarning className="relative w-full overflow-hidden">
        <HeroBigTransition>
          <HeroSection />
        </HeroBigTransition>

        <ExperienceBigTransition>
          <Experience />
        </ExperienceBigTransition>

        <SkillsBigTransition>
          <Skills />
        </SkillsBigTransition>

        <ProjectsBigTransition>
          <Projects />
        </ProjectsBigTransition>

        <EducationBigTransition>
          <Education />
        </EducationBigTransition>

        <ContactBigTransition>
          <ContactSection />
        </ContactBigTransition>
      </div>
    </SmoothScrollProvider>
  );
};
