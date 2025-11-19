import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface FiberSceneProps {
  onHouseReached?: () => void;
}

const FiberScene = ({ onHouseReached }: FiberSceneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    fibers: THREE.Line[];
    house: THREE.Group;
    targetZoom: number;
    currentZoom: number;
    mouseX: number;
    mouseY: number;
  }>();

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0f1a, 0.015);
    
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0a0f1a, 1);
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x00d4ff, 0.3);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00d4ff, 1, 100);
    pointLight1.position.set(20, 20, 20);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x00bfcc, 0.8, 100);
    pointLight2.position.set(-20, -20, -20);
    scene.add(pointLight2);

    // Create fiber network with gel-like physics
    const fibers: THREE.Line[] = [];
    const fiberCount = 50;
    
    for (let i = 0; i < fiberCount; i++) {
      const points: THREE.Vector3[] = [];
      const segments = 20;
      
      for (let j = 0; j < segments; j++) {
        const x = (Math.random() - 0.5) * 80;
        const y = (Math.random() - 0.5) * 80;
        const z = (Math.random() - 0.5) * 80;
        points.push(new THREE.Vector3(x, y, z));
      }
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color().setHSL(0.54, 1, 0.55),
        transparent: true,
        opacity: 0.6,
        linewidth: 2
      });
      
      const line = new THREE.Line(geometry, material);
      (line as any).velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      );
      scene.add(line);
      fibers.push(line);
    }

    // Create 3D house
    const house = new THREE.Group();
    
    // House base
    const baseGeometry = new THREE.BoxGeometry(8, 6, 8);
    const baseMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x334155,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.1
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 3;
    house.add(base);
    
    // Roof
    const roofGeometry = new THREE.ConeGeometry(6, 4, 4);
    const roofMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x1e293b,
      emissive: 0x00bfcc,
      emissiveIntensity: 0.1
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 8;
    roof.rotation.y = Math.PI / 4;
    house.add(roof);
    
    // Windows with glowing effect
    const windowGeometry = new THREE.BoxGeometry(1.5, 1.5, 0.2);
    const windowMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.8
    });
    
    const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(-2, 4, 4.1);
    house.add(window1);
    
    const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
    window2.position.set(2, 4, 4.1);
    house.add(window2);
    
    // Connection point (glowing sphere)
    const connectionGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const connectionMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.9
    });
    const connection = new THREE.Mesh(connectionGeometry, connectionMaterial);
    connection.position.set(0, 8, 0);
    house.add(connection);
    
    // Add glow effect to connection
    const glowGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(connection.position);
    house.add(glow);
    
    house.position.set(0, 0, -30);
    scene.add(house);

    // Store references
    sceneRef.current = {
      scene,
      camera,
      renderer,
      fibers,
      house,
      targetZoom: 50,
      currentZoom: 50,
      mouseX: 0,
      mouseY: 0
    };

    // Mouse interaction
    const handleMouseMove = (event: MouseEvent) => {
      if (!sceneRef.current) return;
      sceneRef.current.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      sceneRef.current.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const handleClick = () => {
      if (!sceneRef.current) return;
      // Zoom in to house on click
      sceneRef.current.targetZoom = 5;
      setTimeout(() => {
        onHouseReached?.();
      }, 2000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    // Animation loop
    const animate = () => {
      if (!sceneRef.current) return;
      
      const { scene, camera, renderer, fibers, house, mouseX, mouseY } = sceneRef.current;
      
      // Smooth zoom transition
      sceneRef.current.currentZoom += (sceneRef.current.targetZoom - sceneRef.current.currentZoom) * 0.05;
      camera.position.z = sceneRef.current.currentZoom;
      
      // Camera follows mouse with damping
      camera.position.x += (mouseX * 10 - camera.position.x) * 0.05;
      camera.position.y += (mouseY * 10 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);
      
      // Animate fibers with gel-like physics
      fibers.forEach((fiber) => {
        const positions = fiber.geometry.attributes.position;
        const velocity = (fiber as any).velocity;
        
        for (let i = 0; i < positions.count; i++) {
          const x = positions.getX(i);
          const y = positions.getY(i);
          const z = positions.getZ(i);
          
          // Apply gel-like spring physics
          const centerDist = Math.sqrt(x * x + y * y + z * z);
          const springForce = -0.0001 * centerDist;
          
          velocity.x += springForce * (x / centerDist);
          velocity.y += springForce * (y / centerDist);
          velocity.z += springForce * (z / centerDist);
          
          // Mouse influence
          const mouseInfluence = 5;
          velocity.x += mouseX * mouseInfluence * 0.001;
          velocity.y += mouseY * mouseInfluence * 0.001;
          
          // Apply damping
          velocity.multiplyScalar(0.98);
          
          positions.setXYZ(
            i,
            x + velocity.x,
            y + velocity.y,
            z + velocity.z
          );
        }
        
        positions.needsUpdate = true;
        
        // Rotate fiber slightly
        fiber.rotation.x += 0.001;
        fiber.rotation.y += 0.002;
      });
      
      // Animate house
      house.rotation.y += 0.005;
      house.children.forEach((child, index) => {
        if (child instanceof THREE.Mesh && index > 2) {
          // Pulse windows and glow
          const material = child.material as THREE.MeshBasicMaterial;
          material.opacity = 0.5 + Math.sin(Date.now() * 0.003 + index) * 0.3;
        }
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
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [onHouseReached]);

  return <div ref={containerRef} className="absolute inset-0" />;
};

export default FiberScene;
