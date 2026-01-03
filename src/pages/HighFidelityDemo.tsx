import React from "react";
import { HighFidelityViewer } from "@/components/3d/HighFidelityViewer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const HighFidelityDemo: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to R3F Viewer
          </Button>
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">High-Fidelity 3D Viewer</h1>
          <p className="text-muted-foreground">
            Pure Three.js with HDR environment maps, GLTF loading, and CSS2D labels
          </p>
        </div>
        <HighFidelityViewer />
      </div>
    </div>
  );
};

export default HighFidelityDemo;
