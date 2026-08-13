import { useEffect, useState, useCallback } from "react";

const CONSENT_KEY = "avenu_cookie_consent_v2";
const PERSIST_LOGIN_KEY = "avenu_persist_session";
const PREFS_KEY = "avenu_cookie_preferences";

export type CookiePreferences = {
  essential: boolean; // Always true (session tokens, security)
  persistentAuth: boolean; // Keep user signed in across browser restarts
  cartState: boolean; // Preserve active cart & checkout items
  analytics: boolean; // Performance & 3D graphics optimization
};

const DEFAULT_PREFS: CookiePreferences = {
  essential: true,
  persistentAuth: true,
  cartState: true,
  analytics: true,
};

/* ============================================================
   Main CookieConsent Component
   ============================================================ */
export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFS);

  // Check consent on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      const savedPrefs = localStorage.getItem(PREFS_KEY);

      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }

      if (!stored) {
        // Delay 1s for entrance pop
        const timer = setTimeout(() => setIsVisible(true), 1000);
        return () => clearTimeout(timer);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  // Save consent & apply persistence configurations
  const applyConsent = useCallback((acceptedPrefs: CookiePreferences) => {
    try {
      localStorage.setItem(CONSENT_KEY, "true");
      localStorage.setItem(PREFS_KEY, JSON.stringify(acceptedPrefs));

      // 1. Persistent Auth Cookie / Storage Setup
      if (acceptedPrefs.persistentAuth) {
        localStorage.setItem(PERSIST_LOGIN_KEY, "true");
        // Set actual browser cookie with 1-year max-age
        document.cookie = `avenu_cookie_consent=accepted; max-age=31536000; path=/; SameSite=Lax`;
        document.cookie = `avenu_persist_session=true; max-age=31536000; path=/; SameSite=Lax`;
      } else {
        localStorage.removeItem(PERSIST_LOGIN_KEY);
        document.cookie = `avenu_persist_session=false; max-age=0; path=/; SameSite=Lax`;
      }

      // 2. Storefront Preferences & Cart Persistence
      if (!acceptedPrefs.cartState) {
        // If user explicitly rejects cart persistence, clear temporary guest caches
        sessionStorage.setItem("avenu_transient_session", "true");
      }
    } catch {
      /* ignore storage errors */
    }

    // Trigger smooth 3D exit animation
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      setShowModal(false);
    }, 600);
  }, []);

  const handleAcceptAll = () => {
    setPreferences(DEFAULT_PREFS);
    applyConsent(DEFAULT_PREFS);
  };

  const handleAcceptEssential = () => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      persistentAuth: false,
      cartState: false,
      analytics: false,
    };
    setPreferences(essentialOnly);
    applyConsent(essentialOnly);
  };

  const handleSavePreferences = () => {
    applyConsent(preferences);
  };

  return (
    <>
      {/* --- Floating Cookie Settings Badge (Always available at bottom-left) --- */}
      {!isVisible && (
        <button
          type="button"
          onClick={() => {
            setIsExiting(false);
            setIsVisible(true);
          }}
          title="Manage Cookie & Login Preferences"
          style={{
            position: "fixed",
            bottom: "1.25rem",
            left: "1.25rem",
            zIndex: 998,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 0.85rem",
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "9999px",
            color: "var(--text-primary, #f8fafc)",
            fontSize: "0.825rem",
            fontWeight: 500,
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px) scale(1.03)";
            e.currentTarget.style.borderColor = "var(--accent-ice, #38bdf8)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
          }}
        >
          <span style={{ fontSize: "1.1rem" }}>🍪</span>
          <span>Cookie Settings</span>
        </button>
      )}

      {/* --- Main Interactive 3D Cookie Banner --- */}
      {isVisible && (
        <div
          role="dialog"
          aria-label="Cookie Consent Banner"
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            zIndex: 999,
            maxWidth: "540px",
            width: "calc(100vw - 3rem)",
            background: "rgba(10, 15, 29, 0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            borderRadius: "20px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(56,189,248,0.15)",
            padding: "1.25rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            opacity: isExiting ? 0 : 1,
            transform: isExiting ? "translateY(20px) scale(0.95)" : "none",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
            }}
          >
            {/* Left Content */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.4rem",
                }}
              >
                <span style={{ fontSize: "1.4rem" }}>🍪</span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "#f8fafc",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Please Accept Our Cookie!
                </h3>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.85rem",
                  lineHeight: 1.45,
                  color: "rgba(226, 232, 240, 0.82)",
                }}
              >
                We use cookies to keep you signed in seamlessly across visits, remember
                your cart items, and optimize your 3D storefront experience.
              </p>
            </div>

            {/* Cookie Icon - 3D model moved to Account */}
            <div
              style={{
                fontSize: "3.5rem",
                flexShrink: 0,
                filter: "drop-shadow(0 8px 16px rgba(56,189,248,0.2))",
              }}
            >
              🍪
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              flexWrap: "wrap",
              gap: "0.6rem",
              paddingTop: "0.5rem",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <button
              type="button"
              onClick={() => setShowModal(true)}
              style={{
                padding: "0.55rem 0.95rem",
                borderRadius: "10px",
                background: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#cbd5e1",
                fontSize: "0.825rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.35)";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.color = "#cbd5e1";
              }}
            >
              Preferences
            </button>

            <button
              type="button"
              onClick={handleAcceptEssential}
              style={{
                padding: "0.55rem 0.95rem",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#e2e8f0",
                fontSize: "0.825rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
              }}
            >
              Essential Only
            </button>

            <button
              type="button"
              onClick={handleAcceptAll}
              style={{
                padding: "0.55rem 1.25rem",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)",
                border: "none",
                color: "#ffffff",
                fontSize: "0.825rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(56, 189, 248, 0.35)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(56, 189, 248, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow =
                  "0 4px 14px rgba(56, 189, 248, 0.35)";
              }}
            >
              Accept All 🍪
            </button>
          </div>
        </div>
      )}

      {/* --- Cookie Preferences Modal --- */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "480px",
              background: "#0f172a",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              borderRadius: "20px",
              padding: "1.75rem",
              boxShadow: "0 25px 50px rgba(0,0,0,0.8)",
              color: "#f8fafc",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>
                Cookie & Session Preferences
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "1.25rem",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Option 1: Essential */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.85rem",
                  padding: "0.85rem",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <input
                  type="checkbox"
                  checked={true}
                  disabled={true}
                  style={{ marginTop: "0.25rem" }}
                />
                <div>
                  <strong style={{ fontSize: "0.9rem", color: "#f1f5f9" }}>
                    Essential & Security (Required)
                  </strong>
                  <p
                    style={{
                      margin: "0.2rem 0 0",
                      fontSize: "0.78rem",
                      color: "#94a3b8",
                    }}
                  >
                    Necessary for authentication tokens, checkout security, and basic
                    navigation.
                  </p>
                </div>
              </div>

              {/* Option 2: Persistent Login */}
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.85rem",
                  padding: "0.85rem",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "12px",
                  border: "1px solid rgba(56,189,248,0.15)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={preferences.persistentAuth}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      persistentAuth: e.target.checked,
                    }))
                  }
                  style={{ marginTop: "0.25rem", accentColor: "#38bdf8" }}
                />
                <div>
                  <strong style={{ fontSize: "0.9rem", color: "#f1f5f9" }}>
                    Keep Me Signed In (Persistent Auth)
                  </strong>
                  <p
                    style={{
                      margin: "0.2rem 0 0",
                      fontSize: "0.78rem",
                      color: "#94a3b8",
                    }}
                  >
                    Stores your login session securely so you stay authenticated across
                    browser restarts without re-entering credentials.
                  </p>
                </div>
              </label>

              {/* Option 3: Cart & Preferences */}
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.85rem",
                  padding: "0.85rem",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.06)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={preferences.cartState}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      cartState: e.target.checked,
                    }))
                  }
                  style={{ marginTop: "0.25rem", accentColor: "#38bdf8" }}
                />
                <div>
                  <strong style={{ fontSize: "0.9rem", color: "#f1f5f9" }}>
                    Cart & Storefront State
                  </strong>
                  <p
                    style={{
                      margin: "0.2rem 0 0",
                      fontSize: "0.78rem",
                      color: "#94a3b8",
                    }}
                  >
                    Remembers your shopping cart items, applied coupons, and recent
                    view history.
                  </p>
                </div>
              </label>

              {/* Option 4: 3D Performance */}
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.85rem",
                  padding: "0.85rem",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.06)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      analytics: e.target.checked,
                    }))
                  }
                  style={{ marginTop: "0.25rem", accentColor: "#38bdf8" }}
                />
                <div>
                  <strong style={{ fontSize: "0.9rem", color: "#f1f5f9" }}>
                    Graphics & Performance Optimization
                  </strong>
                  <p
                    style={{
                      margin: "0.2rem 0 0",
                      fontSize: "0.78rem",
                      color: "#94a3b8",
                    }}
                  >
                    Adapts 3D background shaders and frame rates dynamically based on
                    your hardware.
                  </p>
                </div>
              </label>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                marginTop: "1.5rem",
              }}
            >
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  padding: "0.6rem 1rem",
                  borderRadius: "10px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#cbd5e1",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePreferences}
                style={{
                  padding: "0.6rem 1.25rem",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)",
                  border: "none",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}