import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

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
   3D Canvas: Arm / Tray holding a realistic 3D Chocolate Chip Cookie
   ============================================================ */
function Cookie3DCanvas({ exiting }: { exiting: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const exitRef = useRef(exiting);
  exitRef.current = exiting;

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    let animId = 0;
    let disposed = false;

    const width = parent.clientWidth || 240;
    const height = parent.clientHeight || 200;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    parent.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    camera.position.set(0, 0.2, 4.8);

    // Lights - Warm bakery lighting + cyber accent
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 0.9);
    scene.add(ambientLight);

    const warmSpot = new THREE.SpotLight(0xffb76b, 3.5);
    warmSpot.position.set(2, 4, 3);
    warmSpot.angle = Math.PI / 4;
    warmSpot.penumbra = 0.5;
    scene.add(warmSpot);

    const rimLight = new THREE.DirectionalLight(0x76c7ff, 1.2);
    rimLight.position.set(-3, -1, -2);
    scene.add(rimLight);

    // Group holding the arm + cookie
    const characterGroup = new THREE.Group();
    // Start offscreen to the right
    characterGroup.position.set(5.5, -0.2, 0);
    scene.add(characterGroup);

    /* --- 1. The Robotic / Sleek Mech Arm --- */
    const armGroup = new THREE.Group();

    // Metallic material
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
    });

    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
    });

    // Forearm sleeve
    const forearmGeo = new THREE.CylinderGeometry(0.35, 0.45, 2.2, 16);
    forearmGeo.rotateZ(Math.PI / 2.8);
    const forearm = new THREE.Mesh(forearmGeo, metalMat);
    forearm.position.set(1.4, -0.6, -0.2);
    armGroup.add(forearm);

    // Cyan glowing stripe on forearm
    const stripeGeo = new THREE.TorusGeometry(0.42, 0.02, 8, 24);
    stripeGeo.rotateY(Math.PI / 2);
    stripeGeo.rotateZ(Math.PI / 2.8);
    const stripe = new THREE.Mesh(stripeGeo, glowMat);
    stripe.position.set(1.1, -0.48, -0.15);
    armGroup.add(stripe);

    // Mechanical Wrist / Palm
    const wristGeo = new THREE.SphereGeometry(0.32, 16, 16);
    const wrist = new THREE.Mesh(wristGeo, metalMat);
    wrist.position.set(0.45, -0.22, 0);
    armGroup.add(wrist);

    // Mechanical Fingers holding the cookie
    const fingerMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.7,
      roughness: 0.3,
    });

    for (let i = 0; i < 3; i++) {
      const finger = new THREE.Group();
      const angle = (i - 1) * 0.55;

      const phalanx1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.07, 0.4, 8),
        fingerMat,
      );
      phalanx1.position.y = 0.2;
      finger.add(phalanx1);

      const phalanx2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.06, 0.35, 8),
        fingerMat,
      );
      phalanx2.position.y = 0.5;
      phalanx2.rotation.z = -0.4;
      finger.add(phalanx2);

      finger.position.set(0.3, -0.1, (i - 1) * 0.25);
      finger.rotation.z = -0.6 + angle * 0.2;
      finger.rotation.x = angle * 0.3;
      armGroup.add(finger);
    }

    characterGroup.add(armGroup);

    /* --- 2. The Realistic 3D Chocolate Chip Cookie --- */
    const cookieGroup = new THREE.Group();
    cookieGroup.position.set(0, 0.05, 0.1);

    // Cookie dough texture geometry
    const cookieGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.26, 32, 4);

    // Displace vertices slightly for baked organic shape
    const posAttr = cookieGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);
      const dist = Math.sqrt(x * x + z * z);

      // Random crackle bump
      const noise =
        (Math.sin(x * 12) + Math.cos(z * 12) + Math.sin(y * 20)) * 0.035;
      const edgeFalloff = dist > 0.7 ? (dist - 0.7) * 0.2 : 0;

      posAttr.setX(i, x + (Math.random() - 0.5) * 0.03);
      posAttr.setY(i, y + noise - edgeFalloff);
      posAttr.setZ(i, z + (Math.random() - 0.5) * 0.03);
    }
    cookieGeo.computeVertexNormals();

    // Warm golden baked dough material
    const doughMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Golden amber
      roughness: 0.85,
      metalness: 0.05,
    });
    const cookieMesh = new THREE.Mesh(cookieGeo, doughMat);
    cookieMesh.rotation.x = 0.4;
    cookieMesh.rotation.z = -0.2;
    cookieGroup.add(cookieMesh);

    // Dark Chocolate Chips
    const chipMat = new THREE.MeshStandardMaterial({
      color: 0x271306, // Deep rich chocolate
      roughness: 0.35,
      metalness: 0.1,
    });

    const chipGeo = new THREE.DodecahedronGeometry(0.12, 1);

    // Place 10 chocolate chips randomly on top surface
    const chipPositions = [
      [0.2, 0.14, 0.3],
      [-0.3, 0.13, 0.2],
      [0.4, 0.12, -0.2],
      [-0.2, 0.14, -0.4],
      [0.0, 0.15, 0.0],
      [-0.5, 0.11, -0.1],
      [0.35, 0.13, 0.1],
      [-0.1, 0.13, 0.5],
      [0.1, 0.12, -0.5],
      [-0.4, 0.12, 0.35],
    ];

    chipPositions.forEach(([cx, cy, cz]) => {
      const chip = new THREE.Mesh(chipGeo, chipMat);
      chip.position.set(cx, cy, cz);
      chip.scale.set(
        0.8 + Math.random() * 0.6,
        0.5 + Math.random() * 0.4,
        0.8 + Math.random() * 0.6,
      );
      chip.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );
      cookieGroup.add(chip);
    });

    characterGroup.add(cookieGroup);

    /* --- 3. Floating Golden Crumbs & Magic Sparkles --- */
    const particleCount = 28;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 2.2;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 1.8;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));

    const pMat = new THREE.PointsMaterial({
      color: 0xfcb352,
      size: 0.06,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(pGeo, pMat);
    characterGroup.add(particles);

    /* --- Mouse Tracking Interactivity --- */
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handlePointerMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.targetX = nx * 0.4;
      mouse.targetY = ny * 0.3;
    };
    window.addEventListener("mousemove", handlePointerMove, { passive: true });

    /* --- Animation Loop --- */
    const clock = new THREE.Clock();
    let currentX = 5.5; // Slide in from right

    function animate() {
      if (disposed) return;
      animId = requestAnimationFrame(animate);

      const dt = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth Entrance / Exit Slide
      const targetX = exitRef.current ? 6.0 : 0.0;
      currentX += (targetX - currentX) * Math.min(dt * 5, 0.2);
      characterGroup.position.x = currentX;

      // Mouse Lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.1;
      mouse.y += (mouse.targetY - mouse.y) * 0.1;

      // Gentle floating animation
      characterGroup.position.y = -0.15 + Math.sin(elapsed * 1.8) * 0.08 + mouse.y * 0.3;
      characterGroup.rotation.y = mouse.x * 0.5;
      characterGroup.rotation.x = -mouse.y * 0.3;

      // Spin Cookie gently
      cookieGroup.rotation.y = elapsed * 0.6;
      cookieGroup.rotation.z = Math.sin(elapsed * 1.2) * 0.1;

      // Orbit particles
      particles.rotation.y = elapsed * 0.3;

      renderer.render(scene, camera);
    }

    animate();

    // Resize listener
    const handleResize = () => {
      if (!parent || disposed) return;
      const w = parent.clientWidth || 240;
      const h = parent.clientHeight || 200;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      cookieGeo.dispose();
      doughMat.dispose();
      chipGeo.dispose();
      chipMat.dispose();
      forearmGeo.dispose();
      wristGeo.dispose();
      metalMat.dispose();
      glowMat.dispose();
      fingerMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      if (renderer.domElement.parentNode === parent) {
        parent.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "220px",
        height: "180px",
        position: "relative",
        flexShrink: 0,
        pointerEvents: "none",
      }}
    />
  );
}

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

            {/* Right Interactive 3D Model */}
            <Cookie3DCanvas exiting={isExiting} />
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