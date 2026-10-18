function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createEmailTemplate({ name, email, message }) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br />');

  return `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      New message from ${safeName} via your portfolio contact form.
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0;padding:0;background-color:#050505;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;border-collapse:collapse;">
            <!-- Outer Card -->
            <tr>
              <td style="background-color:#0a0a0a;border:1px solid #262626;border-radius:16px;overflow:hidden;">
                
                <!-- Glowing Top Border Bar -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td height="4" style="background:linear-gradient(to right, #E2E8F0, #94A3B8);line-height:4px;font-size:0px;">&nbsp;</td>
                  </tr>
                </table>

                <!-- Header Info -->
                <div style="padding:32px 32px 24px 32px;border-bottom:1px solid #262626;">
                  <div style="font-family:'Courier New',Courier,monospace,sans-serif;font-size:11px;font-weight:bold;letter-spacing:0.25em;text-transform:uppercase;color:#E2E8F0;margin-bottom:8px;">
                    // PORTFOLIO CONTACT SYSTEM
                  </div>
                  <h1 style="font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:1.3;font-weight:bold;color:#f4f1e8;margin:0 0 8px 0;letter-spacing:-0.02em;">
                    Inquiry from ${safeName}
                  </h1>
                  <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#a8b4c3;margin:0;">
                    A visitor left a message on your personal portfolio website.
                  </p>
                </div>

                <!-- Form Fields -->
                <div style="padding:32px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                    <!-- Sender Row -->
                    <tr>
                      <td style="padding:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;">
                        <div style="font-size:11px;font-weight:bold;color:#a8b4c3;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:6px;">
                          Sender Name
                        </div>
                        <div style="font-size:16px;line-height:1.5;color:#ffffff;font-weight:bold;">
                          ${safeName}
                        </div>
                      </td>
                    </tr>

                    <!-- Email Row -->
                    <tr>
                      <td style="padding:0 0 24px 0;font-family:Arial,Helvetica,sans-serif;">
                        <div style="font-size:11px;font-weight:bold;color:#a8b4c3;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:6px;">
                          Email Address
                        </div>
                        <div>
                          <a href="mailto:${safeEmail}" style="font-size:16px;line-height:1.5;color:#E2E8F0;text-decoration:none;font-weight:bold;word-break:break-all;border-bottom:1px dashed rgba(226,232,240,0.4);padding-bottom:1px;">
                            ${safeEmail}
                          </a>
                        </div>
                      </td>
                    </tr>

                    <!-- Message Row -->
                    <tr>
                      <td style="padding:0 0 28px 0;font-family:Arial,Helvetica,sans-serif;">
                        <div style="font-size:11px;font-weight:bold;color:#a8b4c3;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:8px;">
                          Message Content
                        </div>
                        <div style="background-color:#101010;border:1px solid #262626;border-left:4px solid #E2E8F0;border-radius:8px;padding:20px;font-size:15px;line-height:1.7;color:#e5e7eb;font-family:Arial,Helvetica,sans-serif;white-space:normal;">
                          ${safeMessage}
                        </div>
                      </td>
                    </tr>

                    <!-- Reply Action Button -->
                    <tr>
                      <td align="left" style="font-family:Arial,Helvetica,sans-serif;">
                        <a href="mailto:${safeEmail}" style="display:inline-block;background:linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #CBD5E1 100%);color:#050505;text-decoration:none;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.12em;padding:14px 28px;border-radius:999px;box-shadow:0 4px 12px rgba(226,232,240,0.15);">
                          Quick Reply
                        </a>
                      </td>
                    </tr>
                  </table>
                </div>

              </td>
            </tr>

            <!-- Footer Note -->
            <tr>
              <td style="padding:24px 8px 0 8px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:#555555;letter-spacing:0.02em;">
                This email was auto-generated and securely delivered via the contact form on your portfolio website.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}


module.exports = { createEmailTemplate };
