import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../store/AdminAuthContext";
import { ArrowRight, ShieldIcon, ZapIcon, CheckIcon } from "../../components/Icons";

export default function AdminLogin() {
  const { verifyCredentials, verifyCode, authState, isAuthenticated, clearError } = useAdminAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<"credentials" | "code">("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect when authenticated
  useEffect(() => {
    if (isAuthenticated) navigate("/admin", { replace: true });
  }, [isAuthenticated, navigate]);

  // surface auth errors from the context
  useEffect(() => {
    if (authState.status === "error") setError(authState.message);
  }, [authState]);

  async function onCreds(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await verifyCredentials(username, password);
    setSubmitting(false);
    if (!res.ok) { setError(res.error ?? "Failed"); return; }
    setStep("code");
  }

  function onCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = verifyCode(code);
    setSubmitting(false);
    if (!res.ok) { setError(res.error ?? "Failed"); return; }
    // success triggers effect that redirects to /admin
  }

  function backToCreds() {
    setStep("credentials");
    setCode("");
    setError(null);
    clearError();
  }

  return (
    <div className="admin-login">
      <div className="admin-login-bg" aria-hidden="true">
        <div className="alb-orb alb-orb1" />
        <div className="alb-orb alb-orb2" />
        <div className="alb-grid-lines" />
      </div>

      <div className="admin-login-card card fade-up">
        <div className="brand-line">
          <span className="brand-mark" aria-hidden="true"><img src="/A_for_logo.svg" alt="" className="brand-logo-img" /></span>
          <span className="brand-text">Avenu</span>
          <span className="badge badge-ice admin-pill">Admin</span>
        </div>

        {step === "credentials" && (
          <>
            <h1>Operator sign-in</h1>
            <p className="al-sub muted">
              Secure two-step login. Verify your admin credentials, then we'll dispatch a one-time
              access code to a private Discord channel.
            </p>

            <form onSubmit={onCreds} className="al-form">
              <div className="form-group">
                <label htmlFor="u">Admin username</label>
                <input id="u" className="field" autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="avenuadmin" />
              </div>
              <div className="form-group">
                <label htmlFor="p">Admin password</label>
                <input id="p" className="field" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••" />
              </div>

              {error && <div className="al-error">{error}</div>}

              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
                {submitting ? "Dispatching code…" : <>Verify & dispatch code <ArrowRight size={16} /></>}
              </button>

              <div className="al-meta">
                <ShieldIcon size={14} /> <span>Encrypted admin access · code expires after one use</span>
              </div>
            </form>

            <div className="al-bottom">
              <Link to="/" className="al-back">← Back to storefront</Link>
            </div>
          </>
        )}

        {step === "code" && (
          <>
            <div className="al-step-head">
              <span className="badge badge-ice"><CheckIcon size={12} /> Credentials verified</span>
            </div>
            <h1>Enter dispatch code</h1>
            <p className="al-sub muted">
              We've dispatched a one-time code to the private Avenu admin Discord channel.
              It looks like <code className="al-code-hint">k8N3a-H7q2M-x9P1b-L4mZc</code> — paste it below.
            </p>

            <form onSubmit={onCode} className="al-form">
              <div className="form-group">
                <label htmlFor="code">Access code</label>
                <input
                  id="code"
                  className="field al-code-input"
                  autoFocus
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                  spellCheck={false}
                />
              </div>

              {error && <div className="al-error">{error}</div>}

              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting || code.length < 4}>
                {submitting ? "Verifying…" : <>Unlock admin <ZapIcon size={16} /></>}
              </button>

              <div className="al-meta">
                <ShieldIcon size={14} /> <span>Check your Discord channel · code lives ~5 minutes</span>
              </div>
            </form>

            <div className="al-bottom">
              <button type="button" className="al-back" onClick={backToCreds}>← Use different credentials</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
