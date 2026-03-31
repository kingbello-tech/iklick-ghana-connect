import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three-stdlib';
import { RenderPass } from 'three-stdlib';
import { UnrealBloomPass } from 'three-stdlib';
import { ShaderPass } from 'three-stdlib';
import { FXAAShader } from 'three-stdlib';

interface MetropolisSceneProps {
  scrollProgress: number;
  theme?: string;
}

const MetropolisScene = ({ scrollProgress, theme = 'light' }: MetropolisSceneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    composer: EffectComposer;
    fibers: THREE.Mesh[];
    buildings: THREE.Group[];
    targetBuilding: THREE.Group | null;
    dataPulses: THREE.Mesh[];
    pulseData: { curve: THREE.QuadraticBezierCurve3; t: number; speed: number }[];
    signalRings: THREE.Mesh[];
    tower: THREE.Group | null;
  }>();

  // Update scene colors when theme changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const { scene, renderer } = sceneRef.current;
    
    const isDark = theme === 'dark';
    const bgColor = isDark ? 0x0a0f1a : 0xb8d0e8;
    const fogColor = isDark ? 0x0a0f1a : 0xb8d0e8;
    
    scene.fog = new THREE.FogExp2(fogColor, isDark ? 0.005 : 0.004);
    renderer.setClearColor(bgColor, 1);
    
    scene.children.forEach(child => {
      if (child instanceof THREE.AmbientLight) {
        child.color.setHex(isDark ? 0x1a2332 : 0x8899aa);
        child.intensity = isDark ? 0.5 : 1.2;
      }
      if (child instanceof THREE.DirectionalLight) {
        child.intensity = isDark ? 2.5 : 3.5;
      }
    });
  }, [theme]);

  useEffect(() => {
    if (!containerRef.current) return;

    const isDark = theme === 'dark';
    const bgColor = isDark ? 0x0a0f1a : 0xb8d0e8;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(bgColor, isDark ? 0.005 : 0.004);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 50, 100);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(bgColor, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isDark ? 1.4 : 1.8;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // Post-processing
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      isDark ? 1.8 : 0.8, isDark ? 0.6 : 0.4, isDark ? 0.75 : 0.85
    );
    composer.addPass(bloomPass);
    const fxaaPass = new ShaderPass(FXAAShader);
    const pr = renderer.getPixelRatio();
    fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pr);
    fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pr);
    composer.addPass(fxaaPass);

    // Lighting
    scene.add(new THREE.AmbientLight(isDark ? 0x1a2332 : 0x8899aa, isDark ? 0.5 : 1.2));
    const dirLight = new THREE.DirectionalLight(0xffffff, isDark ? 2.5 : 3.5);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    scene.add(dirLight);
    scene.add(new THREE.PointLight(0x00d4ff, isDark ? 3 : 2, 400).translateTo?.(40, 100, 40) || (() => { const l = new THREE.PointLight(0x00d4ff, isDark ? 3 : 2, 400); l.position.set(40, 100, 40); return l; })());
    scene.add((() => { const l = new THREE.PointLight(0x4dd4ff, isDark ? 2.5 : 1.5, 400); l.position.set(-40, 100, -40); return l; })());
    scene.add((() => { const l = new THREE.PointLight(0x00bfcc, isDark ? 2 : 1.2, 350); l.position.set(0, 80, -50); return l; })());
    scene.add((() => { const l = new THREE.PointLight(0x4dd4ff, isDark ? 2 : 1, 250); l.position.set(0, 130, 0); return l; })());
    const spotLight = new THREE.SpotLight(0xffffff, isDark ? 1.5 : 2);
    spotLight.position.set(0, 150, 0);
    spotLight.angle = Math.PI / 3;
    spotLight.penumbra = 0.3;
    scene.add(spotLight);

    if (!isDark) {
      const extraLight = new THREE.DirectionalLight(0xffffff, 2);
      extraLight.position.set(-50, 80, 60);
      scene.add(extraLight);
      scene.add(new THREE.HemisphereLight(0xc8e0ff, 0xa0b0c0, 1.5));
    }

    // ===== NETWORK GRID GROUND =====
    const gridHelper = new THREE.GridHelper(300, 60, 0x00d4ff, 0x00d4ff);
    (gridHelper.material as THREE.Material).opacity = isDark ? 0.12 : 0.06;
    (gridHelper.material as THREE.Material).transparent = true;
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(300, 300);
    const groundMat = new THREE.MeshPhysicalMaterial({
      color: isDark ? 0x0d1520 : 0x9ab8d4,
      metalness: 0.8,
      roughness: 0.3,
      transparent: true,
      opacity: 0.6,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // ===== CENTRAL ISP TOWER =====
    const tower = new THREE.Group();
    // Main mast
    const mastGeo = new THREE.CylinderGeometry(0.5, 1.2, 60, 8);
    const mastMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0e8f0,
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1,
      emissive: 0x00d4ff,
      emissiveIntensity: isDark ? 0.1 : 0.03,
    });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.y = 30;
    mast.castShadow = true;
    tower.add(mast);

    // Tower cross-braces (lattice look)
    for (let i = 0; i < 5; i++) {
      const braceGeo = new THREE.BoxGeometry(6 - i * 0.8, 0.3, 0.3);
      const brace = new THREE.Mesh(braceGeo, mastMat.clone());
      brace.position.y = 8 + i * 10;
      tower.add(brace);

      const braceZ = new THREE.Mesh(braceGeo, mastMat.clone());
      braceZ.rotation.y = Math.PI / 2;
      braceZ.position.y = 8 + i * 10;
      tower.add(braceZ);
    }

    // Satellite dishes on tower
    for (let i = 0; i < 3; i++) {
      const dishGeo = new THREE.SphereGeometry(2, 16, 16, 0, Math.PI);
      const dishMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.95,
        roughness: 0.05,
        clearcoat: 1,
        emissive: 0x00d4ff,
        emissiveIntensity: isDark ? 0.3 : 0.1,
        side: THREE.DoubleSide,
      });
      const dish = new THREE.Mesh(dishGeo, dishMat);
      dish.position.y = 45 + i * 5;
      dish.rotation.y = (i * Math.PI * 2) / 3;
      dish.rotation.x = -0.3;
      dish.position.x = Math.cos((i * Math.PI * 2) / 3) * 2;
      dish.position.z = Math.sin((i * Math.PI * 2) / 3) * 2;
      tower.add(dish);
    }

    // Tower top beacon
    const beaconGeo = new THREE.SphereGeometry(1.5, 32, 32);
    const beaconMat = new THREE.MeshPhysicalMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: isDark ? 5 : 3,
      metalness: 1,
      roughness: 0,
      transparent: true,
      opacity: 0.95,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 62;
    tower.add(beacon);

    // Beacon glow
    for (let i = 0; i < 4; i++) {
      const glowGeo = new THREE.SphereGeometry(2 + i * 0.8, 32, 32);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: (isDark ? 0.3 : 0.15) - i * 0.05,
        side: THREE.BackSide,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.y = 62;
      tower.add(glow);
    }

    tower.position.set(0, 0, 0);
    scene.add(tower);

    // ===== SIGNAL RINGS from tower =====
    const signalRings: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const ringGeo = new THREE.TorusGeometry(5 + i * 8, 0.15, 8, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 55;
      scene.add(ring);
      signalRings.push(ring);
    }

    // ===== BUILDINGS =====
    const buildings: THREE.Group[] = [];
    const gridSize = 8;
    const spacing = 25;
    const buildingColor = isDark ? 0xf0f8ff : 0xd0e4f5;

    for (let x = -gridSize / 2; x < gridSize / 2; x++) {
      for (let z = -gridSize / 2; z < gridSize / 2; z++) {
        const posX = x * spacing + (Math.random() - 0.5) * 5;
        const posZ = z * spacing + (Math.random() - 0.5) * 5;

        // Skip center area where tower is
        if (Math.abs(posX) < 8 && Math.abs(posZ) < 8) continue;

        const building = new THREE.Group();
        const height = 10 + Math.random() * 30;
        const width = 4 + Math.random() * 4;
        const depth = 4 + Math.random() * 4;

        const baseGeo = new THREE.BoxGeometry(width, height, depth);
        const baseMat = new THREE.MeshPhysicalMaterial({
          color: buildingColor,
          metalness: isDark ? 0.85 : 0.3,
          roughness: isDark ? 0.12 : 0.15,
          clearcoat: 1.0,
          clearcoatRoughness: 0.08,
          reflectivity: 1,
          emissive: 0x00d4ff,
          emissiveIntensity: isDark ? 0.08 : 0.03,
          envMapIntensity: 2,
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = height / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        building.add(base);

        // Windows
        const windowGeo = new THREE.BoxGeometry(0.6, 1.0, 0.15);
        const wRows = Math.floor(height / 3);
        const wCols = Math.floor(width / 2);
        for (let row = 0; row < wRows; row++) {
          for (let col = 0; col < wCols; col++) {
            if (Math.random() > 0.3) {
              const isLit = Math.random() > 0.2;
              const wMat = new THREE.MeshPhysicalMaterial({
                color: 0x00d4ff,
                metalness: 0.95,
                roughness: 0.05,
                transmission: 0.4,
                thickness: 0.5,
                emissive: 0x00d4ff,
                emissiveIntensity: isLit ? (isDark ? 1.5 : 0.8) : 0.2,
                transparent: true,
                opacity: 0.95,
                clearcoat: 1,
                clearcoatRoughness: 0.03,
              });
              const w1 = new THREE.Mesh(windowGeo, wMat);
              w1.position.set((col - wCols / 2) * 1.5, row * 3 + 3, depth / 2 + 0.05);
              building.add(w1);
              const w2 = new THREE.Mesh(windowGeo, wMat.clone());
              w2.position.set((col - wCols / 2) * 1.5, row * 3 + 3, -depth / 2 - 0.05);
              building.add(w2);
            }
          }
        }

        // Rooftop antenna / satellite dish
        if (Math.random() > 0.3) {
          // Small antenna pole
          const antennaGeo = new THREE.CylinderGeometry(0.1, 0.1, 4, 6);
          const antennaMat = new THREE.MeshPhysicalMaterial({
            color: 0xcccccc,
            metalness: 0.9,
            roughness: 0.1,
          });
          const antenna = new THREE.Mesh(antennaGeo, antennaMat);
          antenna.position.y = height + 2;
          building.add(antenna);

          // Mini dish on some buildings
          if (Math.random() > 0.5) {
            const miniDishGeo = new THREE.SphereGeometry(0.8, 12, 12, 0, Math.PI);
            const miniDishMat = new THREE.MeshPhysicalMaterial({
              color: 0xffffff,
              metalness: 0.9,
              roughness: 0.1,
              emissive: 0x00d4ff,
              emissiveIntensity: isDark ? 0.2 : 0.05,
              side: THREE.DoubleSide,
            });
            const miniDish = new THREE.Mesh(miniDishGeo, miniDishMat);
            miniDish.position.y = height + 3.5;
            miniDish.rotation.x = -0.5;
            miniDish.rotation.y = Math.random() * Math.PI * 2;
            building.add(miniDish);
          }
        }

        // Connection node on roof
        const connGeo = new THREE.SphereGeometry(0.7, 32, 32);
        const connMat = new THREE.MeshPhysicalMaterial({
          color: 0x00d4ff,
          emissive: 0x00d4ff,
          emissiveIntensity: isDark ? 3 : 1.5,
          metalness: 1,
          roughness: 0.05,
          clearcoat: 1,
          transparent: true,
          opacity: 0.98,
        });
        const conn = new THREE.Mesh(connGeo, connMat);
        conn.position.y = height + 0.5;
        building.add(conn);

        // Connection glow
        for (let i = 0; i < 3; i++) {
          const gGeo = new THREE.SphereGeometry(0.8 + i * 0.4, 16, 16);
          const gMat = new THREE.MeshBasicMaterial({
            color: 0x00d4ff,
            transparent: true,
            opacity: (isDark ? 0.4 : 0.2) - i * 0.1,
            side: THREE.BackSide,
          });
          const g = new THREE.Mesh(gGeo, gMat);
          g.position.copy(conn.position);
          building.add(g);
        }

        building.position.set(posX, 0, posZ);
        scene.add(building);
        buildings.push(building);
      }
    }

    // ===== FIBER CONNECTIONS (hub-and-spoke from tower + inter-building) =====
    const fibers: THREE.Mesh[] = [];
    const dataPulses: THREE.Mesh[] = [];
    const pulseData: { curve: THREE.QuadraticBezierCurve3; t: number; speed: number }[] = [];

    const createFiber = (p1: THREE.Vector3, p2: THREE.Vector3) => {
      const midY = Math.max(p1.y, p2.y) + 8;
      const curve = new THREE.QuadraticBezierCurve3(
        p1,
        new THREE.Vector3((p1.x + p2.x) / 2, midY, (p1.z + p2.z) / 2),
        p2
      );
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.08, 8, false);
      const tubeMat = new THREE.MeshPhysicalMaterial({
        color: 0x00d4ff,
        metalness: 0.95,
        roughness: 0.05,
        emissive: 0x00d4ff,
        emissiveIntensity: isDark ? 0.8 : 0.4,
        transparent: true,
        opacity: isDark ? 0.9 : 0.7,
        clearcoat: 1,
        transmission: 0.2,
        thickness: 0.5,
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      scene.add(tube);
      fibers.push(tube);

      // Data pulse sphere traveling along this fiber
      const pulseGeo = new THREE.SphereGeometry(0.4, 16, 16);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: 0x00ffcc,
        transparent: true,
        opacity: 0.9,
      });
      const pulse = new THREE.Mesh(pulseGeo, pulseMat);
      scene.add(pulse);
      dataPulses.push(pulse);
      pulseData.push({ curve, t: Math.random(), speed: 0.002 + Math.random() * 0.004 });

      // Pulse glow
      const pgGeo = new THREE.SphereGeometry(0.8, 16, 16);
      const pgMat = new THREE.MeshBasicMaterial({
        color: 0x00ffcc,
        transparent: true,
        opacity: isDark ? 0.25 : 0.12,
        side: THREE.BackSide,
      });
      const pg = new THREE.Mesh(pgGeo, pgMat);
      pulse.add(pg);
    };

    // Hub-and-spoke: tower to each building
    const towerTop = new THREE.Vector3(0, 58, 0);
    buildings.forEach(b => {
      const bTop = b.position.clone();
      bTop.y = (b.children[0] as THREE.Mesh).position.y * 2;
      createFiber(towerTop, bTop);
    });

    // Some inter-building connections
    for (let i = 0; i < buildings.length; i++) {
      const b1 = buildings[i];
      const b2 = buildings[(i + 3) % buildings.length];
      if (b1 === b2) continue;
      const p1 = b1.position.clone();
      p1.y = (b1.children[0] as THREE.Mesh).position.y * 2;
      const p2 = b2.position.clone();
      p2.y = (b2.children[0] as THREE.Mesh).position.y * 2;
      createFiber(p1, p2);
    }

    const targetBuilding = buildings[Math.floor(buildings.length / 2)];

    sceneRef.current = {
      scene, camera, renderer, composer,
      fibers, buildings, targetBuilding,
      dataPulses, pulseData, signalRings, tower,
    };

    // ===== ANIMATION LOOP =====
    const animate = () => {
      if (!sceneRef.current) return;
      const { composer, fibers, dataPulses, pulseData, signalRings, tower } = sceneRef.current;
      const time = Date.now() * 0.001;

      // Animate data pulses along fibers
      dataPulses.forEach((pulse, i) => {
        const pd = pulseData[i];
        pd.t += pd.speed;
        if (pd.t > 1) pd.t = 0;
        const pos = pd.curve.getPointAt(pd.t);
        pulse.position.copy(pos);
      });

      // Animate signal rings expanding from tower
      signalRings.forEach((ring, i) => {
        const phase = ((time * 0.5 + i * 0.8) % 3) / 3;
        const scale = 1 + phase * 8;
        ring.scale.set(scale, scale, 1);
        (ring.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * (isDark ? 0.25 : 0.12);
      });

      // Tower beacon pulse
      if (tower) {
        const beaconMesh = tower.children.find(
          c => c instanceof THREE.Mesh && (c as THREE.Mesh).geometry instanceof THREE.SphereGeometry && c.position.y > 60
        ) as THREE.Mesh | undefined;
        if (beaconMesh) {
          const mat = beaconMesh.material as THREE.MeshPhysicalMaterial;
          mat.emissiveIntensity = (isDark ? 4 : 2) + Math.sin(time * 3) * (isDark ? 2 : 1);
        }
      }

      // Fiber opacity pulse
      fibers.forEach((fiber, index) => {
        const mat = fiber.material as THREE.MeshPhysicalMaterial;
        mat.opacity = (isDark ? 0.7 : 0.5) + Math.sin(time * 2 + index * 0.5) * 0.15;
      });

      composer.render();
      requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!sceneRef.current) return;
      const { camera, renderer, composer } = sceneRef.current;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
      const fp = composer.passes[2] as ShaderPass;
      if (fp) {
        const px = renderer.getPixelRatio();
        fp.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * px);
        fp.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * px);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [theme]);

  // Scroll-based camera zoom
  useEffect(() => {
    if (!sceneRef.current) return;
    const { camera, targetBuilding } = sceneRef.current;
    if (!targetBuilding) return;

    const startPos = new THREE.Vector3(0, 50, 100);
    const targetPos = targetBuilding.position.clone();
    const buildingHeight = (targetBuilding.children[0] as THREE.Mesh).position.y * 2;
    targetPos.y = buildingHeight + 5;
    targetPos.z += 15;

    camera.position.lerpVectors(startPos, targetPos, scrollProgress);

    const lookAtStart = new THREE.Vector3(0, 20, 0);
    const lookAtEnd = targetBuilding.position.clone();
    lookAtEnd.y = buildingHeight;
    const lookAtTarget = new THREE.Vector3();
    lookAtTarget.lerpVectors(lookAtStart, lookAtEnd, scrollProgress);
    camera.lookAt(lookAtTarget);

    if (scrollProgress > 0.3 && targetBuilding.children[0] instanceof THREE.Mesh) {
      const baseMat = targetBuilding.children[0].material as THREE.MeshStandardMaterial;
      baseMat.emissiveIntensity = 0.02 + (scrollProgress - 0.3) * 0.5;
    }
  }, [scrollProgress]);

  return <div ref={containerRef} className="absolute inset-0" />;
};

export default MetropolisScene;
