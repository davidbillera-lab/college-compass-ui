import React, { useRef, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PartProps {
  name: string;
  position: [number, number, number];
  color: string;
  geometry: "box" | "cylinder" | "sphere";
  size?: [number, number, number];
  explodeFactor: number;
  originalPosition: THREE.Vector3;
  isAttached: boolean;
  onClick?: () => void;
  isSelected?: boolean;
}

const Part: React.FC<PartProps> = ({
  name,
  position,
  color,
  geometry,
  size = [1, 1, 1],
  explodeFactor,
  originalPosition,
  isAttached,
  onClick,
  isSelected,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;

    // Calculate exploded position
    const direction = originalPosition.clone().normalize();
    const explodedPos = originalPosition
      .clone()
      .add(direction.multiplyScalar(explodeFactor));

    // Lerp to target position
    meshRef.current.position.lerp(explodedPos, 0.1);
  });

  const renderGeometry = () => {
    switch (geometry) {
      case "cylinder":
        return <cylinderGeometry args={[size[0], size[0], size[1], 32]} />;
      case "sphere":
        return <sphereGeometry args={[size[0], 32, 32]} />;
      default:
        return <boxGeometry args={size} />;
    }
  };

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {renderGeometry()}
      <meshStandardMaterial
        color={color}
        emissive={isSelected ? "#ffffff" : "#000000"}
        emissiveIntensity={isSelected ? 0.3 : 0}
        transparent={!isAttached}
        opacity={isAttached ? 1 : 0.7}
      />
      <Text
        position={[0, size[1] / 2 + 0.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="bottom"
      >
        {name}
      </Text>
    </mesh>
  );
};

interface PartData {
  id: string;
  name: string;
  position: [number, number, number];
  color: string;
  geometry: "box" | "cylinder" | "sphere";
  size: [number, number, number];
  parentId: string | null;
}

const Scene: React.FC<{
  explodeFactor: number;
  parts: PartData[];
  attachments: Record<string, string | null>;
  selectedPart: string | null;
  onSelectPart: (id: string | null) => void;
}> = ({ explodeFactor, parts, attachments, selectedPart, onSelectPart }) => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />

      {parts.map((part) => (
        <Part
          key={part.id}
          name={part.name}
          position={part.position}
          color={part.color}
          geometry={part.geometry}
          size={part.size}
          explodeFactor={explodeFactor}
          originalPosition={new THREE.Vector3(...part.position)}
          isAttached={attachments[part.id] !== null}
          onClick={() => onSelectPart(part.id)}
          isSelected={selectedPart === part.id}
        />
      ))}

      <OrbitControls enableDamping dampingFactor={0.05} />
      <gridHelper args={[10, 10, "#444", "#222"]} />
    </>
  );
};

const initialParts: PartData[] = [
  {
    id: "base",
    name: "Base",
    position: [0, 0.5, 0],
    color: "#4a5568",
    geometry: "box",
    size: [3, 1, 2],
    parentId: null,
  },
  {
    id: "motor",
    name: "Motor",
    position: [0, 1.5, 0],
    color: "#2b6cb0",
    geometry: "cylinder",
    size: [0.6, 1.5, 0.6],
    parentId: "base",
  },
  {
    id: "housing",
    name: "Housing",
    position: [0, 2.75, 0],
    color: "#805ad5",
    geometry: "box",
    size: [1.5, 0.5, 1.5],
    parentId: "motor",
  },
  {
    id: "connector",
    name: "Connector",
    position: [1.5, 0.75, 0],
    color: "#38a169",
    geometry: "sphere",
    size: [0.4, 0.4, 0.4],
    parentId: "base",
  },
  {
    id: "sensor",
    name: "Sensor",
    position: [-1.5, 0.75, 0],
    color: "#d69e2e",
    geometry: "box",
    size: [0.5, 0.5, 0.5],
    parentId: "base",
  },
];

export const AssemblyViewer: React.FC = () => {
  const [explodeFactor, setExplodeFactor] = useState(0);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Record<string, string | null>>(
    () => {
      const initial: Record<string, string | null> = {};
      initialParts.forEach((part) => {
        initial[part.id] = part.parentId;
      });
      return initial;
    }
  );

  const handleExplode = useCallback(() => {
    setExplodeFactor((prev) => (prev > 0 ? 0 : 2));
  }, []);

  const handleAttachPart = useCallback((childId: string, parentId: string) => {
    setAttachments((prev) => ({ ...prev, [childId]: parentId }));
    console.log(`${childId} is now physically linked to ${parentId}`);
  }, []);

  const handleDetachPart = useCallback((partId: string) => {
    setAttachments((prev) => ({ ...prev, [partId]: null }));
    console.log(`${partId} has been detached`);
  }, []);

  const selectedPartData = initialParts.find((p) => p.id === selectedPart);
  const possibleParents = initialParts.filter((p) => p.id !== selectedPart);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>3D Assembly Viewer</span>
          <Badge variant="outline">Interactive</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[400px] w-full rounded-lg overflow-hidden border bg-gradient-to-b from-gray-900 to-gray-800">
          <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
            <Scene
              explodeFactor={explodeFactor}
              parts={initialParts}
              attachments={attachments}
              selectedPart={selectedPart}
              onSelectPart={setSelectedPart}
            />
          </Canvas>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Explode View</h4>
            <div className="flex items-center gap-4">
              <Slider
                value={[explodeFactor]}
                onValueChange={([val]) => setExplodeFactor(val)}
                max={4}
                step={0.1}
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={handleExplode}>
                {explodeFactor > 0 ? "Reset" : "Explode"}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Selected Part</h4>
            {selectedPartData ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  style={{ backgroundColor: selectedPartData.color }}
                  className="text-white"
                >
                  {selectedPartData.name}
                </Badge>
                {attachments[selectedPartData.id] ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDetachPart(selectedPartData.id)}
                  >
                    Detach
                  </Button>
                ) : (
                  possibleParents.map((parent) => (
                    <Button
                      key={parent.id}
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        handleAttachPart(selectedPartData.id, parent.id)
                      }
                    >
                      Attach to {parent.name}
                    </Button>
                  ))
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click a part to select it
              </p>
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <strong>Controls:</strong> Click + drag to rotate · Scroll to zoom ·
          Click parts to select
        </div>
      </CardContent>
    </Card>
  );
};

export default AssemblyViewer;
