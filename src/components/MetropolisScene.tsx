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
    fibers: THREE.Line[];
    buildings: THREE.Group[];
    targetBuilding: THREE.Group | null;
  }>();

  // Update scene colors when theme changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const { scene, renderer } = sceneRef.current;
    
    const isDark = theme === 'dark';
    const bgColor = isDark ? 0x0a0f1a : 0xe8f0f8;
    const fogColor = isDark ? 0x0a0f1a : 0xe8f0f8;
    
    scene.fog = new THREE.FogExp2(fogColor, isDark ? 0.005 : 0.004);
    renderer.setClearColor(bgColor, 1);
    
    // Update ambient light
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
    const bgColor = isDark ? 0x0a0f1a : 0xe8f0f8;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(bgColor, isDark ? 0.005 : 0.004);
    
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
    renderer.setClearColor(bgColor, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isDark ? 1.4 : 1.8;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // Post-processing setup
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      isDark ? 1.8 : 0.8,
      isDark ? 0.6 : 0.4,
      isDark ? 0.75 : 0.85
    );
    composer.addPass(bloomPass);

    const fxaaPass = new ShaderPass(FXAAShader);
    const pixelRatio = renderer.getPixelRatio();
    fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
    fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);
    composer.addPass(fxaaPass);

    // Environment
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
    const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
    scene.add(cubeCamera);
    
    // Lighting - theme aware
    const ambientLight = new THREE.AmbientLight(isDark ? 0x1a2332 : 0x8899aa, isDark ? 0.5 : 1.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, isDark ? 2.5 : 3.5);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const keyLight1 = new THREE.PointLight(0x00d4ff, isDark ? 3 : 2, 400);
    keyLight1.position.set(40, 100, 40);
    scene.add(keyLight1);

    const keyLight2 = new THREE.PointLight(0x4dd4ff, isDark ? 2.5 : 1.5, 400);
    keyLight2.position.set(-40, 100, -40);
    scene.add(keyLight2);

    const fillLight = new THREE.PointLight(0x00bfcc, isDark ? 2 : 1.2, 350);
    fillLight.position.set(0, 80, -50);
    scene.add(fillLight);

    const rimLight1 = new THREE.PointLight(0x4dd4ff, isDark ? 2 : 1, 250);
    rimLight1.position.set(0, 130, 0);
    scene.add(rimLight1);

    const rimLight2 = new THREE.SpotLight(0xffffff, isDark ? 1.5 : 2);
    rimLight2.position.set(0, 150, 0);
    rimLight2.angle = Math.PI / 3;
    rimLight2.penumbra = 0.3;
    scene.add(rimLight2);

    // Additional light for light mode to brighten buildings
    if (!isDark) {
      const extraLight = new THREE.DirectionalLight(0xffffff, 2);
      extraLight.position.set(-50, 80, 60);
      scene.add(extraLight);
      
      const hemiLight = new THREE.HemisphereLight(0xc8e0ff, 0xa0b0c0, 1.5);
      scene.add(hemiLight);
    }

    // Buildings
    const buildings: THREE.Group[] = [];
    const gridSize = 8;
    const spacing = 25;

    // Building colors based on theme
    const buildingColor = isDark ? 0xf0f8ff : 0xd0e4f5;
    const emissiveColor = 0x00d4ff;

    for (let x = -gridSize / 2; x < gridSize / 2; x++) {
      for (let z = -gridSize / 2; z < gridSize / 2; z++) {
        const building = new THREE.Group();
        const height = 10 + Math.random() * 30;
        const width = 4 + Math.random() * 4;
        const depth = 4 + Math.random() * 4;
        
        const baseGeometry = new THREE.BoxGeometry(width, height, depth);
        const baseMaterial = new THREE.MeshPhysicalMaterial({ 
          color: buildingColor,
          metalness: isDark ? 0.85 : 0.3,
          roughness: isDark ? 0.12 : 0.15,
          clearcoat: 1.0,
          clearcoatRoughness: 0.08,
          reflectivity: 1,
          emissive: emissiveColor,
          emissiveIntensity: isDark ? 0.08 : 0.03,
          envMapIntensity: 2,
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = height / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        building.add(base);
        
        // Windows
        const windowGeometry = new THREE.BoxGeometry(0.6, 1.0, 0.15);
        const windowRows = Math.floor(height / 3);
        const windowCols = Math.floor(width / 2);
        
        for (let row = 0; row < windowRows; row++) {
          for (let col = 0; col < windowCols; col++) {
            if (Math.random() > 0.3) {
              const isLit = Math.random() > 0.2;
              const windowMaterial = new THREE.MeshPhysicalMaterial({ 
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
        
        // Connection point on roof
        const connectionGeometry = new THREE.SphereGeometry(0.7, 32, 32);
        const connectionMaterial = new THREE.MeshPhysicalMaterial({ 
          color: 0x00d4ff,
          emissive: 0x00d4ff,
          emissiveIntensity: isDark ? 3 : 1.5,
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
        
        // Glow layers
        for (let i = 0; i < 5; i++) {
          const glowGeometry = new THREE.SphereGeometry(0.8 + i * 0.3, 32, 32);
          const glowMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x00d4ff,
            emissive: 0x00d4ff,
            emissiveIntensity: (isDark ? 2 : 1) - i * 0.3,
            metalness: 1,
            roughness: 0,
            transparent: true,
            opacity: (isDark ? 0.5 : 0.3) - i * 0.08,
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
          opacity: isDark ? 0.15 : 0.08,
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
      }
    }

    // Fiber connections
    const fibers: THREE.Line[] = [];
    const connectionCount = buildings.length * 2;
    
    for (let i = 0; i < connectionCount; i++) {
      const building1 = buildings[Math.floor(Math.random() * buildings.length)];
      const building2 = buildings[Math.floor(Math.random() * buildings.length)];
      
      if (building1 === building2) continue;
      
      const pos1 = building1.position.clone();
      pos1.y = building1.children[0].position.y * 2;
      
      const pos2 = building2.position.clone();
      pos2.y = building2.children[0].position.y * 2;
      
      const curve = new THREE.QuadraticBezierCurve3(
        pos1,
        new THREE.Vector3(
          (pos1.x + pos2.x) / 2,
          Math.max(pos1.y, pos2.y) + 5,
          (pos1.z + pos2.z) / 2
        ),
        pos2
      );
      
      const tubeGeometry = new THREE.TubeGeometry(curve, 80, 0.08, 8, false);
      const tubeMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x00d4ff,
        metalness: 0.95,
        roughness: 0.05,
        emissive: 0x00d4ff,
        emissiveIntensity: isDark ? 0.8 : 0.4,
        transparent: true,
        opacity: isDark ? 0.9 : 0.7,
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
      
      fibers.forEach((fiber, index) => {
        const material = fiber.material as THREE.LineBasicMaterial;
        material.opacity = 0.4 + Math.sin(time * 2 + index * 0.5) * 0.2;
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
      
      const fxaaPass = composer.passes[2] as ShaderPass;
      if (fxaaPass) {
        const pixelRatio = renderer.getPixelRatio();
        fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
        fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [theme]);

  // Update camera based on scroll
  useEffect(() => {
    if (!sceneRef.current) return;
    const { camera, targetBuilding } = sceneRef.current;
    
    if (!targetBuilding) return;
    
    const startPos = new THREE.Vector3(0, 50, 100);
    const targetPos = targetBuilding.position.clone();
    const buildingHeight = targetBuilding.children[0].position.y * 2;
    targetPos.y = buildingHeight + 5;
    targetPos.z += 15;
    
    camera.position.lerpVectors(startPos, targetPos, scrollProgress);
    
    const lookAtStart = new THREE.Vector3(0, 0, 0);
    const lookAtEnd = targetBuilding.position.clone();
    lookAtEnd.y = buildingHeight;
    
    const lookAtTarget = new THREE.Vector3();
    lookAtTarget.lerpVectors(lookAtStart, lookAtEnd, scrollProgress);
    camera.lookAt(lookAtTarget);
    
    if (scrollProgress > 0.3 && targetBuilding.children[0] instanceof THREE.Mesh) {
      const baseMaterial = targetBuilding.children[0].material as THREE.MeshStandardMaterial;
      baseMaterial.emissiveIntensity = 0.02 + (scrollProgress - 0.3) * 0.5;
    }
  }, [scrollProgress]);

  return <div ref={containerRef} className="absolute inset-0" />;
};

export default MetropolisScene;
