import React from "react";
import { AssemblyViewer } from "@/components/3d/AssemblyViewer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

const AssemblyDemo: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-end gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/hifi")}>
            <Sparkles className="h-4 w-4 mr-1" />
            High-Fidelity Viewer
          </Button>
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Assembly Viewer Demo</h1>
          <p className="text-muted-foreground">
            Interactive 3D part assembly with attach/detach and exploded view
          </p>
        </div>
        <AssemblyViewer />
      </div>
    </div>
  );
};

export default AssemblyDemo;
