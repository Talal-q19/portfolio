'use client';
import { useEffect, useState } from 'react';
import { createAdminApi } from '@/utils/admin-api.mjs';
import AdminDashboard from './dashboard';
import { AdminLogin } from './login';
import './admin.css';

const api = createAdminApi();
export default function AdminSession({ preview }) {
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  useEffect(() => {
    if (preview) return;
    let active = true;
    api('auth/session').then(() => { if (active) setState('ready'); }).catch(e => {
      if (active) { setState('login'); if (e.status !== 401) setError(e.message); }
    });
    return () => { active = false; };
  }, [preview]);
  if (preview || state === 'ready') return <AdminDashboard preview={preview} onLogout={() => setState('login')} />;
  return <main className="admin-root admin-auth-page">{state === 'loading' ? <p role="status">Checking your session…</p> : <div className="admin-auth-shell">{error && <p className="admin-session-error" role="alert">{error}</p>}<AdminLogin onSuccess={() => { setError(''); setState('ready'); }} /></div>}</main>;
}
