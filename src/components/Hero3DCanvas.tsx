import { useEffect, useRef } from "react";

export default function Hero3DCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let width = 0;
    let height = 0;

    const dpr = window.devicePixelRatio || 1;

    function resize() {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      width = rect.width || 450;
      height = rect.height || 450;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx?.scale(dpr, dpr);
    }
    resize();
    window.addEventListener("resize", resize);

    // ---- 3D Vector Math & Geometry ----
    type Point3D = { x: number; y: number; z: number };

    // Standard 3D vertices of a double-pyramid Octahedron (sleek diamond)
    const vertices: Point3D[] = [
      { x: 0, y: -1.2, z: 0 },   // Top tip
      { x: 1, y: 0, z: 1 },      // Mid nodes
      { x: -1, y: 0, z: 1 },
      { x: -1, y: 0, z: -1 },
      { x: 1, y: 0, z: -1 },
      { x: 0, y: 1.2, z: 0 },    // Bottom tip
    ];

    // Connect indices to form lines
    const edges = [
      [0, 1], [0, 2], [0, 3], [0, 4], // Top caps
      [1, 2], [2, 3], [3, 4], [4, 1], // Mid ring
      [5, 1], [5, 2], [5, 3], [5, 4], // Bottom caps
    ];

    // Interactive mouse state
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    function onMouseMove(e: MouseEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      mouse.tx = (e.clientX - cx) / (rect.width / 2);
      mouse.ty = (e.clientY - cy) / (rect.height / 2);
    }
    window.addEventListener("mousemove", onMouseMove);

    // Particle nodes floating inside/around the crystal
    const particles: (Point3D & { vx: number; vy: number; vz: number; size: number })[] = [];
    for (let i = 0; i < 28; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        z: (Math.random() - 0.5) * 2,
        vx: (Math.random() - 0.5) * 0.005,
        vy: (Math.random() - 0.5) * 0.005,
        vz: (Math.random() - 0.5) * 0.005,
        size: Math.random() * 2 + 1,
      });
    }

    let angleX = 0.4;
    let angleY = 0.5;
    let angleZ = 0.15;

    // ---- Loop ----
    function render() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Damp mouse target
      mouse.x += (mouse.tx - mouse.x) * 0.08;
      mouse.y += (mouse.ty - mouse.y) * 0.08;

      // Spin speed influenced by mouse skew
      angleY += 0.006 + mouse.x * 0.015;
      angleX += 0.002 + mouse.y * 0.012;
      angleZ += 0.001;

      const scale = Math.min(width, height) * 0.32;
      const cx = width / 2;
      const cy = height / 2;

      // Project 3D points -> 2D
      function project(p: Point3D): { x: number; y: number; z: number } {
        // Rotate Y (yaw)
        let cosY = Math.cos(angleY), sinY = Math.sin(angleY);
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.x * sinY + p.z * cosY;

        // Rotate X (pitch)
        let cosX = Math.cos(angleX), sinX = Math.sin(angleX);
        let y2 = p.y * cosX - z1 * sinX;
        let z2 = p.y * sinX + z1 * cosX;

        // Rotate Z (roll)
        let cosZ = Math.cos(angleZ), sinZ = Math.sin(angleZ);
        let x3 = x1 * cosZ - y2 * sinZ;
        let y3 = x1 * sinZ + y2 * cosZ;

        // Perspective factor
        const distance = 4;
        const f = 1 / (1 + z2 / distance);
        return {
          x: cx + x3 * scale * f,
          y: cy + y3 * scale * f,
          z: z2,
        };
      }

      const projectedVertices = vertices.map(project);

      // Draw background ambient starfield nodes (glowing soft points)
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.z += p.vz;
        // Bounce inside cube boundary
        if (Math.abs(p.x) > 1.5) p.vx *= -1;
        if (Math.abs(p.y) > 1.5) p.vy *= -1;
        if (Math.abs(p.z) > 1.5) p.vz *= -1;

        const proj = project(p);
        const opacity = Math.max(0.1, Math.min(1, (proj.z + 1.5) / 3));

        ctx.beginPath();
        ctx.arc(proj.x, proj.y, p.size * (1 - proj.z * 0.15), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(193, 232, 255, ${opacity * 0.65})`;
        ctx.shadowColor = "#C1E8FF";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw diamond facets with gradient fills (translucent depth)
      ctx.lineWidth = 1;
      edges.forEach(([u, v]) => {
        const p1 = projectedVertices[u];
        const p2 = projectedVertices[v];

        // Fade lines in background, brighten foreground
        const avgZ = (p1.z + p2.z) / 2;
        const opacity = Math.max(0.12, Math.min(0.85, (avgZ + 1.5) / 3));

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(193, 232, 255, ${opacity})`;
        ctx.stroke();
      });

      // Draw glowing vertices
      projectedVertices.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#C1E8FF";
        ctx.shadowColor = "#C1E8FF";
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animFrame = requestAnimationFrame(render);
    }
    render();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <div ref={containerRef} className="hero-3d-container">
      <canvas ref={canvasRef} className="hero-3d-canvas" />
    </div>
  );
}
