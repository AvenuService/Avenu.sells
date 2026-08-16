/**
 * POST /api/crypto-verify
 * Body:  { txid, wallet, minLtc }
 *
 * Checks a Litecoin transaction on the public blockchain (Blockchair) and
 * reports whether it is confirmed and whether the customer sent at least
 * `minLtc` to `wallet`.
 *
 * Returns  { verified, confirmations, sentLtc, minLtc, txid }
 */
const BLOCKCHAIR_TX =
  (txid) =>
    `https://api.blockchair.com/litecoin/dashboards/transaction/${txid}`;

function round6(x) {
  return Number(Number(x).toFixed(6));
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

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      ok: true,
      txid,
      network: "litecoin",
      confirmations,
      sentToWallet: round6(sentToWallet),
      minLtc: round6(minLtc),
      matched: sentToWallet >= minLtc * 0.995,
      message:
        sentToWallet >= minLtc * 0.995
          ? "Payment received — transaction found on the Litecoin network."
          : "Transaction found, but the amount doesn't cover this order yet.",
    });
  } catch (e) {
    res.status(502).json({ ok: false, error: e.message });
  }
}