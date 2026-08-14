/**
 * Diagnostic Component - Shows app health & config status
 * Used to troubleshoot loading issues on Vercel
 */

import { useState, useEffect } from "react";
import { supabaseConfigured } from "../store/supabaseClient";

export function AppDiagnostic() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;
  const nodeEnv = import.meta.env.MODE;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        zIndex: 9999,
        maxWidth: "320px",
        padding: "1rem",
        background: supabaseConfigured ? "#0a5d0a" : "#5d0a0a",
        border: "1px solid " + (supabaseConfigured ? "#0f9d0f" : "#9d0f0f"),
        borderRadius: "8px",
        color: "#f0f0f0",
        fontSize: "0.75rem",
        lineHeight: "1.4",
        fontFamily: "monospace",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
      }}
    >
      <div style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>
        {supabaseConfigured ? "✓ App Ready" : "⚠ Config Issue"}
      </div>

      <div style={{ marginBottom: "0.3rem" }}>
        <strong>Environment:</strong> {nodeEnv}
      </div>

      <div style={{ marginBottom: "0.3rem" }}>
        <strong>Supabase Configured:</strong> {supabaseConfigured ? "Yes" : "No"}
      </div>

      {!supabaseConfigured && (
        <>
          <div style={{ marginBottom: "0.3rem", color: "#faa" }}>
            <strong>Missing:</strong>
            {!supabaseUrl && " URL"}
            {!supabaseUrl && !supabaseKey && " +"} {!supabaseKey && " ANON_KEY"}
          </div>
          <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.2)", fontSize: "0.7rem" }}>
            <p style={{ margin: "0 0 0.3rem 0" }}>
              To fix: Set these Vercel env vars:
            </p>
            <code>VITE_SUPABASE_URL</code>
            <br />
            <code>VITE_SUPABASE_ANON_KEY</code>
          </div>
        </>
      )}

      {supabaseConfigured && (
        <div style={{ fontSize: "0.7rem", marginTop: "0.5rem", opacity: 0.8 }}>
          Ready to load catalog & auth
        </div>
      )}
    </div>
  );
}

export function DiagnosticOverlay() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        setShow((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return show ? <AppDiagnostic /> : null;
}
