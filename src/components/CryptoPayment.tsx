import { useMemo, useState } from "react";
import type { CryptoQuote } from "../lib/crypto";
import { formatPrice } from "../data/products";
import { CheckIcon, CopyIcon, ShieldIcon, ZapIcon } from "./Icons";

type Props = {
  quote: CryptoQuote | null;
  loading: boolean;
  error: string | null;
  onCopy: () => void;
};

/**
 * Litecoin payment panel for checkout. Shows the merchant wallet, an
 * amount-due estimate (USD -> LTC via the live quote) and a QR code the
 * customer can scan from a wallet app. The customer pays directly to the
 * wallet and confirms in the checkout flow (the confirmation page verifies
 * the TXID against the blockchain).
 */
export default function CryptoPayment({ quote, loading, error, onCopy }: Props) {
  const [copied, setCopied] = useState(false);

  const qrUrl = useMemo(() => {
    if (!quote?.wallet) return "";
    const uri = `litecoin:${quote.wallet}?amount=${quote.ltcAmount.toFixed(6)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(uri)}`;
  }, [quote]);

  if (loading) {
    return (
      <div className="crypto-panel card">
        <p className="muted">Fetching a live Litecoin price…</p>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="crypto-panel card">
        <p className="muted">{error || "Crypto pricing is unavailable right now."}</p>
        <p className="muted" style={{ fontSize: "0.85rem", marginTop: "0.4rem" }}>
          You can still complete your order and pay over a manual transfer.
        </p>
      </div>
    );
  }

  if (!quote.walletConfigured || !quote.wallet) {
    return (
      <div className="crypto-panel card">
        <div className="summary-meta" style={{ gap: "0.5rem", color: "var(--accent-ice)" }}>
          <ZapIcon size={15} />
          <strong>Crypto option coming soon</strong>
        </div>
        <p className="muted" style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
          The store hasn't connected a Litecoin wallet yet. Please pick another
          payment method or contact support.
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    void navigator.clipboard?.writeText(quote.wallet).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
    onCopy();
  };

  return (
    <div className="crypto-panel card">
      <div className="crypto-head">
        <span className="crypto-badge">LTC</span>
        <div>
          <strong>Litecoin · {quote.network}</strong>
          <span className="muted" style={{ display: "block", fontSize: "0.85rem" }}>
            Pay directly to our wallet — no middleman.
          </span>
        </div>
      </div>

      <div className="crypto-grid">
        <div className="crypto-qr">
          {qrUrl ? (
            <img src={qrUrl} alt="Litecoin payment QR" width={200} height={200} />
          ) : (
            <div className="crypto-qr-fallback">
              <ZapIcon size={28} />
            </div>
          )}
        </div>

        <div className="crypto-details">
          <div className="crypto-line">
            <span className="muted">Send at least</span>
            <strong style={{ fontSize: "1.15rem", color: "var(--accent-ice)" }}>
              {quote.ltcAmount.toFixed(6)} LTC
            </strong>
            <span className="muted" style={{ fontSize: "0.85rem" }}>
              ≈ {formatPrice(quote.usdTotal)} · @ {quote.rateUsd.toFixed(2)} USD/LTC
            </span>
          </div>

          <div className="crypto-line">
            <span className="muted">Wallet address</span>
            <code className="crypto-addr">{quote.wallet}</code>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleCopy}>
              {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
              <span style={{ marginLeft: "0.35rem" }}>{copied ? "Copied" : "Copy address"}</span>
            </button>
          </div>

          <div className="summary-meta" style={{ marginTop: "0.6rem" }}>
            <ShieldIcon size={14} />
            <span>
              You'll verify your transaction on the confirmation screen. Screenshot your
              transaction ID (TXID) after sending.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}