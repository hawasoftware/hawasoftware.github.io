import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Project, SpatialPosition, Track } from '../audio/types';
import { Sparkles, Compass, Eye, Volume2, Move, RotateCcw } from 'lucide-react';

interface SpatialAcoustics3DProps {
  project: Project;
  selectedTrackId: string;
  onSelectTrack: (trackId: string) => void;
  onUpdateSpatial: (trackId: string, spatial: SpatialPosition) => void;
  isPlaying: boolean;
}

export const SpatialAcoustics3D: React.FC<SpatialAcoustics3DProps> = ({
  project,
  selectedTrackId,
  onSelectTrack,
  onUpdateSpatial,
  isPlaying
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeAcoustic, setActiveAcoustic] = useState<'intimate' | 'studio' | 'hall' | 'cathedral'>('studio');
  const [isDraggingNode, setIsDraggingNode] = useState<boolean>(false);
  const selectedTrack = project.tracks.find(t => t.id === selectedTrackId) || project.tracks[0];

  // Three.js instances ref
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const trackMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const isInteractingRef = useRef(false);
  const draggedTrackIdRef = useRef<string | null>(null);
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const planeIntersectRef = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf6f4ef); // Soft warm glass ambient backdrop
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 12, 16);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer with antialias and alpha
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x38bdf8, 1.2, 20);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    // 5. Studio Glass Grid Floor & Boundary
    const grid = new THREE.GridHelper(24, 24, 0xc4b5fd, 0xe2e8f0);
    grid.position.y = -0.01;
    scene.add(grid);

    // Circular Acoustic Boundary Ring
    const boundaryGeo = new THREE.RingGeometry(9.9, 10, 64);
    const boundaryMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    const boundaryMesh = new THREE.Mesh(boundaryGeo, boundaryMat);
    boundaryMesh.rotation.x = -Math.PI / 2;
    scene.add(boundaryMesh);

    // Inner Sweet Spot Ring
    const sweetSpotGeo = new THREE.RingGeometry(3.9, 4.0, 64);
    const sweetSpotMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35
    });
    const sweetSpotMesh = new THREE.Mesh(sweetSpotGeo, sweetSpotMat);
    sweetSpotMesh.rotation.x = -Math.PI / 2;
    scene.add(sweetSpotMesh);

    // 6. Central 3D Listener (Head + Headphones)
    const listenerGroup = new THREE.Group();
    // Head Sphere
    const headGeo = new THREE.SphereGeometry(0.85, 32, 32);
    const headMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      metalness: 0.3,
      roughness: 0.2,
      transmission: 0.4,
      transparent: true,
      opacity: 0.95
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.y = 0.85;
    listenerGroup.add(headMesh);

    // Headband
    const bandGeo = new THREE.TorusGeometry(0.9, 0.08, 16, 32, Math.PI);
    const bandMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
    const bandMesh = new THREE.Mesh(bandGeo, bandMat);
    bandMesh.rotation.z = Math.PI;
    bandMesh.position.y = 1.25;
    listenerGroup.add(bandMesh);

    // Earcups
    const earGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 24);
    const earMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.rotation.z = Math.PI / 2;
    leftEar.position.set(-0.88, 0.85, 0);
    const rightEar = new THREE.Mesh(earGeo, earMat);
    rightEar.rotation.z = Math.PI / 2;
    rightEar.position.set(0.88, 0.85, 0);
    listenerGroup.add(leftEar);
    listenerGroup.add(rightEar);

    scene.add(listenerGroup);

    // 7. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Subtle float for listener
      listenerGroup.position.y = Math.sin(elapsed * 1.5) * 0.05;

      // Animate track sound waves / ripples
      trackMeshesRef.current.forEach((group, trackId) => {
        const rippleMesh = group.getObjectByName('ripple') as THREE.Mesh | undefined;
        if (rippleMesh) {
          const s = 1.0 + ((elapsed * 2.0) % 2.0) * 0.6;
          rippleMesh.scale.set(s, s, s);
          const mat = rippleMesh.material as THREE.MeshBasicMaterial;
          mat.opacity = Math.max(0, 0.6 - (s - 1.0) * 0.5);
        }

        // Selected halo
        const halo = group.getObjectByName('halo') as THREE.Mesh | undefined;
        if (halo) {
          halo.rotation.y = elapsed * 1.2;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update track meshes whenever project tracks change
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove obsolete meshes
    trackMeshesRef.current.forEach((mesh, trackId) => {
      if (!project.tracks.some(t => t.id === trackId)) {
        scene.remove(mesh);
        trackMeshesRef.current.delete(trackId);
      }
    });

    // Create or update mesh for each track
    project.tracks.forEach((track) => {
      let group = trackMeshesRef.current.get(track.id);

      if (!group) {
        group = new THREE.Group();
        group.name = track.id;

        // Core Glowing Sound Sphere
        const sphereGeo = new THREE.SphereGeometry(0.65, 32, 32);
        const sphereMat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(track.color),
          emissive: new THREE.Color(track.color),
          emissiveIntensity: 0.35,
          roughness: 0.15,
          transmission: 0.3,
          transparent: true,
          opacity: 0.95
        });
        const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
        sphereMesh.name = 'core';
        group.add(sphereMesh);

        // Sound Wave Ripple Ring
        const ringGeo = new THREE.RingGeometry(0.7, 0.85, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(track.color),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.5
        });
        const rippleMesh = new THREE.Mesh(ringGeo, ringMat);
        rippleMesh.name = 'ripple';
        rippleMesh.rotation.x = -Math.PI / 2;
        group.add(rippleMesh);

        // Selection Orbit Halo
        const haloGeo = new THREE.TorusGeometry(0.95, 0.04, 16, 32);
        const haloMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.8
        });
        const haloMesh = new THREE.Mesh(haloGeo, haloMat);
        haloMesh.name = 'halo';
        haloMesh.rotation.x = Math.PI / 4;
        group.add(haloMesh);

        // Ground drop shadow projection circle
        const shadowGeo = new THREE.CircleGeometry(0.6, 24);
        const shadowMat = new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0.15
        });
        const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
        shadowMesh.name = 'shadow';
        shadowMesh.rotation.x = -Math.PI / 2;
        shadowMesh.position.y = -track.spatial.y + 0.02; // Keep at ground level
        group.add(shadowMesh);

        scene.add(group);
        trackMeshesRef.current.set(track.id, group);
      }

      // Update position
      group.position.set(track.spatial.x, track.spatial.y + 0.65, track.spatial.z);

      // Update shadow position to ground
      const shadow = group.getObjectByName('shadow');
      if (shadow) {
        shadow.position.y = -(track.spatial.y + 0.65) + 0.02;
      }

      // Update selection indicator
      const halo = group.getObjectByName('halo') as THREE.Mesh | undefined;
      if (halo) {
        halo.visible = track.id === selectedTrackId;
      }
    });
  }, [project.tracks, selectedTrackId]);

  // Pointer Interaction for Dragging Sound Nodes in 3D
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    const hitObjects: THREE.Object3D[] = [];
    trackMeshesRef.current.forEach(group => {
      const core = group.getObjectByName('core');
      if (core) hitObjects.push(core);
    });

    const intersects = raycasterRef.current.intersectObjects(hitObjects, false);
    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;
      const trackId = clickedMesh.parent?.name;
      if (trackId) {
        onSelectTrack(trackId);
        draggedTrackIdRef.current = trackId;
        isInteractingRef.current = true;
        setIsDraggingNode(true);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isInteractingRef.current || !draggedTrackIdRef.current) return;
    if (!containerRef.current || !cameraRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    if (raycasterRef.current.ray.intersectPlane(planeRef.current, planeIntersectRef.current)) {
      const currentTrack = project.tracks.find(t => t.id === draggedTrackIdRef.current);
      if (currentTrack) {
        // Clamp spatial coordinates to within studio boundaries (-9 to 9)
        const newX = Math.round(Math.max(-9, Math.min(9, planeIntersectRef.current.x)) * 10) / 10;
        const newZ = Math.round(Math.max(-9, Math.min(9, planeIntersectRef.current.z)) * 10) / 10;
        onUpdateSpatial(draggedTrackIdRef.current, {
          ...currentTrack.spatial,
          x: newX,
          z: newZ
        });
      }
    }
  };

  const handlePointerUp = () => {
    isInteractingRef.current = false;
    draggedTrackIdRef.current = null;
    setIsDraggingNode(false);
  };

  // Preset room acoustic change
  const handleAcousticModeChange = (mode: 'intimate' | 'studio' | 'hall' | 'cathedral') => {
    setActiveAcoustic(mode);
    if (selectedTrack) {
      onUpdateSpatial(selectedTrack.id, {
        ...selectedTrack.spatial,
        roomAcoustic: mode
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-col glass-panel rounded-2xl border border-stone-200/80 overflow-hidden relative shadow-lg">
      {/* Top HUD overlay */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <div className="glass-panel px-3.5 py-2 rounded-xl flex items-center gap-2 border border-white/80 shadow-md">
          <Sparkles className="w-4 h-4 text-sky-500" />
          <span className="text-xs font-bold text-stone-800 tracking-wide uppercase">3D Spatial Acoustics Engine</span>
        </div>

        {/* Room Acoustic Mode */}
        <div className="glass-panel p-1 rounded-xl flex items-center gap-1 border border-white/80 shadow-md text-xs">
          <span className="text-[11px] text-stone-500 font-semibold px-2">Acoustic:</span>
          {(['intimate', 'studio', 'hall', 'cathedral'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => handleAcousticModeChange(mode)}
              className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-all ${
                activeAcoustic === mode
                  ? 'bg-stone-900 text-white shadow-sm font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Track Coordinates Float Card */}
      {selectedTrack && (
        <div className="absolute top-4 right-4 z-10 glass-panel-dark text-white p-3.5 rounded-2xl border border-white/20 shadow-xl w-64 backdrop-blur-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-3.5 h-3.5 rounded-full ring-2 ring-white/40 shadow-sm"
                style={{ backgroundColor: selectedTrack.color }}
              />
              <span className="text-xs font-bold tracking-tight">{selectedTrack.name}</span>
            </div>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-stone-300">
              HRTF 3D
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3 font-mono">
            <div className="bg-white/10 p-1.5 rounded-lg">
              <div className="text-[9px] text-stone-400">X (Pan)</div>
              <div className="font-bold text-sky-400">{selectedTrack.spatial.x.toFixed(1)}m</div>
            </div>
            <div className="bg-white/10 p-1.5 rounded-lg">
              <div className="text-[9px] text-stone-400">Y (Height)</div>
              <div className="font-bold text-amber-400">{selectedTrack.spatial.y.toFixed(1)}m</div>
            </div>
            <div className="bg-white/10 p-1.5 rounded-lg">
              <div className="text-[9px] text-stone-400">Z (Depth)</div>
              <div className="font-bold text-rose-400">{selectedTrack.spatial.z.toFixed(1)}m</div>
            </div>
          </div>

          {/* Quick Elevation Y Slider */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-[11px] text-stone-300">Vertical Height:</span>
            <input
              type="range"
              min="-2"
              max="4"
              step="0.1"
              value={selectedTrack.spatial.y}
              onChange={(e) => onUpdateSpatial(selectedTrack.id, {
                ...selectedTrack.spatial,
                y: parseFloat(e.target.value)
              })}
              className="w-28 accent-amber-400 h-1.5 bg-stone-700 rounded-lg cursor-pointer"
            />
          </div>

          <p className="text-[10px] text-stone-400 mt-2 text-center flex items-center justify-center gap-1">
            <Move className="w-3 h-3" /> Drag spheres in the room to reposition sound
          </p>
        </div>
      )}

      {/* 3D WebGL Canvas */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`w-full h-full cursor-grab ${isDraggingNode ? 'cursor-grabbing' : ''}`}
      />

      {/* Bottom Track List Quick Switch Bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 glass-panel px-3 py-1.5 rounded-2xl flex items-center gap-2 border border-white/90 shadow-md">
        <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider pr-1">Sources:</span>
        {project.tracks.map(track => (
          <button
            key={track.id}
            onClick={() => onSelectTrack(track.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
              track.id === selectedTrackId
                ? 'bg-stone-900 text-white shadow-sm scale-105'
                : 'bg-white/70 text-stone-700 hover:bg-white'
            }`}
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: track.color }}
            />
            {track.name}
          </button>
        ))}
      </div>
    </div>
  );
};
