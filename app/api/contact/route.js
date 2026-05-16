import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getRequiredEnv() {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const contactToEmail = process.env.CONTACT_TO_EMAIL || smtpUser;

  if (!smtpUser || !smtpPass || !contactToEmail) {
    return {
      error: 'SMTP_USER, SMTP_PASS, and CONTACT_TO_EMAIL must be configured.',
    };
  }

  return { smtpUser, smtpPass, contactToEmail };
}

function createTransporter(smtpUser, smtpPass) {
  const port = Number(process.env.SMTP_PORT || 465);
  const tlsRejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === 'true'
      : port === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: tlsRejectUnauthorized
        ? tlsRejectUnauthorized === 'true'
        : true,
    },
  });
}

function createEmailTemplate({ name, email, message }) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br />');

  return `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      New message from ${safeName} via your portfolio contact form.
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0;padding:0;background:#080b18;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:680px;margin:0 auto;border-collapse:collapse;">
            <tr>
              <td style="padding:0 0 16px 0;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#16f2b3;">
                  Portfolio Contact
                </div>
              </td>
            </tr>
            <tr>
              <td style="background:#0d1224;border:1px solid #1f2947;border-radius:18px;overflow:hidden;">
                <div style="padding:0;margin:0;">
                  <div style="background:linear-gradient(135deg,#16f2b3 0%,#14b8a6 45%,#0f172a 100%);padding:22px 28px;">
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.4;color:#06211d;text-transform:uppercase;letter-spacing:0.18em;font-weight:bold;">
                      New portfolio message
                    </div>
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:28px;line-height:1.2;color:#ffffff;font-weight:bold;margin-top:8px;">
                      ${safeName}
                    </div>
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.88);margin-top:8px;">
                      Someone reached out from your website contact form.
                    </div>
                  </div>
                </div>

                <div style="padding:28px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                    <tr>
                      <td style="padding:0 0 18px 0;font-family:Arial,Helvetica,sans-serif;">
                        <div style="font-size:12px;line-height:1.4;color:#94a3b8;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:6px;">
                          Sender
                        </div>
                        <div style="font-size:16px;line-height:1.6;color:#e2e8f0;font-weight:bold;">
                          ${safeName}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 0 18px 0;font-family:Arial,Helvetica,sans-serif;">
                        <div style="font-size:12px;line-height:1.4;color:#94a3b8;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:6px;">
                          Reply to
                        </div>
                        <a href="mailto:${safeEmail}" style="font-size:16px;line-height:1.6;color:#16f2b3;text-decoration:none;font-weight:bold;word-break:break-word;">
                          ${safeEmail}
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0;font-family:Arial,Helvetica,sans-serif;">
                        <div style="font-size:12px;line-height:1.4;color:#94a3b8;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:10px;">
                          Message
                        </div>
                        <div style="background:#080b18;border:1px solid #24304f;border-left:4px solid #16f2b3;border-radius:14px;padding:18px 18px 18px 16px;font-size:15px;line-height:1.8;color:#e5e7eb;white-space:normal;">
                          ${safeMessage}
                        </div>
                      </td>
                    </tr>
                  </table>

                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:24px;border-collapse:collapse;">
                    <tr>
                      <td align="left">
                        <a href="mailto:${safeEmail}" style="display:inline-block;background:#16f2b3;color:#08111f;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.04em;padding:12px 18px;border-radius:999px;">
                          Reply to ${safeName}
                        </a>
                      </td>
                    </tr>
                  </table>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 4px 0 4px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#64748b;">
                Delivered from your portfolio contact form. Keep this email for your records.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

export async function POST(request) {
  try {
    const env = getRequiredEnv();

    if (env.error) {
      return NextResponse.json(
        { success: false, message: env.error },
        { status: 500 }
      );
    }

    const body = await request.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const message = String(body.message || '').trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const transporter = createTransporter(env.smtpUser, env.smtpPass);
    const contactFromName = process.env.CONTACT_FROM_NAME || 'Portfolio Contact';
    const text = [
      `Name: ${name}`,
      `Email: ${email}`,
      '',
      'Message:',
      message,
    ].join('\n');

    await transporter.sendMail({
      from: `"${contactFromName}" <${env.smtpUser}>`,
      to: env.contactToEmail,
      replyTo: email,
      subject: `New portfolio contact from ${name}`,
      text,
      html: createEmailTemplate({ name, email, message }),
    });

    return NextResponse.json(
      { success: true, message: 'Message sent successfully!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact API error:', error);

    return NextResponse.json(
      { success: false, message: 'Failed to send message.' },
      { status: 500 }
    );
  }
}
