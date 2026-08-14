import { useEffect, useState } from "react";
import { applyConsent, CONSENT_KEY, DEFAULT_PREFS } from "./CookieConsent";

/* ============================================================
   CookieCallout — playful speech bubble from the Spline cookie.

   "Comes from the side, floating" — a bubble slides in from the
   left, then gently bobs. It invites the visitor to accept the
   cookie (wired to the same consent logic as the banner), and
   dismisses itself on Accept or the close (×) button.

   It only appears while consent hasn't been given yet, so repeat
   visitors never get nagged twice.
   ============================================================ */
export default function CookieCallout() {
  const [dismissed, setDismissed] = useState(false);
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(CONSENT_KEY)) setConsented(true);
    } catch {
      /* ignore storage errors */
    }
  }, []);

  if (consented || dismissed) return null;

  return (
    <div className="cookie-callout" role="dialog" aria-label="Accept cookies">
      <div className="cookie-callout-bubble">
        <button
          type="button"
          className="cookie-callout-x"
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
        >
          ×
        </button>
        <p className="cookie-callout-text">Please accept our cookie 🍪</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            applyConsent(DEFAULT_PREFS);
            setConsented(true);
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}