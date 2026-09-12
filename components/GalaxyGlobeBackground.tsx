"use client";

import React, { useEffect, useRef } from "react";

export default function GalaxyGlobeBackground(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 200);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // --- Color Palette Shift Mechanism ---
    // Smoothly cycles through neon cyber palettes with random target shifts
    let currentHue = Math.random() * 360;
    let targetHue = Math.random() * 360;
    let hueSpeed = 0.4;

    // --- 3D Globe Parameters ---
    const globeRadius = Math.min(height * 0.95, 140);
    let rotationY = 0;
    let rotationX = 0.25;

    // Precompute Globe Points (Spherical Mesh)
    interface Point3D {
      x: number;
      y: number;
      z: number;
      size: number;
      phase: number;
    }

    const globePoints: Point3D[] = [];
    const latCount = 14;
    const lonCount = 28;

    for (let i = 0; i <= latCount; i++) {
      const lat = (i / latCount) * Math.PI - Math.PI / 2; // -PI/2 to PI/2
      const radiusAtLat = globeRadius * Math.cos(lat);
      const y = globeRadius * Math.sin(lat);

      for (let j = 0; j < lonCount; j++) {
        const lon = (j / lonCount) * Math.PI * 2;
        const x = radiusAtLat * Math.sin(lon);
        const z = radiusAtLat * Math.cos(lon);
        globePoints.push({
          x,
          y,
          z,
          size: Math.random() * 1.5 + 1.2,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    // --- Galaxy / Nebula Particle Field ---
    interface GalaxyParticle {
      angle: number;
      dist: number;
      speed: number;
      size: number;
      orbitSpeed: number;
      spiralOffset: number;
      z: number;
      hueOffset: number;
      alpha: number;
    }

    const galaxyParticles: GalaxyParticle[] = [];
    const particleCount = 120;
    const maxDist = Math.max(width * 0.7, 450);

    for (let i = 0; i < particleCount; i++) {
      galaxyParticles.push({
        angle: Math.random() * Math.PI * 2,
        dist: Math.pow(Math.random(), 0.6) * maxDist + 20,
        speed: (Math.random() * 0.003 + 0.001) * (Math.random() > 0.5 ? 1 : -1),
        size: Math.random() * 2.2 + 0.6,
        orbitSpeed: (Math.random() * 0.002 + 0.001),
        spiralOffset: (Math.random() * 2 - 1) * 30,
        z: (Math.random() * 2 - 1) * 100,
        hueOffset: (Math.random() - 0.5) * 60,
        alpha: Math.random() * 0.6 + 0.3,
      });
    }

    // --- Orbital Rings ---
    interface Ring {
      tiltX: number;
      tiltZ: number;
      radius: number;
      speed: number;
      angle: number;
      dash: number[];
    }

    const rings: Ring[] = [
      {
        tiltX: 0.8,
        tiltZ: 0.3,
        radius: globeRadius * 1.55,
        speed: 0.008,
        angle: 0,
        dash: [8, 6, 2, 6],
      },
      {
        tiltX: -0.6,
        tiltZ: -0.4,
        radius: globeRadius * 1.85,
        speed: -0.006,
        angle: 1,
        dash: [14, 10],
      },
      {
        tiltX: 0.3,
        tiltZ: 0.8,
        radius: globeRadius * 2.1,
        speed: 0.004,
        angle: 2.2,
        dash: [4, 8],
      },
    ];

    // Satellites on rings
    interface Satellite {
      ringIndex: number;
      progress: number;
      speed: number;
      size: number;
    }

    const satellites: Satellite[] = [
      { ringIndex: 0, progress: 0.2, speed: 0.012, size: 3.5 },
      { ringIndex: 0, progress: 0.7, speed: 0.012, size: 2.5 },
      { ringIndex: 1, progress: 0.5, speed: -0.009, size: 3.0 },
      { ringIndex: 2, progress: 0.85, speed: 0.007, size: 2.8 },
    ];

    let time = 0;

    // Render loop
    const render = () => {
      time += 0.02;

      // Smooth Hue Drift
      currentHue += (targetHue - currentHue) * 0.01;
      if (Math.abs(targetHue - currentHue) < 2) {
        targetHue = (targetHue + 70 + Math.random() * 120) % 360;
      }
      rotationY += 0.007;

      ctx.clearRect(0, 0, width, height);

      // Globe center positioned elegantly (responsive: right-centered on wide screens, center on small)
      const centerX = width > 768 ? width * 0.78 : width * 0.5;
      const centerY = height * 0.5;

      const primaryColor = `hsl(${currentHue}, 85%, 62%)`;
      const secondaryColor = `hsl(${(currentHue + 45) % 360}, 90%, 68%)`;
      const accentColor = `hsl(${(currentHue + 160) % 360}, 80%, 65%)`;

      // 1. Draw Subtle Glowing Galaxy Background Nebula
      const nebulaGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        10,
        centerX,
        centerY,
        width * 0.65
      );
      nebulaGrad.addColorStop(0, `hsla(${currentHue}, 80%, 60%, 0.18)`);
      nebulaGrad.addColorStop(0.35, `hsla(${(currentHue + 40) % 360}, 75%, 55%, 0.10)`);
      nebulaGrad.addColorStop(0.7, `hsla(${(currentHue + 140) % 360}, 70%, 50%, 0.03)`);
      nebulaGrad.addColorStop(1, "transparent");

      ctx.fillStyle = nebulaGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Galaxy Particle Field (Stars & Cosmic Dust)
      for (let i = 0; i < galaxyParticles.length; i++) {
        const p = galaxyParticles[i];
        p.angle += p.orbitSpeed;

        // Spiral spiral arms effect
        const currentDist = p.dist + Math.sin(time + p.angle * 2) * 8;
        const px = centerX + Math.cos(p.angle) * currentDist * 1.3;
        const py = centerY + Math.sin(p.angle) * (currentDist * 0.5) + Math.sin(time * 0.5 + p.spiralOffset) * 10;

        const twinkle = 0.5 + 0.5 * Math.sin(time * 2 + p.angle * 4);
        const particleHue = (currentHue + p.hueOffset + 360) % 360;

        ctx.beginPath();
        ctx.arc(px, py, p.size * (0.8 + 0.4 * twinkle), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particleHue}, 85%, 75%, ${p.alpha * twinkle * 0.75})`;
        ctx.fill();

        // Extra glow for larger particles
        if (p.size > 2.0) {
          ctx.beginPath();
          ctx.arc(px, py, p.size * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${particleHue}, 90%, 70%, 0.12)`;
          ctx.fill();
        }
      }

      // 3. Draw 3D Rotating Orbital Rings
      rings.forEach((ring) => {
        ring.angle += ring.speed;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(ring.tiltZ);
        ctx.scale(1, ring.tiltX);

        ctx.beginPath();
        ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
        ctx.setLineDash(ring.dash);
        ctx.lineDashOffset = -ring.angle * 40;
        ctx.strokeStyle = `hsla(${(currentHue + ring.tiltZ * 80) % 360}, 80%, 70%, 0.32)`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      });

      // 4. Draw Satellites orbiting along rings
      satellites.forEach((sat) => {
        const ring = rings[sat.ringIndex];
        sat.progress += sat.speed;
        const a = sat.progress;

        // Position in 2D with ring transform
        const rawX = Math.cos(a) * ring.radius;
        const rawY = Math.sin(a) * ring.radius * ring.tiltX;

        // Apply Z tilt rotation
        const cosZ = Math.cos(ring.tiltZ);
        const sinZ = Math.sin(ring.tiltZ);
        const satX = centerX + (rawX * cosZ - rawY * sinZ);
        const satY = centerY + (rawX * sinZ + rawY * cosZ);

        // Draw glowing satellite node
        const satHue = (currentHue + sat.ringIndex * 50) % 360;
        ctx.beginPath();
        ctx.arc(satX, satY, sat.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${satHue}, 90%, 70%, 0.25)`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(satX, satY, sat.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${satHue}, 95%, 85%)`;
        ctx.fill();
      });

      // 5. Draw 3D Rotating Wireframe Globe Points
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);
      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);

      // Transform & Project Globe Points
      interface ProjectedPoint {
        x: number;
        y: number;
        z: number;
        size: number;
        alpha: number;
        hue: number;
      }

      const projected: ProjectedPoint[] = [];

      for (let i = 0; i < globePoints.length; i++) {
        const pt = globePoints[i];

        // Rotate around Y axis
        const x1 = pt.x * cosY + pt.z * sinY;
        const z1 = -pt.x * sinY + pt.z * cosY;

        // Rotate around X axis
        const y2 = pt.y * cosX - z1 * sinX;
        const z2 = pt.y * sinX + z1 * cosX;

        // Perspective scale
        const fov = 400;
        const scale = fov / (fov + z2);
        const projX = centerX + x1 * scale;
        const projY = centerY + y2 * scale;

        // Depth lighting (points in front are brighter and larger)
        const depthNorm = (z2 + globeRadius) / (globeRadius * 2); // 0 (back) to 1 (front)
        const alpha = Math.max(0.08, Math.pow(depthNorm, 1.6) * 0.85);
        const pointHue = (currentHue + (pt.y / globeRadius) * 40 + 360) % 360;

        projected.push({
          x: projX,
          y: projY,
          z: z2,
          size: pt.size * scale * (0.8 + 0.4 * depthNorm),
          alpha,
          hue: pointHue,
        });
      }

      // Sort by Z depth (back to front)
      projected.sort((a, b) => a.z - b.z);

      // Connect closest front points with subtle cyber grid lines
      ctx.lineWidth = 0.6;
      for (let i = 0; i < projected.length; i += 2) {
        const p1 = projected[i];
        if (p1.z < -20) continue; // Skip back face lines for clarity

        for (let j = i + 1; j < Math.min(i + 5, projected.length); j++) {
          const p2 = projected[j];
          if (p2.z < -20) continue;

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 32) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            const lineAlpha = (1 - dist / 32) * Math.min(p1.alpha, p2.alpha) * 0.35;
            ctx.strokeStyle = `hsla(${p1.hue}, 80%, 70%, ${lineAlpha})`;
            ctx.stroke();
          }
        }
      }

      // Draw Projected Globe Dots
      for (let i = 0; i < projected.length; i++) {
        const pt = projected[i];

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${pt.hue}, 85%, 75%, ${pt.alpha})`;
        ctx.fill();

        // Front glowing nodes
        if (pt.z > globeRadius * 0.5) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size * 2.4, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${pt.hue}, 90%, 70%, ${pt.alpha * 0.25})`;
          ctx.fill();
        }
      }

      // 6. Central Core Soft Glow
      const coreGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        globeRadius * 0.9
      );
      coreGrad.addColorStop(0, `hsla(${currentHue}, 90%, 70%, 0.15)`);
      coreGrad.addColorStop(0.5, `hsla(${(currentHue + 35) % 360}, 85%, 65%, 0.06)`);
      coreGrad.addColorStop(1, "transparent");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, globeRadius * 0.9, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl overflow-hidden opacity-90 transition-opacity duration-700"
      aria-hidden="true"
    />
  );
}
