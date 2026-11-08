'use client';

import { useState } from 'react';
import { FiLayers, FiPlus, FiArrowRight } from 'react-icons/fi';
import EntryCards, { PublicationBadge } from './entry-cards';
import AssignSkill from './assign-skill';

export default function SkillsWorkspace({ model, publishedIds, busy, onEdit, onAction, initialGroup = '' }) {
  const [selected, setSelected] = useState(initialGroup);
  const [search, setSearch] = useState('');
  const skillCategory = model.categories.find(c => c.templateKey === 'skills');
  const groupCategory = model.categories.find(c => c.templateKey === 'skill-groups');
  const groups = model.items.filter(i => model.categories.find(c => c.slug === i.category)?.templateKey === 'skill-groups');
  const skills = model.items.filter(i => model.categories.find(c => c.slug === i.category)?.templateKey === 'skills');
  const group = groups.find(g => g.documentId === selected);
  const unassigned = skills.filter(s => !groups.some(g => g.documentId === s.data.skillGroup));
  const members = selected === 'unassigned' ? unassigned : group ? skills.filter(s => s.data.skillGroup === selected) : skills;
  const filtered = members.filter(s => s.data.name.toLowerCase().includes(search.toLowerCase()));
  const addSkill = () => onEdit(null, skillCategory?.slug, group ? { skillGroup: group.documentId } : {});
  return <>
    <div className="admin-workflow-note"><FiLayers aria-hidden="true" /><div><strong>A place for every skill.</strong><p>Groups organize your skills on the portfolio. Choose a group to see its skills, add new ones, or edit the group.</p></div><button disabled={busy || !groupCategory} onClick={() => onEdit(null, groupCategory.slug)}><FiPlus aria-hidden="true" /> New group</button></div>
    <div className="admin-skills-layout"><section className="admin-panel admin-group-browser" aria-label="Skill groups"><div className="admin-heading"><h2>Groups</h2><span className="admin-badge">{groups.length}</span></div>
      <button className={`admin-group-option ${!selected ? 'selected' : ''}`} aria-pressed={!selected} onClick={() => setSelected('')}><span>All skills</span><span>{skills.length}</span></button>
      {groups.map(g => <button className={`admin-group-option ${selected === g.documentId ? 'selected' : ''}`} key={g.documentId} aria-pressed={selected === g.documentId} onClick={() => setSelected(g.documentId)}><span><strong>{g.data.name}</strong><small>{publishedIds.has(g.documentId) ? 'Published group' : 'Draft group'}</small></span><span>{skills.filter(s => s.data.skillGroup === g.documentId).length}</span></button>)}
      {unassigned.length > 0 && <button className={`admin-group-option ${selected === 'unassigned' ? 'selected' : ''}`} aria-pressed={selected === 'unassigned'} onClick={() => setSelected('unassigned')}><span>Needs a group</span><span>{unassigned.length}</span></button>}
      {!groups.length && <p className="admin-muted">Start with a group such as Backend or Design, then add the skills that belong in it.</p>}
    </section><section className="admin-panel admin-skills-content"><div className="admin-heading"><div><p className="admin-eyebrow">YOUR TOOLKIT</p><h2>{group?.data.name || (selected === 'unassigned' ? 'Skills needing a group' : 'All skills')}</h2><p className="admin-muted">{group?.data.description || 'Manage your skills and choose where they belong.'}</p></div>{skillCategory && <button className="admin-primary" disabled={busy || !groups.length} onClick={addSkill}><FiPlus aria-hidden="true" /> Add skill{group ? ' to group' : ''}</button>}</div>
      {group && <div className="admin-group-context"><PublicationBadge live={publishedIds.has(group.documentId)} /><span>{members.length} {members.length === 1 ? 'skill' : 'skills'} in this group</span><button disabled={busy} onClick={() => onEdit(group)}>Edit group <FiArrowRight aria-hidden="true" /></button></div>}
      {group && !publishedIds.has(group.documentId) && <p className="admin-note">This group is a draft. Publish the group and its skills when you’re ready to show them on your portfolio.</p>}
      {group && <AssignSkill group={group} skills={skills} groups={groups} busy={busy} onEdit={onEdit} />}
      <label className="sr-only" htmlFor="skill-search">Search skills</label><input id="skill-search" type="search" placeholder="Search skills by name…" value={search} onChange={e => setSearch(e.target.value)} />
      <EntryCards items={filtered} relatedItems={model.items} categories={model.categories} publishedIds={publishedIds} busy={busy} onEdit={onEdit} onAction={onAction} emptyAction={groups.length && skillCategory ? <button disabled={busy} onClick={addSkill}>+ Add a skill{group ? ` to ${group.data.name}` : ''}</button> : groupCategory ? <button disabled={busy} onClick={() => onEdit(null, groupCategory.slug)}>+ Create your first group</button> : null} />
    </section></div>
  </>;
}
