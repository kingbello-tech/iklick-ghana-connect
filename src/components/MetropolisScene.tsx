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
    fibers: THREE.Line[];
    buildings: THREE.Group[];
    targetBuilding: THREE.Group | null;
  }>();

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0f1a, 0.008);
    
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 50, 100);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0a0f1a, 1);
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x00d4ff, 0.4);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00d4ff, 1.5, 200);
    pointLight1.position.set(30, 60, 30);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x00bfcc, 1.2, 200);
    pointLight2.position.set(-30, 60, -30);
    scene.add(pointLight2);

    // Create metropolis grid
    const buildings: THREE.Group[] = [];
    const buildingPositions: THREE.Vector3[] = [];
    const gridSize = 8;
    const spacing = 25;

    for (let x = -gridSize / 2; x < gridSize / 2; x++) {
      for (let z = -gridSize / 2; z < gridSize / 2; z++) {
        const building = new THREE.Group();
        
        // Randomize building height
        const height = 10 + Math.random() * 30;
        const width = 4 + Math.random() * 4;
        const depth = 4 + Math.random() * 4;
        
        // Building base - white material
        const baseGeometry = new THREE.BoxGeometry(width, height, depth);
        const baseMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xffffff,
          emissive: 0x00d4ff,
          emissiveIntensity: 0.05,
          shininess: 100
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = height / 2;
        building.add(base);
        
        // Windows - create grid of lit windows
        const windowGeometry = new THREE.PlaneGeometry(0.8, 1.2);
        const windowMaterial = new THREE.MeshBasicMaterial({ 
          color: 0x00d4ff,
          transparent: true,
          opacity: 0.8
        });
        
        // Add windows to front and back faces
        const windowRows = Math.floor(height / 3);
        const windowCols = Math.floor(width / 2);
        
        for (let row = 0; row < windowRows; row++) {
          for (let col = 0; col < windowCols; col++) {
            if (Math.random() > 0.3) { // 70% chance of window being lit
              const window1 = new THREE.Mesh(windowGeometry, windowMaterial.clone());
              window1.position.set(
                (col - windowCols / 2) * 1.5,
                row * 3 + 3,
                depth / 2 + 0.01
              );
              building.add(window1);
              
              const window2 = new THREE.Mesh(windowGeometry, windowMaterial.clone());
              window2.position.set(
                (col - windowCols / 2) * 1.5,
                row * 3 + 3,
                -depth / 2 - 0.01
              );
              window2.rotation.y = Math.PI;
              building.add(window2);
            }
          }
        }
        
        // Connection point on roof with blue glow
        const connectionGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const connectionMaterial = new THREE.MeshBasicMaterial({ 
          color: 0x00d4ff,
          transparent: true,
          opacity: 0.9
        });
        const connection = new THREE.Mesh(connectionGeometry, connectionMaterial);
        connection.position.y = height + 0.5;
        building.add(connection);
        
        // Glow effect
        const glowGeometry = new THREE.SphereGeometry(1, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0x00d4ff,
          transparent: true,
          opacity: 0.2
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(connection.position);
        building.add(glow);
        
        const posX = x * spacing + (Math.random() - 0.5) * 5;
        const posZ = z * spacing + (Math.random() - 0.5) * 5;
        building.position.set(posX, 0, posZ);
        
        scene.add(building);
        buildings.push(building);
        buildingPositions.push(new THREE.Vector3(posX, height, posZ));
      }
    }

    // Create aerial fiber connections between buildings
    const fibers: THREE.Line[] = [];
    const connectionCount = buildings.length * 2;
    
    for (let i = 0; i < connectionCount; i++) {
      const building1 = buildings[Math.floor(Math.random() * buildings.length)];
      const building2 = buildings[Math.floor(Math.random() * buildings.length)];
      
      if (building1 === building2) continue;
      
      const pos1 = building1.position.clone();
      pos1.y = building1.children[0].position.y * 2; // Top of building
      
      const pos2 = building2.position.clone();
      pos2.y = building2.children[0].position.y * 2;
      
      // Create curved fiber line
      const curve = new THREE.QuadraticBezierCurve3(
        pos1,
        new THREE.Vector3(
          (pos1.x + pos2.x) / 2,
          Math.max(pos1.y, pos2.y) + 5,
          (pos1.z + pos2.z) / 2
        ),
        pos2
      );
      
      const points = curve.getPoints(20);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.4,
        linewidth: 2
      });
      
      const line = new THREE.Line(geometry, material);
      scene.add(line);
      fibers.push(line);
    }

    // Select a target building for zoom
    const targetBuilding = buildings[Math.floor(buildings.length / 2)];

    sceneRef.current = {
      scene,
      camera,
      renderer,
      fibers,
      buildings,
      targetBuilding
    };

    // Animation loop
    const animate = () => {
      if (!sceneRef.current) return;
      
      const { scene, camera, renderer, fibers, buildings, targetBuilding } = sceneRef.current;
      
      // Animate windows flickering
      buildings.forEach((building) => {
        building.children.forEach((child, index) => {
          if (child instanceof THREE.Mesh && index > 0) {
            const material = child.material as THREE.MeshBasicMaterial;
            if (material.transparent && Math.random() > 0.98) {
              material.opacity = Math.random() * 0.5 + 0.5;
            }
          }
        });
      });
      
      // Pulse fiber connections
      fibers.forEach((fiber, index) => {
        const material = fiber.material as THREE.LineBasicMaterial;
        material.opacity = 0.3 + Math.sin(Date.now() * 0.001 + index) * 0.15;
      });
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!sceneRef.current) return;
      const { camera, renderer } = sceneRef.current;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Update camera based on scroll
  useEffect(() => {
    if (!sceneRef.current) return;
    const { camera, targetBuilding } = sceneRef.current;
    
    if (!targetBuilding) return;
    
    // Calculate camera position based on scroll
    const startPos = new THREE.Vector3(0, 50, 100);
    const targetPos = targetBuilding.position.clone();
    const buildingHeight = targetBuilding.children[0].position.y * 2;
    targetPos.y = buildingHeight + 5;
    targetPos.z += 15;
    
    // Interpolate camera position
    camera.position.lerpVectors(startPos, targetPos, scrollProgress);
    
    // Interpolate look-at target
    const lookAtStart = new THREE.Vector3(0, 0, 0);
    const lookAtEnd = targetBuilding.position.clone();
    lookAtEnd.y = buildingHeight;
    
    const lookAtTarget = new THREE.Vector3();
    lookAtTarget.lerpVectors(lookAtStart, lookAtEnd, scrollProgress);
    camera.lookAt(lookAtTarget);
    
    // Increase blue hue on target building as we zoom
    if (scrollProgress > 0.3 && targetBuilding.children[0] instanceof THREE.Mesh) {
      const baseMaterial = targetBuilding.children[0].material as THREE.MeshPhongMaterial;
      baseMaterial.emissiveIntensity = 0.05 + (scrollProgress - 0.3) * 0.3;
    }
  }, [scrollProgress]);

  return <div ref={containerRef} className="absolute inset-0" />;
};

export default MetropolisScene;
