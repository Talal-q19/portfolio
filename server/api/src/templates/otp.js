function createOtpEmailTemplate({ code, purpose }) {
  // Codes are generated server-side; still restrict interpolation to six digits.
  if (!/^\d{6}$/.test(String(code))) throw new TypeError('Expected a six-digit verification code.');
  const login = purpose === 'login';
  const heading = login ? 'Your studio is one step away.' : 'A fresh start for your studio.';
  const action = login ? 'sign in to Portfolio Studio' : 'reset your Portfolio Studio password';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Portfolio Studio verification</title></head>
<body style="margin:0;padding:0;background:#0f1014;color:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">Your ${login ? 'sign-in' : 'password reset'} code expires in 5 minutes.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0f1014;"><tr><td align="center" style="padding:48px 20px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;">
<tr><td style="padding:0 0 24px;color:#9bb5ff;font-size:22px;font-weight:bold;">tq.<span style="font-size:12px;letter-spacing:2px;color:#afb1bd;"> &nbsp; PORTFOLIO STUDIO</span></td></tr>
<tr><td style="background:#1b1c23;border:1px solid #353744;border-radius:18px;padding:36px 28px;">
<p style="margin:0 0 20px;color:#b29aff;font-size:10px;letter-spacing:2px;">${login ? 'SIGN-IN VERIFICATION' : 'PASSWORD RECOVERY'}</p>
<h1 style="margin:0 0 18px;font-size:30px;line-height:1.2;letter-spacing:-1px;color:#f4f4f7;">${heading}</h1>
<p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#afb1bd;">Use the code below to ${action}.</p>
<div style="padding:24px 12px;background:#121319;border:1px solid #353744;border-radius:12px;text-align:center;font-family:Consolas,monospace;font-size:36px;font-weight:bold;letter-spacing:8px;color:#9bb5ff;">${code}</div>
<p style="margin:20px 0 0;font-size:13px;line-height:1.7;color:#afb1bd;">This code expires in <strong style="color:#f4f4f7;">5 minutes</strong> and can only be used once. Keep it private.</p>
</td></tr>
<tr><td style="padding:24px 8px;font-size:12px;line-height:1.8;color:#afb1bd;">If you didn’t request this code, you can ignore this email. Your account stays secure.<br><span style="color:#9bb5ff;">Talal Qasim</span> &nbsp; / &nbsp; Portfolio Studio</td></tr>
</table></td></tr></table></body></html>`;
}
module.exports = { createOtpEmailTemplate };
