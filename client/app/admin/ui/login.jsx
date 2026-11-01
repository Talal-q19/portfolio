'use client';
import { useState } from 'react';
import { createAdminApi } from '@/utils/admin-api.mjs';
const api = createAdminApi();
export function AdminLogin({ onSuccess }) {
  const [step, setStep] = useState('login');
  const [challenge, setChallenge] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const otp = step === 'login-otp' || step === 'reset-otp';
  function restart(next) { setStep(next); setError(''); setNotice(''); setPassword(''); setConfirm(''); setCode(''); setChallenge(''); setResetToken(''); }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      if (step === 'login') {
        const result = await api('auth/login', { method: 'POST', body: { username, password } });
        setChallenge(result.challengeId); setPassword(''); setStep('login-otp'); setNotice('Check your admin email. The code expires in 5 minutes.');
      } else if (step === 'login-otp') {
        await api('auth/login/verify', { method: 'POST', body: { challengeId: challenge, code } }); onSuccess();
      } else if (step === 'forgot') {
        const result = await api('auth/forgot-password', { method: 'POST', body: { email } });
        setChallenge(result.challengeId); setStep('reset-otp'); setNotice(result.message + ' The code expires in 5 minutes.');
      } else if (step === 'reset-otp') {
        const result = await api('auth/forgot-password/verify', { method: 'POST', body: { challengeId: challenge, code } });
        setResetToken(result.resetToken); setCode(''); setStep('password');
      } else {
        if (password !== confirm) throw new Error('Passwords must match.');
        await api('auth/reset-password', { method: 'POST', body: { resetToken, password } });
        restart('login'); setNotice('Password changed. Sign in with your new password.');
      }
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <section className="admin-panel admin-auth" aria-label="Administrator authentication">
    <p className="admin-eyebrow">PORTFOLIO STUDIO</p><h1>{otp ? 'Check your email' : step === 'forgot' ? 'Reset your password' : step === 'password' ? 'Choose a new password' : 'Welcome back'}</h1>
    <p className="admin-muted">{step === 'login' ? 'Sign in to manage your portfolio.' : otp ? 'Enter the six-digit verification code.' : step === 'password' ? 'Use at least 8 characters. This signs out all existing sessions.' : 'We’ll email a verification code to your admin address.'}</p>
    <form onSubmit={submit}>
      {step === 'login' && <label>Username<input autoFocus autoComplete="username" required maxLength={80} value={username} onChange={e => setUsername(e.target.value)} /></label>}
      {step === 'forgot' && <label>Admin email<input autoFocus type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /></label>}
      {(step === 'login' || step === 'password') && <label>{step === 'password' ? 'New password' : 'Password'}<input type="password" autoComplete={step === 'password' ? 'new-password' : 'current-password'} required minLength={step === 'password' ? 8 : undefined} maxLength={256} value={password} onChange={e => setPassword(e.target.value)} /></label>}
      {step === 'password' && <label>Confirm password<input type="password" autoComplete="new-password" required minLength={8} maxLength={256} value={confirm} onChange={e => setConfirm(e.target.value)} /></label>}
      {otp && <label>Verification code<input autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} /></label>}
      {error && <p role="alert" className="admin-note">{error}</p>}{notice && <p role="status" className="admin-note">{notice}</p>}
      <button className="admin-primary" disabled={busy}>{busy ? 'Please wait…' : otp ? 'Verify code' : step === 'password' ? 'Change password' : step === 'forgot' ? 'Send code' : 'Continue'}</button>
      <button type="button" disabled={busy} onClick={() => restart(step === 'login' ? 'forgot' : 'login')}>{step === 'login' ? 'Forgot password?' : 'Back to sign in'}</button>
      {otp && <p className="admin-muted">Code expired? Go back and request a new one.</p>}
    </form>
  </section>;
}

