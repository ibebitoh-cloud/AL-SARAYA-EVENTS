import { useEffect, useRef, useState } from 'react';

type LayoutItem = {
  id: string;
  type: string;
  labelEn: string;
  labelAr: string;
  x: number;
  y: number;
  rotation: number;
  seats?: number;
};

type Props = {
  items: LayoutItem[];
  width: number;
  depth: number;
  language: 'ar' | 'en';
  mode: 'overview' | 'pov';
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
};

const THREE_URL = 'three';
const CONTROLS_URL = 'three/addons/controls/OrbitControls.js';
const POV_URL = 'three/addons/controls/PointerLockControls.js';

export function EventLayout3D({ items, width, depth, language, mode, onSelect, onMove }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [povLocked, setPovLocked] = useState(false);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    const boot = async () => {
      const THREE = await import(/* @vite-ignore */ THREE_URL);
      const { OrbitControls } = await import(/* @vite-ignore */ CONTROLS_URL);
      const { PointerLockControls } = await import(/* @vite-ignore */ POV_URL);
      if (disposed || !hostRef.current) return;

      const host = hostRef.current;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x08111d);

      const camera = new THREE.PerspectiveCamera(55, 1, 0.05, 1000);
      camera.position.set(width * 0.72, Math.max(12, depth * 0.58), depth * 0.86);

      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      host.replaceChildren(renderer.domElement);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.cursor = 'grab';

      const ambient = new THREE.HemisphereLight(0xcfe5ff, 0x172033, 2.0);
      scene.add(ambient);
      const key = new THREE.DirectionalLight(0xffffff, 3.0);
      key.position.set(width * 0.2, Math.max(width, depth), depth * 0.25);
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      scene.add(key);

      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.2, depth),
        new THREE.MeshStandardMaterial({ color: 0x242b36, roughness: 0.82, metalness: 0.05 })
      );
      floor.position.y = -0.1;
      floor.receiveShadow = true;
      floor.userData.floor = true;
      scene.add(floor);

      const grid = new THREE.GridHelper(Math.max(width, depth), Math.max(10, Math.round(Math.max(width, depth))), 0x5c6675, 0x394352);
      grid.scale.set(width / Math.max(width, depth), 1, depth / Math.max(width, depth));
      grid.position.y = 0.015;
      scene.add(grid);

      const wallMat = new THREE.MeshStandardMaterial({ color: 0x303846, roughness: 0.7 });
      const wallH = 4.5;
      const walls = [
        [0, wallH / 2, -depth / 2, width, wallH, 0.18],
        [0, wallH / 2, depth / 2, width, wallH, 0.18],
        [-width / 2, wallH / 2, 0, 0.18, wallH, depth],
        [width / 2, wallH / 2, 0, 0.18, wallH, depth],
      ];
      walls.forEach(([x, y, z, sx, sy, sz]) => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), wallMat);
        wall.position.set(x, y, z);
        wall.receiveShadow = true;
        scene.add(wall);
      });

      const labels = new THREE.Group();
      scene.add(labels);

      const makeText = (text: string, size = 0.5) => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 42px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 64);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(size * 3.5, size, 1);
        return sprite;
      };

      const makeMaterial = (color: number, metalness = 0.1, roughness = 0.65) =>
        new THREE.MeshStandardMaterial({ color, metalness, roughness });

      const addPart = (parent: any, geometry: any, material: any, position: [number, number, number], scale?: [number, number, number]) => {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(...position);
        if (scale) mesh.scale.set(...scale);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
      };

      const buildTemplate = (item: LayoutItem) => {
        const group = new THREE.Group();
        group.name = item.id;
        group.userData.itemId = item.id;
        const x = ((item.x - 50) / 100) * width;
        const z = ((item.y - 50) / 100) * depth;
        group.position.set(x, 0, z);
        group.rotation.y = (item.rotation * Math.PI) / 180;

        const gold = makeMaterial(0xc9a45a, 0.35, 0.38);
        const dark = makeMaterial(0x171b22, 0.2, 0.72);
        const white = makeMaterial(0xe8edf4, 0.05, 0.45);
        const blue = makeMaterial(0x2c79b9, 0.3, 0.35);
        const green = makeMaterial(0x2f7b61, 0.1, 0.55);
        const pink = makeMaterial(0xd987a7, 0.05, 0.5);

        if (item.type === 'table') {
          addPart(group, new THREE.CylinderGeometry(1.25, 1.25, 0.14, 40), gold, [0, 1.05, 0]);
          addPart(group, new THREE.CylinderGeometry(0.12, 0.18, 1.0, 16), dark, [0, 0.52, 0]);
          const seats = item.seats || 10;
          for (let i = 0; i < seats; i++) {
            const a = (i / seats) * Math.PI * 2;
            addPart(group, new THREE.BoxGeometry(0.55, 0.45, 0.55), white, [Math.cos(a) * 1.75, 0.3, Math.sin(a) * 1.75]);
          }
        } else if (item.type === 'chairs') {
          addPart(group, new THREE.BoxGeometry(0.55, 0.08, 0.55), white, [0, 0.45, 0]);
          addPart(group, new THREE.BoxGeometry(0.08, 0.85, 0.08), dark, [-0.2, 0.15, -0.2]);
          addPart(group, new THREE.BoxGeometry(0.08, 0.85, 0.08), dark, [0.2, 0.15, -0.2]);
          addPart(group, new THREE.BoxGeometry(0.48, 0.65, 0.08), white, [0, 0.78, -0.25]);
        } else if (item.type === 'stage') {
          addPart(group, new THREE.BoxGeometry(8, 0.65, 3.2), dark, [0, 0.33, 0]);
          addPart(group, new THREE.BoxGeometry(7.6, 0.12, 2.8), gold, [0, 0.72, 0]);
          for (let i = -3; i <= 3; i += 2) addPart(group, new THREE.BoxGeometry(0.12, 0.4, 2.5), gold, [i, 0.92, 0]);
        } else if (item.type === 'screen') {
          addPart(group, new THREE.BoxGeometry(7.4, 2.4, 0.16), blue, [0, 2.0, 0]);
          addPart(group, new THREE.BoxGeometry(0.15, 1.2, 0.15), dark, [-3.2, 0.75, 0]);
          addPart(group, new THREE.BoxGeometry(0.15, 1.2, 0.15), dark, [3.2, 0.75, 0]);
        } else if (item.type === 'podium') {
          addPart(group, new THREE.BoxGeometry(0.85, 1.15, 0.55), dark, [0, 0.58, 0]);
          addPart(group, new THREE.BoxGeometry(0.95, 0.08, 0.65), gold, [0, 1.18, 0]);
          addPart(group, new THREE.BoxGeometry(0.7, 0.7, 0.08), blue, [0, 1.45, -0.2]);
        } else if (item.type === 'dance') {
          addPart(group, new THREE.BoxGeometry(5.2, 0.18, 3.8), gold, [0, 0.09, 0]);
          const glow = makeMaterial(0x6e7ea3, 0.2, 0.3);
          for (let i = -2; i <= 2; i++) addPart(group, new THREE.BoxGeometry(0.08, 0.03, 3.2), glow, [i, 0.2, 0]);
          for (let i = -1; i <= 1; i++) addPart(group, new THREE.BoxGeometry(4.5, 0.03, 0.08), glow, [0, 0.2, i]);
        } else if (item.type === 'flowers') {
          addPart(group, new THREE.CylinderGeometry(0.35, 0.45, 0.5, 20), dark, [0, 0.25, 0]);
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            addPart(group, new THREE.SphereGeometry(0.22, 12, 12), pink, [Math.cos(a) * 0.45, 0.72 + (i % 2) * 0.15, Math.sin(a) * 0.45]);
          }
        } else if (item.type === 'buffet') {
          addPart(group, new THREE.BoxGeometry(4.5, 1.0, 0.9), green, [0, 0.5, 0]);
          addPart(group, new THREE.BoxGeometry(4.3, 0.12, 1.05), gold, [0, 1.05, 0]);
        } else {
          addPart(group, new THREE.BoxGeometry(2.6, 0.95, 0.9), blue, [0, 0.48, 0]);
          addPart(group, new THREE.BoxGeometry(2.4, 0.1, 1.0), white, [0, 1.0, 0]);
        }

        const label = makeText(language === 'ar' ? item.labelAr : item.labelEn, 0.34);
        label.position.set(0, 2.8, 0);
        group.add(label);
        return group;
      };

      const itemRoot = new THREE.Group();
      scene.add(itemRoot);
      const rebuild = () => {
        while (itemRoot.children.length) {
          const child = itemRoot.children.pop();
          if (child) child.traverse((obj: any) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
              const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
              materials.forEach((m: any) => { if (m.map) m.map.dispose(); m.dispose(); });
            }
          });
        }
        items.forEach((item) => itemRoot.add(buildTemplate(item)));
      };
      rebuild();

      const orbit = new OrbitControls(camera, renderer.domElement);
      orbit.enableDamping = true;
      orbit.dampingFactor = 0.08;
      orbit.minDistance = Math.max(5, Math.min(width, depth) * 0.28);
      orbit.maxDistance = Math.max(width, depth) * 3.2;
      orbit.maxPolarAngle = Math.PI * 0.49;
      orbit.target.set(0, 0, 0);

      const pov = new PointerLockControls(camera, renderer.domElement);
      pov.pointerSpeed = 0.75;
      pov.enabled = false;
      const keys = new Set<string>();
      let povActive = false;
      const onKeyDown = (e: KeyboardEvent) => keys.add(e.code);
      const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);
      const onLock = () => setPovLocked(true);
      const onUnlock = () => setPovLocked(false);
      document.addEventListener('keydown', onKeyDown);
      document.addEventListener('keyup', onKeyUp);
      pov.addEventListener('lock', onLock);
      pov.addEventListener('unlock', onUnlock);

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      let dragging: { id: string; group: any; offset: any; pointerId: number } | null = null;
      let dragRaf = 0;
      let pendingPointer: PointerEvent | null = null;

      const pointer = (e: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      };

      const onPointerDown = (e: PointerEvent) => {
        if (povActive) return;
        pointer(e);
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(itemRoot.children, true);
        const hit = hits.find((h: any) => h.object.parent?.userData?.itemId || h.object.parent?.parent?.userData?.itemId);
        if (!hit) return;
        let group = hit.object;
        while (group.parent && !group.userData.itemId) group = group.parent;
        if (!group.userData.itemId) return;
        const item = items.find((i) => i.id === group.userData.itemId);
        if (!item) return;
        const point = new THREE.Vector3();
        if (!raycaster.ray.intersectPlane(floorPlane, point)) return;
        dragging = { id: item.id, group, offset: group.position.clone().sub(point), pointerId: e.pointerId };
        onSelect(item.id);
        orbit.enabled = false;
        renderer.domElement.style.cursor = 'grabbing';
        try { renderer.domElement.setPointerCapture(e.pointerId); } catch {}
        e.preventDefault();
      };

      const applyPendingDrag = () => {
        dragRaf = 0;
        if (!dragging || !pendingPointer) return;
        const e = pendingPointer;
        pendingPointer = null;
        pointer(e);
        raycaster.setFromCamera(mouse, camera);
        const point = new THREE.Vector3();
        if (!raycaster.ray.intersectPlane(floorPlane, point)) return;
        const next = point.clone().add(dragging.offset);
        next.x = Math.max(-width / 2 + 0.2, Math.min(width / 2 - 0.2, next.x));
        next.z = Math.max(-depth / 2 + 0.2, Math.min(depth / 2 - 0.2, next.z));
        dragging.group.position.copy(next);
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!dragging || e.pointerId !== dragging.pointerId) return;
        pendingPointer = e;
        if (!dragRaf) dragRaf = requestAnimationFrame(applyPendingDrag);
        e.preventDefault();
      };

      const onPointerUp = (e?: PointerEvent) => {
        if (!dragging) return;
        const id = dragging.id;
        if (pendingPointer) applyPendingDrag();
        const position = dragging.group.position.clone();
        const x = ((position.x / width) * 100) + 50;
        const y = ((position.z / depth) * 100) + 50;
        onMove(id, Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y)));
        dragging = null;
        pendingPointer = null;
        if (dragRaf) { cancelAnimationFrame(dragRaf); dragRaf = 0; }
        if (e) { try { renderer.domElement.releasePointerCapture(e.pointerId); } catch {} }
        orbit.enabled = true;
        renderer.domElement.style.cursor = 'grab';
      };

      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      renderer.domElement.addEventListener('pointermove', onPointerMove);
      renderer.domElement.addEventListener('pointerup', onPointerUp);
      renderer.domElement.addEventListener('pointercancel', onPointerUp);

      const resize = () => {
        if (!hostRef.current) return;
        const r = hostRef.current.getBoundingClientRect();
        camera.aspect = Math.max(0.1, r.width / Math.max(1, r.height));
        camera.updateProjectionMatrix();
        renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
      };
      const observer = new ResizeObserver(resize);
      observer.observe(host);
      resize();

      const resetCamera = () => {
        if (mode === 'pov') {
          orbit.enabled = false;
          pov.enabled = true;
          povActive = true;
          camera.position.set(0, 1.65, depth * 0.35);
          pov.getObject().rotation.set(0, 0, 0);
          pov.lock();
        } else {
          if (pov.isLocked) pov.unlock();
          pov.enabled = false;
          povActive = false;
          orbit.enabled = true;
          camera.position.set(width * 0.72, Math.max(12, depth * 0.58), depth * 0.86);
          orbit.target.set(0, 0, 0);
          orbit.update();
        }
      };
      resetCamera();

      let last = performance.now();
      let raf = 0;
      const animate = (now: number) => {
        raf = requestAnimationFrame(animate);
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (povActive) {
          const speed = Math.max(3, Math.min(width, depth) * 0.18);
          const dir = new THREE.Vector3();
          if (keys.has('KeyW') || keys.has('ArrowUp')) dir.z -= 1;
          if (keys.has('KeyS') || keys.has('ArrowDown')) dir.z += 1;
          if (keys.has('KeyA') || keys.has('ArrowLeft')) dir.x -= 1;
          if (keys.has('KeyD') || keys.has('ArrowRight')) dir.x += 1;
          if (dir.lengthSq()) {
            dir.normalize().multiplyScalar(speed * dt);
            pov.moveRight(dir.x);
            pov.moveForward(-dir.z);
            camera.position.x = Math.max(-width / 2 + 0.4, Math.min(width / 2 - 0.4, camera.position.x));
            camera.position.z = Math.max(-depth / 2 + 0.4, Math.min(depth / 2 - 0.4, camera.position.z));
            camera.position.y = 1.65;
          }
        } else {
          orbit.update();
        }
        renderer.render(scene, camera);
      };
      raf = requestAnimationFrame(animate);

      engineRef.current = { resetCamera, rebuild, renderer, scene };
      setReady(true);

      cleanup = () => {
        cancelAnimationFrame(raf);
        observer.disconnect();
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('keyup', onKeyUp);
        pov.removeEventListener('lock', onLock);
        pov.removeEventListener('unlock', onUnlock);
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('pointermove', onPointerMove);
        renderer.domElement.removeEventListener('pointerup', onPointerUp);
        renderer.domElement.removeEventListener('pointercancel', onPointerUp);
        orbit.dispose();
        pov.dispose();
        renderer.dispose();
        scene.traverse((obj: any) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
            materials.forEach((m: any) => { if (m.map) m.map.dispose(); m.dispose(); });
          }
        });
      };
    };

    boot().catch(() => setReady(false));
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [width, depth, language]);

  useEffect(() => {
    engineRef.current?.rebuild?.();
  }, [items]);

  useEffect(() => {
    engineRef.current?.resetCamera?.();
  }, [mode]);

  return (
    <div className="relative h-full min-h-[520px] overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
      <div ref={hostRef} className="absolute inset-0" />
      {!ready && <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 bg-slate-950/90">{language === 'ar' ? 'جاري تحميل المحرك ثلاثي الأبعاد…' : 'Loading 3D engine…'}</div>}
      <div className="absolute left-3 top-3 rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-[10px] text-slate-300">
        {mode === 'pov'
          ? (language === 'ar' ? (povLocked ? 'داخل المكان · WASD للحركة · Esc للخروج' : 'اضغط داخل الشاشة للدخول · WASD للحركة') : (povLocked ? 'Inside · WASD to move · Esc to exit' : 'Click to enter · WASD to move'))
          : (language === 'ar' ? '3D حقيقي · اسحب للفّ · عجلة للتقريب · اسحب العنصر لتحريكه' : 'True 3D · drag to orbit · wheel to zoom · drag items to move')}
      </div>
    </div>
  );
}
