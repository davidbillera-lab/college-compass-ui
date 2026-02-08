import { useScholarshipFieldAnalysis } from "@/hooks/useScholarshipFieldAnalysis";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, ArrowRight, Check, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ScholarshipOpportunityBannerProps {
  compact?: boolean;
  showDetails?: boolean;
  className?: string;
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount}`;
}

export default function ScholarshipOpportunityBanner({ 
  compact = false, 
  showDetails = true,
  className 
}: ScholarshipOpportunityBannerProps) {
  const { impacts, loading, totalMissingValue, totalMissingCount } = useScholarshipFieldAnalysis();

  if (loading) {
    return (
      <div className={cn("animate-pulse rounded-lg border bg-muted/30 p-4", className)}>
        <div className="h-4 bg-muted rounded w-1/3 mb-2" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    );
  }

  const missingFields = impacts.filter(i => !i.isFilled);
  const filledFields = impacts.filter(i => i.isFilled);
  const completionRate = impacts.length > 0 
    ? Math.round((filledFields.length / impacts.length) * 100) 
    : 100;

  if (missingFields.length === 0) {
    return (
      <div className={cn(
        "rounded-lg border border-success/20 bg-success/5 p-4 flex items-center gap-3",
        className
      )}>
        <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
          <Check className="h-5 w-5 text-success" />
        </div>
        <div>
          <p className="font-medium text-foreground">Profile Maximized!</p>
          <p className="text-sm text-muted-foreground">
            You're matching with all available scholarship criteria
          </p>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <Link 
        to="/profile?wizard=true" 
        className={cn(
          "block rounded-lg border border-primary/20 bg-primary/5 p-4 hover:bg-primary/10 transition-colors",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">
                Unlock {formatCurrency(totalMissingValue)} in scholarships
              </p>
              <p className="text-sm text-muted-foreground">
                {missingFields.length} profile fields to complete
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-primary" />
        </div>
      </Link>
    );
  }

  return (
    <div className={cn(
      "rounded-xl border bg-gradient-to-br from-primary/5 to-accent/5 p-6",
      className
    )}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Left: Summary */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Scholarship Opportunity</h3>
          </div>
          <p className="text-muted-foreground mb-4">
            Complete {missingFields.length} profile fields to match with{" "}
            <span className="font-medium text-foreground">{totalMissingCount} more scholarships</span> worth up to{" "}
            <span className="font-medium text-primary">{formatCurrency(totalMissingValue)}</span>
          </p>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Profile completion</span>
                <span className="font-medium">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
          </div>

          {showDetails && (
            <div className="flex flex-wrap gap-2">
              {missingFields.slice(0, 5).map((field) => (
                <Badge key={field.field} variant="outline" className="text-xs">
                  {field.label}
                </Badge>
              ))}
              {missingFields.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{missingFields.length - 5} more
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Right: CTA */}
        <div className="flex flex-col items-center gap-2 lg:border-l lg:pl-6">
          <div className="flex items-center gap-2 text-center">
            <DollarSign className="h-8 w-8 text-primary" />
            <span className="text-3xl font-bold text-primary">
              {formatCurrency(totalMissingValue)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground text-center">potential value</p>
          <Button asChild className="mt-2">
            <Link to="/profile?wizard=true">
              Complete Profile
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
