import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface MetropolisSceneProps {
  scrollProgress: number;
}

const MetropolisScene = ({ scrollProgress }: MetropolisSceneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    houses: THREE.Group[];
    fiberCable: THREE.Mesh;
    wifiIcons: THREE.Group[];
    time: number;
  }>();

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f4f8);

    // Isometric-like perspective camera
    const camera = new THREE.PerspectiveCamera(
      35,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(40, 50, 40);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xf0f4f8, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // Lighting - bright, clean, soft
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(30, 60, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.bias = -0.001;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xe8f0ff, 0.6);
    fillLight.position.set(-20, 40, -20);
    scene.add(fillLight);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe8edf3,
      roughness: 0.9,
      metalness: 0,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    // House building function
    const createHouse = (x: number, z: number, scale: number = 1, roofType: 'gable' | 'hip' = 'gable') => {
      const house = new THREE.Group();
      const houseMat = new THREE.MeshPhysicalMaterial({
        color: 0xdce3eb,
        roughness: 0.4,
        metalness: 0.05,
        clearcoat: 0.3,
        clearcoatRoughness: 0.4,
      });

      // Body
      const bodyW = 4 * scale;
      const bodyH = 3 * scale;
      const bodyD = 5 * scale;
      const bodyGeo = new THREE.BoxGeometry(bodyW, bodyH, bodyD);
      const body = new THREE.Mesh(bodyGeo, houseMat);
      body.position.y = bodyH / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      house.add(body);

      // Roof
      if (roofType === 'gable') {
        const roofShape = new THREE.Shape();
        roofShape.moveTo(-bodyW / 2 - 0.3, 0);
        roofShape.lineTo(0, bodyH * 0.6);
        roofShape.lineTo(bodyW / 2 + 0.3, 0);
        roofShape.closePath();

        const extrudeSettings = { depth: bodyD + 0.4, bevelEnabled: false };
        const roofGeo = new THREE.ExtrudeGeometry(roofShape, extrudeSettings);
        const roofMat = new THREE.MeshPhysicalMaterial({
          color: 0xc8d0d9,
          roughness: 0.35,
          metalness: 0.05,
          clearcoat: 0.4,
        });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(0, bodyH, -bodyD / 2 - 0.2);
        roof.castShadow = true;
        house.add(roof);
      } else {
        const roofGeo = new THREE.ConeGeometry(bodyW * 0.8, bodyH * 0.5, 4);
        const roofMat = new THREE.MeshPhysicalMaterial({
          color: 0xc8d0d9,
          roughness: 0.35,
          metalness: 0.05,
          clearcoat: 0.4,
        });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = bodyH + bodyH * 0.25;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        house.add(roof);
      }

      // Windows
      const winMat = new THREE.MeshPhysicalMaterial({
        color: 0xb8cce0,
        roughness: 0.1,
        metalness: 0.3,
        transmission: 0.3,
        thickness: 0.5,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
      });
      const winGeo = new THREE.BoxGeometry(0.8 * scale, 1.0 * scale, 0.1);

      // Front windows
      [-1, 1].forEach((side) => {
        const win = new THREE.Mesh(winGeo, winMat);
        win.position.set(side * 1.2 * scale, bodyH * 0.55, bodyD / 2 + 0.06);
        house.add(win);
      });

      // Door
      const doorGeo = new THREE.BoxGeometry(0.9 * scale, 1.6 * scale, 0.1);
      const doorMat = new THREE.MeshPhysicalMaterial({
        color: 0x9ab0c8,
        roughness: 0.3,
        metalness: 0.1,
      });
      const door = new THREE.Mesh(doorGeo, doorMat);
      door.position.set(0, 0.8 * scale, bodyD / 2 + 0.06);
      house.add(door);

      house.position.set(x, 0, z);
      return house;
    };

    // Place houses in a neighborhood layout
    const houseData = [
      { x: -18, z: -12, scale: 1.1, roof: 'gable' as const },
      { x: -12, z: -5, scale: 0.9, roof: 'hip' as const },
      { x: -20, z: 3, scale: 1.0, roof: 'gable' as const },
      { x: -8, z: 8, scale: 1.2, roof: 'gable' as const },
      { x: 10, z: -15, scale: 0.8, roof: 'hip' as const },
      { x: 16, z: -8, scale: 1.0, roof: 'gable' as const },
      { x: 5, z: 5, scale: 1.1, roof: 'gable' as const },
      { x: 18, z: 6, scale: 0.9, roof: 'hip' as const },
      { x: -5, z: 15, scale: 1.0, roof: 'gable' as const },
      { x: 12, z: 16, scale: 0.85, roof: 'gable' as const },
      { x: -15, z: 14, scale: 0.95, roof: 'hip' as const },
      { x: 22, z: -2, scale: 1.05, roof: 'gable' as const },
    ];

    const houses: THREE.Group[] = [];
    houseData.forEach((h) => {
      const house = createHouse(h.x, h.z, h.scale, h.roof);
      // Slight random rotation for organic feel
      house.rotation.y = (Math.random() - 0.5) * 0.4;
      scene.add(house);
      houses.push(house);
    });

    // Small trees
    const createTree = (x: number, z: number, height: number = 3) => {
      const tree = new THREE.Group();
      const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, height * 0.4, 6);
      const trunkMat = new THREE.MeshPhysicalMaterial({ color: 0xc0cad5, roughness: 0.6 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = height * 0.2;
      trunk.castShadow = true;
      tree.add(trunk);

      const foliageGeo = new THREE.ConeGeometry(height * 0.4, height * 0.7, 6);
      const foliageMat = new THREE.MeshPhysicalMaterial({ color: 0xbdc8d4, roughness: 0.5 });
      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.y = height * 0.6;
      foliage.castShadow = true;
      tree.add(foliage);

      tree.position.set(x, 0, z);
      return tree;
    };

    const treePositions = [
      [-6, -10], [3, -12], [-16, -2], [14, 2], [8, -5],
      [-10, 12], [20, 12], [-22, 8], [0, -8], [25, -12],
      [-25, -8], [7, 18], [-8, -18], [22, 18],
    ];
    treePositions.forEach(([x, z]) => {
      scene.add(createTree(x, z, 2 + Math.random() * 2));
    });

    // Winding fiber cable - glowing blue path
    const cablePath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-25, 0.3, 20),
      new THREE.Vector3(-15, 0.3, 14),
      new THREE.Vector3(-8, 0.3, 8),
      new THREE.Vector3(-2, 0.3, 2),
      new THREE.Vector3(5, 0.3, -2),
      new THREE.Vector3(10, 0.3, -8),
      new THREE.Vector3(16, 0.3, -12),
      new THREE.Vector3(25, 0.3, -18),
    ], false, 'catmullrom', 0.5);

    // Main cable
    const cableTubeGeo = new THREE.TubeGeometry(cablePath, 120, 0.8, 12, false);
    const cableMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.6,
      roughness: 0.15,
      metalness: 0.3,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      transparent: true,
      opacity: 0.85,
    });
    const fiberCable = new THREE.Mesh(cableTubeGeo, cableMat);
    fiberCable.castShadow = true;
    scene.add(fiberCable);

    // Glow around cable
    const glowTubeGeo = new THREE.TubeGeometry(cablePath, 120, 2.0, 12, false);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    const glowTube = new THREE.Mesh(glowTubeGeo, glowMat);
    scene.add(glowTube);

    // Secondary glow
    const glowTubeGeo2 = new THREE.TubeGeometry(cablePath, 120, 3.5, 12, false);
    const glowMat2 = new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.04,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(glowTubeGeo2, glowMat2));

    // WiFi signal icons (3D arcs above select houses)
    const wifiIcons: THREE.Group[] = [];
    const createWifiIcon = (parent: THREE.Group) => {
      const wifi = new THREE.Group();
      const arcMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });

      for (let i = 0; i < 3; i++) {
        const innerR = 0.5 + i * 0.5;
        const outerR = innerR + 0.15;
        const arcShape = new THREE.RingGeometry(innerR, outerR, 16, 1, Math.PI * 0.3, Math.PI * 0.4);
        const arc = new THREE.Mesh(arcShape, arcMat.clone());
        arc.rotation.x = -Math.PI / 6;
        arc.position.y = 5 + i * 0.1;
        wifi.add(arc);
      }

      // Dot at base
      const dotGeo = new THREE.SphereGeometry(0.15, 8, 8);
      const dot = new THREE.Mesh(dotGeo, arcMat.clone());
      dot.position.y = 4.7;
      wifi.add(dot);

      wifi.position.copy(parent.position);
      return wifi;
    };

    // Add WiFi to a few houses
    [0, 3, 5, 7, 10].forEach((idx) => {
      if (houses[idx]) {
        const wifi = createWifiIcon(houses[idx]);
        scene.add(wifi);
        wifiIcons.push(wifi);
      }
    });

    sceneRef.current = {
      scene,
      camera,
      renderer,
      houses,
      fiberCable,
      wifiIcons,
      time: 0,
    };

    // Animation loop
    let animId: number;
    const animate = () => {
      if (!sceneRef.current) return;
      const { renderer, scene, camera, wifiIcons, fiberCable } = sceneRef.current;
      sceneRef.current.time += 0.016;
      const t = sceneRef.current.time;

      // Pulse fiber cable glow
      const cMat = fiberCable.material as THREE.MeshPhysicalMaterial;
      cMat.emissiveIntensity = 0.5 + Math.sin(t * 2) * 0.2;

      // Animate WiFi icons - gentle float and pulse
      wifiIcons.forEach((wifi, i) => {
        wifi.children.forEach((child, j) => {
          const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
          mat.opacity = 0.5 + Math.sin(t * 3 + i + j * 0.5) * 0.3;
        });
      });

      // Slow auto-rotation
      const baseAngle = t * 0.05;
      const radius = 55;
      camera.position.x = Math.cos(baseAngle) * radius;
      camera.position.z = Math.sin(baseAngle) * radius;
      camera.position.y = 45;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!sceneRef.current) return;
      const { camera, renderer } = sceneRef.current;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Zoom into a house on scroll
  useEffect(() => {
    if (!sceneRef.current) return;
    const { camera, houses } = sceneRef.current;
    const target = houses[6]; // Center house
    if (!target) return;

    if (scrollProgress > 0) {
      const t = Math.min(scrollProgress * 1.2, 1);
      const ease = t * t * (3 - 2 * t); // smoothstep

      const startPos = new THREE.Vector3(
        camera.position.x,
        45,
        camera.position.z
      );
      const endPos = target.position.clone().add(new THREE.Vector3(8, 8, 10));

      camera.position.lerpVectors(startPos, endPos, ease);

      const lookStart = new THREE.Vector3(0, 0, 0);
      const lookEnd = target.position.clone().add(new THREE.Vector3(0, 2, 0));
      const lookAt = new THREE.Vector3().lerpVectors(lookStart, lookEnd, ease);
      camera.lookAt(lookAt);
    }
  }, [scrollProgress]);

  return <div ref={containerRef} className="absolute inset-0" />;
};

export default MetropolisScene;
