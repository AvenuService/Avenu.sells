import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

type SceneHandle = {
  dispose: () => void;
};

export default function Scene3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;

    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x021024, 0.055);

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    // ---- Environment (procedural gradient cube for reflections) ----
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    const envGeo = new THREE.SphereGeometry(50, 32, 32);
    const envMat = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      vertexColors: false,
    });
    // Gradient texture (vertical ice -> deep navy)
    const cnv = document.createElement("canvas");
    cnv.width = 4;
    cnv.height = 256;
    const cx = cnv.getContext("2d")!;
    const grad = cx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#C1E8FF");
    grad.addColorStop(0.45, "#5483B3");
    grad.addColorStop(1, "#021024");
    cx.fillStyle = grad;
    cx.fillRect(0, 0, 4, 256);
    const envTex = new THREE.CanvasTexture(cnv);
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    envMat.map = envTex;
    const envMesh = new THREE.Mesh(envGeo, envMat);
    envScene.add(envMesh);
    const envRT = pmrem.fromScene(envScene as unknown as THREE.Scene);
    scene.environment = envRT.texture;

    // ---- Crystal (faceted icosahedron, glass-like material) ----
    const crystalGeo = new THREE.IcosahedronGeometry(1.6, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x9fd8ff,
      metalness: 0.15,
      roughness: 0.08,
      transmission: 0.85,
      thickness: 1.5,
      ior: 1.45,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.4,
      transparent: true,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.set(0, 0, 0);
    scene.add(crystal);

    // Inner glowing core
    const coreGeo = new THREE.IcosahedronGeometry(0.55, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xC1E8FF,
      transparent: true,
      opacity: 0.65,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // Wireframe halo
    const haloGeo = new THREE.IcosahedronGeometry(1.65, 1);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x7DA0CA,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    scene.add(halo);

    // ---- Lights ----
    const keyLight = new THREE.DirectionalLight(0xC1E8FF, 1.4);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x5483B3, 0.9);
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0xC1E8FF, 1.2, 12);
    fillLight.position.set(0, 0, 3);
    scene.add(fillLight);

    // ---- Particle field ----
    const PARTICLE_COUNT = 220;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(PARTICLE_COUNT * 3);
    const pAlpha = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = 2.5 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPos[i * 3 + 2] = r * Math.cos(phi);
      pAlpha[i] = Math.random();
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute("alpha", new THREE.BufferAttribute(pAlpha, 1));

    const pMat = new THREE.PointsMaterial({
      size: 0.03,
      color: 0xC1E8FF,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // ---- Post-processing: bloom for the glow ----
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(mount.clientWidth, mount.clientHeight),
      0.85, // strength
      0.55, // radius
      0.15, // threshold
    );
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    // ---- Mouse parallax ----
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    function onMove(e: MouseEvent) {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      mouse.tx = nx * 0.4;
      mouse.ty = -ny * 0.3;
    }
    window.addEventListener("mousemove", onMove);

    // ---- Scroll progress drives camera orbit + crystal color ----
    let scrollProgress = 0;
    function onScroll() {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollProgress = Math.min(1, Math.max(0, window.scrollY / max));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Color stations: ice (top) -> deep navy (mid) -> frozen cyan (bottom)
    const colorTop = new THREE.Color(0x9fd8ff);
    const colorMid = new THREE.Color(0x0a3568);
    const colorBot = new THREE.Color(0xC1E8FF);

    // ---- Resize ----
    function onResize() {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    }
    window.addEventListener("resize", onResize);

    // ---- Animation loop ----
    const clock = new THREE.Clock();
    let visible = true;
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0 },
    );
    io.observe(mount);

    function tick() {
      rafRef.current = requestAnimationFrame(tick);
      if (!visible) return;

      const t = clock.getElapsedTime();
      const dt = Math.min(clock.getDelta?.() ?? 0.016, 0.05);

      // Smooth mouse
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;

      // Crystal rotation
      if (!prefersReduced) {
        crystal.rotation.y += 0.0035 + mouse.x * 0.01;
        crystal.rotation.x += 0.0015 + mouse.y * 0.008;
        halo.rotation.y -= 0.0022;
        halo.rotation.x -= 0.0011;
        core.rotation.y += 0.04;
        core.scale.setScalar(1 + Math.sin(t * 1.8) * 0.06);
        particles.rotation.y += 0.0008;
        particles.rotation.x += 0.0004;
      }

      // Scroll-driven orbit + camera dolly
      // Camera orbits a quarter turn + pulls closer as you scroll.
      const angle = scrollProgress * Math.PI * 0.6;
      const radius = 6 - scrollProgress * 1.4;
      camera.position.x = Math.sin(angle) * radius + mouse.x * 0.6;
      camera.position.y = scrollProgress * 1.4 + mouse.y * 0.6;
      camera.position.z = Math.cos(angle) * radius;
      camera.lookAt(0, 0, 0);

      // Scroll-driven crystal color (3-stop gradient)
      const c = new THREE.Color();
      if (scrollProgress < 0.5) {
        c.copy(colorTop).lerp(colorMid, scrollProgress * 2);
      } else {
        c.copy(colorMid).lerp(colorBot, (scrollProgress - 0.5) * 2);
      }
      crystalMat.color.copy(c);
      coreMat.color.copy(c).lerp(new THREE.Color(0xffffff), 0.3);

      // Bloom intensity grows slightly with scroll
      bloom.strength = 0.7 + scrollProgress * 0.5;

      // t is unused outside of prefersReduced check, dt unused except future use
      void t; void dt;

      composer.render();
    }
    tick();

    // ---- Dispose ----
    const handle: SceneHandle = {
      dispose: () => {
        cancelAnimationFrame(rafRef.current);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
        io.disconnect();
        composer.dispose();
        renderer.dispose();
        crystalGeo.dispose();
        crystalMat.dispose();
        coreGeo.dispose();
        coreMat.dispose();
        haloGeo.dispose();
        haloMat.dispose();
        pGeo.dispose();
        pMat.dispose();
        envGeo.dispose();
        envMat.dispose();
        envTex.dispose();
        pmrem.dispose();
        if (renderer.domElement.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
      },
    };
    // stash for cleanup
    (mount as unknown as { __scene3d?: SceneHandle }).__scene3d = handle;

    return () => handle.dispose();
  }, []);

  return (
    <div
      ref={mountRef}
      className="scene-3d-mount"
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
