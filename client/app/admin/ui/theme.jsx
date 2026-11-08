'use client';

import { createContext, useContext, useSyncExternalStore } from 'react';
import { FiMoon, FiSun } from 'react-icons/fi';

const AdminThemeContext = createContext(null);
const storageKey = 'portfolio-admin-theme';
const changeEvent = 'admin-theme-change';
let memoryTheme = 'light';
let storageUnavailable = false;

function snapshot() {
  if (storageUnavailable) return memoryTheme;
  try { return localStorage.getItem(storageKey) === 'dark' ? 'dark' : 'light'; }
  catch { return memoryTheme; }
}
function subscribe(notify) {
  const sync = event => { if (event.key === storageKey || event.key === null) notify(); };
  window.addEventListener('storage', sync);
  window.addEventListener(changeEvent, notify);
  return () => {
    window.removeEventListener('storage', sync);
    window.removeEventListener(changeEvent, notify);
  };
}

export function AdminThemeProvider({ children }) {
  const theme = useSyncExternalStore(subscribe, snapshot, () => 'light');
  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light';
    memoryTheme = next;
    try { localStorage.setItem(storageKey, next); } catch { storageUnavailable = true; }
    window.dispatchEvent(new Event(changeEvent));
  }
  return <AdminThemeContext.Provider value={{ theme, toggle }}><div className="admin-appearance" data-admin-theme={theme}>{children}</div></AdminThemeContext.Provider>;
}

export function AdminThemeToggle() {
  const appearance = useContext(AdminThemeContext);
  if (!appearance) return null;
  const dark = appearance.theme === 'dark';
  return <button type="button" className="admin-theme-toggle" aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`} title={`Switch to ${dark ? 'light' : 'dark'} theme`} onClick={appearance.toggle}>{dark ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}<span>{dark ? 'Light' : 'Dark'} mode</span></button>;
}
