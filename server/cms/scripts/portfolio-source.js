const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const client = path.resolve(__dirname, '../../../client');
const read = file => fs.readFileSync(path.join(client, file), 'utf8');
// Evaluate only checked-in local data modules in an isolated context, never CMS input.
function dataModule(file, names) {
  return vm.runInNewContext(`${read(file).replace(/export const /g, 'const ')};({${names.join(',')}})`, {}, { timeout: 1000 });
}
function constant(source, name) {
  const start = source.indexOf(`const ${name} = `);
  if (start < 0) throw new Error(`Missing source constant ${name}`);
  const end = source.indexOf('\n};', start) >= 0 && name === 'companyLogos'
    ? source.indexOf('\n};', start) + 3 : source.indexOf('\n];', start) + 3;
  if (end < start) throw new Error(`Cannot extract ${name}`);
  return vm.runInNewContext(`${source.slice(start, end)};${name}`, {}, { timeout: 1000 });
}
const slugify = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const bullets = values => Array.from(values, text => ({ text }));
const file = source => ({ $file: source });
function dateRange(label) {
  const months = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
  const dates = [...label.matchAll(/([A-Z][a-z]{2}) (\d{4})/g)].map(([, month, year]) => `${year}-${months[month]}`);
  return { startDate: dates[0], endDate: dates[1] || null };
}
function buildPortfolioSource() {
  const { personalData: person } = dataModule('utils/data/personal-data.js', ['personalData']);
  const { experiences } = dataModule('utils/data/experience.js', ['experiences']);
  const { educations } = dataModule('utils/data/educations.js', ['educations']);
  const { projectsData } = dataModule('utils/data/projects-data.js', ['projectsData']);
  const { skillCategories } = dataModule('utils/data/skills.js', ['skillCategories']);
  const hero = read('app/components/homepage/hero-section/index.jsx');
  const logos = constant(read('app/components/homepage/experience/index.jsx'), 'companyLogos');
  let skillSource = read('utils/skill-image.js');
  skillSource = skillSource.replace(/import (\w+) from ['"]([^'"]+)['"];?/g, (_, name, source) => `const ${name} = ${JSON.stringify(path.posix.normalize(`/utils/${source}`))};`);
  const skillsImage = vm.runInNewContext(`${skillSource.replace('export const skillsImage', 'const skillsImage')};skillsImage`, {}, { timeout: 1000 });
  const records = [];
  const add = (key, category, data) => records.push({ key, category, data, displayOrder: records.filter(r => r.category === category).length });
  const tones = className => /orange/.test(className) ? 'orange' : /cyan|64D8FF/.test(className) ? 'cyan' : /green|emerald|34D399/.test(className) ? 'green' : /gray|718297|500/.test(className) ? 'muted' : /purple/.test(className) ? 'purple' : 'default';
  add('hero:main', 'hero', {
    heading: 'Software Engineer', role: 'Fintech Backend Engineer', paragraph: person.description,
    eyebrow: 'Backend engineering', location: 'Dubai', availability: 'Open for New Opportunities',
    buttons: [{ label: 'Contact me', url: '#contact' }, { label: 'View selected work', url: '#projects' }, { label: 'Get Resume', url: person.resume }],
    panels: [['coder.js', 'codeLines'], ['skills.json', 'skillsTabLines'], ['README.md', 'readmeTabLines']].map(([title, name]) => ({
      title, lines: Array.from(constant(hero, name), line => ({ tokens: Array.from(line, token => ({ text: token.text, tone: tones(token.className) })) })),
    })),
  });
  for (const experience of experiences) {
    add(`experience:${experience.id}`, 'experience', {
      title: experience.title, company: experience.company, image: file(logos[experience.company]),
      description: experience.highlights[0], highlights: bullets(experience.highlights),
      ...dateRange(experience.duration), current: experience.duration.includes('Present'),
      durationLabel: experience.duration, location: experience.duration.includes('Dubai') ? 'Dubai, UAE' : '',
    });
  }
  for (const project of projectsData) {
    add(`project:${project.id}`, 'projects', {
      name: project.name, slug: slugify(project.name), description: project.description, outcome: project.outcome,
      role: project.role, projectStatus: project.status, imageKind: project.imageKind || 'screenshot',
      gallery: Array.from(project.images, (image, index) => ({ image: file(image), alt: `${project.name} — image ${index + 1}` })),
      technologies: bullets(project.techStack), details: bullets(project.details), sourceUrl: project.code, demoUrl: project.demo,
    });
  }
  for (const group of skillCategories) {
    const groupKey = `skill-group:${slugify(group.title)}`;
    add(groupKey, 'skill-groups', { name: group.title, eyebrow: group.eyebrow, description: group.description, accent: group.accent });
    for (const skill of group.skills) {
      // Redis is present in local data but has no existing icon mapping.
      const icon = skillsImage(skill) || (skill === 'Redis' ? '/migration-assets/redis.svg' : null);
      if (!icon) throw new Error(`Missing skill icon: ${skill}`);
      add(`skill:${slugify(group.title)}:${slugify(skill)}`, 'skills', { name: skill, icon: file(icon), skillGroup: { $entry: groupKey } });
    }
  }
  for (const education of educations) {
    const year = /Completed (\d{4})/.exec(education.duration)?.[1];
    add(`education:${education.id}`, 'education', {
      qualification: education.title, institution: education.institution, credential: education.credential,
      image: file(education.image), ...(year ? { completionYear: Number(year) } : dateRange(education.duration)),
      durationLabel: education.duration, location: education.location, details: bullets(education.details),
    });
  }
  const layout = read('app/layout.js');
  const seoTitle = /title: "([^"]+)"/.exec(layout)[1];
  const seoDescription = /description:\s*"([^"]+)"/.exec(layout)[1];
  const nav = constant(read('app/components/navbar.jsx'), 'NAV_ITEMS');
  const contactForm = read('app/components/homepage/contact/contact-form.jsx');
  const contactIntroduction = /\{"(If you have[^\n]+?)"\}/.exec(contactForm)?.[1] || '';
  add('site-settings:main', 'site-settings', {
    displayName: person.name, profileImage: file(person.profile), contactEmail: person.email,
    seoTitle, seoDescription, phone: person.phone, location: person.address, designation: person.designation,
    cv: file(person.resume), aboutHeading: 'Who I am?', aboutText: person.description,
    socialLinks: ['github', 'facebook', 'instagram', 'linkedIn', 'twitter', 'stackOverflow', 'leetcode'].filter(key => person[key]).map(key => ({ label: key, url: person[key] })),
    navigation: Array.from(nav, item => ({ label: item.label, url: `#${item.target}` })),
    footerText: `© Portfolio by ${person.name}`, devUsername: person.devUsername, contactIntroduction,
  });
  const headings = { about: 'About Me', experience: 'Experiences', skills: 'Skills', projects: 'Projects', education: 'Educations', contact: 'Contact me' };
  add('section-settings:main', 'section-settings', { sections: Array.from(nav, (item, order) => ({
    key: item.target, heading: headings[item.target], visible: true, order,
    ...(item.target === 'projects' ? {
      eyebrow: 'Selected case studies',
      introduction: 'Open a window to review the role, technical approach, and measurable outcome behind each project.',
    } : {}),
  })) });
  return JSON.parse(JSON.stringify(records));
}

function sourceFile(source) {
  const migrationAsset = source.startsWith('/migration-assets/');
  const base = migrationAsset ? path.resolve(__dirname, '../assets') : source.startsWith('/app/') ? client : path.join(client, 'public');
  const target = path.resolve(base, migrationAsset ? source.slice('/migration-assets/'.length) : `.${source}`);
  if (!target.startsWith(base + path.sep) || !fs.statSync(target).isFile()) throw new Error(`Invalid source media path ${source}`);
  return target;
}
function fileKey(source) {
  return crypto.createHash('sha256').update(source).update(fs.readFileSync(sourceFile(source))).digest('hex');
}
module.exports = { buildPortfolioSource, sourceFile, fileKey };
