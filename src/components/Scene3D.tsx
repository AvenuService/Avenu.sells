import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

type SceneHandle = { dispose: () => void };

const ICE_TOP = new THREE.Color(0x4a82b8);
const ICE_MID = new THREE.Color(0x0a2240);
const ICE_BOT = new THREE.Color(0x629ad0);

const PARTICLE_COUNT = 700;

function errToMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return typeof e === "string" ? e : "[unknown error]";
}

export default function Scene3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const isMobile = window.matchMedia?.("(max-width: 720px)").matches ?? false;

    let disposed = false;

    try {
      init();
    } catch (e) {
      console.warn("[Scene3D] WebGL init failed:", errToMessage(e));
    }

    function init() {
      const parent = mount;
      if (!parent || disposed) return;

      const size = () => parent.clientWidth || window.innerWidth;
      const hsize = () => parent.clientHeight || window.innerHeight;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);

      const canvas = document.createElement("canvas");
      canvas.style.display = "block";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      parent.appendChild(canvas);

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
        });
      } catch (e) {
        console.warn("[Scene3D] WebGL unavailable — aborting:", errToMessage(e));
        parent.removeChild(canvas);
        return;
      }

      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(size(), hsize());
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.72;
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x020a16, 0.05);

      const camera = new THREE.PerspectiveCamera(
        42,
        size() / hsize(),
        0.1,
        300,
      );
      camera.position.set(0, 0, 6.5);

      /* ============================================================
         Environment — multi-stop baked gradient w/ horizon glow
         (Two layers: ice-cream top, navy horizon, deep floor, ambient fill.)
         ============================================================ */
      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();

      const cnv = document.createElement("canvas");
      cnv.width = 16;
      cnv.height = 256;
      const cx = cnv.getContext("2d")!;
      const grad = cx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0.0, "#1e3a58");
      grad.addColorStop(0.35, "#132742");
      grad.addColorStop(0.5, "#0b1b30");
      grad.addColorStop(0.52, "#061224");
      grad.addColorStop(0.75, "#030a18");
      grad.addColorStop(1.0, "#01050e");
      cx.fillStyle = grad;
      cx.fillRect(0, 0, 16, 256);
      cx.globalCompositeOperation = "lighter";
      cx.fillStyle = "rgba(120, 180, 230, 0.15)";
      cx.fillRect(0, 124, 16, 8);
      cx.globalCompositeOperation = "source-over";
      const envTex = new THREE.CanvasTexture(cnv);
      envTex.mapping = THREE.EquirectangularReflectionMapping;
      envTex.colorSpace = THREE.SRGBColorSpace;

      const envScene = new THREE.Scene();
      const envGeo = new THREE.SphereGeometry(50, 32, 32);
      const envMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide });
      envMat.map = envTex;
      const envMesh = new THREE.Mesh(envGeo, envMat);
      envScene.add(envMesh);
      const envRT = pmrem.fromScene(envScene, 0.025);
      scene.environment = envRT.texture;

      /* ============================================================
         Crystal — custom ShaderMaterial (fresnel rim + iridescence +
         transmission-distortion of the env via procedural noise)
         ============================================================ */
      const crystalGeo = new THREE.IcosahedronGeometry(1.55, 1);

      const crystalMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: ICE_TOP.clone() },
          uRimColor: { value: new THREE.Color(0xffffff) },
          uEnv: { value: scene.environment },
          uTransmission: { value: 0.86 },
          uIor: { value: 1.45 },
          uThickness: { value: 1.6 },
          uFresnelPower: { value: 2.2 },
          uDistort: { value: 0.35 },
          uOpacity: { value: 0.92 },
          uReveal: { value: 1.0 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vNormalW;
          varying vec3 vViewDir;
          varying vec3 vPos;
          varying float vNoise;

          uniform float uTime;

          // 3D simplex-ish hash noise (cheap, decent quality)
          float hash(vec3 p) {
            p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
            p *= 17.0;
            return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
          }
          float noise(vec3 p) {
            vec3 i = floor(p);
            vec3 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                  mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
              mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                  mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
              f.z
            );
          }

          void main() {
            vec3 pos = position;
            // gentle breathing + facet shimmer
            vNoise = noise(normal * 2.0 + uTime * 0.15);
            pos += normal * (sin(uTime * 0.7 + vNoise * 6.0) * 0.018);
            vec4 wp = modelMatrix * vec4(pos, 1.0);
            vNormalW = normalize(mat3(modelMatrix) * normal);
            vViewDir = normalize(cameraPosition - wp.xyz);
            vPos = wp.xyz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }
        `,
        fragmentShader: /* glsl */ `
          precision highp float;

          varying vec3 vNormalW;
          varying vec3 vViewDir;
          varying vec3 vPos;
          varying float vNoise;

          uniform float uTime;
          uniform vec3 uColor;
          uniform vec3 uRimColor;
          uniform sampler2D uEnv;
          uniform float uTransmission;
          uniform float uIor;
          uniform float uThickness;
          uniform float uFresnelPower;
          uniform float uDistort;
          uniform float uOpacity;
          uniform float uReveal;

          // 2D hash for screen distortion
          float hash2(vec2 p) {
            return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453);
          }

          vec3 sampleEnv(vec3 dir, float distort) {
            // distortion wobble keyed to world position + time
            vec3 d = normalize(dir + vec3(
              sin(vPos.y * 2.0 + uTime * 0.6) * distort,
              cos(vPos.x * 2.0 + uTime * 0.5) * distort,
              sin(vPos.z * 1.7 + uTime * 0.4) * distort
            ));
            // equirect sample
            float u = 0.5 + atan(d.z, d.x) / (2.0 * 3.14159265);
            float v = 0.5 - asin(clamp(d.y, -1.0, 1.0)) / 3.14159265;
            return texture2D(uEnv, vec2(u, v)).rgb;
          }

          void main() {
            vec3 N = normalize(vNormalW);
            vec3 V = normalize(vViewDir);
            // fresnel — soft rim, accentuated
            float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), uFresnelPower);

            // refraction via Snell (cheap, no per-pixel thickness map)
            float eta = 1.0 / uIor;
            vec3 refr = refract(-V, N, eta);
            vec3 envR = sampleEnv(reflect(-V, N), uDistort * 0.5);
            vec3 envT = sampleEnv(refr, uDistort);

            // iridescent shimmer along the rim
            float irid = 0.5 + 0.5 * sin(fres * 9.0 + uTime * 0.6 + vPos.x * 3.0);
            vec3 rimGlow = mix(uRimColor, uColor, 0.35) * irid * fres;

            // body is mostly the soft transmission color + a tint of uColor
            vec3 base = mix(envT * uTransmission, envR, 0.35);
            base = mix(base, uColor, 0.18);

            vec3 col = base + rimGlow * 1.4;
            col += uColor * 0.05; // slight ambient fill

            // subtle internal glow that pulses
            col += uRimColor * (0.04 + 0.04 * sin(uTime * 1.6 + vNoise * 4.0)) * fres;

            float a = clamp(uOpacity * (0.55 + 0.45 * fres), 0.0, 1.0) * uReveal;

            gl_FragColor = vec4(col, a);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      scene.add(crystal);

      /* Inner core — bright pinpoint glow */
      const coreGeo = new THREE.IcosahedronGeometry(0.5, 2);
      const coreMat = new THREE.MeshBasicMaterial({
        color: ICE_BOT.clone(),
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      scene.add(core);

      /* Wireframe halo */
      const haloGeo = new THREE.IcosahedronGeometry(1.85, 1);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0x7da0ca,
        wireframe: true,
        transparent: true,
        opacity: 0.16,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      scene.add(halo);

      /* Icy orbit rings — three tilted tubes routed on CatmullRom curves */
      const rings: THREE.Mesh[] = [];
      const ringMatBase = new THREE.MeshStandardMaterial({
        color: 0xc1e8ff,
        metalness: 0.85,
        roughness: 0.18,
        transparent: true,
        opacity: 0.55,
        envMapIntensity: 1.4,
        emissive: new THREE.Color(0x2f6fae),
        emissiveIntensity: 0.35,
      });

      function makeRing(radius: number, tube: number, tilt: [number, number]) {
        const segs = 28;
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= segs; i++) {
          const a = (i / segs) * Math.PI * 2;
          pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
        }
        const curve = new THREE.CatmullRomCurve3(pts, true);
        const geo = new THREE.TubeGeometry(curve, 220, tube, 8, true);
        const mat = ringMatBase.clone();
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = tilt[0];
        mesh.rotation.y = tilt[1];
        scene.add(mesh);
        rings.push(mesh);
      }
      makeRing(2.45, 0.012, [Math.PI * 0.35, Math.PI * 0.18]);
      makeRing(2.85, 0.010, [Math.PI * 0.62, -Math.PI * 0.22]);
      makeRing(3.25, 0.008, [Math.PI * 0.5, Math.PI * 0.55]);

      /* ============================================================
         Particle field — custom shader, per-particle alpha + size +
         curl-noise swirl driven on CPU. Additive blending, soft round
         point sprite (no fixed-size squares).
         ============================================================ */
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(PARTICLE_COUNT * 3);
      const pSeed = new Float32Array(PARTICLE_COUNT * 3);
      const pAlpha = new Float32Array(PARTICLE_COUNT);
      const pSize = new Float32Array(PARTICLE_COUNT);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const r = 2.6 + Math.random() * 4.4;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        pPos[i * 3] = x;
        pPos[i * 3 + 1] = y;
        pPos[i * 3 + 2] = z;
        pSeed[i * 3] = x;
        pSeed[i * 3 + 1] = y;
        pSeed[i * 3 + 2] = z;
        pAlpha[i] = 0.05 + Math.random() * 0.25;
        pSize[i] = 6.0 + Math.random() * 18.0;
      }
      pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
      pGeo.setAttribute("aSeed", new THREE.BufferAttribute(pSeed, 3));
      pGeo.setAttribute("aAlpha", new THREE.BufferAttribute(pAlpha, 1));
      pGeo.setAttribute("aSize", new THREE.BufferAttribute(pSize, 1));

      const pMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: ICE_BOT.clone() },
          uPixelRatio: { value: pixelRatio },
          uReveal: { value: 1.0 },
        },
        vertexShader: /* glsl */ `
          attribute vec3 aSeed;
          attribute float aAlpha;
          attribute float aSize;
          uniform float uTime;
          uniform float uPixelRatio;
          varying float vAlpha;
          varying float vTwinkle;

          float hash(vec3 p) {
            p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
            p *= 17.0;
            return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
          }

          void main() {
            // gentle swirl around origin using a tiny curl-like field
            float t = uTime * 0.12;
            vec3 p = position;
            float ang = t * (0.25 + hash(aSeed) * 0.6);
            float s = sin(ang);
            float c = cos(ang);
            p.xz = mat2(c, -s, s, c) * p.xz;
            p.y += sin(uTime * 0.5 + hash(aSeed) * 6.28) * 0.18;

            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            float dist = -mv.z;
            gl_PointSize = clamp(aSize * (300.0 / dist) * uPixelRatio * 0.5, 1.0, 60.0);

            vAlpha = aAlpha;
            vTwinkle = 0.55 + 0.45 * sin(uTime * (1.2 + hash(aSeed) * 3.0) + hash(aSeed) * 12.0);
          }
        `,
        fragmentShader: /* glsl */ `
          precision highp float;
          varying float vAlpha;
          varying float vTwinkle;
          uniform vec3 uColor;

          void main() {
            // soft round sprite, sharper core, soft falloff
            vec2 uv = gl_PointCoord * 2.0 - 1.0;
            float d = dot(uv, uv);
            if (d > 1.0) discard;
            float a = (1.0 - d);
            a = pow(a, 1.6);
            vec3 col = uColor * (0.85 + vTwinkle * 0.55);
            gl_FragColor = vec4(col, a * vAlpha * vTwinkle);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const particles = new THREE.Points(pGeo, pMat);
      scene.add(particles);

      /* ============================================================
         Lighting — key + rim + fill + soft hemispheric upwash
         ============================================================ */
      scene.add(new THREE.HemisphereLight(0x4a82b8, 0x01050e, 0.25));
      const keyLight = new THREE.DirectionalLight(0xa5d4ff, 0.65);
      keyLight.position.set(3, 4.5, 5);
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0x38618c, 0.4);
      rimLight.position.set(-4, -2, -3);
      scene.add(rimLight);
      const fillLight = new THREE.PointLight(0x7fb8eb, 0.5, 16, 1.8);
      fillLight.position.set(0, 0, 3.2);
      scene.add(fillLight);

      /* ============================================================
         Post-processing — render → bloom → SMAA → vignette/CA → output
         ============================================================ */
      const composer = new EffectComposer(renderer);
      composer.setPixelRatio(pixelRatio);
      composer.setSize(size(), hsize());
      composer.addPass(new RenderPass(scene, camera));

      const bloom = new UnrealBloomPass(
        new THREE.Vector2(size(), hsize()),
        0.28, // strength (toned down from bright glare)
        0.4, // radius
        0.52, // threshold
      );
      composer.addPass(bloom);

      // Subtle vignette + chromatic aberration for holographic depth
      const fxPass = new ShaderPass({
        uniforms: {
          tDiffuse: { value: null },
          uVignette: { value: 0.85 },
          uCA: { value: 0.0018 },
          uReveal: { value: 1.0 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          precision highp float;
          uniform sampler2D tDiffuse;
          uniform float uVignette;
          uniform float uCA;
          uniform float uReveal;
          varying vec2 vUv;

          void main() {
            vec2 uv = vUv;
            vec2 d = uv - 0.5;
            float r2 = dot(d, d);
            // radial chromatic aberration
            vec2 ofs = d * uCA * (1.0 + r2 * 2.0);
            vec3 col;
            col.r = texture2D(tDiffuse, uv + ofs).r;
            col.g = texture2D(tDiffuse, uv).g;
            col.b = texture2D(tDiffuse, uv - ofs).b;
            // vignette
            float vig = 1.0 - r2 * uVignette * 1.1;
            col *= clamp(vig, 0.0, 1.0);
            col *= mix(0.6, 1.0, uReveal);
            gl_FragColor = vec4(col, 1.0);
          }
        `,
      });
      composer.addPass(fxPass);

      const smaa = new SMAAPass();
      composer.addPass(smaa);
      composer.addPass(new OutputPass());

      /* ============================================================
         Input — mouse parallax + scroll progress
         ============================================================ */
      const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
      function onMove(e: MouseEvent) {
        const nx = (e.clientX / window.innerWidth) * 2 - 1;
        const ny = (e.clientY / window.innerHeight) * 2 - 1;
        mouse.tx = nx * 0.36;
        mouse.ty = -ny * 0.28;
      }
      function onTouch(e: TouchEvent) {
        const t = e.touches[0];
        if (!t) return;
        const nx = (t.clientX / window.innerWidth) * 2 - 1;
        const ny = (t.clientY / window.innerHeight) * 2 - 1;
        mouse.tx = nx * 0.36;
        mouse.ty = -ny * 0.28;
      }
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("touchmove", onTouch, { passive: true });

      let scrollProgress = 0;
      function onScroll() {
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        scrollProgress = Math.min(1, Math.max(0, window.scrollY / max));
      }
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();

      /* Visibility gating via IntersectionObserver */
      let visible = true;
      const io = new IntersectionObserver(
        (entries) => { visible = entries[0]?.isIntersecting ?? true; },
        { threshold: 0 },
      );
      io.observe(parent);

      /* Reveal — dismount once scrolled well past hero */
      let reveal = 1.0;
      function onScrollReveal() {
        reveal = Math.max(0, 1 - Math.max(0, scrollProgress - 0.45) * 1.6);
      }

      /* Resize */
      function onResize() {
        if (!parent || disposed) return;
        const w = size();
        const h = hsize();
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        composer.setSize(w, h);
      }
      window.addEventListener("resize", onResize);

      /* Context loss handling */
      function onContextLost(e: Event) {
        e.preventDefault();
        cancelAnimationFrame(rafRef.current);
        visible = false;
      }
      canvas.addEventListener("webglcontextlost", onContextLost, false);
      function onContextRestored() {
        visible = true;
        rafRef.current = requestAnimationFrame(tick);
      }
      canvas.addEventListener("webglcontextrestored", onContextRestored, false);

      /* ============================================================
         Animation loop — frame-rate-independent via dt
         ============================================================ */
      const clock = new THREE.Clock();
      const tmpColor = new THREE.Color();
      const coreWhite = new THREE.Color(0xffffff);

      function tick() {
        rafRef.current = requestAnimationFrame(tick);
        if (!visible || disposed) return;

        const dt = Math.min(clock.getDelta(), 0.05);
        const t = clock.elapsedTime;

        mouse.x += (mouse.tx - mouse.x) * 0.06;
        mouse.y += (mouse.ty - mouse.y) * 0.06;

        onScrollReveal();

        // Crystal + halo + core motion (dt-scaled)
        if (!prefersReduced) {
          crystal.rotation.y += (0.18 + mouse.x * 0.6) * dt;
          crystal.rotation.x += (0.08 + mouse.y * 0.4) * dt;
          halo.rotation.y -= 0.11 * dt;
          halo.rotation.x -= 0.06 * dt;
          core.rotation.y += 2.0 * dt;
          core.rotation.z += 0.8 * dt;
          const pulse = 1 + Math.sin(t * 1.8) * 0.06;
          core.scale.setScalar(pulse);
          particles.rotation.y += 0.04 * dt;
          particles.rotation.x += 0.02 * dt;
          for (let r = 0; r < rings.length; r++) {
            rings[r].rotation.z += (0.08 + r * 0.04) * dt;
          }
        }

        // Scroll-driven orbit + dolly
        const angle = scrollProgress * Math.PI * 0.6;
        const radius = 6.5 - scrollProgress * 1.5;
        camera.position.x = Math.sin(angle) * radius + mouse.x * 0.7;
        camera.position.y = scrollProgress * 1.6 + mouse.y * 0.7;
        camera.position.z = Math.cos(angle) * radius;
        camera.lookAt(0, 0, 0);

        // Scroll-driven crystal color (3-stop gradient)
        if (scrollProgress < 0.5) {
          tmpColor.copy(ICE_TOP).lerp(ICE_MID, scrollProgress * 2);
        } else {
          tmpColor.copy(ICE_MID).lerp(ICE_BOT, (scrollProgress - 0.5) * 2);
        }
        crystalMat.uniforms.uColor.value.copy(tmpColor);
        coreMat.color.copy(tmpColor).lerp(coreWhite, 0.35);
        pMat.uniforms.uColor.value.copy(tmpColor).lerp(coreWhite, 0.2);

        // Reveal-fade based on scroll distance
        crystalMat.uniforms.uReveal.value = reveal;
        pMat.uniforms.uReveal.value = reveal;
        fxPass.uniforms.uReveal.value = reveal;

        // Time uniforms + bloom strength grows slightly with scroll
        crystalMat.uniforms.uTime.value = t;
        pMat.uniforms.uTime.value = t;
        bloom.strength = 0.25 + scrollProgress * 0.25;

        composer.render();
      }
      tick();

      /* ============================================================
         Dispose — full cleanup of every GPU resource + listeners
         ============================================================ */
      function disposeGeo(g: THREE.BufferGeometry) {
        g.dispose();
      }
      function disposeMat(m: THREE.Material | THREE.Material[]) {
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m.dispose();
      }
      const allMats: THREE.Material[] = [
        crystalMat,
        coreMat,
        haloMat,
        ringMatBase,
        pMat,
        envMat,
        ...rings.map((r) => r.material as THREE.Material),
      ];
      const allGeos: THREE.BufferGeometry[] = [
        crystalGeo,
        coreGeo,
        haloGeo,
        pGeo,
        envGeo,
        ...rings.map((r) => r.geometry),
      ];

      const handle: SceneHandle = {
        dispose: () => {
          disposed = true;
          cancelAnimationFrame(rafRef.current);
          io.disconnect();
          window.removeEventListener("mousemove", onMove);
          window.removeEventListener("touchmove", onTouch);
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onResize);
          canvas.removeEventListener("webglcontextlost", onContextLost, false);
          canvas.removeEventListener("webglcontextrestored", onContextRestored, false);
          composer.dispose();
          for (const g of allGeos) disposeGeo(g);
          for (const m of allMats) disposeMat(m);
          envTex.dispose();
          envRT.dispose();
          pmrem.dispose();
          renderer.dispose();
          if (canvas.parentNode === parent) parent.removeChild(canvas);
        },
      };

      // Stash for sanity/debug only.
      (parent as unknown as { __scene3d?: SceneHandle }).__scene3d = handle;
    }

    return () => {
      const stash = (mount as unknown as { __scene3d?: SceneHandle }).__scene3d;
      if (stash?.dispose) stash.dispose();
      (mount as unknown as { __scene3d?: SceneHandle }).__scene3d = undefined;
    };
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
