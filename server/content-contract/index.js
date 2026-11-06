// Versioned, browser-safe metadata. Validation code is shared by CMS and API.
const text = (required = false, max = 500) => ({ type: 'text', required, max });
const list = (component, min = 0) => ({ type: 'list', component, min });
const media = (required = true, kind = 'image') => ({ type: 'media', required, kind });
const link = () => ({ type: 'url' });
const components = {
  bullet: { text: text(true, 5000) },
  link: { label: text(true, 100), url: { type: 'url', required: true } },
  gallery: { image: media(), alt: text(true, 300), caption: text(false, 500) },
  token: { text: text(false, 5000), tone: { type: 'enum', values: ['default', 'muted', 'green', 'cyan', 'orange', 'purple', 'white'] } },
  line: { tokens: list('token', 1) },
  panel: { title: text(true, 100), lines: list('line', 1) },
  section: {
    key: { type: 'enum', required: true, values: ['about', 'experience', 'skills', 'projects', 'education', 'contact'] },
    heading: text(true, 200), eyebrow: text(false, 200), introduction: text(false, 2000), visible: { type: 'boolean', required: true },
    order: { type: 'integer', required: true, min: 0, max: 1000 },
  },
};
const templates = {
  hero: { name: 'Hero', cardinality: 'singleton', fields: {
    heading: text(true, 200), paragraph: text(true, 5000), greeting: text(), role: text(),
    designation: text(), availability: text(), eyebrow: text(), location: text(), buttons: list('link'), panels: list('panel'),
  } },
  experience: { name: 'Experience', cardinality: 'multiple', fields: {
    title: text(true, 200), company: text(true, 200), image: media(), description: text(true, 10000),
    startDate: { type: 'date', required: true }, endDate: { type: 'date' },
    current: { type: 'boolean', required: true }, location: text(), durationLabel: text(), highlights: list('bullet'),
  }, rules: [{ type: 'current-position', currentField: 'current', startField: 'startDate', endField: 'endDate' }] },
  projects: { name: 'Projects', cardinality: 'multiple', fields: {
    name: text(true, 200), slug: { type: 'slug', required: true }, description: text(true, 10000),
    outcome: text(true, 5000), role: text(true, 300),
    projectStatus: { type: 'enum', required: true, values: ['Live', 'Completed', 'In progress'] },
    gallery: list('gallery', 1), technologies: list('bullet', 1), details: list('bullet', 1),
    imageKind: { type: 'enum', values: ['logo', 'screenshot'] }, sourceUrl: link(), demoUrl: link(),
  } },
  skills: { name: 'Skills', cardinality: 'multiple', fields: {
    name: text(true, 100), icon: media(), skillGroup: { type: 'skillGroup', required: true },
  } },
  'skill-groups': { name: 'Skill Groups', cardinality: 'multiple', fields: {
    name: text(true, 100), eyebrow: text(true, 200), description: text(true, 2000),
    accent: { type: 'enum', values: ['emerald', 'amber', 'sky'] },
  } },
  education: { name: 'Education', cardinality: 'multiple', fields: {
    qualification: text(true, 300), institution: text(true, 300), credential: text(true, 100), image: media(),
    startDate: { type: 'date' }, endDate: { type: 'date' }, completionYear: { type: 'integer', min: 1900, max: 2200 },
    durationLabel: text(), location: text(), details: list('bullet'),
  }, rules: [{ type: 'date-range-or-year', startField: 'startDate', endField: 'endDate', yearField: 'completionYear' }] },
  'site-settings': { name: 'Site Settings', cardinality: 'singleton', fields: {
    displayName: text(true, 200), profileImage: media(), contactEmail: { type: 'email', required: true },
    seoTitle: text(true, 300), seoDescription: text(true, 2000), phone: text(),
    cv: media(false, 'file'), socialLinks: list('link'), navigation: list('link'), footerText: text(false, 2000),
    devUsername: text(), contactIntroduction: text(false, 2000),
  } },
  'section-settings': { name: 'Section Settings', cardinality: 'singleton', fields: { sections: list('section', 1) } },
};

class ContentValidationError extends Error {
  constructor(fields) {
    super('Content is incomplete or invalid.');
    this.name = 'ContentValidationError';
    this.fields = fields;
  }
}
const blank = value => value === undefined || value === null || value === '';
const validDate = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}(-\d{2})?$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1900 || year > 2200 || month < 1 || month > 12) return false;
  return day === undefined || (day > 0 && day <= new Date(Date.UTC(year, month, 0)).getUTCDate());
};
const validUrl = value => {
  if (typeof value !== 'string') return false;
  if (/^#[a-z][a-z0-9-]*$/i.test(value) || /^\/(?!\/)[^\s\\]*$/.test(value)) return true;
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password; } catch { return false; }
};

async function validatePayload(templateKey, payload, resolvers = {}) {
  const template = templates[templateKey];
  const errors = {};
  if (!template) throw new ContentValidationError({ category: 'Unsupported category template.' });
  async function object(fields, value, prefix) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) { errors[prefix] = 'Expected an object.'; return; }
    for (const key of Object.keys(value)) {
      if (!['id', '__component'].includes(key) && !Object.hasOwn(fields, key)) errors[`${prefix}.${key}`] = 'Field is not allowed for this template.';
    }
    for (const [key, spec] of Object.entries(fields)) {
      const path = `${prefix}.${key}`;
      const v = value[key];
      if (blank(v)) {
        if (spec.required || spec.min > 0 && spec.type === 'list') errors[path] = 'This field is required.';
        continue;
      }
      switch (spec.type) {
        case 'text':
          if (typeof v !== 'string' || spec.required && !v.trim() || v.length > spec.max) errors[path] = `Expected text, maximum ${spec.max} characters.`;
          break;
        case 'email':
          if (typeof v !== 'string' || v.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v)) errors[path] = 'A valid email address is required.';
          break;
        case 'url': if (!validUrl(v)) errors[path] = 'Use a valid HTTP(S), local or section URL.'; break;
        case 'slug': if (typeof v !== 'string' || v.length > 200 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)) errors[path] = 'Use a lowercase URL slug.'; break;
        case 'boolean': if (typeof v !== 'boolean') errors[path] = 'Expected true or false.'; break;
        case 'integer': if (!Number.isInteger(v) || v < spec.min || v > spec.max) errors[path] = 'Number is outside the allowed range.'; break;
        case 'enum': if (!spec.values.includes(v)) errors[path] = 'Choose an allowed value.'; break;
        case 'date': if (!validDate(v)) errors[path] = 'Use a valid YYYY-MM or YYYY-MM-DD date.'; break;
        case 'list':
          if (!Array.isArray(v) || v.length < spec.min || v.length > 200) { errors[path] = `Expected ${spec.min} to 200 items.`; break; }
          for (const [index, item] of v.entries()) await object(components[spec.component], item, `${path}.${index}`);
          break;
        case 'media': {
          const file = resolvers.media && await resolvers.media(v);
          if (!file || spec.kind === 'image' && !file.mime?.startsWith('image/')) errors[path] = `An existing ${spec.kind} is required.`;
          break;
        }
        case 'skillGroup':
          if (!resolvers.skillGroup || !await resolvers.skillGroup(v)) errors[path] = 'An existing Skill Groups entry is required.';
          break;
      }
    }
  }
  await object(template.fields, payload, 'data');
  if (templateKey === 'experience') {
    if (payload?.current === true && !blank(payload.endDate)) errors['data.endDate'] = 'Clear end date for a current position.';
    if (payload?.current === false && blank(payload.endDate)) errors['data.endDate'] = 'End date is required.';
  }
  if (['experience', 'education'].includes(templateKey) && payload?.startDate && payload?.endDate && payload.endDate < payload.startDate) errors['data.endDate'] = 'End date cannot precede start date.';
  if (templateKey === 'education') {
    if (blank(payload?.completionYear) && (!payload?.startDate || !payload?.endDate)) errors['data.completionYear'] = 'Provide a completion year or a full date range.';
    if (!blank(payload?.completionYear) && (payload?.startDate || payload?.endDate)) errors['data.completionYear'] = 'Use a completion year or date range, not both.';
  }
  if (templateKey === 'section-settings' && Array.isArray(payload?.sections)) {
    const keys = payload.sections.map(s => s.key);
    if (new Set(keys).size !== keys.length) errors['data.sections'] = 'Section keys must be unique.';
  }
  if (Object.keys(errors).length) throw new ContentValidationError(errors);
  return payload;
}

function validateCategory(data) {
  const fields = {};
  if (typeof data.name !== 'string' || !data.name.trim() || data.name.length > 100) fields.name = 'Category name is required (up to 100 characters).';
  if (typeof data.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug) || data.slug.length > 100) fields.slug = 'A stable lowercase slug is required.';
  const template = templates[data.templateKey];
  if (!template) fields.templateKey = 'Choose a registered template.';
  if (template && data.cardinality !== template.cardinality) fields.cardinality = `This template requires ${template.cardinality} entries.`;
  if (!Number.isInteger(data.displayOrder) || data.displayOrder < 0) fields.displayOrder = 'A nonnegative integer is required.';
  if (typeof data.visible !== 'boolean') fields.visible = 'Expected true or false.';
  if (Object.keys(fields).length) throw new ContentValidationError(fields);
  return data;
}
function getFormMetadata() { return JSON.parse(JSON.stringify({ version: 1, templates, components })); }
module.exports = { templates, components, validatePayload, validateCategory, getFormMetadata, ContentValidationError };
