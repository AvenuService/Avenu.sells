import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/* ============================================================
   High-Quality 3D Cookie Model for Account Profile
   - Professional Spline-style rendering
   - MSAA Anti-aliasing + optimal pixel ratio
   - Realistic PBR lighting & materials
   - Interactive mouse tracking
   ============================================================ */

export default function CookieModel3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    let animId = 0;
    let disposed = false;

    const width = parent.clientWidth || 320;
    const height = parent.clientHeight || 320;

    let renderer: THREE.WebGLRenderer;
    try {
      // High-quality rendering settings
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        precision: "highp",
        stencil: false,
        preserveDrawingBuffer: false,
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    // Optimal pixel ratio for crisp rendering
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);

    // Professional tone mapping & color space
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    parent.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.1, 3.5);

    /* ============================================================
       Professional Bakery Lighting Setup
       - Key light (warm bakery fill)
       - Rim light (definition)
       - Fill light (soft shadows)
       - IBL environment (realistic reflections)
       ============================================================ */

    // Soft ambient for fill
    const ambientLight = new THREE.AmbientLight(0xfff5e6, 0.65);
    scene.add(ambientLight);

    // Key light - warm bakery glow (3/4 front)
    const keyLight = new THREE.DirectionalLight(0xffd9a8, 1.8);
    keyLight.position.set(2.5, 2.2, 2.8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.camera.left = -5;
    keyLight.shadow.camera.right = 5;
    keyLight.shadow.camera.top = 5;
    keyLight.shadow.camera.bottom = -5;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Rim light - cool accent for depth
    const rimLight = new THREE.DirectionalLight(0x87ceeb, 0.9);
    rimLight.position.set(-2.2, 1.5, -2.5);
    scene.add(rimLight);

    // Soft fill from below
    const fillLight = new THREE.DirectionalLight(0xfff0e6, 0.5);
    fillLight.position.set(0, -1.5, 1.2);
    scene.add(fillLight);

    /* ============================================================
       Realistic Cookie Materials (PBR)
       ============================================================ */

    // Main dough body - glazed baked finish
    const doughMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4872e, // Rich golden brown
      metalness: 0.08,
      roughness: 0.65,
      emissive: 0x3d1f0f,
      emissiveIntensity: 0.15,
      side: THREE.FrontSide,
      shadowSide: THREE.BackSide,
    });

    // Chocolate chips - realistic dark chocolate
    const chipMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a0f08, // Deep chocolate
      metalness: 0.15,
      roughness: 0.45,
      emissive: 0x0a0704,
      emissiveIntensity: 0.08,
    });

    // Crumb edges - slightly lighter, slightly rough
    const crumbMaterial = new THREE.MeshStandardMaterial({
      color: 0xc9723b,
      metalness: 0.05,
      roughness: 0.8,
    });

    /* ============================================================
       Geometry: Main Cookie (Cylinder with organic distortion)
       ============================================================ */

    const cookieGeometry = new THREE.CylinderGeometry(1.0, 1.05, 0.3, 48, 6);

    // Organic vertex displacement for realistic baked texture
    const positions = cookieGeometry.attributes.position;
    const posArray = positions.array as Float32Array;

    const noise = {
      perlin: (x: number, y: number) => {
        // Pseudo-Perlin noise for organic look
        const xi = Math.floor(x) & 255;
        const yi = Math.floor(y) & 255;
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);
        const u = xf * xf * (3 - 2 * xf);
        const v = yf * yf * (3 - 2 * yf);

        const n00 = Math.sin(xi * 12.9898 + yi * 78.233) * 43758.5453;
        const n10 = Math.sin((xi + 1) * 12.9898 + yi * 78.233) * 43758.5453;
        const n01 = Math.sin(xi * 12.9898 + (yi + 1) * 78.233) * 43758.5453;
        const n11 = Math.sin((xi + 1) * 12.9898 + (yi + 1) * 78.233) * 43758.5453;

        const nx0 = n00 - Math.floor(n00);
        const nx1 = n10 - Math.floor(n10);
        const ny0 = n01 - Math.floor(n01);
        const ny1 = n11 - Math.floor(n11);

        const nxy0 = nx0 + (nx1 - nx0) * u;
        const nxy1 = ny0 + (ny1 - ny0) * u;
        return nxy0 + (nxy1 - nxy0) * v;
      },
    };

    for (let i = 0; i < posArray.length; i += 3) {
      const x = posArray[i];
      const y = posArray[i + 1];
      const z = posArray[i + 2];

      const dist = Math.sqrt(x * x + z * z);
      const angle = Math.atan2(z, x);

      // Add multi-scale noise for realistic surface
      const surfaceNoise =
        noise.perlin(x * 6, z * 6) * 0.04 +
        noise.perlin(x * 12, z * 12) * 0.02 +
        noise.perlin(x * 25, z * 25) * 0.01;

      // Slightly raised edges (cookie rises when baking)
      const edgeRise = Math.max(0, (dist - 0.8) * 0.15);

      posArray[i] = x + Math.cos(angle) * surfaceNoise * 0.5;
      posArray[i + 1] = y + edgeRise + surfaceNoise;
      posArray[i + 2] = z + Math.sin(angle) * surfaceNoise * 0.5;
    }

    cookieGeometry.computeVertexNormals();

    const cookieMesh = new THREE.Mesh(cookieGeometry, doughMaterial);
    cookieMesh.castShadow = true;
    cookieMesh.receiveShadow = true;
    cookieMesh.rotation.x = 0.35;
    cookieMesh.rotation.z = -0.15;
    scene.add(cookieMesh);

    /* ============================================================
       Chocolate Chips (Realistic Placement)
       ============================================================ */

    const chipGeo = new THREE.IcosahedronGeometry(0.14, 3);
    const chipPositions = [
      { pos: [0.35, 0.18, 0.25], scale: [1.1, 0.7, 0.95] },
      { pos: [-0.4, 0.16, 0.15], scale: [0.9, 0.65, 0.85] },
      { pos: [0.55, 0.14, -0.2], scale: [1.0, 0.72, 0.9] },
      { pos: [-0.25, 0.17, -0.35], scale: [0.85, 0.68, 0.78] },
      { pos: [0.1, 0.19, 0.0], scale: [1.15, 0.75, 1.0] },
      { pos: [-0.55, 0.12, -0.05], scale: [0.95, 0.62, 0.88] },
      { pos: [0.45, 0.15, 0.4], scale: [1.05, 0.7, 0.92] },
      { pos: [-0.15, 0.16, 0.5], scale: [0.9, 0.68, 0.82] },
      { pos: [0.2, 0.13, -0.4], scale: [0.88, 0.65, 0.8] },
      { pos: [-0.5, 0.15, 0.3], scale: [1.0, 0.7, 0.95] },
    ];

    chipPositions.forEach(({ pos, scale }) => {
      const chip = new THREE.Mesh(chipGeo, chipMaterial);
      chip.position.set(pos[0], pos[1], pos[2]);
      chip.scale.set(scale[0], scale[1], scale[2]);
      chip.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );
      chip.castShadow = true;
      chip.receiveShadow = true;
      scene.add(chip);
    });

    /* ============================================================
       Crumb Details (Scattered surface texture)
       ============================================================ */

    const crumbGeo = new THREE.TetrahedronGeometry(0.06, 0);
    for (let i = 0; i < 12; i++) {
      const crumb = new THREE.Mesh(crumbGeo, crumbMaterial);
      const angle = (i / 12) * Math.PI * 2;
      const dist = 0.7 + Math.random() * 0.25;

      crumb.position.set(
        Math.cos(angle) * dist,
        0.17 + Math.random() * 0.02,
        Math.sin(angle) * dist,
      );
      crumb.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );
      crumb.scale.multiplyScalar(0.7 + Math.random() * 0.4);
      crumb.castShadow = true;
      crumb.receiveShadow = true;
      scene.add(crumb);
    }

    /* ============================================================
       Dust Particles & Sparkles (Subtle ambient details)
       ============================================================ */

    const particleCount = 35;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 3.5;
      particlePositions[i * 3 + 1] = -0.5 + Math.random() * 2.5;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 2.8;
      particleSizes[i] = Math.random() * 0.08;
    }

    particleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3),
    );
    particleGeo.setAttribute("size", new THREE.BufferAttribute(particleSizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffd4a8,
      size: 0.08,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeo, particleMaterial);
    scene.add(particles);

    /* ============================================================
       Mouse Interactivity
       ============================================================ */

    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      mouse.targetX = nx * 0.5;
      mouse.targetY = ny * 0.4;
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });

    /* ============================================================
       Animation Loop
       ============================================================ */

    const clock = new THREE.Clock();
    let frameCount = 0;

    function animate() {
      if (disposed) return;
      animId = requestAnimationFrame(animate);
      frameCount++;

      const dt = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth mouse tracking
      mouse.x += (mouse.targetX - mouse.x) * 0.15;
      mouse.y += (mouse.targetY - mouse.y) * 0.15;

      // Gentle rotation and tilt
      cookieMesh.rotation.y += dt * 0.3 + mouse.x * 0.02;
      cookieMesh.rotation.x = 0.35 - mouse.y * 0.2;
      cookieMesh.rotation.z = -0.15 + mouse.x * 0.1;

      // Subtle floating motion
      cookieMesh.position.y = Math.sin(elapsed * 0.8) * 0.08;

      // Rotate particles slowly
      particles.rotation.y = elapsed * 0.15;
      particles.rotation.x = Math.sin(elapsed * 0.5) * 0.1;

      // Animate particle opacity
      const particleOpacity = 0.5 + Math.sin(elapsed * 1.5) * 0.2;
      particleMaterial.opacity = particleOpacity;

      if (frameCount === 1) {
        setIsLoading(false);
      }

      renderer.render(scene, camera);
    }

    animate();

    /* ============================================================
       Responsive Resize Handler
       ============================================================ */

    const handleResize = () => {
      if (!parent || disposed) return;

      const newWidth = parent.clientWidth || 320;
      const newHeight = parent.clientHeight || 320;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    /* ============================================================
       Cleanup
       ============================================================ */

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("resize", handleResize);

      renderer.dispose();
      cookieGeometry.dispose();
      doughMaterial.dispose();
      chipGeo.dispose();
      chipMaterial.dispose();
      crumbGeo.dispose();
      crumbMaterial.dispose();
      particleGeo.dispose();
      particleMaterial.dispose();

      if (renderer.domElement.parentNode === parent) {
        parent.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (webglFailed) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "5rem",
          opacity: 0.6,
        }}
      >
        🍪
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        borderRadius: "12px",
        overflow: "hidden",
        opacity: isLoading ? 0.5 : 1,
        transition: "opacity 0.6s ease",
        background: "radial-gradient(circle, rgba(15,23,42,0.4) 0%, rgba(10,15,29,0.8) 100%)",
      }}
    />
  );
}
