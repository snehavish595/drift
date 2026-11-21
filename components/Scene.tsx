"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

// A living orb: its colour, size and turbulence follow task progress; it flares when you finish a task.
export default function Scene({ progress, pulse }: { progress: number; pulse: number }) {
  const mount = useRef<HTMLDivElement>(null);
  const live = useRef({ progress: 0, kick: 0 });
  live.current.progress = progress;
  useEffect(() => { live.current.kick = 1; }, [pulse]);

  useEffect(() => {
    const el = mount.current!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 7;

    const geo = new THREE.SphereGeometry(1.7, 96, 96);
    const base = Float32Array.from(geo.attributes.position.array as Float32Array);
    const mat = new THREE.MeshStandardMaterial({ color: "#8F9BFF", metalness: 0.55, roughness: 0.22, emissive: "#2a2580", emissiveIntensity: 0.6 });
    const orb = new THREE.Mesh(geo, mat);
    const group = new THREE.Group();
    group.add(orb);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.012, 8, 200), new THREE.MeshBasicMaterial({ color: "#EDEAFF", transparent: true, opacity: 0.35 }));
    ring.rotation.x = 1.2;
    group.add(ring);
    scene.add(group);

    const N = 700, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 4 + Math.random() * 9, a = Math.random() * 6.28, b = Math.acos(2 * Math.random() - 1);
      pos.set([r * Math.sin(b) * Math.cos(a), r * Math.sin(b) * Math.sin(a), r * Math.cos(b)], i * 3);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 0.03, color: "#EDEAFF", transparent: true, opacity: 0.7 }));
    scene.add(stars);

    scene.add(new THREE.AmbientLight("#8F9BFF", 0.5));
    const l1 = new THREE.PointLight("#FFB48A", 60, 20); l1.position.set(4, 3, 4); scene.add(l1);
    const l2 = new THREE.PointLight("#7CF0C9", 50, 20); l2.position.set(-4, -3, 3); scene.add(l2);

    const mouse = { x: 0, y: 0, tx: 0, ty: 0, speed: 0 };
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / innerWidth) * 2 - 1, ny = -((e.clientY / innerHeight) * 2 - 1);
      mouse.speed = Math.min(1, Math.hypot(nx - mouse.tx, ny - mouse.ty) * 6);
      mouse.tx = nx; mouse.ty = ny;
    };
    addEventListener("pointermove", onMove);

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h); camera.aspect = w / h;
      const wide = w / h > 1.1;
      group.position.set(wide ? -2.2 : 0, wide ? 0 : 2.2, 0);
      group.scale.setScalar(wide ? 1 : 0.7);
      camera.updateProjectionMatrix();
    };
    resize(); addEventListener("resize", resize);

    const cA = new THREE.Color("#8F9BFF"), cB = new THREE.Color("#7CF0C9"), tmp = new THREE.Color();
    const p = geo.attributes.position as THREE.BufferAttribute;
    let raf = 0, amp = 0.15;
    const clock = new THREE.Clock();

    const tick = () => {
      const t = clock.getElapsedTime() * (reduce ? 0.2 : 1);
      const { progress: pr } = live.current;
      mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
      mouse.speed *= 0.94; live.current.kick *= 0.93;
      const target = 0.12 + (1 - pr) * 0.16 + mouse.speed * 0.25 + live.current.kick * 0.35;
      amp += (target - amp) * 0.06;
      const freq = 1.3 + (1 - pr) * 0.8;
      for (let i = 0; i < p.count; i++) {
        const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2];
        const n = Math.sin(x * freq + t * 0.9) * Math.sin(y * freq + t * 0.7) * Math.sin(z * freq + t * 0.5);
        const d = 1 + amp * n;
        p.setXYZ(i, x * d, y * d, z * d);
      }
      p.needsUpdate = true; geo.computeVertexNormals();
      tmp.copy(cA).lerp(cB, pr); mat.color.copy(tmp); mat.emissive.copy(tmp).multiplyScalar(0.25);
      group.rotation.y += 0.002;
      orb.rotation.x += (mouse.y * 0.5 - orb.rotation.x) * 0.04;
      orb.rotation.y += 0.003;
      ring.rotation.z = t * 0.2; ring.rotation.y = mouse.x * 0.6;
      stars.rotation.y = t * 0.02 + mouse.x * 0.1; stars.rotation.x = mouse.y * 0.1;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", onMove); removeEventListener("resize", resize);
      renderer.dispose(); geo.dispose(); mat.dispose(); starGeo.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mount} className="pointer-events-none fixed inset-0 z-0" aria-hidden />;
}
