import { useState } from "react";
import { verifyCryptoPayment } from "../lib/crypto";
import { formatPrice } from "../data/products";
import { CheckIcon, CopyIcon, ZapIcon } from "./Icons";

type Props = {
  wallet: string;
  ltcAmount: number;
  usdTotal: number;
  onVerified: () => void;
};

/**
 * Placed on the order-confirmation page for crypto orders. Shows the same
 * wallet + amount the customer saw at checkout, plus a TXID field. When the
 * customer pastes their transaction ID we check the Litecoin blockchain; on a
 * match the order is marked paid (via onVerified) and a payment-detected
 * email is sent server-side (best-effort).
 */
export default function CryptoReceipt({
  wallet,
  ltcAmount,
  usdTotal,
  onVerified,
}: Props) {
  const [txid, setTxid] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<"ok" | "fail" | null>(null);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard?.writeText(wallet).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  };

  const handleVerify = async () => {
    const id = txid.trim();
    if (!id) {
      setMessage("Enter the transaction ID (TXID) from your wallet app.");
      setResult(null);
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const res = await verifyCryptoPayment(id, wallet, ltcAmount);
      if (res.matched) {
        setResult("ok");
        setMessage(`Confirmed — ${res.confirmations} confirmations on the Litecoin network. Payment received.`);
        onVerified();
      } else {
        setMessage(
          res.error
            ? res.error
            : `We found the transaction, but the amount (${res.sentToWallet?.toFixed(6) ?? "—"} LTC) doesn't cover the order. Double-check the wallet address.`,
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card crypto-panel" style={{ marginTop: "1.2rem" }}>
      <div className="crypto-head">
        <span className="crypto-badge">LTC</span>
        <div>
          <strong>Complete your Litecoin payment</strong>
          <span className="muted" style={{ display: "block", fontSize: "0.85rem" }}>
            Send {ltcAmount.toFixed(6)} LTC to the wallet below, then paste your TXID to confirm.
          </span>
        </div>
        {result === "ok" && (
          <span className="crypto-verified"><CheckIcon size={14} /> Paid</span>
        )}
      </div>

      <div className="crypto-line" style={{ marginTop: "1rem" }}>
        <span className="muted">Wallet address</span>
        <code className="crypto-addr">{wallet}</code>
        <button type="button" className="btn btn-ghost btn-sm" onClick={handleCopy}>
          {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
          <span style={{ marginLeft: "0.35rem" }}>{copied ? "Copied" : "Copy address"}</span>
        </button>
      </div>

      <div className="crypto-line">
        <span className="muted">Amount due</span>
        <strong style={{ color: "var(--accent-ice)" }}>
          {ltcAmount.toFixed(6)} LTC
        </strong>
        <span className="muted" style={{ fontSize: "0.85rem" }}>
          ≈ {formatPrice(usdTotal)}
        </span>
      </div>

      <div className="crypto-line">
        <span className="muted">Transaction ID</span>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <input
            value={txid}
            onChange={(e) => setTxid(e.target.value)}
            className="field"
            placeholder="Paste your LTC TXID…"
            style={{ flex: "1 1 240px" }}
          />
          <button type="button" className="btn btn-primary" onClick={handleVerify} disabled={busy}>
            {busy ? "Checking…" : "Verify payment"}
          </button>
        </div>
      </div>

      {message && (
        <p className="muted" style={{ marginTop: "0.7rem", fontSize: "0.9rem" }}>
          {result === "ok" && <CheckIcon size={14} style={{ verticalAlign: "-2px" }} />}
          {message}
        </p>
      )}

      <div className="summary-meta" style={{ marginTop: "0.8rem" }}>
        <ZapIcon size={14} />
        <span>
          Litecoin transfers usually confirm in a few minutes. Your order is reserved while the
          payment is on its way.
        </span>
      </div>
    </div>
  );
}