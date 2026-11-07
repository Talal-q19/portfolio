'use client';
import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { createAdminApi } from '@/utils/admin-api.mjs';
const Threads = dynamic(() => import('../../components/public/effects/Threads'), { ssr: false });
const api = createAdminApi();
export function AdminLogin({ onSuccess }) {
  const pending = useRef(false);
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
  const [attempts, setAttempts] = useState(null);
  const otp = step === 'login-otp' || step === 'reset-otp';
  function restart(next) { setStep(next); setError(''); setNotice(''); setAttempts(null); setPassword(''); setConfirm(''); setCode(''); setChallenge(''); setResetToken(''); }
  async function submit(event, verificationCode = code) {
    event?.preventDefault();
    if (pending.current || (otp && (verificationCode.length !== 6 || attempts?.blocked))) return;
    pending.current = true; setBusy(true); setError(''); setNotice('');
    try {
      if (step === 'login') {
        const result = await api('auth/login', { method: 'POST', body: { username, password } });
        setAttempts(null); setChallenge(result.challengeId); setPassword(''); setStep('login-otp'); setNotice('Check your admin email. The code expires in 5 minutes.');
      } else if (step === 'login-otp') {
        await api('auth/login/verify', { method: 'POST', body: { challengeId: challenge, code: verificationCode } }); onSuccess();
      } else if (step === 'forgot') {
        const result = await api('auth/forgot-password', { method: 'POST', body: { email } });
        setAttempts(null); setChallenge(result.challengeId); setStep('reset-otp'); setNotice(result.message + ' The code expires in 5 minutes.');
      } else if (step === 'reset-otp') {
        const result = await api('auth/forgot-password/verify', { method: 'POST', body: { challengeId: challenge, code: verificationCode } });
        setAttempts(null); setResetToken(result.resetToken); setCode(''); setStep('password');
      } else {
        if (password !== confirm) throw new Error('Passwords must match.');
        await api('auth/reset-password', { method: 'POST', body: { resetToken, password } });
        restart('login'); setNotice('Password changed. Sign in with your new password.');
      }
    } catch (e) { setError(e.message); setAttempts(e.attempts || null); if (otp) { setCode(''); codeInput.current?.focus(); } }
    finally { pending.current = false; setBusy(false); }
  }
  const codeInput = useRef(null);
  function updateCode(event) {
    const next = event.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(next); setError('');
    if (next.length === 6) void submit(null, next);
  }
  return <section className="admin-auth-layout" aria-label="Administrator authentication">
    <div className="admin-auth-left">
      <Link href="/" className="admin-auth-brand"><span className="admin-auth-monogram">tq.</span><span>Talal Qasim<small>PORTFOLIO STUDIO</small></span></Link>
      <div className="admin-auth">
        <p className="admin-auth-step">{otp ? '02 / VERIFY YOUR IDENTITY' : step === 'login' ? '01 / YOUR WORKSPACE' : 'ACCOUNT RECOVERY'}</p>
        <h1>{otp ? 'Check your email' : step === 'forgot' ? 'Forgot your password?' : step === 'password' ? 'A fresh start' : 'Welcome back.'}</h1>
        <p className="admin-muted">{step === 'login' ? 'Your next update starts here. Sign in to your studio.' : otp ? 'A little extra security. Enter the code sent to your admin email.' : step === 'password' ? 'Use at least 8 characters. This signs out all existing sessions.' : 'We’ll email a verification code to your admin address.'}</p>
        <form onSubmit={submit} aria-busy={busy}>
          <fieldset className="admin-auth-fields" disabled={busy}>
            {step === 'login' && <label>Username<input autoFocus autoComplete="username" required maxLength={80} value={username} onChange={e => setUsername(e.target.value)} /></label>}
            {step === 'forgot' && <label>Admin email<input autoFocus type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /></label>}
            {(step === 'login' || step === 'password') && <label>{step === 'password' ? 'New password' : 'Password'}<input type="password" autoComplete={step === 'password' ? 'new-password' : 'current-password'} required minLength={step === 'password' ? 8 : undefined} maxLength={256} value={password} onChange={e => setPassword(e.target.value)} /></label>}
            {step === 'password' && <label>Confirm password<input type="password" autoComplete="new-password" required minLength={8} maxLength={256} value={confirm} onChange={e => setConfirm(e.target.value)} /></label>}
          </fieldset>
          {otp && <div className="admin-otp">
            <label htmlFor="admin-otp">Verification code</label>
            <div className="admin-otp-control">
              <input ref={codeInput} id="admin-otp" key={challenge} autoFocus type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} readOnly={busy} disabled={attempts?.blocked} aria-invalid={Boolean(error)} aria-describedby="admin-otp-help admin-auth-feedback" onChange={updateCode} />
              <div className="admin-otp-slots" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <span key={index} className={index === code.length ? 'is-current' : ''}>{code[index] || '·'}</span>)}</div>
            </div>
            <p id="admin-otp-help" className="admin-muted">{busy ? 'Verifying your code…' : 'Verification starts automatically after the sixth digit.'}</p>
          </div>}
          <div id="admin-auth-feedback" aria-live="polite">
            {error && <p role="alert" className="admin-note">{error}</p>}{notice && <p role="status" className="admin-note">{notice}</p>}
            {attempts && <p className="admin-note">{attempts.kind === 'password' ? 'Password' : 'OTP'} failed attempts: <strong>{attempts.failed}/{attempts.limit}</strong>{attempts.blocked ? ' — Account temporarily blocked.' : ''}</p>}
          </div>
          {!otp && <button className="admin-primary" disabled={busy}>{busy ? 'Please wait…' : step === 'password' ? 'Change password' : step === 'forgot' ? 'Send code' : 'Sign in →'}</button>}
          <button className="admin-auth-back" type="button" disabled={busy} onClick={() => restart(step === 'login' ? 'forgot' : 'login')}>{step === 'login' ? 'Forgot password?' : 'Back to sign in'}</button>
          {otp && <p className="admin-muted">Code expired? Go back and request a new one.</p>}
        </form>
      </div>
      <div className="admin-auth-footer"><Link href="/">← Back to portfolio</Link><span>Private workspace</span></div>
    </div>
    <aside className="admin-auth-art" aria-label="Portfolio Studio">
      <div className="admin-auth-art-top"><span>DESIGNED TO EVOLVE</span><span>© {new Date().getFullYear()}</span></div>
      <div className="admin-auth-threads" aria-hidden="true"><Threads color="#9bb5ff" accentColor="#b29aff" amplitude={2} distance={0.45} speed={0.35} angle={-28} enableMouseInteraction /></div>
      <div className="admin-auth-art-copy"><p className="admin-eyebrow">THE SPACE BEHIND THE WORK</p><h2>Good work.<br /><span>Always evolving.</span></h2><p>Your ideas, projects, and stories.<br />One place to make them yours.</p></div>
      <div className="admin-auth-art-bottom"><span className="admin-auth-status" /> A little craft. A lot of possibility.</div>
    </aside>
  </section>;
}
