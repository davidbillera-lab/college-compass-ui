import { ReactNode } from "react";
import { useSubscription, PREMIUM_TIER } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Lock, Sparkles, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface PremiumGateProps {
  children: ReactNode;
  featureName?: string;
  showUpgradeCard?: boolean;
}

export function PremiumGate({ children, featureName = "This feature", showUpgradeCard = true }: PremiumGateProps) {
  const { hasAccess, loading, openCheckout, trial } = useSubscription();

  if (loading) return null;
  if (hasAccess) return <>{children}</>;
  if (!showUpgradeCard) return null;

  return (
    <Card className="border-dashed border-muted-foreground/30">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg">Premium Feature</CardTitle>
        <CardDescription>
          {featureName} is available with {PREMIUM_TIER.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-3">
        <Button onClick={openCheckout} size="sm">
          <Crown className="mr-2 h-4 w-4" />
          Upgrade to Unlock
        </Button>
        <p className="text-xs text-muted-foreground">
          <Link to="/pricing" className="underline underline-offset-2 hover:text-foreground">
            View pricing
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

/** Trial countdown banner shown at the top of the app layout during the free trial */
export function TrialBanner() {
  const { trial, isPremium, loading, openCheckout } = useSubscription();

  if (loading || isPremium || !trial.isInTrial) return null;

  const urgent = trial.trialDaysRemaining <= 2;

  return (
    <div className={`w-full px-4 py-2.5 flex items-center justify-between gap-4 text-sm ${
      urgent
        ? "bg-destructive/10 border-b border-destructive/20 text-destructive"
        : "bg-amber-50 border-b border-amber-200 text-amber-800"
    }`}>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 flex-shrink-0" />
        <span>
          {urgent
            ? `Your free trial expires in ${trial.trialDaysRemaining} day${trial.trialDaysRemaining !== 1 ? "s" : ""}! Subscribe now to keep access.`
            : `Free trial: ${trial.trialDaysRemaining} day${trial.trialDaysRemaining !== 1 ? "s" : ""} remaining`}
        </span>
      </div>
      <Button
        size="sm"
        variant={urgent ? "destructive" : "outline"}
        className="flex-shrink-0 h-7 text-xs"
        onClick={openCheckout}
      >
        <Crown className="mr-1.5 h-3.5 w-3.5" />
        Subscribe — ${PREMIUM_TIER.onboarding_fee + PREMIUM_TIER.monthly_price} today
      </Button>
    </div>
  );
}

/** Full-page paywall shown when trial has expired and user is not subscribed */
export function TrialExpiredGate({ children }: { children: ReactNode }) {
  const { hasAccess, trial, loading, openCheckout } = useSubscription();

  if (loading) return null;
  if (hasAccess) return <>{children}</>;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <Card className="max-w-md w-full border-primary/20 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {trial.trialExpired ? "Your Free Trial Has Ended" : "Premium Required"}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {trial.trialExpired
              ? "Subscribe to continue using College Compass and keep all your data."
              : `Start your ${PREMIUM_TIER.trial_days}-day free trial or subscribe to access this feature.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">One-time setup fee</span>
              <span className="font-semibold">${PREMIUM_TIER.onboarding_fee}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Monthly subscription</span>
              <span className="font-semibold">${PREMIUM_TIER.monthly_price}/mo</span>
            </div>
            <div className="border-t border-border pt-2 flex items-center justify-between text-sm font-semibold">
              <span>Due today</span>
              <span className="text-primary">${PREMIUM_TIER.onboarding_fee + PREMIUM_TIER.monthly_price}</span>
            </div>
          </div>
          <Button onClick={openCheckout} className="w-full" size="lg">
            <Crown className="mr-2 h-4 w-4" />
            Subscribe Now
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Cancel anytime. Your data is always saved.{" "}
            <Link to="/pricing" className="underline underline-offset-2 hover:text-foreground">
              See full pricing
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface PremiumButtonProps {
  onClick: () => void;
  children: ReactNode;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
}

export function PremiumButton({
  onClick,
  children,
  className,
  variant = "default",
  size = "default",
  disabled = false,
}: PremiumButtonProps) {
  const { hasAccess, loading, openCheckout } = useSubscription();

  if (loading) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        {children}
      </Button>
    );
  }

  if (!hasAccess) {
    return (
      <Button variant="outline" size={size} className={className} onClick={openCheckout}>
        <Crown className="mr-2 h-4 w-4 text-primary" />
        Upgrade for {typeof children === "string" ? children : "this feature"}
      </Button>
    );
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={onClick} disabled={disabled}>
      <Sparkles className="mr-2 h-4 w-4" />
      {children}
    </Button>
  );
}
