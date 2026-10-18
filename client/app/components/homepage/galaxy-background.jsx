"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as random from "maath/random/dist/maath-random.esm";

const Starfield = ({ count = 5000, speed = 1, size = 0.004, opacity = 0.55, ...props }) => {
  const ref = useRef();
  
  // Generate random points in a sphere for the galaxy
  const sphere = useMemo(() => {
    // count points * 3 values per point (x, y, z)
    const arr = random.inSphere(new Float32Array(count * 3), { radius: 1.5 });
    // Sanitize any NaN values to prevent Three.js rendering / validation errors
    for (let i = 0; i < arr.length; i++) {
      if (isNaN(arr[i])) {
        arr[i] = 0;
      }
    }
    return arr;
  }, [count]);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= (delta / 10) * speed;
      ref.current.rotation.y -= (delta / 15) * speed;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#E2E8F0" // Platinum starlight
          size={size}
          opacity={opacity}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
};

const ShootingStarsCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let stars = [];
    let timeoutId = null;

    const MAX_CONCURRENT_STARS = 2; // Strict limit to prevent bursts

    const resizeCanvas = () => {
      if (!canvas || !canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement.clientHeight || window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const spawnStar = () => {
      if (!canvas || document.hidden) return;
      if (stars.length >= MAX_CONCURRENT_STARS) return;

      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.25; // ~45 deg angle
      const startX = Math.random() * (canvas.width * 1.2) - canvas.width * 0.1;
      const startY = Math.random() * (canvas.height * 0.45);

      stars.push({
        x: startX,
        y: startY,
        length: 120 + Math.random() * 160,
        speed: 10 + Math.random() * 12,
        angle: angle,
        opacity: 0,
        maxOpacity: 0.85 + Math.random() * 0.15,
        life: 0,
        maxLife: 35 + Math.random() * 25,
        color: Math.random() > 0.35 ? "#E2E8F0" : "#94A3B8",
      });
    };

    const scheduleNextStar = (delay) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!document.hidden) {
          spawnStar();
        }
        // Graceful, paced interval between shooting stars (2.2s to 4.7s)
        const nextTime = 2200 + Math.random() * 2500;
        scheduleNextStar(nextTime);
      }, delay);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden/inactive: clear star array and timer
        stars = [];
        if (timeoutId) clearTimeout(timeoutId);
      } else {
        // Tab resumed: reset stars and schedule next single star smoothly
        stars = [];
        scheduleNextStar(1200 + Math.random() * 1000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Initial shooting star spawn after page loads
    scheduleNextStar(1500);

    const render = () => {
      if (!canvas || !ctx) return;

      // If document is hidden, reset stars and wait
      if (document.hidden) {
        stars = [];
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i];
        star.life++;
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;

        // Fade in quickly, then fade out smoothly
        const progress = star.life / star.maxLife;
        if (progress < 0.18) {
          star.opacity = (progress / 0.18) * star.maxOpacity;
        } else {
          star.opacity = (1 - (progress - 0.18) / 0.82) * star.maxOpacity;
        }

        if (star.opacity <= 0 || star.life >= star.maxLife) {
          stars.splice(i, 1);
          continue;
        }

        const tailX = star.x - Math.cos(star.angle) * star.length;
        const tailY = star.y - Math.sin(star.angle) * star.length;

        const gradient = ctx.createLinearGradient(star.x, star.y, tailX, tailY);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
        gradient.addColorStop(0.2, star.color === "#E2E8F0" ? `rgba(226, 232, 240, ${star.opacity * 0.85})` : `rgba(148, 163, 184, ${star.opacity * 0.85})`);
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2.0;
        ctx.lineCap = "round";
        ctx.shadowBlur = 10;
        ctx.shadowColor = star.color;
        ctx.stroke();

        // Meteor Head Spark Glow
        ctx.beginPath();
        ctx.arc(star.x, star.y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#FFFFFF";
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10 w-full h-full"
    />
  );
};

export default function GalaxyBackground({ 
  onLoaded, 
  count = 3000, 
  speed = 0.6, 
  size = 0.0032, 
  opacity = 0.40,
  shootingStars = true 
}) {
  return (
    <div 
      className="absolute -top-[var(--nav-safe-top)] bottom-0 left-1/2 -translate-x-1/2 z-0 w-[100vw] bg-[#050505] overflow-hidden pointer-events-none"
      style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 60%, rgba(0,0,0,0.5) 85%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 60%, rgba(0,0,0,0.5) 85%, transparent 100%)' }}
    >
      {/* Deep Space Ambient Glow / Nebulae */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-gradient-to-tr from-[#E2E8F0]/10 via-[#07101d]/0 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-[#64d8ff]/8 via-transparent to-transparent rounded-full blur-[100px] pointer-events-none" />

      {/* 3D Starfield Canvas */}
      <Canvas camera={{ position: [0, 0, 1] }} onCreated={() => onLoaded && onLoaded()}>
        <Starfield count={count} speed={speed} size={size} opacity={opacity} />
      </Canvas>

      {/* Dynamic Shooting Stars Canvas */}
      {shootingStars && <ShootingStarsCanvas />}
    </div>
  );
}
