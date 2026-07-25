"use client";

import { useRef, useMemo } from "react";
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
          color="#D4AF37" // Cinematic gold
          size={size}
          opacity={opacity}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
};

export default function GalaxyBackground({ onLoaded, count = 5000, speed = 1, size = 0.004, opacity = 0.55 }) {
  return (
    <div 
      className="absolute -top-[var(--nav-safe-top)] bottom-0 left-1/2 -translate-x-1/2 z-0 w-[100vw] bg-[#050505]"
      style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 50%, rgba(0,0,0,0.5) 80%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 50%, rgba(0,0,0,0.5) 80%, transparent 100%)' }}
    >
      <Canvas camera={{ position: [0, 0, 1] }} onCreated={() => onLoaded && onLoaded()}>
        <Starfield count={count} speed={speed} size={size} opacity={opacity} />
      </Canvas>
    </div>
  );
}
