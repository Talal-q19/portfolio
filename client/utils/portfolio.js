import { mediaUrl } from './media-url.mjs';

export function portfolioData(envelope, mediaOrigin) {
  const groups = envelope.categories;
  const items = key => groups.filter(c => c.templateKey === key).flatMap(c => c.items);
  const first = key => items(key)[0]?.data;
  const rawSettings = first('site-settings');
  const settings = rawSettings ? { ...rawSettings, profileImage: { ...rawSettings.profileImage, url: mediaUrl(rawSettings.profileImage?.url, mediaOrigin) } } : null;
  const hero = first('hero');
  const sections = first('section-settings')?.sections || [];
  const textList = values => (values || []).map(v => v.text);
  const media = value => mediaUrl(value?.url || '', mediaOrigin);
  const social = Object.fromEntries((settings?.socialLinks || []).map(s => [s.label, s.url]));
  const personalData = settings ? { name: settings.displayName, profile: media(settings.profileImage), description: hero?.paragraph || settings.aboutText, email: settings.contactEmail, phone: settings.phone, address: settings.location, resume: media(settings.cv) || '#contact', ...social } : null;
  return { settings, hero, sections, personalData,
    experiences: items('experience').map(e => ({ id: e.documentId, ...e.data, image: media(e.data.image), duration: e.data.durationLabel || `${e.data.startDate} - ${e.data.current ? 'Present' : e.data.endDate}`, highlights: textList(e.data.highlights).length ? textList(e.data.highlights) : [e.data.description] })),
    educations: items('education').map(e => ({ id: e.documentId, ...e.data, title: e.data.qualification, image: media(e.data.image), duration: e.data.durationLabel || (e.data.completionYear ? `Completed ${e.data.completionYear}` : `${e.data.startDate} - ${e.data.endDate}`), details: textList(e.data.details) })),
    projectsData: items('projects').map(e => ({ id: e.documentId, ...e.data, status: e.data.projectStatus, statusType: e.data.projectStatus.toLowerCase().replaceAll(' ', '-'), images: e.data.gallery.map(g => media(g.image)), gallery: e.data.gallery, techStack: textList(e.data.technologies), details: textList(e.data.details), code: e.data.sourceUrl, demo: e.data.demoUrl })),
    skillCategories: items('skill-groups').map(e => ({ id: e.documentId, title: e.data.name, ...e.data, skills: items('skills').filter(s => s.data.skillGroup === e.documentId).map(s => ({ id: s.documentId, name: s.data.name, icon: media(s.data.icon) })) })),
  };
}
