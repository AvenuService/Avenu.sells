import { useEffect, useState } from "react";

export const CONSENT_KEY = "avenu_cookie_consent_v2";
export const PERSIST_LOGIN_KEY = "avenu_persist_session";
export const PREFS_KEY = "avenu_cookie_preferences";

export type CookiePreferences = {
  essential: boolean;
  persistentAuth: boolean;
  cartState: boolean;
  analytics: boolean;
};

export const DEFAULT_PREFS: CookiePreferences = {
  essential: true,
  persistentAuth: true,
  cartState: true,
  analytics: true,
};

/* ============================================================
   Shared helpers
   These are used by both the consent banner and the Account
   settings so cookie preferences live in exactly one place.
   ============================================================ */

/** Read the user's saved preferences, falling back to defaults. */
export function getCookiePreferences(): CookiePreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CookiePreferences>;
      return { ...DEFAULT_PREFS, ...parsed };
    }
  } catch {
    /* ignore storage errors */
  }
  return { ...DEFAULT_PREFS };
}

/** Persist consent + preferences and apply auth/cart behaviour. */
export function applyConsent(acceptedPrefs: CookiePreferences): void {
  try {
    localStorage.setItem(CONSENT_KEY, "true");
    localStorage.setItem(PREFS_KEY, JSON.stringify(acceptedPrefs));

    if (acceptedPrefs.persistentAuth) {
      localStorage.setItem(PERSIST_LOGIN_KEY, "true");
      document.cookie = "avenu_cookie_consent=accepted; max-age=31536000; path=/; SameSite=Lax";
      document.cookie = "avenu_persist_session=true; max-age=31536000; path=/; SameSite=Lax";
    } else {
      localStorage.removeItem(PERSIST_LOGIN_KEY);
      document.cookie = "avenu_persist_session=false; max-age=0; path=/; SameSite=Lax";
    }

    if (acceptedPrefs.cartState) {
      sessionStorage.removeItem("avenu_transient_session");
    } else {
      sessionStorage.setItem("avenu_transient_session", "true");
    }
  } catch {
    /* ignore storage errors */
  }
}

/* ============================================================
   Simplified Cookie Consent Banner
   Preferences moved to Account settings.
   ============================================================ */
export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) {
        const timer = setTimeout(() => setIsVisible(true), 1000);
        return () => clearTimeout(timer);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  const dismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
    }, 400);
  };

  const handleAcceptAll = () => {
    applyConsent(DEFAULT_PREFS);
    dismiss();
  };

  const handleRejectAll = () => {
    applyConsent({
      essential: true,
      persistentAuth: false,
      cartState: false,
      analytics: false,
    });
    dismiss();
  };

  if (!isVisible) {
    // Floating cookie badge when dismissed — reopens the banner.
    return (
      <button
        type="button"
        onClick={() => {
          setIsExiting(false);
          setIsVisible(true);
        }}
        title="Cookie Settings"
        style={{
          position: "fixed",
          bottom: "1.5rem",
          left: "1.5rem",
          zIndex: 998,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.6rem 1rem",
          background: "rgba(15, 23, 42, 0.9)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(56, 189, 248, 0.2)",
          borderRadius: "9999px",
          color: "#f8fafc",
          fontSize: "0.85rem",
          fontWeight: 500,
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
          e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.2)";
        }}
      >
        <span aria-hidden="true">🍪</span>
        <span>Cookies</span>
      </button>
    );
  }
// Simple accept / reject banner.
  return (
    <div
      role="dialog"
      aria-label="Cookie Consent"
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 999,
        maxWidth: "420px",
        width: "calc(100vw - 3rem)",
        background: "rgba(10, 15, 29, 0.95)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(56, 189, 248, 0.2)",
        borderRadius: "16px",
        padding: "1.25rem",
        boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 20px rgba(56,189,248,0.1)",
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? "translateY(16px) scale(0.95)" : "translateY(0) scale(1)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
    >
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", fontWeight: 700, color: "#f8fafc" }}>
          🍪 We use cookies
        </h3>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(226, 232, 240, 0.8)", lineHeight: 1.4 }}>
          We use cookies to keep you signed in, remember your cart, and improve your experience.
          Manage preferences in your account settings.
        </p>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleRejectAll}
          style={{
            flex: 1,
            minWidth: "120px",
            padding: "0.6rem 1rem",
            borderRadius: "8px",
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            color: "#cbd5e1",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
          }}
        >
          Reject
        </button>

        <button
          type="button"
          onClick={handleAcceptAll}
          style={{
            flex: 1,
            minWidth: "120px",
            padding: "0.6rem 1rem",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)",
            border: "none",
            color: "#ffffff",
            fontSize: "0.8rem",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(56, 189, 248, 0.35)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(56, 189, 248, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(56, 189, 248, 0.35)";
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}