"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAppearance } from "./appearance";

gsap.registerPlugin(ScrollTrigger);

export default function HeroWorld({ entered }) {
  const host = useRef(null);
  const { theme } = useAppearance();
  const currentTheme = useRef(theme);
  const updateTheme = useRef(null);
  useEffect(() => {
    currentTheme.current = theme;
    updateTheme.current?.(theme);
  }, [theme]);
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
      scene.fog = new THREE.FogExp2(0x0f1014, 0.035);
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.set(0, 0.4, 13);
      const world = new THREE.Group();
      scene.add(world);
      const assembly = new THREE.Group();
      world.add(assembly);
      const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.25, 0),
        new THREE.MeshPhysicalMaterial({ color: 0x8e9eff, metalness: 0.65, roughness: 0.18, clearcoat: 1, flatShading: true }),
      );
      core.rotation.set(0.35, 0.5, 0.2);
      assembly.add(core);
      const cage = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.65, 0),
        new THREE.MeshBasicMaterial({ color: 0x82b8ff, wireframe: true, transparent: true, opacity: 0.4 }),
      );
      assembly.add(cage);
      const bands = [];
      const metalMaterials = [];
      const edgeMaterials = [];
      [0, 1, 2].forEach((level) => {
        const band = new THREE.Group();
        band.rotation.set(0.6 + level * 0.75, level * 0.8, level * 0.4);
        bands.push(band);
        assembly.add(band);
        for (let segment = 0; segment < 4; segment++) {
          const material = new THREE.MeshPhysicalMaterial({
            color: level === 1 ? 0xb89dff : 0x6f9eff,
            metalness: 0.72, roughness: 0.23, clearcoat: 1,
          });
          metalMaterials.push(material);
          const arc = new THREE.Mesh(new THREE.TorusGeometry(2.15 + level * 0.48, 0.105, 10, 44, Math.PI * 0.4), material);
          arc.rotation.z = segment * Math.PI / 2;
          band.add(arc);
          const edgeMaterial = new THREE.MeshBasicMaterial({ color: level === 1 ? 0xd1a7ff : 0x8edfff });
          edgeMaterials.push(edgeMaterial);
          const node = new THREE.Mesh(new THREE.OctahedronGeometry(0.13), edgeMaterial);
          const angle = segment * Math.PI / 2;
          node.position.set(Math.cos(angle) * (2.15 + level * 0.48), Math.sin(angle) * (2.15 + level * 0.48), 0);
          band.add(node);
        }
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
      const ambient = new THREE.AmbientLight(0xb5baff, 1.8);
      scene.add(ambient);
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
      updateTheme.current = (next) => {
        const dark = next === "dark";
        scene.fog.color.set(dark ? 0x0f1014 : 0xe1e7f0);
        core.material.color.set(dark ? 0x9aaaff : 0x4360bd);
        core.material.metalness = dark ? 0.65 : 0.35;
        cage.material.color.set(dark ? 0xb1c9ff : 0x315acb);
        stars.material.color.set(dark ? 0xa5bdff : 0x315acb);
        stars.material.opacity = dark ? 0.65 : 0.5;
        ambient.color.set(dark ? 0xb5baff : 0xffffff);
        ambient.intensity = dark ? 1.8 : 2.6;
        metalMaterials.forEach((material, i) => {
          material.color.set(dark ? (i >= 4 && i < 8 ? 0xb89dff : 0x6f9eff) : (i >= 4 && i < 8 ? 0x8260c6 : 0x4269c7));
          material.metalness = dark ? 0.72 : 0.4;
        });
        edgeMaterials.forEach((material, i) => material.color.set(dark ? (i >= 4 && i < 8 ? 0xd1a7ff : 0x8edfff) : (i >= 4 && i < 8 ? 0x8151bd : 0x245fa6)));
        // Match the floor to the CSS palette instead of retaining a dark-only grid.
        const colors = grid.geometry.attributes.color;
        const center = new THREE.Color(dark ? 0x4b65b2 : 0x879dce);
        const lines = new THREE.Color(dark ? 0x1c294c : 0xb6c5de);
        for (let i = 0; i < colors.count; i++) {
          const position = grid.geometry.attributes.position;
          const isCenter = Math.abs(position.getX(i)) < 0.001 || Math.abs(position.getZ(i)) < 0.001;
          const color = isCenter ? center : lines;
          colors.setXYZ(i, color.r, color.g, color.b);
        }
        colors.needsUpdate = true;
        draw();
      };
      updateTheme.current(currentTheme.current);
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
      resize();
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
        bands.forEach((band, i) => {
          timeline.to(band.rotation, { z: band.rotation.z + (i % 2 ? -Math.PI : Math.PI), ease: "none" }, 0);
          timeline.to(band.scale, { x: 1.35 + i * 0.12, y: 1.35 + i * 0.12, z: 1.35 + i * 0.12, ease: "none" }, 0);
        });
        timeline.to(core.rotation, { y: Math.PI * 2, x: 1.6, ease: "none" }, 0);
        gsap.from(assembly.scale, { x: 0.05, y: 0.05, z: 0.05, duration: 1.8, ease: "expo.out", onUpdate: draw });
      });
      const lost = (event) => { event.preventDefault(); element.dataset.failed = "true"; };
      renderer.domElement.addEventListener("webglcontextlost", lost);
      cleanup = () => {
        updateTheme.current = null;
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
