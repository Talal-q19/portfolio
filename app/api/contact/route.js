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
  return `
    <div style="font-family: Arial, sans-serif; color: #222; background: #f6f7fb; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 24px; border: 1px solid #e5e7eb;">
        <h2 style="margin: 0 0 16px; color: #111827;">New Portfolio Contact Message</h2>
        <p><strong>Your Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Your Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Your Message:</strong></p>
        <div style="white-space: pre-wrap; border-left: 4px solid #16f2b3; padding-left: 12px; color: #374151;">${escapeHtml(message)}</div>
      </div>
    </div>
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
      `Your Name: ${name}`,
      `Your Email: ${email}`,
      '',
      'Your Message:',
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
