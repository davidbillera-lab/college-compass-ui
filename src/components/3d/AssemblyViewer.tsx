import React, { useRef, useState, useCallback, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";
import { generateBuildExport } from "./buildExport";

// Skin definitions
type SkinType = "default" | "neon_fantasy" | "worn_steel" | "camo_custom" | "gold_plated" | "holographic";

interface SkinSettings {
  color?: string;
  emissive?: string;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
  opacity?: number;
  transparent?: boolean;
}

const SKINS: Record<SkinType, { label: string; settings: SkinSettings }> = {
  default: {
    label: "Default",
    settings: { roughness: 0.5, metalness: 0.3 },
  },
  neon_fantasy: {
    label: "Neon Fantasy",
    settings: { 
      color: "#00ffff", 
      emissive: "#00ffff", 
      emissiveIntensity: 2,
      roughness: 0.2,
      metalness: 0.8,
    },
  },
  worn_steel: {
    label: "Worn Steel",
    settings: { 
      color: "#8b8b8b",
      roughness: 0.8, 
      metalness: 1.0,
      emissive: "#000000",
      emissiveIntensity: 0,
    },
  },
  camo_custom: {
    label: "Tactical Camo",
    settings: { 
      color: "#4a5d23",
      roughness: 0.9, 
      metalness: 0.1,
    },
  },
  gold_plated: {
    label: "Gold Plated",
    settings: {
      color: "#ffd700",
      emissive: "#ff8c00",
      emissiveIntensity: 0.3,
      roughness: 0.1,
      metalness: 1.0,
    },
  },
  holographic: {
    label: "Holographic",
    settings: {
      color: "#ff00ff",
      emissive: "#8800ff",
      emissiveIntensity: 1.5,
      roughness: 0.0,
      metalness: 0.9,
      opacity: 0.85,
      transparent: true,
    },
  },
};

// State Machine for Disassembly
interface DisassemblyState {
  isMagazineRemoved: boolean;
  isTakedownPinPushed: boolean;
  isUpperPivoted: boolean;
  isBCGRemoved: boolean;
  isChargingHandleRemoved: boolean;
}

const initialDisassemblyState: DisassemblyState = {
  isMagazineRemoved: false,
  isTakedownPinPushed: false,
  isUpperPivoted: false,
  isBCGRemoved: false,
  isChargingHandleRemoved: false,
};

interface PartAnimation {
  targetPosition?: THREE.Vector3;
  targetRotation?: THREE.Euler;
  duration: number;
}

interface PartData {
  id: string;
  name: string;
  position: [number, number, number];
  color: string;
  geometry: "box" | "cylinder" | "sphere";
  size: [number, number, number];
  parentId: string | null;
  mass: number; // Mass in kg
  category?: "Barrel" | "Stock" | "Receiver" | "Component";
  length?: number; // Length in inches (for barrels)
  canInteract?: (state: DisassemblyState) => boolean;
  onInteract?: (state: DisassemblyState) => Partial<DisassemblyState> | null;
  errorMessage?: (state: DisassemblyState) => string | null;
  getAnimation?: (state: DisassemblyState) => PartAnimation | null;
}

// NFA Compliance Status
type NFAStatus = "Standard Configuration" | "NFA REGULATED: Short Barreled Rifle (SBR)" | "NFA REGULATED: Any Other Weapon (AOW)";

interface ComplianceResult {
  status: NFAStatus;
  isNFA: boolean;
  details: string;
}

const checkCompliance = (parts: PartData[]): ComplianceResult => {
  const barrel = parts.find(p => p.category === "Barrel");
  const stock = parts.find(p => p.category === "Stock");
  
  // 2026 NFA Rule: Barrel < 16" with a Stock = SBR (requires $0 Tax Stamp registration)
  if (barrel?.length && barrel.length < 16 && stock) {
    return {
      status: "NFA REGULATED: Short Barreled Rifle (SBR)",
      isNFA: true,
      details: `Barrel length ${barrel.length}" < 16" with stock attached. Requires ATF Form 4 registration ($0 tax under OBBBA 2026).`,
    };
  }
  
  // Additional check: Barrel < 16" without stock could be pistol or AOW
  if (barrel?.length && barrel.length < 16 && !stock) {
    return {
      status: "Standard Configuration",
      isNFA: false,
      details: `Pistol configuration - ${barrel.length}" barrel without stock. No NFA registration required.`,
    };
  }
  
  return {
    status: "Standard Configuration",
    isNFA: false,
    details: "Standard rifle configuration. No NFA restrictions apply.",
  };
};

interface PhysicsData {
  totalMass: number;
  centerOfGravity: THREE.Vector3;
}

interface PartProps {
  part: PartData;
  explodeFactor: number;
  disassemblyState: DisassemblyState;
  isSelected: boolean;
  onClick: () => void;
  skin: SkinType;
  globalSkin: SkinType;
}

const Part: React.FC<PartProps> = ({
  part,
  explodeFactor,
  disassemblyState,
  isSelected,
  onClick,
  skin,
  globalSkin,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const originalPosition = useRef(new THREE.Vector3(...part.position));
  const animationProgress = useRef(0);
  const hueOffset = useRef(Math.random() * Math.PI * 2);

  const animation = part.getAnimation?.(disassemblyState);
  const canInteract = part.canInteract?.(disassemblyState) ?? true;

  // Determine which skin to use (part-specific or global)
  const activeSkin = skin !== "default" ? skin : globalSkin;
  const skinSettings = SKINS[activeSkin].settings;

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Handle state-based animations
    if (animation) {
      if (animationProgress.current < 1) {
        animationProgress.current = Math.min(1, animationProgress.current + delta * 2);

        if (animation.targetPosition) {
          meshRef.current.position.lerp(animation.targetPosition, 0.1);
        }
        if (animation.targetRotation) {
          meshRef.current.rotation.x = THREE.MathUtils.lerp(
            meshRef.current.rotation.x,
            animation.targetRotation.x,
            0.1
          );
          meshRef.current.rotation.y = THREE.MathUtils.lerp(
            meshRef.current.rotation.y,
            animation.targetRotation.y,
            0.1
          );
          meshRef.current.rotation.z = THREE.MathUtils.lerp(
            meshRef.current.rotation.z,
            animation.targetRotation.z,
            0.1
          );
        }
      }
    } else {
      if (animationProgress.current > 0 && !animation) {
        animationProgress.current = 0;
      }

      const direction = originalPosition.current.clone().normalize();
      const explodedPos = originalPosition.current
        .clone()
        .add(direction.multiplyScalar(explodeFactor));
      meshRef.current.position.lerp(explodedPos, 0.1);
    }

    // Animated effects for special skins
    if (activeSkin === "holographic" && meshRef.current.material) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      const hue = (state.clock.elapsedTime * 0.5 + hueOffset.current) % 1;
      mat.color.setHSL(hue, 0.8, 0.5);
      mat.emissive.setHSL(hue, 1, 0.3);
    }

    if (activeSkin === "neon_fantasy" && meshRef.current.material) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.5 + 1.5;
      mat.emissiveIntensity = pulse;
    }
  });

  const renderGeometry = () => {
    switch (part.geometry) {
      case "cylinder":
        return <cylinderGeometry args={[part.size[0], part.size[0], part.size[1], 32]} />;
      case "sphere":
        return <sphereGeometry args={[part.size[0], 32, 32]} />;
      default:
        return <boxGeometry args={part.size} />;
    }
  };

  // Compute material color
  const baseColor = skinSettings.color || part.color;
  const emissiveColor = isSelected 
    ? "#ffffff" 
    : canInteract 
      ? "#00ff00" 
      : (skinSettings.emissive || "#000000");
  const emissiveIntensity = isSelected 
    ? 0.4 
    : canInteract 
      ? 0.15 
      : (skinSettings.emissiveIntensity || 0);

  return (
    <mesh
      ref={meshRef}
      position={part.position}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {renderGeometry()}
      <meshStandardMaterial
        color={baseColor}
        emissive={emissiveColor}
        emissiveIntensity={emissiveIntensity}
        roughness={skinSettings.roughness ?? 0.5}
        metalness={skinSettings.metalness ?? 0.3}
        transparent={skinSettings.transparent || !canInteract}
        opacity={canInteract ? (skinSettings.opacity ?? 1) : 0.6}
      />
      <Text
        position={[0, part.size[1] / 2 + 0.4, 0]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {part.name}
      </Text>
    </mesh>
  );
};

// Center of Gravity Marker component
const CoGMarker: React.FC<{ position: THREE.Vector3 }> = ({ position }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.lerp(position, 0.1);
      // Pulsing animation
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={position.toArray()}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshStandardMaterial
          color="#ff4444"
          emissive="#ff0000"
          emissiveIntensity={1.5}
          transparent
          opacity={0.9}
        />
      </mesh>
      <Text
        position={[position.x, position.y + 0.35, position.z]}
        fontSize={0.18}
        color="#ff4444"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.015}
        outlineColor="#000000"
      >
        CoG
      </Text>
    </group>
  );
};

const Scene: React.FC<{
  explodeFactor: number;
  parts: PartData[];
  disassemblyState: DisassemblyState;
  selectedPart: string | null;
  onSelectPart: (id: string) => void;
  partSkins: Record<string, SkinType>;
  globalSkin: SkinType;
  showCoG: boolean;
  cogPosition: THREE.Vector3;
}> = ({ explodeFactor, parts, disassemblyState, selectedPart, onSelectPart, partSkins, globalSkin, showCoG, cogPosition }) => {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#ffffff" />

      {parts.map((part) => (
        <Part
          key={part.id}
          part={part}
          explodeFactor={explodeFactor}
          disassemblyState={disassemblyState}
          isSelected={selectedPart === part.id}
          onClick={() => onSelectPart(part.id)}
          skin={partSkins[part.id] || "default"}
          globalSkin={globalSkin}
        />
      ))}

      {showCoG && <CoGMarker position={cogPosition} />}

      <OrbitControls enableDamping dampingFactor={0.05} />
      <gridHelper args={[10, 10, "#444", "#222"]} />
    </>
  );
};

// Define parts with state machine logic and mass data
const createParts = (): PartData[] => [
  {
    id: "lower_receiver",
    name: "Lower Receiver",
    position: [0, 0.4, 0],
    color: "#3d3d3d",
    geometry: "box",
    size: [2.5, 0.8, 0.6],
    parentId: null,
    mass: 0.36, // kg
    category: "Receiver",
    canInteract: () => false,
  },
  {
    id: "magazine",
    name: "Magazine",
    position: [0.3, -0.3, 0],
    color: "#4a4a4a",
    geometry: "box",
    size: [0.4, 1.2, 0.5],
    parentId: "lower_receiver",
    mass: 0.45, // kg (loaded)
    category: "Component",
    canInteract: (state) => !state.isMagazineRemoved,
    onInteract: () => ({ isMagazineRemoved: true }),
    getAnimation: (state) =>
      state.isMagazineRemoved
        ? { targetPosition: new THREE.Vector3(0.3, -2.5, 0), duration: 0.5 }
        : null,
  },
  {
    id: "rear_takedown_pin",
    name: "Takedown Pin",
    position: [-0.8, 0.5, 0.35],
    color: "#666666",
    geometry: "cylinder",
    size: [0.08, 0.15, 0.08],
    parentId: "lower_receiver",
    mass: 0.008, // kg
    category: "Component",
    canInteract: (state) => state.isMagazineRemoved && !state.isTakedownPinPushed,
    onInteract: (state) => (state.isMagazineRemoved ? { isTakedownPinPushed: true } : null),
    errorMessage: (state) =>
      !state.isMagazineRemoved ? "Remove Magazine first before pushing takedown pin." : null,
    getAnimation: (state) =>
      state.isTakedownPinPushed
        ? { targetPosition: new THREE.Vector3(-0.8, 0.5, 0.55), duration: 0.3 }
        : null,
  },
  {
    id: "upper_receiver",
    name: "Upper Receiver",
    position: [0, 1.1, 0],
    color: "#2d2d2d",
    geometry: "box",
    size: [2.8, 0.6, 0.55],
    parentId: "lower_receiver",
    mass: 0.45, // kg
    category: "Receiver",
    canInteract: (state) => state.isTakedownPinPushed && !state.isUpperPivoted,
    onInteract: (state) => (state.isTakedownPinPushed ? { isUpperPivoted: true } : null),
    errorMessage: (state) =>
      !state.isTakedownPinPushed ? "Push Takedown Pin first to pivot upper receiver." : null,
    getAnimation: (state) =>
      state.isUpperPivoted
        ? {
            targetPosition: new THREE.Vector3(0.8, 1.5, 0),
            targetRotation: new THREE.Euler(0, 0, Math.PI / 4),
            duration: 0.5,
          }
        : null,
  },
  {
    id: "barrel",
    name: "Barrel (16\")",
    position: [1.8, 1.1, 0],
    color: "#1f1f1f",
    geometry: "cylinder",
    size: [0.12, 2.2, 0.12],
    parentId: "upper_receiver",
    mass: 0.68, // kg
    category: "Barrel",
    length: 16, // inches - standard rifle length
    canInteract: () => false,
  },
  {
    id: "stock",
    name: "Buttstock",
    position: [-1.6, 0.5, 0],
    color: "#2a2a2a",
    geometry: "box",
    size: [1.0, 0.5, 0.4],
    parentId: "lower_receiver",
    mass: 0.25, // kg
    category: "Stock",
    canInteract: () => false,
  },
  {
    id: "bcg",
    name: "BCG",
    position: [0, 1.1, 0],
    color: "#1a1a1a",
    geometry: "cylinder",
    size: [0.18, 1.8, 0.18],
    parentId: "upper_receiver",
    mass: 0.31, // kg
    category: "Component",
    canInteract: (state) => state.isUpperPivoted && !state.isBCGRemoved,
    onInteract: (state) => (state.isUpperPivoted ? { isBCGRemoved: true } : null),
    errorMessage: (state) =>
      !state.isUpperPivoted ? "Pivot Upper Receiver first to access the BCG." : null,
    getAnimation: (state) =>
      state.isBCGRemoved
        ? { targetPosition: new THREE.Vector3(2.5, 1.1, 0), duration: 0.5 }
        : null,
  },
  {
    id: "charging_handle",
    name: "Charging Handle",
    position: [-1.2, 1.3, 0],
    color: "#555555",
    geometry: "box",
    size: [0.4, 0.15, 0.3],
    parentId: "upper_receiver",
    mass: 0.05, // kg
    category: "Component",
    canInteract: (state) => state.isBCGRemoved && !state.isChargingHandleRemoved,
    onInteract: (state) => (state.isBCGRemoved ? { isChargingHandleRemoved: true } : null),
    errorMessage: (state) =>
      !state.isBCGRemoved ? "Remove BCG first before removing Charging Handle." : null,
    getAnimation: (state) =>
      state.isChargingHandleRemoved
        ? { targetPosition: new THREE.Vector3(-2.5, 1.3, 0), duration: 0.5 }
        : null,
  },
];

// Calculate physics data for assembled parts
const calculatePhysics = (parts: PartData[], disassemblyState: DisassemblyState): PhysicsData => {
  let totalMass = 0;
  const cogVector = new THREE.Vector3(0, 0, 0);

  // Determine which parts are still assembled
  const assembledParts = parts.filter((part) => {
    if (part.id === "magazine" && disassemblyState.isMagazineRemoved) return false;
    if (part.id === "bcg" && disassemblyState.isBCGRemoved) return false;
    if (part.id === "charging_handle" && disassemblyState.isChargingHandleRemoved) return false;
    return true;
  });

  assembledParts.forEach((part) => {
    const mass = part.mass;
    totalMass += mass;

    // Get part position and add weighted contribution to CoG
    const partPos = new THREE.Vector3(...part.position);
    cogVector.add(partPos.multiplyScalar(mass));
  });

  // Calculate final center of gravity
  if (totalMass > 0) {
    cogVector.divideScalar(totalMass);
  }

  return { totalMass, centerOfGravity: cogVector };
};

const getStepStatus = (state: DisassemblyState) => {
  const steps = [
    { done: state.isMagazineRemoved, label: "Remove Magazine" },
    { done: state.isTakedownPinPushed, label: "Push Takedown Pin" },
    { done: state.isUpperPivoted, label: "Pivot Upper Receiver" },
    { done: state.isBCGRemoved, label: "Remove BCG" },
    { done: state.isChargingHandleRemoved, label: "Remove Charging Handle" },
  ];

  const completedSteps = steps.filter((s) => s.done).length;
  const nextStep = steps.find((s) => !s.done);

  return {
    step: completedSteps,
    total: steps.length,
    label: nextStep?.label || "Field Strip Complete!",
  };
};

export const AssemblyViewer: React.FC = () => {
  const [explodeFactor, setExplodeFactor] = useState(0);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [disassemblyState, setDisassemblyState] = useState<DisassemblyState>(initialDisassemblyState);
  const [globalSkin, setGlobalSkin] = useState<SkinType>("default");
  const [partSkins, setPartSkins] = useState<Record<string, SkinType>>({});
  const [showCoG, setShowCoG] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const parts = useMemo(() => createParts(), []);
  const stepStatus = getStepStatus(disassemblyState);
  const physicsData = useMemo(() => calculatePhysics(parts, disassemblyState), [parts, disassemblyState]);
  const complianceData = useMemo(() => checkCompliance(parts), [parts]);

  const handlePartClick = useCallback(
    (partId: string) => {
      setSelectedPart(partId);
      const part = parts.find((p) => p.id === partId);
      if (!part) return;

      const errorMsg = part.errorMessage?.(disassemblyState);
      if (errorMsg) {
        toast.error(errorMsg);
        return;
      }

      if (!part.canInteract?.(disassemblyState)) {
        return;
      }

      const stateUpdate = part.onInteract?.(disassemblyState);
      if (stateUpdate) {
        setDisassemblyState((prev) => ({ ...prev, ...stateUpdate }));
        toast.success(`${part.name} action completed`);
      }
    },
    [parts, disassemblyState]
  );

  const handleReset = useCallback(() => {
    setDisassemblyState(initialDisassemblyState);
    setExplodeFactor(0);
    setShowCoG(true);
    toast.info("Assembly reset to initial state");
  }, []);

  const handleExplode = useCallback(() => {
    setExplodeFactor((prev) => (prev > 0 ? 0 : 2));
  }, []);

  const applySkinToPart = useCallback((partId: string, skin: SkinType) => {
    setPartSkins((prev) => ({ ...prev, [partId]: skin }));
    toast.success(`Applied ${SKINS[skin].label} skin to part`);
  }, []);

  const applyGlobalSkin = useCallback((skin: SkinType) => {
    setGlobalSkin(skin);
    setPartSkins({}); // Clear individual skins
    toast.success(`Applied ${SKINS[skin].label} skin to all parts`);
  }, []);

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      const cogDesc = `X: ${physicsData.centerOfGravity.x.toFixed(2)}, Y: ${physicsData.centerOfGravity.y.toFixed(2)}, Z: ${physicsData.centerOfGravity.z.toFixed(2)}`;
      
      const buildData = {
        name: "AR15_Build",
        totalMass: physicsData.totalMass,
        cogDescription: cogDesc,
        nfaStatus: complianceData.status,
        nfaDetails: complianceData.details,
        parts: parts.map((p) => ({
          category: p.category || "Component",
          name: p.name,
          mass: p.mass,
          nfaStatus: p.category === "Barrel" && p.length ? `${p.length}" barrel` : "N/A",
        })),
      };

      await generateBuildExport(buildData, canvasContainerRef.current);
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  }, [parts, physicsData, complianceData]);

  const isComplete = stepStatus.step === stepStatus.total;
  const selectedPartData = parts.find((p) => p.id === selectedPart);

  return (
    <Card className="w-full max-w-4xl mx-auto animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Field Strip Trainer</span>
          <div className="flex items-center gap-2">
            <Badge variant={isComplete ? "default" : "secondary"}>
              Step {stepStatus.step}/{stepStatus.total}
            </Badge>
            {isComplete && (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500">
                Complete!
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* NFA Compliance Banner */}
        <div className={`rounded-lg p-3 border ${complianceData.isNFA ? "bg-red-500/10 border-red-500/50" : "bg-green-500/10 border-green-500/50"}`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Badge variant={complianceData.isNFA ? "destructive" : "default"} className={!complianceData.isNFA ? "bg-green-600" : ""}>
                {complianceData.isNFA ? "⚠️ NFA ITEM" : "✓ NON-NFA"}
              </Badge>
              <span className="font-medium text-sm">{complianceData.status}</span>
            </div>
            <span className="text-xs text-muted-foreground">{complianceData.details}</span>
          </div>
        </div>

        {/* Physics Stats & Current instruction */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-3 border">
            <div className="text-sm font-medium text-muted-foreground mb-1">Next Step:</div>
            <div className="text-lg font-semibold">{stepStatus.label}</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 border">
            <div className="text-sm font-medium text-muted-foreground mb-1">Build Physics:</div>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-lg font-semibold">{physicsData.totalMass.toFixed(3)}</span>
                <span className="text-sm text-muted-foreground ml-1">kg</span>
              </div>
              <div className="text-sm text-muted-foreground">
                CoG: ({physicsData.centerOfGravity.x.toFixed(2)}, {physicsData.centerOfGravity.y.toFixed(2)}, {physicsData.centerOfGravity.z.toFixed(2)})
              </div>
            </div>
          </div>
        </div>

        {/* 3D Viewer */}
        <div 
          ref={canvasContainerRef}
          className="h-[400px] w-full rounded-lg overflow-hidden border bg-gradient-to-b from-gray-900 to-gray-800"
        >
          <Canvas camera={{ position: [4, 3, 4], fov: 50 }}>
            <Scene
              explodeFactor={explodeFactor}
              parts={parts}
              disassemblyState={disassemblyState}
              selectedPart={selectedPart}
              onSelectPart={handlePartClick}
              partSkins={partSkins}
              globalSkin={globalSkin}
              showCoG={showCoG}
              cogPosition={physicsData.centerOfGravity}
            />
          </Canvas>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <h4 className="text-sm font-medium">Global Skin</h4>
            <Select value={globalSkin} onValueChange={(v) => applyGlobalSkin(v as SkinType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SKINS).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Actions</h4>
            <div className="flex gap-2 flex-wrap">
              <Button variant="destructive" size="sm" onClick={handleReset}>
                Reset All
              </Button>
              <Button
                variant={showCoG ? "default" : "outline"}
                size="sm"
                onClick={() => setShowCoG(!showCoG)}
              >
                {showCoG ? "Hide CoG" : "Show CoG"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-1" />
                {isExporting ? "Exporting..." : "Export PDF"}
              </Button>
            </div>
          </div>
        </div>

        {/* Selected part skin */}
        {selectedPartData && (
          <div className="rounded-lg border p-3 bg-muted/30 animate-fade-in">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm text-muted-foreground">Selected Part</div>
                <div className="font-medium">{selectedPartData.name}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Apply Skin:</span>
                <Select
                  value={partSkins[selectedPart!] || "default"}
                  onValueChange={(v) => applySkinToPart(selectedPart!, v as SkinType)}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SKINS).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Progress indicators */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={disassemblyState.isMagazineRemoved ? "default" : "outline"}>
            1. Magazine
          </Badge>
          <Badge variant={disassemblyState.isTakedownPinPushed ? "default" : "outline"}>
            2. Takedown Pin
          </Badge>
          <Badge variant={disassemblyState.isUpperPivoted ? "default" : "outline"}>
            3. Upper Receiver
          </Badge>
          <Badge variant={disassemblyState.isBCGRemoved ? "default" : "outline"}>
            4. BCG
          </Badge>
          <Badge variant={disassemblyState.isChargingHandleRemoved ? "default" : "outline"}>
            5. Charging Handle
          </Badge>
        </div>

        <div className="text-xs text-muted-foreground">
          <strong>Controls:</strong> Click + drag to rotate · Scroll to zoom · Click parts to interact · Green glow = can interact
        </div>
      </CardContent>
    </Card>
  );
};

export default AssemblyViewer;
