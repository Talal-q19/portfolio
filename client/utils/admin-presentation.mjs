// Presentation only: persisted content keys and API validation stay stable.
export const sectionName = category => ({ hero: 'Hero & CV', 'site-settings': 'Profile & contact', 'section-settings': 'Section headings & visibility', 'skill-groups': 'Skill groups' })[category?.templateKey] || category?.name || 'Content';
const layouts = {
  hero: [
    ['Introduction', 'The text visitors see at the top of your portfolio.', ['heading', 'role', 'paragraph', 'eyebrow', 'location']],
    ['Portrait card', 'Your job title on the reverse of the profile card. Your name and photo live in Profile & contact.', ['designation']],
    ['CV & buttons', 'Upload your CV here and manage the links shown below your introduction.', ['cv', 'buttons']],
    ['Code display', 'The code-style panels beside your introduction.', ['panels'], true],
    ['Other options', 'Additional values retained for compatibility with other layouts.', ['greeting', 'availability'], true],
  ],
  'site-settings': [
    ['Profile', 'Your shared name and portrait, used across the portfolio.', ['displayName', 'profileImage']],
    ['Contact & social links', 'How visitors can reach you. Upload your CV in Hero & CV.', ['contactEmail', 'phone', 'contactIntroduction', 'socialLinks']],
    ['Search appearance', 'The title and description shown in search results and shared links.', ['seoTitle', 'seoDescription']],
    ['Footer', 'The text at the bottom of your portfolio.', ['footerText']],
    ['Other options', 'Navigation links and developer profile details.', ['navigation', 'devUsername'], true],
  ],
  experience: [
    ['Position', 'Your role, employer, and company image.', ['title', 'company', 'image', 'location']],
    ['Dates', 'Choose Present position for your current role.', ['current', 'startDate', 'endDate']],
    ['Work & achievements', 'Describe the role and highlight what you accomplished.', ['description', 'highlights']],
    ['Date label override', 'Optional custom date text. Leave blank to use the dates above.', ['durationLabel'], true],
  ],
  education: [
    ['Qualification', 'The course, institution, and credential shown on your portfolio.', ['qualification', 'institution', 'credential', 'image', 'location']],
    ['Dates & details', 'Use either a completion year or a start and end date.', ['completionYear', 'startDate', 'endDate', 'details']],
    ['Date label override', 'Leave blank to generate this from your dates.', ['durationLabel'], true],
  ],
  projects: [
    ['Project overview', 'Introduce the project and your contribution.', ['name', 'description', 'role', 'outcome', 'projectStatus']],
    ['Images', 'Upload screenshots or a logo. Add descriptive alternative text for each image.', ['gallery', 'imageKind']],
    ['Technology & details', 'The tools you used and the work you delivered.', ['technologies', 'details']],
    ['Links', 'Optional live project and source code links.', ['demoUrl', 'sourceUrl']],
    ['URL settings', 'A unique lowercase identifier for this project, such as portfolio-studio.', ['slug'], true],
  ],
};
export function editorGroups(templateKey, fields) {
  const hidden = templateKey === 'site-settings' ? ['cv'] : [];
  const groups = (layouts[templateKey] || [['Content', '', Object.keys(fields)]]).map(([title, description, keys, advanced]) => ({ title, description, advanced: Boolean(advanced), fields: Object.fromEntries(keys.filter(key => fields[key] && !hidden.includes(key)).map(key => [key, fields[key]])) })).filter(group => Object.keys(group.fields).length);
  const assigned = new Set([...hidden, ...groups.flatMap(group => Object.keys(group.fields))]);
  const remaining = Object.fromEntries(Object.entries(fields).filter(([key]) => !assigned.has(key)));
  if (Object.keys(remaining).length) groups.push({ title: 'More options', description: '', advanced: true, fields: remaining });
  return groups;
}
