import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three-stdlib';
import { RenderPass } from 'three-stdlib';
import { UnrealBloomPass } from 'three-stdlib';
import { ShaderPass } from 'three-stdlib';
import { FXAAShader } from 'three-stdlib';

interface MetropolisSceneProps {
  scrollProgress: number;
}

const MetropolisScene = ({ scrollProgress }: MetropolisSceneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    composer: EffectComposer;
    fibers: THREE.Line[];
    buildings: THREE.Group[];
    targetBuilding: THREE.Group | null;
  }>();

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0f1a, 0.005);
    
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
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0f1a, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // Post-processing setup
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Bloom effect for glowing elements - enhanced for glossy look
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.8, // strength - increased for more glow
      0.6, // radius - increased for softer glow
      0.75 // threshold - lowered to bloom more elements
    );
    composer.addPass(bloomPass);

    // Anti-aliasing
    const fxaaPass = new ShaderPass(FXAAShader);
    const pixelRatio = renderer.getPixelRatio();
    fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
    fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);
    composer.addPass(fxaaPass);

    // Environment Map for Realistic Reflections
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
    const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
    scene.add(cubeCamera);
    
    // Enhanced Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x1a2332, 0.5);
    scene.add(ambientLight);

    // Main directional light with higher intensity
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Key lights for glossy reflections
    const keyLight1 = new THREE.PointLight(0x00d4ff, 3, 400);
    keyLight1.position.set(40, 100, 40);
    scene.add(keyLight1);

    const keyLight2 = new THREE.PointLight(0x4dd4ff, 2.5, 400);
    keyLight2.position.set(-40, 100, -40);
    scene.add(keyLight2);

    // Fill light
    const fillLight = new THREE.PointLight(0x00bfcc, 2, 350);
    fillLight.position.set(0, 80, -50);
    scene.add(fillLight);

    // Rim lights for glossy edges
    const rimLight1 = new THREE.PointLight(0x4dd4ff, 2, 250);
    rimLight1.position.set(0, 130, 0);
    scene.add(rimLight1);

    const rimLight2 = new THREE.SpotLight(0xffffff, 1.5);
    rimLight2.position.set(0, 150, 0);
    rimLight2.angle = Math.PI / 3;
    rimLight2.penumbra = 0.3;
    scene.add(rimLight2);

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
        
        // Building base - glossy production material
        const baseGeometry = new THREE.BoxGeometry(width, height, depth);
        const baseMaterial = new THREE.MeshPhysicalMaterial({ 
          color: 0xf0f8ff,
          metalness: 0.85,
          roughness: 0.12,
          clearcoat: 1.0,
          clearcoatRoughness: 0.08,
          reflectivity: 1,
          emissive: 0x00d4ff,
          emissiveIntensity: 0.08,
          envMapIntensity: 2,
          transparent: false,
          opacity: 1
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = height / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        building.add(base);
        
        // Windows - create grid of glossy lit windows
        const windowGeometry = new THREE.BoxGeometry(0.6, 1.0, 0.15);
        
        // Add windows to all faces
        const windowRows = Math.floor(height / 3);
        const windowCols = Math.floor(width / 2);
        
        for (let row = 0; row < windowRows; row++) {
          for (let col = 0; col < windowCols; col++) {
            if (Math.random() > 0.3) { // 70% chance of window being lit
              const isLit = Math.random() > 0.2;
              const windowMaterial = new THREE.MeshPhysicalMaterial({ 
                color: 0x00d4ff,
                metalness: 0.95,
                roughness: 0.05,
                transmission: 0.4,
                thickness: 0.5,
                emissive: 0x00d4ff,
                emissiveIntensity: isLit ? 1.5 : 0.2,
                transparent: true,
                opacity: 0.95,
                clearcoat: 1,
                clearcoatRoughness: 0.03,
                reflectivity: 1
              });
              
              const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
              window1.position.set(
                (col - windowCols / 2) * 1.5,
                row * 3 + 3,
                depth / 2 + 0.05
              );
              building.add(window1);
              
              const window2 = new THREE.Mesh(windowGeometry, windowMaterial.clone());
              window2.position.set(
                (col - windowCols / 2) * 1.5,
                row * 3 + 3,
                -depth / 2 - 0.05
              );
              building.add(window2);
            }
          }
        }
        
        // Connection point on roof with intense glossy glow
        const connectionGeometry = new THREE.SphereGeometry(0.7, 32, 32);
        const connectionMaterial = new THREE.MeshPhysicalMaterial({ 
          color: 0x00d4ff,
          emissive: 0x00d4ff,
          emissiveIntensity: 3,
          metalness: 1,
          roughness: 0.05,
          clearcoat: 1,
          clearcoatRoughness: 0,
          transparent: true,
          opacity: 0.98,
          reflectivity: 1
        });
        const connection = new THREE.Mesh(connectionGeometry, connectionMaterial);
        connection.position.y = height + 0.5;
        building.add(connection);
        
        // Multiple glossy glow layers for intense bloom effect
        for (let i = 0; i < 5; i++) {
          const glowGeometry = new THREE.SphereGeometry(0.8 + i * 0.3, 32, 32);
          const glowMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x00d4ff,
            emissive: 0x00d4ff,
            emissiveIntensity: 2 - i * 0.3,
            metalness: 1,
            roughness: 0,
            transparent: true,
            opacity: 0.5 - i * 0.08,
            clearcoat: 1,
            clearcoatRoughness: 0,
            side: THREE.BackSide
          });
          const glow = new THREE.Mesh(glowGeometry, glowMaterial);
          glow.position.copy(connection.position);
          building.add(glow);
        }

        const glowGeometry2 = new THREE.SphereGeometry(1.8, 32, 32);
        const glowMaterial2 = new THREE.MeshBasicMaterial({
          color: 0x00d4ff,
          transparent: true,
          opacity: 0.15,
          side: THREE.BackSide
        });
        const glow2 = new THREE.Mesh(glowGeometry2, glowMaterial2);
        glow2.position.copy(connection.position);
        building.add(glow2);
        
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
      
      const points = curve.getPoints(80);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      
      // Create glossy fiber cable with tube geometry for 3D look
      const tubeGeometry = new THREE.TubeGeometry(curve, 80, 0.08, 8, false);
      const tubeMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x00d4ff,
        metalness: 0.95,
        roughness: 0.05,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9,
        clearcoat: 1,
        clearcoatRoughness: 0,
        transmission: 0.2,
        thickness: 0.5,
        reflectivity: 1
      });
      
      const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      scene.add(tube);
      fibers.push(tube as any);
    }

    // Select a target building for zoom
    const targetBuilding = buildings[Math.floor(buildings.length / 2)];

    sceneRef.current = {
      scene,
      camera,
      renderer,
      composer,
      fibers,
      buildings,
      targetBuilding
    };

    // Animation loop
    const animate = () => {
      if (!sceneRef.current) return;
      
      const { composer, fibers, buildings } = sceneRef.current;
      const time = Date.now() * 0.001;
      
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
      
      // Pulse fiber connections with smooth animation
      fibers.forEach((fiber, index) => {
        const material = fiber.material as THREE.LineBasicMaterial;
        material.opacity = 0.4 + Math.sin(time * 2 + index * 0.5) * 0.2;
      });
      
      // Render with post-processing
      composer.render();
      requestAnimationFrame(animate);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!sceneRef.current) return;
      const { camera, renderer, composer } = sceneRef.current;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
      
      // Update FXAA resolution
      const fxaaPass = composer.passes[2] as ShaderPass;
      if (fxaaPass) {
        const pixelRatio = renderer.getPixelRatio();
        fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
        fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);
      }
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
      const baseMaterial = targetBuilding.children[0].material as THREE.MeshStandardMaterial;
      baseMaterial.emissiveIntensity = 0.02 + (scrollProgress - 0.3) * 0.5;
    }
  }, [scrollProgress]);

  return <div ref={containerRef} className="absolute inset-0" />;
};

export default MetropolisScene;
