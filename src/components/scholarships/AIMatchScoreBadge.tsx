import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Sparkles, Info, Loader2, AlertCircle } from 'lucide-react';
import { AIMatchScoreResult } from '@/lib/scholarshipsIntel/api';
import { cn } from '@/lib/utils';

interface AIMatchScoreBadgeProps {
  score?: AIMatchScoreResult;
  loading?: boolean;
  onCalculate?: () => void;
  compact?: boolean;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'text-success';
  if (score >= 50) return 'text-warning';
  if (score >= 25) return 'text-orange-500';
  return 'text-destructive';
}

function getScoreBgColor(score: number): string {
  if (score >= 75) return 'bg-success/10 border-success/20';
  if (score >= 50) return 'bg-warning/10 border-warning/20';
  if (score >= 25) return 'bg-orange-500/10 border-orange-500/20';
  return 'bg-destructive/10 border-destructive/20';
}

function getStatusLabel(status: string, score: number): string {
  if (status === 'eligible') return 'Likely Eligible';
  if (status === 'maybe') return 'Possibly Eligible';
  return 'Unlikely';
}

export function AIMatchScoreBadge({
  score,
  loading,
  onCalculate,
  compact = false,
  className,
}: AIMatchScoreBadgeProps) {
  if (loading) {
    return (
      <Badge variant="outline" className={cn("gap-1", className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs">Calculating...</span>
      </Badge>
    );
  }

  if (!score) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onCalculate}
        className={cn("gap-1 h-7", className)}
      >
        <Sparkles className="h-3 w-3 text-primary" />
        <span className="text-xs">Get AI Score</span>
      </Button>
    );
  }

  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Badge 
            variant="outline"
            className={cn(
              "cursor-pointer gap-1 transition-colors hover:bg-muted",
              getScoreBgColor(score.overall_score),
              className
            )}
          >
            <Sparkles className={cn("h-3 w-3", getScoreColor(score.overall_score))} />
            <span className={cn("font-semibold", getScoreColor(score.overall_score))}>
              {score.overall_score}%
            </span>
          </Badge>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <AIScoreDetails score={score} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
            getScoreBgColor(score.overall_score),
            className
          )}
        >
          <div className="flex items-center gap-2">
            <Sparkles className={cn("h-4 w-4", getScoreColor(score.overall_score))} />
            <div>
              <div className="flex items-center gap-1">
                <span className={cn("text-lg font-bold", getScoreColor(score.overall_score))}>
                  {score.overall_score}%
                </span>
                <Info className="h-3 w-3 text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">
                {getStatusLabel(score.eligibility_status, score.overall_score)}
              </span>
            </div>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <AIScoreDetails score={score} />
      </PopoverContent>
    </Popover>
  );
}

function AIScoreDetails({ score }: { score: AIMatchScoreResult }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h4 className="font-semibold">AI Match Analysis</h4>
      </div>

      {/* Overall Score */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Overall Match</span>
        <span className={cn("text-2xl font-bold", getScoreColor(score.overall_score))}>
          {score.overall_score}%
        </span>
      </div>

      {/* Breakdown */}
      <div className="space-y-2">
        {score.breakdown.map((item) => (
          <div key={item.category} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{item.category}</span>
              <span className="font-medium">{item.score}/{item.maxScore}</span>
            </div>
            <Progress 
              value={(item.score / item.maxScore) * 100} 
              className="h-1.5" 
            />
            <p className="text-xs text-muted-foreground">{item.details}</p>
          </div>
        ))}
      </div>

      {/* Reasoning */}
      <div className="pt-2 border-t">
        <p className="text-sm text-muted-foreground">{score.reasoning}</p>
      </div>

      {/* Missing Fields */}
      {score.missing_fields.length > 0 && (
        <div className="flex items-start gap-2 p-2 rounded-md bg-warning/10 border border-warning/20">
          <AlertCircle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-warning">Improve your score</p>
            <p className="text-xs text-muted-foreground">
              Complete these fields: {score.missing_fields.join(', ')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
