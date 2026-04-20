import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus, Folder, Loader2 } from "lucide-react";
import {
  fetchCollegeLists,
  createCollegeList,
  addCollegeToList,
  removeCollegeFromList,
  getCollegeListMembership,
  CollegeListWithCount,
} from "@/lib/collegeLists/api";
import { toast } from "@/hooks/use-toast";

interface AddToListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collegeId: string;
  collegeName: string;
}

const LIST_COLORS = [
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "green", label: "Green", class: "bg-green-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "red", label: "Red", class: "bg-red-500" },
  { value: "pink", label: "Pink", class: "bg-pink-500" },
];

export function AddToListDialog({
  open,
  onOpenChange,
  collegeId,
  collegeName,
}: AddToListDialogProps) {
  const { user } = useAuth();
  const [lists, setLists] = React.useState<CollegeListWithCount[]>([]);
  const [memberOf, setMemberOf] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);
  const [showNewList, setShowNewList] = React.useState(false);
  const [newListName, setNewListName] = React.useState("");
  const [newListColor, setNewListColor] = React.useState("blue");
  const [creating, setCreating] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [listsData, membership] = await Promise.all([
        fetchCollegeLists(),
        getCollegeListMembership(collegeId),
      ]);
      setLists(listsData);
      setMemberOf(new Set(membership));
    } catch (err) {
      console.error("Error loading lists:", err);
      toast({
        title: "Error",
        description: "Failed to load your lists",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  // Load lists and membership when dialog opens
  React.useEffect(() => {
    if (open && user) {
      void loadData();
    }
  }, [open, user, loadData]);

  const handleToggleList = async (listId: string, checked: boolean) => {
    try {
      if (checked) {
        await addCollegeToList(listId, collegeId);
        setMemberOf((prev) => new Set([...prev, listId]));
        toast({ title: "Added to list" });
      } else {
        await removeCollegeFromList(listId, collegeId);
        setMemberOf((prev) => {
          const next = new Set(prev);
          next.delete(listId);
          return next;
        });
        toast({ title: "Removed from list" });
      }
      // Refresh counts
      void loadData();
    } catch (err) {
      console.error("Error toggling list:", err);
      toast({
        title: "Error",
        description: "Failed to update list",
        variant: "destructive",
      });
    }
  };

  const handleCreateList = async () => {
    if (!user || !newListName.trim()) return;
    setCreating(true);
    try {
      const newList = await createCollegeList(
        user.id,
        newListName.trim(),
        undefined,
        newListColor
      );
      // Add college to the new list
      await addCollegeToList(newList.id, collegeId);
      toast({ title: `Created "${newListName}" and added ${collegeName}` });
      setNewListName("");
      setShowNewList(false);
      void loadData();
    } catch (err) {
      console.error("Error creating list:", err);
      toast({
        title: "Error",
        description: "Failed to create list",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const getColorClass = (color: string | null) => {
    return LIST_COLORS.find((c) => c.value === color)?.class || "bg-blue-500";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to List</DialogTitle>
          <DialogDescription>
            Add <span className="font-semibold">{collegeName}</span> to your lists
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {lists.length > 0 && (
              <ScrollArea className="max-h-[240px]">
                <div className="space-y-2">
                  {lists.map((list) => (
                    <div
                      key={list.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Checkbox
                        id={list.id}
                        checked={memberOf.has(list.id)}
                        onCheckedChange={(checked) =>
                          handleToggleList(list.id, checked === true)
                        }
                      />
                      <div
                        className={`w-3 h-3 rounded-full ${getColorClass(list.color)}`}
                      />
                      <label
                        htmlFor={list.id}
                        className="flex-1 cursor-pointer text-sm font-medium"
                      >
                        {list.name}
                      </label>
                      <Badge variant="secondary" className="text-xs">
                        {list.item_count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {lists.length === 0 && !showNewList && (
              <div className="text-center py-6 text-muted-foreground">
                <Folder className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No lists yet. Create your first one!</p>
              </div>
            )}

            {showNewList ? (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="new-list-name">List name</Label>
                  <Input
                    id="new-list-name"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="e.g., Dream Schools, Safety Schools"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    {LIST_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setNewListColor(color.value)}
                        className={`w-6 h-6 rounded-full ${color.class} ${
                          newListColor === color.value
                            ? "ring-2 ring-offset-2 ring-primary"
                            : ""
                        }`}
                        aria-label={color.label}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleCreateList}
                    disabled={!newListName.trim() || creating}
                  >
                    {creating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    Create & Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowNewList(false);
                      setNewListName("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowNewList(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New List
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
