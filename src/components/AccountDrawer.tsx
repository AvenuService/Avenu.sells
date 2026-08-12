import { useEffect, useState } from "react";
import { useShopperAuth, displayName, displayUsername, avatarUrl } from "../store/ShopperAuthContext";
import { CloseIcon, EditIcon, LogoutIcon, ShieldIcon, UserIcon, GoogleIcon, CheckIcon } from "./Icons";

export default function AccountDrawer() {
  const {
    session,
    loading: authLoading,
    isOpen,
    closeAccount,
    signInWithGoogle,
    signOut,
    updateProfile,
    clearError,
    error: authError,
  } = useShopperAuth();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  // Hydrate the form whenever a session lands.
  useEffect(() => {
    if (session) {
      setFullName(displayName(session) || "");
      setUsername(displayUsername(session) || "");
      setSaved(false);
    }
  }, [session]);

  // ESC closes the drawer.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAccount();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeAccount]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaved(false);
    const res = await updateProfile({ fullName, username });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    }
  }

  async function handleGoogle() {
    if (signingIn) return;
    setSigningIn(true);
    const res = await signInWithGoogle();
    if (!res.ok) setSigningIn(false);
    // On success, browser navigates to Google.
  }

  function handleSignOut() {
    void signOut();
    closeAccount();
  }

  const user = session?.user;
  const email = user?.email ?? "";
  const avatar = avatarUrl(session);
  const name = displayName(session);

  return (
    <div className={`account-drawer ${isOpen ? "open" : ""}`} aria-hidden={!isOpen}>
      <div className="account-overlay" onClick={closeAccount} />
      <aside className="account-panel" role="dialog" aria-modal="true" aria-label="Account panel">
        <header className="account-head">
          <div className="account-head-title">
            <UserIcon size={20} />
            <h2>Account</h2>
          </div>
          <button className="account-close" aria-label="Close account" onClick={closeAccount}>
            <CloseIcon size={20} />
          </button>
        </header>

        {authLoading ? (
          <div className="account-empty">
            <div className="account-empty-art" />
            <h3>Loading…</h3>
            <p className="muted">Checking your session.</p>
          </div>
        ) : !session ? (
          // ---------- Signed out ----------
          <div className="account-empty">
            <div className="account-empty-art">
              <UserIcon size={26} />
            </div>
            <h3>You're signed out</h3>
            <p className="muted" style={{ maxWidth: "320px" }}>
              Sign in to track orders, save your details, and breeze through checkout.
            </p>
            <button
              type="button"
              className="google-btn"
              onClick={handleGoogle}
              disabled={signingIn}
            >
              <GoogleIcon size={20} />
              <span>{signingIn ? "Redirecting to Google…" : "Continue with Google"}</span>
            </button>

            {authError && (
              <div className="gate-error" role="alert" style={{ marginTop: "0.6rem" }}>
                <strong>Couldn't start sign-in.</strong>
                <p className="muted" style={{ marginTop: "0.3rem" }}>
                  {authError}
                  {/google/i.test(authError) || /provider/i.test(authError) || /disabled/i.test(authError)
                    ? " — Make sure the Google provider is enabled under Supabase → Authentication → Providers."
                    : ""}
                </p>
              </div>
            )}

            <div className="gate-meta">
              <ShieldIcon size={14} />
              <span>Secured by Supabase Auth · We never see your Google password.</span>
            </div>
          </div>
        ) : (
          // ---------- Signed in ----------
          <>
            <div className="account-user">
              {avatar ? (
                <img className="account-avatar" src={avatar} alt="" referrerPolicy="no-referrer" />
              ) : (
                <span className="account-avatar account-avatar-fallback">
                  {(name || email || "A").charAt(0).toUpperCase()}
                </span>
              )}
              <div className="account-user-info">
                <strong className="account-user-name">{name || "Avenu shopper"}</strong>
                <span className="account-user-email">{email}</span>
                {displayUsername(session) && (
                  <span className="account-user-handle">@{displayUsername(session)}</span>
                )}
              </div>
            </div>

            <form className="account-form" onSubmit={handleSave}>
              <div className="af-section">
                <p className="admin-section-title-small" style={{ marginBottom: "0.6rem" }}>
                  Profile
                </p>

                <div className="form-group">
                  <label htmlFor="af-fullname">Display name</label>
                  <input
                    id="af-fullname"
                    className="field"
                    type="text"
                    value={fullName}
                    placeholder="Your name"
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="af-username">Username</label>
                  <input
                    id="af-username"
                    className="field"
                    type="text"
                    value={username}
                    placeholder="username"
                    autoCapitalize="none" autoCorrect="off"
                    onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
                  />
                  <small className="muted">Lowercase handle. Shown on your orders and account.</small>
                </div>

                <div className="af-row">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    <EditIcon size={14} />
                    {saving ? "Saving…" : "Save profile"}
                  </button>
                  {saved && (
                    <span className="af-saved">
                      <CheckIcon size={14} /> Saved
                    </span>
                  )}
                </div>

                {authError && (
                  <div className="gate-error" role="alert" style={{ marginTop: "0.6rem" }}>
                    <strong>Couldn't save profile.</strong>
                    <p className="muted" style={{ marginTop: "0.3rem" }}>{authError}</p>
                    <button type="button" className="link-btn" onClick={clearError}>
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </form>

            <footer className="account-foot">
              <div className="account-session-summary">
                <span className="muted">Signed in with</span>
                <strong>{session?.user?.app_metadata?.provider || "Google"}</strong>
              </div>
              <button type="button" className="btn btn-ghost" onClick={handleSignOut}>
                <LogoutIcon size={14} /> Sign out
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
