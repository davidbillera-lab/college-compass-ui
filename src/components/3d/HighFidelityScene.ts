import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface HighFidelitySceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  labelRenderer: CSS2DRenderer;
  controls: OrbitControls;
  loadFirearmPart: (url: string, partName: string) => Promise<THREE.Object3D>;
  loadHDREnvironment: (url: string) => Promise<void>;
  snapToSocket: (newPart: THREE.Object3D, basePart: THREE.Object3D, socketName: string) => boolean;
  animate: () => void;
  dispose: () => void;
  resize: () => void;
}

export interface HighFidelitySceneOptions {
  container: HTMLElement;
  width?: number;
  height?: number;
  backgroundColor?: number;
  enableHDR?: boolean;
  hdrUrl?: string;
}

/**
 * Initializes a high-fidelity Three.js scene with:
 * - ACES Filmic tone mapping for cinematic metal look
 * - CSS2D label renderer for floating part names
 * - HDR environment maps for realistic metallic reflections
 * - GLTF model loading support
 * - OrbitControls for interaction
 */
export const initHighFidelityScene = (options: HighFidelitySceneOptions): HighFidelitySceneContext => {
  const { 
    container, 
    width = container.clientWidth || window.innerWidth, 
    height = container.clientHeight || window.innerHeight,
    backgroundColor = 0x1a1a2e,
    enableHDR = true,
    hdrUrl = 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_08_1k.hdr'
  } = options;

  // 1. Setup Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(backgroundColor);

  // 2. Setup Camera
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.set(4, 3, 4);
  camera.lookAt(0, 0, 0);

  // 3. Setup WebGL Renderer with cinematic tone mapping
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; // Cinematic metal look
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // 4. Setup CSS2D Label Renderer for floating part names
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(width, height);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0px';
  labelRenderer.domElement.style.left = '0px';
  labelRenderer.domElement.style.pointerEvents = 'none';
  container.appendChild(labelRenderer.domElement);

  // 5. Add default lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
  fillLight.position.set(-5, -5, -5);
  scene.add(fillLight);

  // 6. Setup OrbitControls
  const controls = new OrbitControls(camera, labelRenderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 2;
  controls.maxDistance = 20;

  // 7. Load HDR Environment Map for realistic metallic reflections
  const loadHDREnvironment = async (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const rgbeLoader = new RGBELoader();
      rgbeLoader.load(
        url,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          scene.environment = texture;
          resolve();
        },
        undefined,
        (error) => {
          console.error('Failed to load HDR environment:', error);
          reject(error);
        }
      );
    });
  };

  // Auto-load HDR if enabled
  if (enableHDR && hdrUrl) {
    loadHDREnvironment(hdrUrl).catch(console.error);
  }

  // 8. GLTF Loader for real firearm parts
  const gltfLoader = new GLTFLoader();
  
  const loadFirearmPart = async (url: string, partName: string): Promise<THREE.Object3D> => {
    return new Promise((resolve, reject) => {
      gltfLoader.load(
        url,
        (gltf: GLTF) => {
          const model = gltf.scene;
          
          // Create a styled 3D label that follows the part
          const labelDiv = document.createElement('div');
          labelDiv.className = 'part-label';
          labelDiv.textContent = partName;
          labelDiv.style.cssText = `
            color: white;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 12px;
            font-weight: 500;
            padding: 4px 8px;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 4px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(4px);
            white-space: nowrap;
            pointer-events: none;
          `;
          
          const label = new CSS2DObject(labelDiv);
          
          // Position label above the model's bounding box
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          label.position.set(0, size.y / 2 + 0.3, 0);
          
          model.add(label);
          model.userData.partName = partName;
          model.userData.label = label;
          
          // Enable shadows on all meshes
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          
          scene.add(model);
          resolve(model);
        },
        undefined,
        (error) => {
          console.error(`Failed to load GLTF model for ${partName}:`, error);
          reject(error);
        }
      );
    });
  };

  // 9. Socket/Plug Snapping System
  /**
   * Snaps a new part's plug to a base part's socket
   * Socket naming convention: 'Socket_<type>' (e.g., 'Socket_Grip', 'Socket_Stock')
   * Plug naming convention: 'Plug' or 'Plug_<type>'
   */
  const snapToSocket = (
    newPart: THREE.Object3D, 
    basePart: THREE.Object3D, 
    socketName: string
  ): boolean => {
    // 1. Find the specific socket on the base (e.g., 'Socket_Grip')
    const socket = basePart.getObjectByName(socketName);
    // 2. Find the plug on the new part (e.g., 'Plug')
    const plug = newPart.getObjectByName('Plug') || 
                 newPart.getObjectByName(`Plug_${socketName.replace('Socket_', '')}`);

    if (socket && plug) {
      // 3. Calculate the offset so the Plug sits exactly on the Socket
      const worldPosition = new THREE.Vector3();
      socket.getWorldPosition(worldPosition);
      
      // Account for plug offset within the new part
      const plugLocalPosition = new THREE.Vector3();
      plug.getWorldPosition(plugLocalPosition);
      const plugOffset = plugLocalPosition.clone().sub(newPart.position);
      
      newPart.position.copy(worldPosition).sub(plugOffset);
      
      // 4. Match the rotation so the part isn't upside down
      const worldQuaternion = new THREE.Quaternion();
      socket.getWorldQuaternion(worldQuaternion);
      newPart.quaternion.copy(worldQuaternion);
      
      // 5. Parent it so they move together
      basePart.attach(newPart);
      
      // Store connection metadata
      newPart.userData.attachedTo = basePart.userData.partName || 'base';
      newPart.userData.socket = socketName;
      
      console.log(`Snapped ${newPart.userData.partName || 'part'} to ${socketName}`);
      return true;
    }
    
    console.warn(`Socket ${socketName} or Plug not found for snapping`);
    return false;
  };

  // 10. Animation loop
  let animationFrameId: number;
  
  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  };

  // 10. Resize handler
  const resize = () => {
    const newWidth = container.clientWidth || window.innerWidth;
    const newHeight = container.clientHeight || window.innerHeight;
    
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(newWidth, newHeight);
    labelRenderer.setSize(newWidth, newHeight);
  };

  // 11. Cleanup function
  const dispose = () => {
    cancelAnimationFrame(animationFrameId);
    
    // Dispose all objects in scene
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    
    renderer.dispose();
    controls.dispose();
    
    // Remove DOM elements
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    if (labelRenderer.domElement.parentNode) {
      labelRenderer.domElement.parentNode.removeChild(labelRenderer.domElement);
    }
  };

  return {
    scene,
    camera,
    renderer,
    labelRenderer,
    controls,
    loadFirearmPart,
    loadHDREnvironment,
    snapToSocket,
    animate,
    dispose,
    resize,
  };
};

/**
 * Creates a placeholder part with realistic PBR materials
 * for testing when GLTF models aren't available
 */
export const createPlaceholderPart = (
  scene: THREE.Scene,
  name: string,
  geometry: THREE.BufferGeometry,
  position: THREE.Vector3,
  color: number = 0x333333
): THREE.Mesh => {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.4,
    metalness: 0.8,
    envMapIntensity: 1.0,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.partName = name;

  // Add CSS2D label
  const labelDiv = document.createElement('div');
  labelDiv.className = 'part-label';
  labelDiv.textContent = name;
  labelDiv.style.cssText = `
    color: white;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 12px;
    font-weight: 500;
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(4px);
    white-space: nowrap;
    pointer-events: none;
  `;

  const label = new CSS2DObject(labelDiv);
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  label.position.set(0, size.y / 2 + 0.3, 0);
  mesh.add(label);

  scene.add(mesh);
  return mesh;
};
