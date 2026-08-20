import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useShopperAuth, displayName, displayUsername, avatarUrl } from "../store/ShopperAuthContext";
import { useOrders } from "../store/OrdersContext";
import { CloseIcon, EditIcon, LogoutIcon, ShieldIcon, UserIcon, GoogleIcon, CheckIcon } from "./Icons";
import CookieModel3D from "./CookieModel3D";
import {
  getCookiePreferences,
  applyConsent,
  type CookiePreferences,
} from "./CookieConsent";

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

  const { orders } = useOrders();

  const shopperOrders = useMemo(() => {
    if (!email) return [];
    const normalized = email.toLowerCase().trim();
    return orders.filter(
      (o) => o.customerEmail?.toLowerCase().trim() === normalized,
    );
  }, [orders, email]);

  // Cookie preference controls (moved here from the consent banner).
  const [cookiePrefs, setCookiePrefs] = useState<CookiePreferences>(getCookiePreferences);
  const [cookieSaved, setCookieSaved] = useState(false);

  function handleCookieToggle(key: keyof CookiePreferences) {
    setCookiePrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSaveCookies() {
    applyConsent(cookiePrefs);
    setCookieSaved(true);
    setTimeout(() => setCookieSaved(false), 1800);
  }

  const cookieOptStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.85rem",
    padding: "0.85rem",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.06)",
    cursor: "pointer",
    margin: "0 0 0.5rem",
  };

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

                {/* Order History Section */}
                <div
                  style={{
                    marginTop: "1.2rem",
                    padding: "1rem",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "0.8rem",
                    }}
                  >
                    <p className="admin-section-title-small" style={{ margin: 0 }}>
                      Order history ({shopperOrders.length})
                    </p>
                  </div>

                  {shopperOrders.length === 0 ? (
                    <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                      No orders placed yet with this account.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {shopperOrders.map((ord) => (
                        <div
                          key={ord.id}
                          style={{
                            padding: "0.85rem",
                            background: "rgba(255, 255, 255, 0.03)",
                            border: "1px solid rgba(255, 255, 255, 0.06)",
                            borderRadius: "10px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.4rem",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#C1E8FF" }}>
                              {ord.code}
                            </span>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                padding: "0.15rem 0.5rem",
                                borderRadius: "12px",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.03em",
                                background:
                                  ord.status === "paid" || ord.status === "fulfilled"
                                    ? "rgba(34, 197, 94, 0.15)"
                                    : ord.status === "cancelled"
                                    ? "rgba(239, 68, 68, 0.15)"
                                    : "rgba(234, 179, 8, 0.15)",
                                color:
                                  ord.status === "paid" || ord.status === "fulfilled"
                                    ? "#4ade80"
                                    : ord.status === "cancelled"
                                    ? "#f87171"
                                    : "#facc15",
                              }}
                            >
                              {ord.status}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem", color: "rgba(226, 232, 240, 0.7)" }}>
                            <span>{new Date(ord.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                            <strong style={{ color: "#f1f5f9" }}>${ord.total.toFixed(2)}</strong>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.2rem", paddingTop: "0.4rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                              {ord.items.length} {ord.items.length === 1 ? "item" : "items"}
                            </span>
                            <Link
                              to={`/order/${ord.code}`}
                              onClick={closeAccount}
                              style={{
                                fontSize: "0.78rem",
                                color: "#7DA0CA",
                                textDecoration: "none",
                                fontWeight: 500,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                              }}
                            >
                              View Order →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3D Cookie Model - Premium Profile Touch */}
                <div
                  style={{
                    marginTop: "1.2rem",
                    padding: "1rem",
                    background: "rgba(56, 189, 248, 0.08)",
                    border: "1px solid rgba(56, 189, 248, 0.2)",
                    borderRadius: "12px",
                  }}
                >
                  <p
                    className="admin-section-title-small"
                    style={{
                      marginBottom: "0.8rem",
                      marginTop: 0,
                      color: "rgba(226, 232, 240, 0.9)",
                    }}
                  >
                    Your Cookie
                  </p>
                  <div
                    style={{
                      width: "100%",
                      height: "300px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      background: "radial-gradient(circle, rgba(15,23,42,0.4) 0%, rgba(10,15,29,0.8) 100%)",
                    }}
                  >
                    <CookieModel3D />
                  </div>
                  <p style={{ margin: "0.8rem 0 0", fontSize: "0.75rem", color: "rgba(148, 163, 184, 0.9)" }}>
                    🍪 A freshly baked cookie just for you. Customize your profile to earn more!
                  </p>
                </div>

                <div className="af-row" style={{ marginTop: "1rem" }}>
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

            {/* Cookie & privacy preferences — moved here from the consent banner */}
            <div
              style={{
                marginTop: "1.2rem",
                padding: "1rem",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "12px",
              }}
            >
              <p className="admin-section-title-small" style={{ marginBottom: "0.6rem", marginTop: 0 }}>
                Cookie & privacy preferences
              </p>

              <label style={cookieOptStyle}>
                <input type="checkbox" checked disabled className="cookie-check" />
                <div>
                  <strong style={{ fontSize: "0.9rem", color: "#f1f5f9" }}>Essential cookies</strong>
                  <p className="muted" style={{ margin: "0.2rem 0 0", fontSize: "0.78rem" }}>
                    Required for security sessions and core functionality. Always on.
                  </p>
                </div>
              </label>

              <label style={cookieOptStyle}>
                <input
                  type="checkbox"
                  className="cookie-check"
                  checked={cookiePrefs.persistentAuth}
                  onChange={() => handleCookieToggle("persistentAuth")}
                />
                <div>
                  <strong style={{ fontSize: "0.9rem", color: "#f1f5f9" }}>Keep me signed in</strong>
                  <p className="muted" style={{ margin: "0.2rem 0 0", fontSize: "0.78rem" }}>
                    Persists your login across browser restarts.
                  </p>
                </div>
              </label>

              <label style={cookieOptStyle}>
                <input
                  type="checkbox"
                  className="cookie-check"
                  checked={cookiePrefs.cartState}
                  onChange={() => handleCookieToggle("cartState")}
                />
                <div>
                  <strong style={{ fontSize: "0.9rem", color: "#f1f5f9" }}>Cart & storefront state</strong>
                  <p className="muted" style={{ margin: "0.2rem 0 0", fontSize: "0.78rem" }}>
                    Remembers your cart, coupons, and recent view history.
                  </p>
                </div>
              </label>

              <label style={cookieOptStyle}>
                <input
                  type="checkbox"
                  className="cookie-check"
                  checked={cookiePrefs.analytics}
                  onChange={() => handleCookieToggle("analytics")}
                />
                <div>
                  <strong style={{ fontSize: "0.9rem", color: "#f1f5f9" }}>Graphics & performance</strong>
                  <p className="muted" style={{ margin: "0.2rem 0 0", fontSize: "0.78rem" }}>
                    Adapts 3D background effects based on your hardware.
                  </p>
                </div>
              </label>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" className="btn btn-primary" onClick={handleSaveCookies}>
                  Save preferences
                </button>
                {cookieSaved && (
                  <span className="af-saved">
                    <CheckIcon size={14} /> Saved
                  </span>
                )}
              </div>
            </div>

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
