// Vercel serverless function — Avenu contact form
// Forwards submissions via Resend (https://resend.com).
//
// Setup:
//   1. Sign up at resend.com and create an API key
//   2. Verify your sending domain (e.g. avenu.sale) — OR use the built-in
//      onboarding@resend.dev address to test before verifying a domain
//   3. Add the key to your .env.local (dev) and to Vercel Project Settings →
//      Environment Variables (prod) as RESEND_API_KEY
//   4. Optionally set RESEND_FROM (e.g. "Avenu <hello@avenu.sale>") and
//      RESEND_TO (e.g. "contact@avenu.sale")
//
// The endpoint is POST /api/contact with JSON body:
//   { name?: string, email: string, message: string, projectType?: string }

export const config = { runtime: "edge" };

type ContactPayload = {
  name?: string;
  email: string;
  message: string;
  projectType?: string;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return json(405, { ok: false, error: "Method not allowed. Use POST." });
  }

  let body: ContactPayload;
  try {
    body = (await req.json()) as ContactPayload;
  } catch {
    return json(400, { ok: false, error: "Invalid JSON body." });
  }

  const { name, email, message, projectType } = body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email)) {
    return json(400, { ok: false, error: "A valid email is required." });
  }
  if (!message || message.trim().length < 5) {
    return json(400, { ok: false, error: "Please write a message of at least 5 characters." });
  }
  if (message.length > 5000) {
    return json(400, { ok: false, error: "Message is too long (max 5000 chars)." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Friendlier error so the UI can surface a "not configured yet" state
    // rather than a generic 500.
    return json(503, {
      ok: false,
      error:
        "Email delivery is not configured yet. Add RESEND_API_KEY in Vercel env vars to start collecting messages.",
    });
  }

  const fromAddress = process.env.RESEND_FROM ?? "Avenu <onboarding@resend.dev>";
  const toAddress = process.env.RESEND_TO ?? "contact@avenu.sale";

  const subject = name
    ? `New Avenu message from ${name}`
    : "New Avenu message from a visitor";

  const textBody = [
    `New message from avenu.sale`,
    ``,
    `From: ${name ?? "Anonymous"} <${email}>`,
    projectType ? `Project type: ${projectType}` : "",
    ``,
    `Message:`,
    message.trim(),
    ``,
    `—`,
    `Reply directly to this email to respond to ${name ?? "the sender"}.`,
  ]
    .filter(Boolean)
    .join("\n");

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #021024;">
      <h2 style="color:#052659; margin-bottom: 8px;">New message from avenu.sale</h2>
      <p style="color:#5483B3; margin: 0 0 16px;">Someone reached out via your contact form.</p>
      <table style="width:100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr><td style="padding: 6px 0; color:#5483B3; width: 110px; vertical-align: top;">From</td><td style="padding: 6px 0;"><strong>${escapeHtml(name ?? "Anonymous")}</strong> <${escapeHtml(email)}></td></tr>
        ${projectType ? `<tr><td style="padding: 6px 0; color:#5483B3; vertical-align: top;">Project type</td><td style="padding: 6px 0;">${escapeHtml(projectType)}</td></tr>` : ""}
      </table>
      <div style="padding: 16px; background:#f4f9ff; border-left: 3px solid #5483B3; border-radius: 6px; white-space: pre-wrap; color:#021024;">${escapeHtml(message.trim())}</div>
      <p style="margin-top: 24px; color:#5483B3; font-size: 13px;">Reply directly to this email to respond.</p>
    </div>
  `;

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [toAddress],
        reply_to: email,
        subject,
        text: textBody,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return json(502, {
        ok: false,
        error: `Resend rejected the request (${res.status}).`,
        detail: errText.slice(0, 500),
      });
    }

    return json(200, { ok: true });
  } catch (e) {
    return json(500, {
      ok: false,
      error: "Failed to send the message. Please try again later.",
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """)
    .replace(/'/g, "&#39;");
}
