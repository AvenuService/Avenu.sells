// Client helpers for the crypto (Litecoin) payment option.
// These call the serverless endpoints in /api when the app is running on
// Vercel. When running under `npm run dev` (plain Vite, no /api runtime)
// they fall back to local env values so the checkout still renders.

export type CryptoQuote = {
  asset: string;
  network: string;
  wallet: string;
  walletConfigured: boolean;
  rateUsd: number;
  ltcAmount: number;
  usdTotal: number;
  source: string;
};

export type CryptoVerifyResult = {
  ok: boolean;
  error?: string;
  txid?: string;
  network?: string;
  confirmations: number;
  sentToWallet: number;
  minLtc: number;
  matched: boolean;
};

/** Live quote + merchant wallet from /api/crypto-quote (Vite fallback below). */
export async function getCryptoQuote(usdTotal: number): Promise<CryptoQuote> {
  try {
    const res = await fetch(
      `/api/crypto-quote?usd=${encodeURIComponent(String(usdTotal))}`,
      { headers: { Accept: "application/json" } },
    );
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      return (await res.json()) as CryptoQuote;
    }
  } catch {
    /* fall through to local env snapshot below */
  }

  const wallet = import.meta.env.VITE_CRYPTO_LTC_WALLET as string | undefined;
  const rate =
    Number(import.meta.env.VITE_CRYPTO_FALLBACK_PRICE_USD) || 60;

  return {
    asset: "LTC",
    network: "litecoin",
    wallet: wallet ?? "",
    walletConfigured: Boolean(wallet),
    rateUsd: rate,
    ltcAmount: rate > 0 ? usdTotal / rate : 0,
    usdTotal,
    source: "local-env",
  };
}

/** Verify a Litecoin TXID against a wallet + minimum amount. */
export async function verifyCryptoPayment(
  txid: string,
  wallet: string,
  minLtc: number,
  opts?: { email?: string; orderCode?: string; usdTotal?: number },
): Promise<CryptoVerifyResult> {
  try {
    const res = await fetch("/api/crypto-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        txid,
        wallet,
        minLtc,
        email: opts?.email,
        orderCode: opts?.orderCode,
        usdTotal: opts?.usdTotal,
      }),
    });
    const data = await res.json();
    return data as CryptoVerifyResult;
  } catch {
    return {
      ok: false,
      error: "Could not reach the verification service.",
      confirmations: 0,
      sentToWallet: 0,
      minLtc,
      matched: false,
    };
  }
}