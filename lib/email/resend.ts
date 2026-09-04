import { Resend } from "resend";

let resendClientInstance: Resend | null = null;

/**
 * Returns a singleton instance of the Resend email client.
 * Returns null if RESEND_API_KEY is not configured.
 */
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "[Resend] Missing RESEND_API_KEY. Transactional email dispatch will be simulated."
      );
    }
    return null;
  }

  if (resendClientInstance) {
    return resendClientInstance;
  }

  try {
    resendClientInstance = new Resend(apiKey);
    return resendClientInstance;
  } catch (error) {
    console.error("[Resend] Initialization failed:", error);
    return null;
  }
}

/**
 * Renders a structured, Quiet Luxury styled HTML email for transactional notifications.
 */
export function renderNotificationEmailHtml(params: {
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  userName?: string;
}): string {
  const { title, message, actionUrl, actionText = "View in Meridian", userName } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #111827; border: 1px solid #1f293d; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px; border-bottom: 1px solid #1f293d; background: linear-gradient(180deg, #162032 0%, #111827 100%);">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <span style="font-size: 18px; font-weight: 700; letter-spacing: -0.02em; color: #ffffff;">MERIDIAN</span>
                  </td>
                  <td align="right">
                    <span style="font-size: 12px; font-weight: 500; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Notification</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              ${userName ? `<p style="margin: 0 0 12px 0; font-size: 14px; color: #94a3b8;">Hi ${userName},</p>` : ""}
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #f8fafc; line-height: 1.4;">${title}</h2>
              <div style="background-color: #172033; border-left: 3px solid #38bdf8; border-radius: 6px; padding: 16px 20px; margin-bottom: 28px;">
                <p style="margin: 0; font-size: 15px; color: #cbd5e1; line-height: 1.6;">${message}</p>
              </div>
              
              ${
                actionUrl
                  ? `
              <div style="text-align: left; margin-top: 24px;">
                <a href="${actionUrl}" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 14px; font-weight: 600; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${actionText} &rarr;</a>
              </div>
              `
                  : ""
              }
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #1f293d; background-color: #0d1322; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                You received this transactional notification based on your activity in Meridian.<br />
                &copy; ${new Date().getFullYear()} Meridian. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Sends a transactional email using Resend.
 * Gracefully handles errors and missing configuration without throwing exceptions.
 */
export async function sendTransactionalEmail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; messageId?: string }> {
  if (!to || !to.trim()) {
    console.warn("[Resend] Cannot send email: recipient address is empty or invalid.");
    return { success: false };
  }

  const resend = getResendClient();

  if (!resend) {
    if (process.env.NODE_ENV !== "test") {
      console.info(
        `[Resend Simulated] To: ${to} | Subject: "${subject}"`
      );
    }
    return { success: true, messageId: "simulated-msg-id" };
  }

  try {
    const fromAddress =
      process.env.EMAIL_FROM || "Meridian <onboarding@resend.dev>";

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: to.trim(),
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error("[Resend] Email dispatch failed:", error);
      return { success: false };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error("[Resend] Unexpected email dispatch error:", error);
    return { success: false };
  }
}
