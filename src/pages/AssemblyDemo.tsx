import React from "react";
import { AssemblyViewer } from "@/components/3d/AssemblyViewer";

const AssemblyDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
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
