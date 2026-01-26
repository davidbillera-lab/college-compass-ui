import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, BookOpen } from "lucide-react";
import PipelineView from "@/components/scholarships/PipelineView";
import DirectoryView from "@/components/scholarships/DirectoryView";

export default function Scholarships() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Scholarships</h1>
        <p className="text-sm text-muted-foreground">
          Discover opportunities and track your applications in one place.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pipeline" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="directory" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Directory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-6">
          <PipelineView />
        </TabsContent>

        <TabsContent value="directory" className="mt-6">
          <DirectoryView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
