'use client';

import { useId, useState } from 'react';

export default function AssignSkill({ group, skills, groups, busy, onEdit }) {
  const [selected, setSelected] = useState('');
  const id = useId();
  const available = skills.filter(s => s.data.skillGroup !== group.documentId);
  const skill = available.find(s => s.documentId === selected);
  if (!available.length) return null;
  return <details className="admin-assign-skill"><summary>Move an existing skill into this group</summary><p className="admin-muted">Choose a skill. You can review and save the move in its editor.</p><label htmlFor={id}>Existing skill</label><div className="admin-relation-select"><select id={id} disabled={busy} value={selected} onChange={e => setSelected(e.target.value)}><option value="">Choose a skill to move</option>{available.map(s => <option key={s.documentId} value={s.documentId}>{s.data.name} · {groups.find(g => g.documentId === s.data.skillGroup)?.data.name || 'No group'}</option>)}</select><button type="button" disabled={busy || !skill} onClick={() => onEdit(skill, skill.category, { skillGroup: group.documentId })}>Review move →</button></div></details>;
}
