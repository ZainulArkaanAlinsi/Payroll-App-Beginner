'use client';

/**
 * Latar 3D halaman muka — jaring organisasi.
 *
 * Titik = orang, garis = aliran kompensasi antar simpul. Sengaja monokrom
 * dan lambat: perannya atmosfer, bukan tontonan. Menghormati
 * prefers-reduced-motion dan membersihkan seluruh sumber daya GPU saat lepas.
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function NetworkField({ className }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDark = document.documentElement.classList.contains('dark');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
    camera.position.set(0, 0, 15);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      return; // perangkat tanpa WebGL cukup melihat latar statis
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    // ── simpul: distribusi Fibonacci di kulit bola, jadi tidak menggerombol ──
    const COUNT = 190;
    const R = 6.4;
    const nodes: THREE.Vector3[] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < COUNT; i++) {
      const y = 1 - (i / (COUNT - 1)) * 2;
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      // sedikit acak supaya tidak terlihat seperti pola matematis murni
      const jitter = 0.72 + Math.random() * 0.5;
      nodes.push(
        new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius).multiplyScalar(R * jitter),
      );
    }

    const accent = new THREE.Color(isDark ? '#5fbf9d' : '#1f7a5f');
    const dim = new THREE.Color(isDark ? '#8fa3ab' : '#54646c');

    // ── titik ──
    const pointGeo = new THREE.BufferGeometry().setFromPoints(nodes);
    const sizes = new Float32Array(COUNT);
    const colors = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      sizes[i] = Math.random() > 0.86 ? 0.13 : 0.055;
      const c = Math.random() > 0.8 ? accent : dim;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    pointGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    pointGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pointMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uOpacity: { value: isDark ? 0.85 : 0.7 } },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        varying float vDepth;
        void main() {
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vDepth = -mv.z;
          gl_PointSize = size * 320.0 / vDepth;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vDepth;
        uniform float uOpacity;
        void main() {
          // titik bulat lembut, bukan kotak
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float edge = smoothstep(0.5, 0.16, d);
          // yang jauh memudar — memberi kedalaman tanpa kabut mahal
          float fade = clamp(1.0 - (vDepth - 8.0) / 16.0, 0.15, 1.0);
          gl_FragColor = vec4(vColor, edge * fade * uOpacity);
        }
      `,
      vertexColors: true,
    });

    const points = new THREE.Points(pointGeo, pointMat);

    // ── garis antar simpul yang berdekatan ──
    const linePos: number[] = [];
    const MAX_DIST = 3.5;
    for (let i = 0; i < COUNT; i++) {
      let links = 0;
      for (let j = i + 1; j < COUNT && links < 3; j++) {
        if (nodes[i].distanceTo(nodes[j]) < MAX_DIST) {
          linePos.push(nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z);
          links++;
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: isDark ? 0x4a6f7a : 0x8fa2aa,
      transparent: true,
      opacity: isDark ? 0.22 : 0.3,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);

    // ── partikel yang mengalir di sepanjang orbit: "gaji berjalan" ──
    const FLOW = 34;
    const flowGeo = new THREE.BufferGeometry();
    const flowPos = new Float32Array(FLOW * 3);
    flowGeo.setAttribute('position', new THREE.BufferAttribute(flowPos, 3));
    const flowMat = new THREE.PointsMaterial({
      color: accent,
      size: 0.13,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const flow = new THREE.Points(flowGeo, flowMat);
    const flowState = Array.from({ length: FLOW }, () => ({
      a: Math.random() * Math.PI * 2,
      tilt: (Math.random() - 0.5) * 1.6,
      radius: R * (0.85 + Math.random() * 0.5),
      speed: 0.12 + Math.random() * 0.22,
    }));

    const group = new THREE.Group();
    group.add(points, lines, flow);
    group.rotation.z = 0.22;
    scene.add(group);

    // ── interaksi: parallax lembut mengikuti kursor ──
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 0.5;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 0.36;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let raf = 0;
    let running = true;
    const clock = new THREE.Clock();

    // hentikan render saat tab tidak terlihat — hemat baterai
    const onVis = () => {
      running = !document.hidden;
      if (running) {
        clock.start();
        raf = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(raf);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    function tick() {
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();

      if (!reduced) {
        group.rotation.y = t * 0.045;
        group.rotation.x = Math.sin(t * 0.18) * 0.07;

        for (let i = 0; i < FLOW; i++) {
          const s = flowState[i];
          s.a += s.speed * 0.01;
          const p = i * 3;
          flowPos[p] = Math.cos(s.a) * s.radius;
          flowPos[p + 1] = Math.sin(s.a * 0.6 + s.tilt) * s.radius * 0.42;
          flowPos[p + 2] = Math.sin(s.a) * s.radius;
        }
        flowGeo.attributes.position.needsUpdate = true;
      }

      current.x += (target.x - current.x) * 0.045;
      current.y += (target.y - current.y) * 0.045;
      camera.position.x = current.x * 6;
      camera.position.y = -current.y * 6;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
      ro.disconnect();
      pointGeo.dispose();
      pointMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      flowGeo.dispose();
      flowMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={host} className={className} aria-hidden />;
}
