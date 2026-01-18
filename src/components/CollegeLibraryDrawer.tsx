import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { College } from "@/lib/collegeIntel/types";
import {
  MapPin,
  Users,
  DollarSign,
  GraduationCap,
  Building2,
  ExternalLink,
  Trophy,
  BookOpen,
} from "lucide-react";

function currency(n?: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

type Props = {
  college: College | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CollegeLibraryDrawer({ college, open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {college ? (
          <>
            <SheetHeader>
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  {college.logo_url ? (
                    <img
                      src={college.logo_url}
                      alt={college.name}
                      className="w-12 h-12 object-contain"
                    />
                  ) : (
                    <Building2 className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <SheetTitle className="text-left">{college.name}</SheetTitle>
                  <SheetDescription className="text-left flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {college.city}, {college.state}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Type Badges */}
              <div className="flex flex-wrap gap-2">
                {college.type && (
                  <Badge variant="outline">{college.type}</Badge>
                )}
                {college.size && (
                  <Badge variant="secondary">{college.size}</Badge>
                )}
                {college.region && (
                  <Badge variant="info">{college.region}</Badge>
                )}
                {college.setting && (
                  <Badge variant="outline">{college.setting}</Badge>
                )}
              </div>

              {/* Key Stats */}
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="text-sm font-medium">Key Statistics</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {college.student_population?.toLocaleString() || "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">Students</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {college.acceptance_rate ? `${college.acceptance_rate}%` : "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">Acceptance Rate</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {college.student_faculty_ratio ? `${college.student_faculty_ratio}:1` : "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">Student:Faculty</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {college.graduation_rate ? `${college.graduation_rate}%` : "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">Graduation Rate</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Costs */}
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Costs & Aid
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-lg">{currency(college.tuition_in_state)}</div>
                    <div className="text-xs text-muted-foreground">In-State Tuition</div>
                  </div>
                  <div>
                    <div className="font-medium text-lg">{currency(college.tuition_out_state)}</div>
                    <div className="text-xs text-muted-foreground">Out-of-State Tuition</div>
                  </div>
                  {college.sticker_usd && (
                    <div>
                      <div className="font-medium">{currency(college.sticker_usd)}</div>
                      <div className="text-xs text-muted-foreground">Sticker Price</div>
                    </div>
                  )}
                  {college.avg_financial_aid && (
                    <div>
                      <div className="font-medium text-green-600">{currency(college.avg_financial_aid)}</div>
                      <div className="text-xs text-muted-foreground">Avg. Financial Aid</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Academics */}
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="text-sm font-medium">Academic Profile</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {(college.sat_range_low || college.sat_range_high) && (
                    <div>
                      <div className="font-medium">
                        {college.sat_range_low}–{college.sat_range_high}
                      </div>
                      <div className="text-xs text-muted-foreground">SAT Range</div>
                    </div>
                  )}
                  {(college.act_range_low || college.act_range_high) && (
                    <div>
                      <div className="font-medium">
                        {college.act_range_low}–{college.act_range_high}
                      </div>
                      <div className="text-xs text-muted-foreground">ACT Range</div>
                    </div>
                  )}
                  {college.avg_gpa && (
                    <div>
                      <div className="font-medium">{college.avg_gpa}</div>
                      <div className="text-xs text-muted-foreground">Avg. GPA</div>
                    </div>
                  )}
                </div>
                {college.notable_programs && college.notable_programs.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-muted-foreground mb-2">Notable Programs</div>
                    <div className="flex flex-wrap gap-1">
                      {college.notable_programs.map((program, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {program}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Athletics */}
              {(college.athletics_division || (college.sports && college.sports.length > 0)) && (
                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Athletics
                  </h4>
                  {college.athletics_division && (
                    <Badge variant="info">{college.athletics_division}</Badge>
                  )}
                  {college.sports && college.sports.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {college.sports.map((sport, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {sport}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Actions */}
              <div className="flex gap-2">
                {college.website_url && (
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={() => window.open(college.website_url!, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Website
                  </Button>
                )}
                <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-10 text-sm text-muted-foreground">
            Select a college to view details.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
