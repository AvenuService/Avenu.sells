import {
  createContext,
  useCallback,
  useContext,
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
  // step 1: verify username + password; generate complex code and fire webhook
  verifyCredentials: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  // step 2: match the code the operator reads from their Discord channel
  verifyCode: (code: string) => { ok: boolean; error?: string };
  clearError: () => void;
  logout: () => void;
  // expose the pending-code timestamp for UI hint (do NOT expose the code itself to UI)
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
          color: 0xC1E8FF, // ice blue accent in decimal
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
    // swallow — we never want a webhook failure to leak auth state to the UI
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useLocalStorage<Session | null>(SESSION_KEY, null);
  const authStateRef = useState<AuthState>({ status: "idle" });
  const [authState, setAuthState] = authStateRef;
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [pendingAt, setPendingAt] = useState<number | null>(null);

  const session = stored &&
    typeof stored.expiresAt === "number" &&
    stored.expiresAt > Date.now()
    ? stored
    : (() => {
        if (stored && stored.expiresAt <= Date.now() && typeof window !== "undefined") {
          setStored(null);
        }
        return null;
      })();

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
      const matches = normalize(code) === normalize(pendingCode);
      if (!matches) {
        setAuthState({ status: "error", message: "Wrong code. Check your Discord channel and try again." });
        return { ok: false, error: "Wrong code." };
      }
      const now = Date.now();
      const next: Session = {
        token: generateComplexCode(3, 6),
        issuedAt: now,
        expiresAt: now + SESSION_TTL,
      };
      setStored(next);
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
