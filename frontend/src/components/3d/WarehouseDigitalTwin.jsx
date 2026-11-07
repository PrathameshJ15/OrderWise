import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Play,
  Pause,
  RotateCcw,
  Box,
  Layers,
  AlertTriangle,
  CheckCircle2,
  X,
  Compass,
  ArrowRight,
  Eye,
  Sliders,
  Maximize2,
  TrendingUp,
  TrendingDown,
  Truck,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import {
  createWarehouseFloor,
  createDockBays,
  buildRackBay,
  populateRackCrates,
  createTransitParticles,
  createForkliftAGV,
  createWarehouseArchitecture,
  ZONE_CONFIGS,
  PALETTE,
} from './warehouse/warehouseBuilder';

/**
 * Checks if WebGL is available in the current browser/runtime environment.
 */
function checkWebGLSupport() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    if (!canvas || typeof canvas.getContext !== 'function') return false;
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    return Boolean(gl);
  } catch (_e) {
    return false;
  }
}

/**
 * ============================================================================
 * WAREHOUSE DIGITAL TWIN 3D SIMULATION COMPONENT
 * ============================================================================
 * High-fidelity, realistic industrial digital twin for the OrderWise Simulation Lab.
 * Features:
 *  - High-density industrial pallet racking with distinct SKU physical models
 *  - Polished concrete floor with safety walkways & hazard striping
 *  - Autonomous warehouse AGV / Forklift traversing safety lanes
 *  - Inbound & Outbound loading dock infrastructure with conveyor lines
 *  - Overhead structural trusses & suspended high-bay LED luminaires
 *  - Real-time simulation scenario visualization & before-and-after toggles
 *  - Interactive Raycasting & floating glassmorphic inventory telemetry HUD
 *  - Cinematic lerping camera presets (Isometric, Blueprint, Aisle, Focus, Docks)
 * ============================================================================
 */
export default function WarehouseDigitalTwin({
  products = [],
  orders = [],
  activeResult = null,
  selectedScenario = 'inventory_increase',
  scenarioInputs = {},
  selectedProductId = null,
  onSelectProduct = () => {},
  onSelectZone = () => {},
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animationFrameRef = useRef(null);
  const racksMapRef = useRef(new Map());
  const transitParticlesRef = useRef(null);
  const forkliftRef = useRef(null);

  // Smooth camera animation target refs
  const cameraTargetPos = useRef(null);
  const controlsTargetLookAt = useRef(null);

  const [hasWebGL, setHasWebGL] = useState(() => checkWebGLSupport());
  const [isPlaying, setIsPlaying] = useState(true);
  const [viewMode, setViewMode] = useState('simulated'); // 'baseline' | 'simulated'
  const [activeZone, setActiveZone] = useState(null);
  const [inspectedProduct, setInspectedProduct] = useState(null);
  const [hoveredObject, setHoveredObject] = useState(null);

  // Re-verify WebGL availability on mount
  useEffect(() => {
    setHasWebGL(checkWebGLSupport());
  }, []);

  // Compute merged product inventory metrics combining baseline + authoritative simulation diff
  const inventoryMetrics = useMemo(() => {
    const diffData = activeResult?.diff || activeResult?.results || activeResult;
    const itemDiffs = diffData?.item_diffs || diffData?.changes || diffData?.differences || [];

    const map = new Map();

    products.forEach((p) => {
      const pId = Number(p.id);
      const onHand = Number(p.on_hand_quantity ?? p.inventory?.on_hand_quantity ?? 100);
      const reserved = Number(p.reserved_quantity ?? p.inventory?.reserved_quantity ?? 0);

      // Extract matching diffs from authoritative simulation results
      const pDiffs = itemDiffs.filter((d) => Number(d.product_id) === pId);
      const allocatedSim = pDiffs.reduce((sum, d) => sum + (d.current_allocated ?? d.simulated_allocated ?? 0), 0);
      const requestedSim = pDiffs.reduce((sum, d) => sum + (d.requested_quantity ?? 0), 0);
      const deferredSim = Math.max(0, requestedSim - allocatedSim);

      let simulatedStock = onHand;
      if (selectedScenario === 'inventory_increase' && Number(scenarioInputs?.product_id) === pId) {
        simulatedStock += Number(scenarioInputs?.quantity ?? 0);
      } else if (selectedScenario === 'inventory_decrease' && Number(scenarioInputs?.product_id) === pId) {
        simulatedStock = Math.max(0, onHand - Number(scenarioInputs?.quantity ?? 0));
      }

      const availableFree = Math.max(0, onHand - reserved);
      const simulatedFree = Math.max(0, simulatedStock - allocatedSim);

      map.set(pId, {
        product_id: pId,
        name: p.name,
        sku: p.sku,
        on_hand_quantity: onHand,
        reserved_quantity: reserved,
        available_quantity: availableFree,
        simulated_stock: simulatedStock,
        simulated_free: simulatedFree,
        allocated_quantity: allocatedSim,
        deferred_quantity: deferredSim,
        requested_quantity: requestedSim,
        diffs: pDiffs,
        netDelta: simulatedStock - onHand,
        fulfillmentRate: requestedSim > 0 ? Math.round((allocatedSim / requestedSim) * 100) : 100,
      });
    });

    return map;
  }, [products, activeResult, selectedScenario, scenarioInputs]);

  // Smooth cinematic camera transitions using lerp target positions
  const setCameraPreset = useCallback((preset, targetZonePos = null) => {
    if (!cameraRef.current || !controlsRef.current) return;

    let targetPos = new THREE.Vector3(28, 24, 28);
    let targetLook = new THREE.Vector3(0, 2, 0);

    switch (preset) {
      case 'overhead': // Top-down architectural blueprint view
        targetPos = new THREE.Vector3(0, 50, 0.01);
        targetLook = new THREE.Vector3(0, 0, 0);
        break;
      case 'aisle': // Ground eye-level warehouse aisle perspective
        targetPos = new THREE.Vector3(0, 7, 28);
        targetLook = new THREE.Vector3(0, 3, 0);
        break;
      case 'zone-c': // Scarce bay close-up
        targetPos = new THREE.Vector3(-8, 12, 16);
        targetLook = new THREE.Vector3(-10, 3, 8);
        break;
      case 'docks': // Logistics inbound/outbound docks view
        targetPos = new THREE.Vector3(0, 16, 28);
        targetLook = new THREE.Vector3(0, 2, 0);
        break;
      case 'focus': // Dynamic focus on specific rack coordinates
        if (targetZonePos) {
          targetPos = new THREE.Vector3(targetZonePos[0] + 8, 9, targetZonePos[2] + 10);
          targetLook = new THREE.Vector3(targetZonePos[0], 3, targetZonePos[2]);
        }
        break;
      case 'isometric': // Standard 30-degree isometric view
      default:
        targetPos = new THREE.Vector3(28, 24, 28);
        targetLook = new THREE.Vector3(0, 2, 0);
        break;
    }

    cameraTargetPos.current = targetPos;
    controlsTargetLookAt.current = targetLook;
  }, []);

  // Sync inspected product when selectedProductId prop changes
  useEffect(() => {
    if (selectedProductId) {
      const match = ZONE_CONFIGS.find((z) => z.productId === Number(selectedProductId));
      if (match) {
        setActiveZone(match);
        const data = inventoryMetrics.get(match.productId);
        setInspectedProduct(data || { name: match.name, sku: match.sku, product_id: match.productId });
        setCameraPreset('focus', match.position);
      }
    }
  }, [selectedProductId, inventoryMetrics, setCameraPreset]);

  // Initialize Three.js Scene, Camera, Controls, Lights, Racks, Docks & AGV
  useEffect(() => {
    if (!hasWebGL || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 480;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isLight ? 0xf8fafc : 0x0a0a0c);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 1000);
    camera.position.set(28, 24, 28);
    cameraRef.current = camera;

    // 3. WebGLRenderer with high-performance flags & soft shadows
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
        alpha: true,
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;
      container.replaceChildren(renderer.domElement);
    } catch (_err) {
      setHasWebGL(false);
      return;
    }

    // 4. OrbitControls
    let controls;
    try {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxPolarAngle = Math.PI / 2.05; // Prevent camera dipping beneath floor
      controls.minDistance = 8;
      controls.maxDistance = 75;
      controls.target.set(0, 2, 0);
      controlsRef.current = controls;
    } catch (_err) {
      // Fallback
    }

    // 5. Lighting Setup (Industrial high-bay LED luminaires + soft red ambient accent)
    const ambientLight = new THREE.AmbientLight(0xffffff, isLight ? 1.05 : 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, isLight ? 1.5 : 1.3);
    dirLight.position.set(26, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 80;
    dirLight.shadow.camera.left = -25;
    dirLight.shadow.camera.right = 25;
    dirLight.shadow.camera.top = 25;
    dirLight.shadow.camera.bottom = -25;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    // OrderWise signature soft ambient red light
    const redAccentLight = new THREE.PointLight(PALETTE.accentRed, 1.4, 30);
    redAccentLight.position.set(-10, 6, 8);
    scene.add(redAccentLight);

    // 6. Build Structural Warehouse Floor Slab, Loading Docks & Architectural Trusses
    createWarehouseFloor(scene, isLight);
    createDockBays(scene, isLight);
    createWarehouseArchitecture(scene, isLight);

    // 7. Build Industrial 3-Tier Storage Racks
    const racksMap = new Map();
    ZONE_CONFIGS.forEach((zone) => {
      const rackData = buildRackBay(zone, { isLight });
      scene.add(rackData.group);
      racksMap.set(zone.productId, { zone, rackData });
    });
    racksMapRef.current = racksMap;

    // 8. Autonomous Warehouse AGV / Forklift
    const forklift = createForkliftAGV(scene);
    forkliftRef.current = forklift;

    // 9. Transit Flow Logistics Particles
    const particles = createTransitParticles(scene, 24);
    transitParticlesRef.current = particles;

    // 10. Interactive Raycasting for Hover & Click Inspections
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const getIntersectedObject = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const clientX = event.clientX || (event.touches && event.touches[0]?.clientX);
      const clientY = event.clientY || (event.touches && event.touches[0]?.clientY);
      if (!clientX || !clientY) return null;

      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (const hit of intersects) {
        let curr = hit.object;
        while (curr && curr !== scene) {
          if (curr.userData?.type === 'zone_rack' || curr.userData?.type === 'product_crate') {
            return curr.userData;
          }
          curr = curr.parent;
        }
      }
      return null;
    };

    const handlePointerMove = (e) => {
      const hit = getIntersectedObject(e);
      if (hit) {
        renderer.domElement.style.cursor = 'pointer';
        setHoveredObject(hit);
      } else {
        renderer.domElement.style.cursor = 'grab';
        setHoveredObject(null);
      }
    };

    const handlePointerDown = (e) => {
      const hit = getIntersectedObject(e);
      if (hit) {
        const zone = ZONE_CONFIGS.find((z) => z.productId === hit.productId);
        if (zone) {
          setActiveZone(zone);
          const metric = inventoryMetrics.get(zone.productId);
          setInspectedProduct(metric || { name: zone.name, sku: zone.sku, product_id: zone.productId });
          onSelectZone(zone);
          onSelectProduct(metric);
          setCameraPreset('focus', zone.position);
        }
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('pointermove', handlePointerMove);
    domElement.addEventListener('pointerdown', handlePointerDown);

    // 11. Responsive Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // 12. Main 60 FPS Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Camera Lerp interpolation towards target positions
      if (cameraTargetPos.current) {
        camera.position.lerp(cameraTargetPos.current, 0.06);
        if (camera.position.distanceTo(cameraTargetPos.current) < 0.05) {
          camera.position.copy(cameraTargetPos.current);
          cameraTargetPos.current = null;
        }
      }

      if (controlsTargetLookAt.current && controls) {
        controls.target.lerp(controlsTargetLookAt.current, 0.06);
        if (controls.target.distanceTo(controlsTargetLookAt.current) < 0.05) {
          controls.target.copy(controlsTargetLookAt.current);
          controlsTargetLookAt.current = null;
        }
      }

      if (controls && typeof controls.update === 'function') {
        controls.update();
      }

      // Update AGV Forklift
      if (forkliftRef.current && isPlaying) {
        forkliftRef.current.update(delta, isPlaying);
      }

      // Update Transit Logistics Flow Particles
      if (transitParticlesRef.current && isPlaying) {
        transitParticlesRef.current.update(delta, isPlaying);
      }

      // Shortage / Simulation Alert Beacons pulsing animation
      if (isPlaying) {
        const time = clock.getElapsedTime();
        racksMap.forEach(({ rackData, zone }) => {
          if (rackData.beaconLight && zone.isScarce) {
            rackData.beaconLight.intensity = 1.4 + Math.sin(time * 5) * 0.8;
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      resizeObserver.disconnect();
      domElement.removeEventListener('pointermove', handlePointerMove);
      domElement.removeEventListener('pointerdown', handlePointerDown);

      scene.clear();
      renderer.dispose();
      racksMap.clear();
    };
  }, [hasWebGL, isLight, inventoryMetrics, onSelectProduct, onSelectZone, setCameraPreset]);

  // Update crates dynamically when inventoryMetrics or viewMode changes
  useEffect(() => {
    if (!racksMapRef.current || racksMapRef.current.size === 0) return;

    racksMapRef.current.forEach(({ rackData, zone }) => {
      const data = inventoryMetrics.get(zone.productId) || {};
      populateRackCrates(rackData, zone, data, {
        isSimulated: viewMode === 'simulated',
        isLight,
      });
    });
  }, [inventoryMetrics, viewMode, isLight]);

  return (
    <div className="relative w-full rounded-card border border-bd bg-s overflow-hidden select-none transition-colors duration-300 shadow-xl">
      {/* 3D Top Header & Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-bd bg-s2/80 backdrop-blur-sm z-10">
        <div className="flex items-center space-x-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isPlaying ? 'bg-ok' : 'bg-wa'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPlaying ? 'bg-ok' : 'bg-wa'}`}
            />
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-[12px] font-mono font-bold tracking-wider uppercase text-t">
              3D Warehouse Digital Twin
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-pill bg-ac/10 text-ac border border-ac/30 font-semibold">
              {viewMode === 'simulated' ? 'SIMULATED OUTCOME' : 'LIVE BASELINE'}
            </span>
          </div>
        </div>

        {/* View Mode & Animation Controls */}
        <div className="flex items-center space-x-2">
          {/* Baseline vs Simulated Outcome Mode Toggle */}
          <div className="inline-flex rounded-pill border border-bd bg-s p-0.5 text-[12px]">
            <button
              onClick={() => setViewMode('baseline')}
              className={`px-3 py-1 rounded-pill font-medium transition-all ${
                viewMode === 'baseline'
                  ? 'bg-s2 text-t shadow-sm font-semibold'
                  : 'text-t2 hover:text-t'
              }`}
            >
              Baseline State
            </button>
            <button
              onClick={() => setViewMode('simulated')}
              className={`px-3 py-1 rounded-pill font-medium transition-all ${
                viewMode === 'simulated'
                  ? 'bg-ac text-white shadow-sm font-semibold'
                  : 'text-t2 hover:text-t'
              }`}
            >
              Simulated Outcome
            </button>
          </div>

          {/* Play/Pause Animation Toggle */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause simulation animations' : 'Play simulation animations'}
            className="p-1.5 rounded-pill border border-bd bg-s2 text-t2 hover:text-t transition-colors"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current text-ok" />}
          </button>

          {/* Reset Camera View */}
          <button
            onClick={() => setCameraPreset('isometric')}
            title="Reset to default isometric camera angle"
            className="p-1.5 rounded-pill border border-bd bg-s2 text-t2 hover:text-t transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="relative w-full h-[480px] md:h-[540px] bg-s overflow-hidden">
        {hasWebGL ? (
          <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        ) : (
          /* WebGL Fallback 2D Floorplan View */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-s2/40">
            <Layers className="h-12 w-12 text-t2 mb-3 opacity-40" />
            <h4 className="font-display font-bold text-base text-t">Warehouse Floorplan View (2D Fallback)</h4>
            <p className="text-[13px] text-t2 max-w-md mt-1">
              WebGL is unavailable in this environment. Interactive storage zones and telemetry remain fully operational.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-6 w-full max-w-lg">
              {ZONE_CONFIGS.map((z) => {
                const metric = inventoryMetrics.get(z.productId);
                return (
                  <button
                    key={z.id}
                    onClick={() => {
                      setActiveZone(z);
                      setInspectedProduct(metric);
                      onSelectZone(z);
                      onSelectProduct(metric);
                    }}
                    className={`p-3 rounded-card border text-left transition-all ${
                      activeZone?.id === z.id
                        ? 'border-ac bg-ac/10 text-t shadow-sm'
                        : 'border-bd bg-s text-t2 hover:border-outline'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-ac">{z.code}</span>
                      <span className="text-[11px] text-t2 font-medium">{z.name}</span>
                    </div>
                    <div className="font-bold text-t text-[13px] mt-1">{z.name}</div>
                    <div className="text-[12px] text-t2 mt-1">
                      Stock: {viewMode === 'simulated' ? metric?.simulated_stock : metric?.on_hand_quantity} units
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Camera Quick-Preset Toolbar (Overlay Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-1.5 p-1.5 rounded-pill border border-bd/80 bg-s/90 backdrop-blur-md shadow-lg">
          <span className="text-[11px] font-mono text-t2 px-2 hidden sm:inline">Camera:</span>
          <button
            onClick={() => setCameraPreset('isometric')}
            className="px-2.5 py-1 text-[11px] font-mono rounded-pill border border-bd bg-s2 text-t hover:border-ac transition-colors"
          >
            Isometric
          </button>
          <button
            onClick={() => setCameraPreset('overhead')}
            className="px-2.5 py-1 text-[11px] font-mono rounded-pill border border-bd bg-s2 text-t hover:border-ac transition-colors"
          >
            Blueprint
          </button>
          <button
            onClick={() => setCameraPreset('aisle')}
            className="px-2.5 py-1 text-[11px] font-mono rounded-pill border border-bd bg-s2 text-t hover:border-ac transition-colors"
          >
            Aisle View
          </button>
          <button
            onClick={() => setCameraPreset('zone-c')}
            className="px-2.5 py-1 text-[11px] font-mono rounded-pill border border-ac/40 bg-ac/10 text-ac font-semibold hover:bg-ac/20 transition-colors"
          >
            Zone C (Scarce)
          </button>
          <button
            onClick={() => setCameraPreset('docks')}
            className="px-2.5 py-1 text-[11px] font-mono rounded-pill border border-bd bg-s2 text-t hover:border-ac transition-colors"
          >
            Docks
          </button>
        </div>

        {/* Active Simulation Notification Banner Overlay */}
        {activeResult && (
          <div className="absolute top-4 left-4 z-10 max-w-sm rounded-card border border-ok/30 bg-s/90 backdrop-blur-md p-3 shadow-lg flex items-center space-x-2.5 text-[12px]">
            <Sparkles className="h-4 w-4 text-ok shrink-0 animate-pulse" />
            <div>
              <span className="font-semibold text-t block">Authoritative Simulation Active</span>
              <span className="text-t2 text-[11px]">
                Scenario: <span className="text-ac font-mono font-bold uppercase">{selectedScenario.replace(/_/g, ' ')}</span> &bull; 3D racks reflect live simulated diff.
              </span>
            </div>
          </div>
        )}

        {/* Interactive Floating Product & Zone Inspector HUD Card (Top Right Overlay) */}
        {inspectedProduct && (
          <div className="absolute top-4 right-4 z-20 w-84 max-w-[calc(100vw-32px)] rounded-card border border-bd bg-s/95 backdrop-blur-md p-4 shadow-2xl transition-all">
            <div className="flex items-start justify-between border-b border-bd pb-2.5 mb-3">
              <div>
                <span className="text-[11px] font-mono font-bold text-ac uppercase block">
                  {activeZone?.code || 'ZONE'} &bull; {inspectedProduct.sku}
                </span>
                <h4 className="font-display font-bold text-[16px] text-t leading-tight">
                  {inspectedProduct.name}
                </h4>
              </div>
              <button
                onClick={() => {
                  setInspectedProduct(null);
                  setActiveZone(null);
                }}
                className="p-1 rounded-pill text-t2 hover:text-t hover:bg-s2 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Inventory Telemetry Metrics */}
            <div className="grid grid-cols-2 gap-2 text-[12px] mb-3">
              <div className="p-2.5 rounded-card bg-s2 border border-bd/60">
                <span className="text-t2 text-[10px] font-mono block">Baseline On-Hand</span>
                <span className="font-mono font-bold text-t text-sm">
                  {inspectedProduct.on_hand_quantity ?? 0} units
                </span>
                <span className="text-t2 text-[10px] block mt-0.5">
                  Reserved: {inspectedProduct.reserved_quantity ?? 0}
                </span>
              </div>
              <div className="p-2.5 rounded-card bg-s2 border border-bd/60">
                <span className="text-t2 text-[10px] font-mono block">Simulated Stock</span>
                <span className="font-mono font-bold text-sm text-ac">
                  {inspectedProduct.simulated_stock ?? inspectedProduct.on_hand_quantity ?? 0} units
                </span>
                <span className="text-t2 text-[10px] block mt-0.5">
                  Free: {inspectedProduct.simulated_free ?? 0}
                </span>
              </div>
            </div>

            {/* Allocation Progress Bar */}
            <div className="space-y-1 mb-3">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-t2">Fulfillment Rate:</span>
                <span className="font-bold text-ok">{inspectedProduct.fulfillmentRate ?? 100}%</span>
              </div>
              <div className="w-full bg-s2 h-2 rounded-full overflow-hidden flex border border-bd/60">
                <div
                  className="bg-ok h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, inspectedProduct.fulfillmentRate ?? 100)}%` }}
                />
                <div
                  className="bg-no h-full transition-all duration-500"
                  style={{ width: `${Math.max(0, 100 - (inspectedProduct.fulfillmentRate ?? 100))}%` }}
                />
              </div>
            </div>

            {/* Detailed Allocation Breakdown */}
            <div className="space-y-1.5 border-t border-bd pt-2 text-[12px]">
              <div className="flex items-center justify-between text-t2">
                <span>Requested Demand:</span>
                <span className="font-mono font-bold text-t">
                  {inspectedProduct.requested_quantity ?? 0} units
                </span>
              </div>
              <div className="flex items-center justify-between text-t2">
                <span>Simulated Allocated:</span>
                <span className="font-mono font-bold text-ok">
                  {inspectedProduct.allocated_quantity ?? 0} units
                </span>
              </div>
              <div className="flex items-center justify-between text-t2">
                <span>Simulated Shortage:</span>
                <span className="font-mono font-bold text-no">
                  {inspectedProduct.deferred_quantity ?? 0} units
                </span>
              </div>
              <div className="flex items-center justify-between text-t2 font-semibold">
                <span>Net Stock Delta:</span>
                <span
                  className={`font-mono ${
                    (inspectedProduct.netDelta ?? 0) > 0
                      ? 'text-ok'
                      : (inspectedProduct.netDelta ?? 0) < 0
                      ? 'text-no'
                      : 'text-t2'
                  }`}
                >
                  {(inspectedProduct.netDelta ?? 0) > 0 ? `+${inspectedProduct.netDelta}` : inspectedProduct.netDelta ?? 0} units
                </span>
              </div>
            </div>

            {/* Focus on Zone Action Button */}
            {activeZone && (
              <div className="mt-3 pt-2.5 border-t border-bd flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCameraPreset('focus', activeZone.position)}
                  className="btn-secondary w-full py-1.5 text-[11px] font-mono flex items-center justify-center space-x-1.5"
                >
                  <Compass className="h-3.5 w-3.5 text-ac" />
                  <span>Center Camera on {activeZone.code}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Hover Object Indicator Pill */}
        {hoveredObject && !inspectedProduct && (
          <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-pill border border-bd bg-s/90 backdrop-blur-md shadow-md text-[12px] font-mono flex items-center space-x-2 text-t">
            <Box className="h-3.5 w-3.5 text-ac" />
            <span>
              {hoveredObject.sku || hoveredObject.label || 'Interactive Object'} &mdash;{' '}
              <span className="text-t2">Click to inspect</span>
            </span>
          </div>
        )}
      </div>

      {/* Footer Allocation Legend & Quick Zone Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t border-bd bg-s2/40 text-[12px]">
        {/* Color Legend */}
        <div className="flex flex-wrap items-center gap-4 text-t2 font-sans">
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-ok" />
            <span>Fully Allocated</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-wa" />
            <span>Partially Allocated</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-no" />
            <span>Shortage / Deferred</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3B82F6]" />
            <span>Available Free Stock</span>
          </div>
        </div>

        {/* Quick Zone Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto">
          {ZONE_CONFIGS.map((z) => (
            <button
              key={z.id}
              onClick={() => {
                setActiveZone(z);
                const metric = inventoryMetrics.get(z.productId);
                setInspectedProduct(metric || { name: z.name, sku: z.sku, product_id: z.productId });
                onSelectZone(z);
                onSelectProduct(metric);
                setCameraPreset('focus', z.position);
              }}
              className={`px-2 py-0.5 rounded-pill text-[11px] font-mono transition-colors ${
                activeZone?.id === z.id
                  ? 'bg-ac text-white font-bold'
                  : 'bg-s text-t2 border border-bd hover:text-t'
              }`}
            >
              {z.code}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
