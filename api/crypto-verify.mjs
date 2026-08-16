/**
 * POST /api/crypto-verify
 * Body:  { txid, wallet, minLtc, email, orderCode }
 *
 * Checks a Litecoin transaction on the public blockchain (Blockchair) and
 * reports whether it is confirmed and whether the customer sent at least
 * `minLtc` to `wallet`. When a match is found it best-effort emails the
 * customer via Resend (if RESEND_API_KEY is configured) with a
 * "your payment was detected" notice.
 */
const BLOCKCHAIR_TX =
  (txid) =>
    `https://api.blockchair.com/litecoin/dashboards/transaction/${txid}`;

const RESEND_URL = "https://api.resend.com/emails";

function round6(x) {
  return Number(Number(x).toFixed(6));
}

/** Fire-and-forget Payment-detected email. Never throws. */
async function sendPaymentDetectedEmail({ email, orderCode, txid, ltc, usd }) {
  const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
  if (!apiKey || !email) return;
  try {
    const from = process.env.RESEND_FROM || "Avenu <onboarding@resend.dev>";
    const subject = orderCode
      ? `Payment detected — order ${orderCode}`
      : "Your payment was detected";
    const html = `
      <h2 style="margin-bottom:8px;">Your payment was detected 🎉</h2>
      <p>We received your Litecoin payment${orderCode ? ` for order <strong>${orderCode}</strong>` : ""}.</p>
      <p><strong>Amount:</strong> ${ltc ? ltc.toFixed(6) : "—"} LTC${usd ? ` (≈ $${usd.toFixed(2)})` : ""}</p>
      <p><strong>TXID:</strong> <code style="word-break:break-all;">${txid || "—"}</code></p>
      <p>Your order is confirmed. Thank you for shopping with Avenu.</p>`;
    await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to: [email], subject, html }),
      signal: AbortSignal.timeout(8000),
    }).catch(() => {});
  } catch {
    /* ignore — email is best-effort */
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let body = {};
  try {
    body = req.body && typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});
  } catch {
    res.status(400).json({ ok: false, error: "Invalid JSON body" });
    return;
  }

  const txid = String(body.txid || "").trim();
  const wallet = String(body.wallet || "").trim();
  const minLtc = Math.max(0, Number(body.minLtc) || 0);
  const email = String(body.email || "").trim().toLowerCase();
  const orderCode = String(body.orderCode || "").trim();

  if (!txid) {
    res.status(400).json({ ok: false, error: "Missing txid" });
    return;
  }

  try {
    const r = await fetch(BLOCKCHAIR_TX(txid), {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!r.ok) {
      res.status(502).json({ ok: false, error: "Blockchair request failed" });
      return;
    }

    const payload = await r.json();
    const node = payload?.data?.[txid];
    if (!node) {
      res.status(404).json({ ok: false, error: "Transaction not found" });
      return;
    }

    const outputs = Array.isArray(node.outputs) ? node.outputs : [];

    let sentToWallet = 0;
    for (const out of outputs) {
      const addr = out?.recipient ?? out?.address ?? "";
      if (addr.toLowerCase() === wallet.toLowerCase()) {
        sentToWallet += Number(out?.value ?? 0);
      }
    }

    // confirmations lives at node.confirmations; fall back to a positive value
    // whenever the tx exists on-chain but the field is missing (or mempool).
    const rawConf = node?.confirmations;
    const confirmations =
      Number(rawConf) >= 0 ? Number(rawConf) : node?.transaction ? 1 : 0;

    const matched = sentToWallet >= minLtc * 0.995;

    // If the payment matches, notify the customer (best-effort, never blocks).
    if (matched) {
      await sendPaymentDetectedEmail({
        email,
        orderCode,
        txid,
        ltc: sentToWallet,
        usd: body.usdTotal ? Number(body.usdTotal) : undefined,
      });
    }

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      ok: true,
      txid,
      network: "litecoin",
      confirmations,
      sentToWallet: round6(sentToWallet),
      minLtc: round6(minLtc),
      matched,
      message: matched
        ? "Payment received — transaction found on the Litecoin network."
        : "Transaction found, but the amount doesn't cover this order yet.",
    });
  } catch (e) {
    res.status(502).json({ ok: false, error: e.message });
  }
}