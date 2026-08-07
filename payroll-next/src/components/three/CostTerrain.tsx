'use client';

/**
 * Bentang biaya 3D — biaya gaji per departemen per periode.
 *
 * Ini bukan hiasan: tiap balok adalah satu angka nyata dari basis data.
 * Sumbu X = departemen, sumbu Z = periode, tinggi = total biaya perusahaan.
 * Warna mengikuti departemen (entitas), bukan peringkat, dan selalu
 * disertai label saat disorot supaya identitas tidak bergantung warna saja.
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { rupiah } from '@/lib/format';

export interface TerrainCell {
  dept: string;
  period: string;
  value: number;
  deptIndex: number;
  periodIndex: number;
}

const LIGHT_SERIES = ['#14876a', '#6b4bc4', '#c2870d', '#2c6fbf', '#c0483c', '#0e8fa3'];
const DARK_SERIES = ['#2a9e7f', '#8f78dd', '#b3831a', '#4c8dd8', '#d76a5c', '#2aa6bb'];

export default function CostTerrain({
  cells,
  departments,
  periods,
}: {
  cells: TerrainCell[];
  departments: string[];
  periods: string[];
}) {
  const host = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<TerrainCell | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const el = host.current;
    if (!el || cells.length === 0) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDark = document.documentElement.classList.contains('dark');
    const palette = isDark ? DARK_SERIES : LIGHT_SERIES;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setSupported(false);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    // ── tata letak grid ──
    const nx = departments.length;
    const nz = periods.length;
    const gap = 1.35;
    const barW = 0.86;
    const maxVal = Math.max(...cells.map((c) => c.value), 1);
    const MAX_H = 6;

    const offsetX = ((nx - 1) * gap) / 2;
    const offsetZ = ((nz - 1) * gap) / 2;

    const group = new THREE.Group();
    const boxGeo = new THREE.BoxGeometry(barW, 1, barW);
    // geser titik pusat ke dasar agar penskalaan tinggi tumbuh ke atas
    boxGeo.translate(0, 0.5, 0);

    const bars: THREE.Mesh[] = [];
    const materials: THREE.MeshStandardMaterial[] = [];

    for (const c of cells) {
      const h = Math.max(0.06, (c.value / maxVal) * MAX_H);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette[c.deptIndex % palette.length]),
        roughness: 0.34,
        metalness: 0.06,
        transparent: true,
        opacity: 0.94,
      });
      materials.push(mat);
      const mesh = new THREE.Mesh(boxGeo, mat);
      mesh.position.set(c.deptIndex * gap - offsetX, 0, c.periodIndex * gap - offsetZ);
      mesh.scale.y = reduced ? h : 0.01;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { cell: c, targetH: h, baseColor: mat.color.clone() };
      group.add(mesh);
      bars.push(mesh);
    }

    // ── lantai ──
    const floorGeo = new THREE.PlaneGeometry(nx * gap + 2.2, nz * gap + 2.2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x161a1d : 0xe4e7e5,
      roughness: 0.95,
      metalness: 0,
      transparent: true,
      opacity: isDark ? 0.55 : 0.75,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    group.add(floor);

    // garis grid tipis di lantai — orientasi tanpa mengganggu
    const gridHelper = new THREE.GridHelper(
      Math.max(nx, nz) * gap + 2,
      Math.max(nx, nz),
      isDark ? 0x2a3237 : 0xc3cac7,
      isDark ? 0x1e2529 : 0xd3d9d6,
    );
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.4;
    group.add(gridHelper);

    scene.add(group);

    // ── pencahayaan: satu kunci berbayang + isi lembut ──
    scene.add(new THREE.AmbientLight(0xffffff, isDark ? 0.5 : 0.75));
    const key = new THREE.DirectionalLight(0xffffff, isDark ? 1.5 : 1.9);
    key.position.set(6, 11, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 40;
    key.shadow.camera.left = -12;
    key.shadow.camera.right = 12;
    key.shadow.camera.top = 12;
    key.shadow.camera.bottom = -12;
    scene.add(key);
    const fill = new THREE.DirectionalLight(isDark ? 0x7fa0b0 : 0xffffff, 0.4);
    fill.position.set(-7, 4, -5);
    scene.add(fill);

    // ── orbit sederhana: seret untuk memutar, tanpa pustaka kontrol ──
    let azimuth = -0.62;
    let polar = 0.94;
    const dist = Math.max(15, Math.max(nx, nz) * 2.9);
    let dragging = false;
    let last = { x: 0, y: 0 };
    let autoSpin = true;

    const applyCamera = () => {
      polar = Math.min(1.42, Math.max(0.28, polar));
      camera.position.set(
        dist * Math.sin(polar) * Math.sin(azimuth),
        dist * Math.cos(polar),
        dist * Math.sin(polar) * Math.cos(azimuth),
      );
      camera.lookAt(0, 1.4, 0);
    };
    applyCamera();

    const canvas = renderer.domElement;
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'grab';

    const onDown = (e: PointerEvent) => {
      dragging = true;
      autoSpin = false;
      last = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'grabbing';
      canvas.setPointerCapture(e.pointerId);
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      canvas.style.cursor = 'grab';
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* pointer sudah dilepas */
      }
    };

    // ── sorot dengan raycaster ──
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hovered: THREE.Mesh | null = null;

    const onMove = (e: PointerEvent) => {
      if (dragging) {
        azimuth -= (e.clientX - last.x) * 0.007;
        polar -= (e.clientY - last.y) * 0.006;
        last = { x: e.clientX, y: e.clientY };
        applyCamera();
        return;
      }
      const r = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(bars, false)[0];
      const mesh = (hit?.object as THREE.Mesh) ?? null;

      if (mesh !== hovered) {
        if (hovered) {
          (hovered.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
        }
        hovered = mesh;
        if (mesh) {
          const m = mesh.material as THREE.MeshStandardMaterial;
          m.emissive.copy(m.color).multiplyScalar(0.32);
          setHover(mesh.userData.cell as TerrainCell);
        } else {
          setHover(null);
        }
      }
    };
    const onLeave = () => {
      if (hovered) (hovered.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
      hovered = null;
      setHover(null);
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);

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
    const clock = new THREE.Clock();

    function tick() {
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();

      // balok tumbuh dari lantai saat pertama muncul
      if (!reduced) {
        for (const b of bars) {
          const target = b.userData.targetH as number;
          if (Math.abs(b.scale.y - target) > 0.002) {
            b.scale.y += (target - b.scale.y) * 0.075;
          }
        }
        if (autoSpin && t > 1.2) {
          azimuth -= 0.0016;
          applyCamera();
        }
      }

      renderer.render(scene, camera);
    }
    tick();

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      ro.disconnect();
      boxGeo.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      gridHelper.geometry.dispose();
      materials.forEach((m) => m.dispose());
      renderer.dispose();
      if (canvas.parentNode === el) el.removeChild(canvas);
    };
  }, [cells, departments, periods]);

  if (!supported) {
    return (
      <div className="grid h-full place-items-center t-label" style={{ color: 'var(--text-muted)' }}>
        Peramban ini tidak mendukung WebGL — gunakan tampilan tabel di bawah.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={host} className="h-full w-full" />

      {/* label melayang: identitas & angka, bukan sekadar warna */}
      <div
        className="glass pointer-events-none absolute top-3 left-3 px-3 py-2 t-micro transition-opacity"
        style={{ borderRadius: 12, opacity: hover ? 1 : 0 }}
      >
        {hover && (
          <>
            <div className="font-medium" style={{ color: 'var(--text-strong)' }}>
              {hover.dept}
            </div>
            <div style={{ color: 'var(--text-muted)' }}>{hover.period}</div>
            <div className="tnum mt-0.5 font-semibold" style={{ color: 'var(--text-strong)' }}>
              {rupiah(hover.value)}
            </div>
          </>
        )}
      </div>

      <p
        className="pointer-events-none absolute right-3 bottom-2 t-micro"
        style={{ color: 'var(--text-muted)' }}
      >
        seret untuk memutar · arahkan kursor ke balok
      </p>
    </div>
  );
}
