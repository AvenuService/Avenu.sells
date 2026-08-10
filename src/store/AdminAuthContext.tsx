import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { generateComplexCode } from "../data/products";

// ---- Admin credentials (the single Avenu operator) ----
// NOTE: these live client-side in this build. A real production deploy
// should proxy the verify step through a serverless function so the
// secret never ships in the bundle. See README for the upgrade path.
const ADMIN_USERNAME = "avenuadmin";
const ADMIN_PASSWORD = "fuckingavenu_ismailtuff";

const WEBHOOK_URL =
  "https://discord.com/api/webhooks/1536156347274625135/7tsr4rpzMTxmPr_F2rh5Cl_ZNIIHYFPLwgAivXQ2vEGj3U6H0OHTdHWFTCi4pqD4ro28";

const SESSION_KEY = "avenu.admin.session.v1";
const SESSION_TTL = 1000 * 60 * 60 * 8; // 8 hours

type Session = {
  token: string;
  issuedAt: number;
  expiresAt: number;
};

type AuthState =
  | { status: "idle" }
  | { status: "credential-pending"; pendingCode: string }
  | { status: "error"; message: string };

type AdminAuthContextValue = {
  session: Session | null;
  isAuthenticated: boolean;
  authState: AuthState;
  verifyCredentials: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  verifyCode: (code: string) => { ok: boolean; error?: string };
  clearError: () => void;
  logout: () => void;
  pendingAt: number | null;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

async function postToWebhook(code: string, meta: { username: string; at: string }) {
  try {
    const payload = {
      embeds: [
        {
          title: "🔐 Avenu Admin — Login Code",
          description: "Use this code to complete your admin sign-in.",
          color: 0xc1e8ff,
          fields: [
            { name: "Operator", value: `\`${meta.username}\``, inline: true },
            { name: "Triggered", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
            { name: "Access Code", value: `## \`${code}\``, inline: false },
          ],
          footer: { text: "Avenu · avenu.sale admin panel" },
        },
      ],
      username: "Avenu Admin",
    };
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // swallow — a webhook failure must never leak auth state to the UI
  }
}

function isValidSession(s: Session | null): s is Session {
  return !!s && typeof s.expiresAt === "number" && s.expiresAt > Date.now();
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useLocalStorage<Session | null>(SESSION_KEY, null);
  const [authState, setAuthState] = useState<AuthState>({ status: "idle" });
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [pendingAt, setPendingAt] = useState<number | null>(null);

  // Clean expired sessions in an effect — NEVER during render.
  useEffect(() => {
    if (stored && !isValidSession(stored)) {
      setStored(null);
    }
  }, [stored, setStored]);

  // Recheck the session periodically (every minute) so expiry is enforced live.
  useEffect(() => {
    const t = window.setInterval(() => {
      if (stored && !isValidSession(stored)) setStored(null);
    }, 60_000);
    return () => window.clearInterval(t);
  }, [stored, setStored]);

  const session = isValidSession(stored) ? stored : null;
  const isAuthenticated = !!session;

  const verifyCredentials = useCallback<AdminAuthContextValue["verifyCredentials"]>(
    async (username, password) => {
      if (!username || !password) return { ok: false, error: "Enter your admin username and password." };
      if (username.trim() !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        setAuthState({ status: "error", message: "Invalid admin credentials." });
        return { ok: false, error: "Invalid admin credentials." };
      }
      const code = generateComplexCode(4, 5); // e.g. k8N3a-H7q2M-x9P1b-L4mZc
      setPendingCode(code);
      setPendingAt(Date.now());
      setAuthState({ status: "credential-pending", pendingCode: code });
      await postToWebhook(code, { username, at: new Date().toISOString() });
      return { ok: true };
    },
    [],
  );

  const verifyCode = useCallback<AdminAuthContextValue["verifyCode"]>(
    (code) => {
      if (!pendingCode) return { ok: false, error: "No pending login attempt." };
      const normalize = (s: string) => s.trim().toUpperCase().replace(/\s+/g, "");
      if (normalize(code) !== normalize(pendingCode)) {
        setAuthState({ status: "error", message: "Wrong code. Check your Discord channel and try again." });
        return { ok: false, error: "Wrong code." };
      }
      const now = Date.now();
      setStored({
        token: generateComplexCode(3, 6),
        issuedAt: now,
        expiresAt: now + SESSION_TTL,
      });
      setPendingCode(null);
      setPendingAt(null);
      setAuthState({ status: "idle" });
      return { ok: true };
    },
    [pendingCode, setStored],
  );

  const clearError = useCallback(() => setAuthState({ status: "idle" }), []);

  const logout = useCallback(() => {
    setStored(null);
    setPendingCode(null);
    setPendingAt(null);
    setAuthState({ status: "idle" });
  }, [setStored]);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      session,
      isAuthenticated,
      authState,
      verifyCredentials,
      verifyCode,
      clearError,
      logout,
      pendingAt,
    }),
    [session, isAuthenticated, authState, verifyCredentials, verifyCode, clearError, logout, pendingAt],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within <AdminAuthProvider>");
  return ctx;
}
