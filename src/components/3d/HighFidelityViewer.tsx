import React, { useCallback, useState } from 'react';
import { useHighFidelityScene } from './useHighFidelityScene';
import { createPlaceholderPart, type HighFidelitySceneContext } from './HighFidelityScene';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Upload, Box } from 'lucide-react';

interface LoadedPart {
  name: string;
  object: THREE.Object3D;
}

/**
 * High-Fidelity 3D Viewer Component
 * Uses pure Three.js with HDR environment maps, GLTF loading, and CSS2D labels
 */
export const HighFidelityViewer: React.FC = () => {
  const [loadedParts, setLoadedParts] = useState<LoadedPart[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hdrLoaded, setHdrLoaded] = useState(false);
  const [modelUrl, setModelUrl] = useState('');

  const handleSceneReady = useCallback((context: HighFidelitySceneContext) => {
    // Add some placeholder parts to demonstrate the scene
    const lowerReceiver = createPlaceholderPart(
      context.scene,
      'Lower Receiver',
      new THREE.BoxGeometry(2.5, 0.8, 0.6),
      new THREE.Vector3(0, 0.4, 0),
      0x3d3d3d
    );

    const upperReceiver = createPlaceholderPart(
      context.scene,
      'Upper Receiver',
      new THREE.BoxGeometry(2.8, 0.6, 0.55),
      new THREE.Vector3(0, 1.1, 0),
      0x2d2d2d
    );

    const barrel = createPlaceholderPart(
      context.scene,
      'Barrel (16")',
      new THREE.CylinderGeometry(0.12, 0.12, 2.2, 32),
      new THREE.Vector3(1.8, 1.1, 0),
      0x1f1f1f
    );
    barrel.rotation.z = Math.PI / 2;

    const stock = createPlaceholderPart(
      context.scene,
      'Buttstock',
      new THREE.BoxGeometry(1.0, 0.5, 0.4),
      new THREE.Vector3(-1.6, 0.5, 0),
      0x2a2a2a
    );

    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    context.scene.add(ground);

    setLoadedParts([
      { name: 'Lower Receiver', object: lowerReceiver },
      { name: 'Upper Receiver', object: upperReceiver },
      { name: 'Barrel (16")', object: barrel },
      { name: 'Buttstock', object: stock },
    ]);

    setHdrLoaded(true);
    toast.success('High-fidelity scene initialized with HDR environment');
  }, []);

  const { containerRef, loadModel } = useHighFidelityScene({
    onReady: handleSceneReady,
    backgroundColor: 0x1a1a2e,
    enableHDR: true,
  });

  const handleLoadModel = async () => {
    if (!modelUrl.trim()) {
      toast.error('Please enter a GLTF/GLB model URL');
      return;
    }

    setIsLoading(true);
    try {
      const partName = modelUrl.split('/').pop()?.replace(/\.(gltf|glb)$/i, '') || 'Loaded Part';
      const object = await loadModel(modelUrl, partName);
      setLoadedParts((prev) => [...prev, { name: partName, object }]);
      toast.success(`Loaded ${partName}`);
      setModelUrl('');
    } catch (error) {
      toast.error('Failed to load model. Check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Box className="h-5 w-5" />
            High-Fidelity 3D Viewer
          </span>
          <div className="flex items-center gap-2">
            <Badge variant={hdrLoaded ? 'default' : 'secondary'}>
              {hdrLoaded ? '✓ HDR Active' : 'Loading HDR...'}
            </Badge>
            <Badge variant="outline">{loadedParts.length} Parts</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 3D Viewer Container */}
        <div
          ref={containerRef}
          className="h-[500px] w-full rounded-lg overflow-hidden border relative"
          style={{ background: 'linear-gradient(to bottom, #1a1a2e, #16213e)' }}
        />

        {/* Model Loader */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter GLTF/GLB model URL..."
            value={modelUrl}
            onChange={(e) => setModelUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoadModel()}
          />
          <Button onClick={handleLoadModel} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-1" />
                Load Model
              </>
            )}
          </Button>
        </div>

        {/* Loaded Parts List */}
        <div className="flex flex-wrap gap-2">
          {loadedParts.map((part, index) => (
            <Badge key={index} variant="secondary">
              {part.name}
            </Badge>
          ))}
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Features:</strong> ACES Filmic tone mapping • HDR environment
            reflections • CSS2D floating labels • GLTF/GLB support
          </p>
          <p>
            <strong>Controls:</strong> Click + drag to rotate • Scroll to zoom •
            Right-click to pan
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default HighFidelityViewer;
