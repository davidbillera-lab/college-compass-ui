import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchCollegeLists,
  createCollegeList,
  deleteCollegeList,
  fetchListItems,
  removeCollegeFromList,
  CollegeListWithCount,
  CollegeListItem,
  CollegeList,
} from "@/lib/collegeLists/api";
import { fetchColleges } from "@/lib/collegeIntel/api";
import { College } from "@/lib/collegeIntel/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Folder,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Share2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ShareListDialog } from "@/components/colleges/ShareListDialog";

const LIST_COLORS = [
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "green", label: "Green", class: "bg-green-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "red", label: "Red", class: "bg-red-500" },
  { value: "pink", label: "Pink", class: "bg-pink-500" },
];

export default function CollegeListsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lists, setLists] = React.useState<CollegeListWithCount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [newListName, setNewListName] = React.useState("");
  const [newListColor, setNewListColor] = React.useState("blue");
  const [creating, setCreating] = React.useState(false);

  // Selected list view
  const [selectedList, setSelectedList] = React.useState<CollegeListWithCount | null>(null);
  const [listItems, setListItems] = React.useState<CollegeListItem[]>([]);
  const [colleges, setColleges] = React.useState<Record<string, College>>({});
  const [loadingItems, setLoadingItems] = React.useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = React.useState<CollegeListWithCount | null>(null);

  // Share dialog
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [shareTarget, setShareTarget] = React.useState<CollegeList | null>(null);

  React.useEffect(() => {
    if (user) {
      loadLists();
    }
  }, [user]);

  const loadLists = async () => {
    setLoading(true);
    try {
      const data = await fetchCollegeLists();
      setLists(data);
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
  };

  const handleCreateList = async () => {
    if (!user || !newListName.trim()) return;
    setCreating(true);
    try {
      await createCollegeList(user.id, newListName.trim(), undefined, newListColor);
      toast({ title: `Created "${newListName}"` });
      setNewListName("");
      setNewListColor("blue");
      setShowCreateDialog(false);
      loadLists();
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

  const handleDeleteList = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCollegeList(deleteTarget.id);
      toast({ title: `Deleted "${deleteTarget.name}"` });
      setDeleteTarget(null);
      if (selectedList?.id === deleteTarget.id) {
        setSelectedList(null);
      }
      loadLists();
    } catch (err) {
      console.error("Error deleting list:", err);
      toast({
        title: "Error",
        description: "Failed to delete list",
        variant: "destructive",
      });
    }
  };

  const handleSelectList = async (list: CollegeListWithCount) => {
    setSelectedList(list);
    setLoadingItems(true);
    try {
      const [items, allColleges] = await Promise.all([
        fetchListItems(list.id),
        fetchColleges(),
      ]);
      setListItems(items);
      // Create lookup map
      const collegeMap: Record<string, College> = {};
      allColleges.forEach((c) => {
        collegeMap[c.id] = c;
      });
      setColleges(collegeMap);
    } catch (err) {
      console.error("Error loading list items:", err);
      toast({
        title: "Error",
        description: "Failed to load list items",
        variant: "destructive",
      });
    } finally {
      setLoadingItems(false);
    }
  };

  const handleRemoveFromList = async (collegeId: string) => {
    if (!selectedList) return;
    try {
      await removeCollegeFromList(selectedList.id, collegeId);
      setListItems((prev) => prev.filter((item) => item.college_id !== collegeId));
      toast({ title: "Removed from list" });
      loadLists(); // Refresh counts
    } catch (err) {
      console.error("Error removing from list:", err);
      toast({
        title: "Error",
        description: "Failed to remove college",
        variant: "destructive",
      });
    }
  };

  const getColorClass = (color: string | null) => {
    return LIST_COLORS.find((c) => c.value === color)?.class || "bg-blue-500";
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Please log in to view your college lists.
          </CardContent>
        </Card>
      </div>
    );
  }

  // Detail view for selected list
  if (selectedList) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedList(null)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`w-4 h-4 rounded-full ${getColorClass(selectedList.color)}`}
                />
                <CardTitle>{selectedList.name}</CardTitle>
                <Badge variant="secondary">{listItems.length} colleges</Badge>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setShareTarget(selectedList);
                  setShareDialogOpen(true);
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/colleges")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Colleges
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {loadingItems ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : listItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>This list is empty.</p>
                <Button
                  variant="link"
                  onClick={() => navigate("/colleges")}
                  className="mt-2"
                >
                  Browse colleges to add some
                </Button>
              </div>
            ) : (
              <div className="grid gap-3">
                {listItems.map((item) => {
                  const college = colleges[item.college_id];
                  if (!college) return null;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{college.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {college.city}, {college.state}
                          {college.type && ` • ${college.type}`}
                        </p>
                      </div>
                      {college.website_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <a
                            href={college.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFromList(item.college_id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Share Dialog */}
        <ShareListDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          list={shareTarget}
          onListUpdated={loadLists}
        />
      </div>
    );
  }

  // Lists overview
  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">My College Lists</CardTitle>
              <p className="text-muted-foreground text-sm mt-1">
                Organize colleges into custom groups
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create List
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>You haven't created any lists yet.</p>
              <p className="text-sm mt-1">
                Create lists to organize your college search.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First List
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lists.map((list) => (
                <div
                  key={list.id}
                  className="group relative border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleSelectList(list)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full ${getColorClass(list.color)}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{list.name}</p>
                        {list.share_token && (
                          <span title="Shared">
                            <Share2 className="h-3 w-3 text-muted-foreground" />
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {list.item_count} college{list.item_count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareTarget(list);
                        setShareDialogOpen(true);
                      }}
                    >
                      <Share2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(list);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create List Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
            <DialogDescription>
              Give your list a name and pick a color.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="list-name">List name</Label>
              <Input
                id="list-name"
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
                    className={`w-8 h-8 rounded-full ${color.class} ${
                      newListColor === color.value
                        ? "ring-2 ring-offset-2 ring-primary"
                        : ""
                    }`}
                    aria-label={color.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateList}
              disabled={!newListName.trim() || creating}
            >
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete list?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteList}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Dialog */}
      <ShareListDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        list={shareTarget}
        onListUpdated={loadLists}
      />
    </div>
  );
}
