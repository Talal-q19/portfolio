"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function HeroWorld({ entered }) {
  const host = useRef(null);
  useEffect(() => {
    if (!entered) return;
    const element = host.current;
    let disposed = false;
    let cleanup = () => {};
    import("three").then((THREE) => {
      if (disposed) return;
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      } catch { return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      element.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x080b18, 0.035);
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.set(0, 0.4, 13);
      const world = new THREE.Group();
      scene.add(world);
      const core = new THREE.Mesh(
        new THREE.TorusKnotGeometry(1.85, 0.52, 160, 20, 2, 3),
        new THREE.MeshPhysicalMaterial({ color: 0x667dff, metalness: 0.85, roughness: 0.22, clearcoat: 1 }),
      );
      world.add(core);
      const cage = new THREE.Mesh(
        new THREE.IcosahedronGeometry(3.45, 1),
        new THREE.MeshBasicMaterial({ color: 0x82b8ff, wireframe: true, transparent: true, opacity: 0.16 }),
      );
      world.add(cage);
      [0, 1, 2].forEach((i) => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(3.1 + i * 0.48, 0.012, 6, 140),
          new THREE.MeshBasicMaterial({ color: i === 1 ? 0xd6a4ff : 0x70d9ff, transparent: true, opacity: 0.65 }),
        );
        ring.rotation.set(0.8 + i * 0.6, i * 0.65, i * 0.4);
        world.add(ring);
      });
      const points = new Float32Array(450 * 3);
      for (let i = 0; i < points.length; i += 3) {
        // Deterministic distribution keeps the scene stable across mounts.
        points[i] = Math.sin(i * 12.98) * 16;
        points[i + 1] = Math.cos(i * 4.14) * 11;
        points[i + 2] = Math.sin(i * 7.12) * 12 - 5;
      }
      const starsGeometry = new THREE.BufferGeometry();
      starsGeometry.setAttribute("position", new THREE.BufferAttribute(points, 3));
      const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0x9fbaff, size: 0.035, transparent: true, opacity: 0.65 }));
      scene.add(stars);
      scene.add(new THREE.AmbientLight(0xb5baff, 1.8));
      const key = new THREE.PointLight(0x65baff, 110, 30);
      key.position.set(4, 4, 5);
      scene.add(key);
      const rim = new THREE.PointLight(0xd06bff, 95, 30);
      rim.position.set(-4, -2, 3);
      scene.add(rim);
      const grid = new THREE.GridHelper(60, 45, 0x4b65b2, 0x1c294c);
      grid.position.y = -4.5;
      scene.add(grid);
      const draw = () => renderer.render(scene, camera);
      const resize = () => {
        const { width, height } = element.getBoundingClientRect();
        renderer.setSize(width, height);
        camera.aspect = width / Math.max(height, 1);
        camera.updateProjectionMatrix();
        world.position.x = width < 768 ? 0.9 : 2.8;
        world.position.y = width < 768 ? 1.4 : 0;
        world.scale.setScalar(width < 768 ? 0.72 : 1);
        draw();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(element);
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const timeline = gsap.timeline({
          onUpdate: draw,
          scrollTrigger: { trigger: element.closest(".pf-hero"), start: "top top", end: "bottom top", scrub: 1 },
        });
        timeline.to(world.rotation, { x: 1.1, y: Math.PI * 1.5, z: 0.5, ease: "none" }, 0)
          .to(camera.position, { z: 6.5, y: 1.7, ease: "none" }, 0)
          .to(stars.rotation, { y: 0.45, ease: "none" }, 0);
        gsap.from(world.scale, { x: 0.05, y: 0.05, z: 0.05, duration: 1.8, ease: "expo.out", onUpdate: draw });
      });
      const lost = (event) => { event.preventDefault(); element.dataset.failed = "true"; };
      renderer.domElement.addEventListener("webglcontextlost", lost);
      resize();
      cleanup = () => {
        media.revert();
        observer.disconnect();
        renderer.domElement.removeEventListener("webglcontextlost", lost);
        scene.traverse((object) => {
          object.geometry?.dispose();
          if (object.material) object.material.dispose();
        });
        renderer.dispose();
        renderer.domElement.remove();
      };
    }).catch(() => {});
    return () => { disposed = true; cleanup(); };
  }, [entered]);
  return <div ref={host} className="pf-hero-world" aria-hidden="true"><div className="pf-world-fallback" /></div>;
}
