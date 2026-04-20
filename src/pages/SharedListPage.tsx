import * as React from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchSharedList,
  fetchSharedListItems,
  CollegeList,
  CollegeListItem,
} from "@/lib/collegeLists/api";
import { fetchColleges } from "@/lib/collegeIntel/api";
import { College } from "@/lib/collegeIntel/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Folder, Loader2, GraduationCap, MapPin, Users } from "lucide-react";

const LIST_COLORS: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  pink: "bg-pink-500",
};

export default function SharedListPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [list, setList] = React.useState<CollegeList | null>(null);
  const [items, setItems] = React.useState<CollegeListItem[]>([]);
  const [colleges, setColleges] = React.useState<Record<string, College>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadSharedList = React.useCallback(async () => {
    if (!shareToken) return;
    setLoading(true);
    setError(null);
    try {
      const [sharedList, listItems, allColleges] = await Promise.all([
        fetchSharedList(shareToken),
        fetchSharedListItems(shareToken),
        fetchColleges(),
      ]);

      if (!sharedList) {
        setError("This list doesn't exist or is no longer shared.");
        return;
      }

      setList(sharedList);
      setItems(listItems);

      // Create lookup map
      const collegeMap: Record<string, College> = {};
      allColleges.forEach((c) => {
        collegeMap[c.id] = c;
      });
      setColleges(collegeMap);
    } catch (err) {
      console.error("Error loading shared list:", err);
      setError("Failed to load this shared list.");
    } finally {
      setLoading(false);
    }
  }, [shareToken]);

  React.useEffect(() => {
    if (shareToken) {
      void loadSharedList();
    }
  }, [shareToken, loadSharedList]);

  const getColorClass = (color: string | null) => {
    return LIST_COLORS[color || "blue"] || "bg-blue-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading shared list...</p>
        </div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <Folder className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">List Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error || "This list doesn't exist or is no longer shared."}
            </p>
            <Button asChild variant="outline">
              <Link to="/">Go to Homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto py-6 px-4">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-5 h-5 rounded-full ${getColorClass(list.color)}`} />
            <h1 className="text-2xl font-bold">{list.name}</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Badge variant="secondary">
              <GraduationCap className="h-3 w-3 mr-1" />
              {items.length} college{items.length !== 1 ? "s" : ""}
            </Badge>
            <span>Shared college list</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto py-8 px-4">
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>This list is empty.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const college = colleges[item.college_id];
              if (!college) return null;
              return (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-lg leading-tight mb-1 truncate">
                          {college.name}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {college.city}, {college.state}
                        </p>
                      </div>
                      {college.website_url && (
                        <Button variant="ghost" size="icon" asChild>
                          <a
                            href={college.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Visit website"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {college.type && (
                        <Badge variant="outline" className="text-xs">
                          {college.type}
                        </Badge>
                      )}
                      {college.size && (
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {college.size}
                        </Badge>
                      )}
                      {college.acceptance_rate && (
                        <Badge variant="outline" className="text-xs">
                          {(college.acceptance_rate * 100).toFixed(0)}% acceptance
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Want to create your own college lists?
          </p>
          <Button asChild>
            <Link to="/auth">Get Started Free</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
