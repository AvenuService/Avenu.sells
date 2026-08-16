/**
 * GET /api/crypto-quote?usd=123.45
 * Returns the merchant Litecoin wallet address, a live USD->LTC rate
 * (CoinGecko public API) and the LTC amount a shopper owes for `usd`.
 * Falls back to VITE_CRYPTO_FALLBACK_PRICE_USD when the rate source
 * is unreachable so checkout never hard-fails.
 *
 * Env (set in Vercel, or .env.local for local dev):
 *   VITE_CRYPTO_LTC_WALLET            — public LTC address customers are told to send to
 *   VITE_CRYPTO_FALLBACK_PRICE_USD    — e.g. 60 (USD per LTC) when CoinGecko is down
 */

const WALLET =
  process.env.CRYPTO_LTC_WALLET ||
  process.env.VITE_CRYPTO_LTC_WALLET ||
  "";

const FALLBACK_PRICE =
  Number(
    process.env.VITE_CRYPTO_FALLBACK_PRICE_USD ||
      process.env.CRYPTO_FALLBACK_PRICE_USD ||
      60,
  ) || 60;

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd";

function round(value, digits = 6) {
  return Number(Number(value).toFixed(digits));
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const usdTotal = Math.max(0, Number(req.query.usd) || 0);

  let rateUsd = FALLBACK_PRICE;
  let source = "fallback";
  try {
    const r = await fetch(COINGECKO_URL, {
      signal: AbortSignal.timeout(6000),
      headers: { Accept: "application/json" },
    });
    if (r.ok) {
      const body = await r.json();
      const price = body?.litecoin?.usd;
      if (typeof price === "number" && price > 0) {
        rateUsd = price;
        source = "coingecko";
      }
    }
  } catch {
    /* network/sandbox offline — keep fallback rate */
  }

  const ltcAmount = rateUsd > 0 ? usdTotal / rateUsd : 0;

  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    asset: "LTC",
    network: "litecoin",
    wallet: WALLET,
    walletConfigured: Boolean(WALLET),
    rateUsd: round(rateUsd),
    ltcAmount: round(ltcAmount),
    usdTotal: round(usdTotal),
    source,
  });
}