'use client';

import { useState } from 'react';
import { FiPlus, FiLayers } from 'react-icons/fi';

export default function SkillGroupPicker({ groups, value, onChange, onCreate, onDirty, inputProps }) {
  const [creating, setCreating] = useState(false);
  const [data, setData] = useState({ name: '', eyebrow: '', description: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  async function create() {
    setErrors({}); setMessage('');
    try { const group = await onCreate(data); onChange(group.documentId); setCreating(false); setData({ name: '', eyebrow: '', description: '' }); }
    catch (e) { setErrors(e.fields || {}); setMessage(e.message); }
  }
  return <><div className="admin-relation-select"><select {...inputProps} value={value || ''} onChange={e => onChange(e.target.value)}><option value="">Choose a skill group</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select>{onCreate && <button type="button" disabled={inputProps.disabled} aria-expanded={creating} onClick={() => setCreating(!creating)}><FiPlus aria-hidden="true" /> New group</button>}</div><small className="admin-field-help">Choose where this skill appears. Change the group here to move the skill.</small>
    {creating && <fieldset className="admin-inline-create"><legend><FiLayers aria-hidden="true" /> Create a group here</legend><p className="admin-muted">Your skill stays open. The new group is saved as a draft and selected automatically.</p>{[{ key: 'name', label: 'Group name', placeholder: 'e.g. Backend', max: 100 }, { key: 'eyebrow', label: 'Short label', placeholder: 'e.g. Reliable foundations', max: 200 }, { key: 'description', label: 'Description', placeholder: 'What brings these skills together?', max: 2000 }].map(f => <div className="admin-field" key={f.key}><label htmlFor={`new-group-${f.key}`}>{f.label} *</label>{f.key === 'description' ? <textarea id={`new-group-${f.key}`} rows={3} maxLength={f.max} disabled={inputProps.disabled} value={data[f.key]} placeholder={f.placeholder} aria-invalid={Boolean(errors[`data.${f.key}`])} aria-describedby={errors[`data.${f.key}`] ? `new-group-${f.key}-error` : undefined} onChange={e => { onDirty?.(); setData({ ...data, [f.key]: e.target.value }); }} /> : <input id={`new-group-${f.key}`} type="text" maxLength={f.max} disabled={inputProps.disabled} value={data[f.key]} placeholder={f.placeholder} aria-invalid={Boolean(errors[`data.${f.key}`])} aria-describedby={errors[`data.${f.key}`] ? `new-group-${f.key}-error` : undefined} onChange={e => { onDirty?.(); setData({ ...data, [f.key]: e.target.value }); }} />}{errors[`data.${f.key}`] && <p className="admin-field-error" id={`new-group-${f.key}-error`}>{errors[`data.${f.key}`]}</p>}</div>)}{message && <p role="alert" className="admin-field-error">{message}</p>}<div className="admin-actions"><button type="button" className="admin-primary" disabled={inputProps.disabled} onClick={create}>Create & select group</button><button type="button" disabled={inputProps.disabled} onClick={() => setCreating(false)}>Cancel</button></div></fieldset>}
  </>;
}
