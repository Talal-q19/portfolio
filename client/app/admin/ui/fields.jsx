'use client';

import { emptyFields, moveItem } from '@/utils/admin-api.mjs';
import { mediaUrl } from '@/utils/media-url.mjs';
import { useRef, useState } from 'react';

export const labelFor = key => key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase());

export default function Fields({ fields, value, onChange, components, errors, media, groups, upload, pending, prefix = 'data', templateKey }) {
  const cvInput = useRef(null);
  const [datePrecision, setDatePrecision] = useState({});
  return <div className="admin-fields">{Object.entries(fields).filter(([key]) => templateKey !== 'hero-cv-button' || key !== 'url').map(([key, spec]) => {
    const path = `${prefix}.${key}`;
    const id = `field-${path}`;
    const error = errors[path];
    const set = next => onChange({ ...value, [key]: next, ...(templateKey === 'experience' && key === 'current' && next ? { endDate: '' } : {}) });
    const required = spec.required || spec.type === 'list' && spec.min > 0 || templateKey === 'experience' && key === 'endDate' && value.current === false;
    const title = key === 'seoTitle' ? 'Search result title' : key === 'seoDescription' ? 'Search result description' : key === 'demoUrl' ? 'Live project link' : key === 'sourceUrl' ? 'Source code link' : key === 'slug' ? 'Project URL name' : key === 'eyebrow' ? 'Small heading label' : key === 'cv' ? 'CV / resume' : templateKey === 'hero' && key === 'heading' ? 'Main headline' : templateKey === 'hero' && key === 'paragraph' ? 'Introduction text' : templateKey === 'hero' && key === 'role' ? 'Subtitle below your headline' : templateKey === 'hero' && key === 'designation' ? 'Job title on the back of your portrait' : key === 'current' ? 'Present position' : key === 'alt' ? 'Alt text' : prefix.includes('technologies') && key === 'text' ? 'Technology' : labelFor(key);
    const props = { id, 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${id}-error` : undefined, required, disabled: pending };
    let control;
    if (spec.type === 'list') {
      const rows = value[key] || [];
      const itemName = ({ technologies: 'Technology', details: 'Detail', highlights: 'Highlight', gallery: 'Image', buttons: 'Button', socialLinks: 'Social link' })[key] || labelFor(spec.component);
      control = <fieldset className="admin-repeat" aria-describedby={error ? `${id}-error` : undefined}>
        <legend>{title}{required && ' *'}</legend>
        {rows.length === 0 && <p className="admin-muted">No items yet.{spec.min > 0 && ` Add at least ${spec.min}.`}</p>}
        {rows.map((row, index) => <div className="admin-repeat-row" key={index}>
          <div className="admin-row-head"><strong>{itemName} {index + 1}</strong><div className="admin-actions">
            <button type="button" disabled={pending || index === 0} aria-label={`Move ${title} item ${index + 1} up`} onClick={() => set(moveItem(rows, index, -1))}>↑</button>
            <button type="button" disabled={pending || index === rows.length - 1} aria-label={`Move ${title} item ${index + 1} down`} onClick={() => set(moveItem(rows, index, 1))}>↓</button>
            <button type="button" disabled={pending} onClick={() => set(rows.filter((_, i) => i !== index))}>Remove<span className="sr-only"> {title} item {index + 1}</span></button>
          </div></div>
          {templateKey === 'hero' && key === 'buttons' && index === 2 && <p className="admin-muted">This button downloads the CV uploaded above. Its link is managed automatically.</p>}
          <Fields templateKey={templateKey === 'hero' && key === 'buttons' && index === 2 ? 'hero-cv-button' : undefined} fields={components[spec.component]} value={row} onChange={next => set(rows.map((r, i) => i === index ? next : r))} {...{ components, errors, media, groups, upload, pending }} prefix={`${path}.${index}`} />
        </div>)}
        <button type="button" disabled={pending || rows.length >= 200} onClick={() => set([...rows, { ...emptyFields(components[spec.component]), ...(templateKey === 'hero' && key === 'buttons' && rows.length === 2 ? { label: 'Get CV', url: '#contact' } : {}) }])}>+ Add {itemName}</button>
      </fieldset>;
    } else if (spec.type === 'boolean') {
      control = <label className="admin-check" htmlFor={id}><input {...props} required={false} type="checkbox" checked={value[key] === true} onChange={e => set(e.target.checked)} />{title}{required && ' *'}</label>;
    } else if (spec.type === 'media') {
      const selected = media.find(m => m.id === Number(value[key]?.id || value[key])) || (value[key]?.url ? value[key] : null);
      const choices = media.filter(m => key === 'cv' ? m.mime === 'application/pdf' : spec.kind !== 'image' || m.mime?.startsWith('image/'));
      control = <><label htmlFor={id}>{title}{required && ' *'}</label>
        {selected?.mime?.startsWith('image/') && /* CMS/library images have dynamic dimensions. */
          // eslint-disable-next-line @next/next/no-img-element
          <img className="admin-preview-image" src={mediaUrl(selected.url)} alt={selected.alternativeText || selected.name || 'Selected media'} />}
        {selected && !selected.mime?.startsWith('image/') && <p className="admin-selected-file"><strong>{selected.name || 'Current file'}</strong><a href={mediaUrl(selected.url)} target="_blank" rel="noreferrer">Open file ↗</a></p>}
        <select {...props} value={value[key]?.id || value[key] || ''} onChange={e => set(e.target.value ? Number(e.target.value) : null)}><option value="">{key === 'cv' ? 'No CV selected' : `Select ${spec.kind}`}</option>{choices.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
        {key === 'cv' ? <div className="admin-cv-upload">
          <button type="button" className="admin-primary" disabled={pending} aria-describedby={`${id}-upload-help`} onClick={() => cvInput.current?.click()}>{pending ? 'Please wait…' : selected ? 'Update CV' : 'Upload CV'}</button>
          <p id={`${id}-upload-help`} className="admin-muted">Choose a PDF up to 8 MiB. Save your changes, then publish to update the website.</p>
        </div> : <label className="admin-upload" htmlFor={`${id}-upload`}>Or upload {spec.kind} (maximum 8 MiB)</label>}
        <input ref={key === 'cv' ? cvInput : undefined} hidden={key === 'cv'} id={`${id}-upload`} type="file" disabled={pending} accept={key === 'cv' ? 'application/pdf' : spec.kind === 'image' ? 'image/png,image/jpeg,image/gif,image/webp' : 'image/png,image/jpeg,image/gif,image/webp,application/pdf'} onChange={async e => {
          const file = e.target.files[0]; e.target.value = '';
          if (file) { const result = await upload(file, path, key === 'cv' ? 'application/pdf' : null); if (result) set(result.id); }
        }} />
      </>;
    } else if (spec.type === 'enum' || spec.type === 'skillGroup') {
      const options = spec.type === 'enum' ? spec.values.map(v => ({ id: v, name: v })) : groups;
      control = <><label htmlFor={id}>{title}{required && ' *'}</label><select {...props} value={value[key] || ''} onChange={e => set(e.target.value)}><option value="">Select {title.toLowerCase()}</option>{options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></>;
    } else {
      const long = spec.type === 'text' && spec.max > 500 && !prefix.includes('technologies');
      const disabled = pending || templateKey === 'experience' && key === 'endDate' && value.current === true;
      const inputProps = { ...props, disabled, value: value[key] ?? '', maxLength: spec.max, onChange: e => set(spec.type === 'integer' && e.target.value !== '' ? Number(e.target.value) : e.target.value) };
      const precision = datePrecision[key] || (String(value[key] || '').length === 10 ? 'date' : 'month');
      control = <><label htmlFor={id}>{title}{required && ' *'}</label>{long ? <textarea {...inputProps} rows={4} /> : <input {...inputProps} type={spec.type === 'integer' ? 'number' : spec.type === 'email' ? 'email' : spec.type === 'date' ? precision : 'text'} min={spec.min} max={spec.type === 'integer' ? spec.max : undefined} list={prefix.includes('technologies') ? 'admin-technologies' : undefined} />}
        {spec.type === 'date' && <small className="admin-muted">{precision === 'month' ? 'Month and year' : 'Exact date'} <button type="button" disabled={disabled} onClick={() => {
          const next = precision === 'date' ? 'month' : 'date';
          setDatePrecision(previous => ({ ...previous, [key]: next }));
          set(next === 'month' ? String(value[key] || '').slice(0, 7) : '');
        }}>Use {precision === 'month' ? 'exact date' : 'month and year'}</button></small>}
      </>;
    }
    return <div className={`admin-field ${spec.type === 'list' ? 'admin-full' : ''}`} key={key}>{control}{error && <p id={`${id}-error`} className="admin-field-error">{error}</p>}</div>;
  })}{prefix === 'data' && <datalist id="admin-technologies">{['React', 'Next.js', 'Node.js', 'Express', 'Strapi', 'PostgreSQL', 'Docker', 'TypeScript', 'JavaScript', 'Python'].map(t => <option key={t} value={t} />)}</datalist>}</div>;
}
