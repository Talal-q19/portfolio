"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as random from "maath/random/dist/maath-random.esm";

const Starfield = (props) => {
  const ref = useRef();
  
  // Generate random points in a sphere for the galaxy
  const sphere = useMemo(() => {
    // 5000 points * 3 values per point (x, y, z) = 15000
    const arr = random.inSphere(new Float32Array(15000), { radius: 1.5 });
    // Sanitize any NaN values to prevent Three.js rendering / validation errors
    for (let i = 0; i < arr.length; i++) {
      if (isNaN(arr[i])) {
        arr[i] = 0;
      }
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#D4AF37" // Cinematic gold
          size={0.003}
          opacity={0.45}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
};

export default function GalaxyBackground({ onLoaded }) {
  return (
    <div 
      className="absolute -top-[var(--nav-safe-top)] bottom-0 left-1/2 -translate-x-1/2 z-0 w-[100vw] bg-[#050505]"
      style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)' }}
    >
      <Canvas camera={{ position: [0, 0, 1] }} onCreated={() => onLoaded && onLoaded()}>
        <Starfield />
      </Canvas>
    </div>
  );
}
