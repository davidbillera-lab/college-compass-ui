import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscription, PREMIUM_TIER } from "@/contexts/SubscriptionContext";
import { Check, Crown, Sparkles, Loader2, ExternalLink } from "lucide-react";

export function PremiumUpgradeCard() {
  const { isPremium, isSubscribed, subscriptionEnd, loading, openCheckout, openCustomerPortal } = useSubscription();

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (isPremium) {
    return (
      <Card className="border-primary bg-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crown className="h-5 w-5 text-primary" />
              Premium Active
            </CardTitle>
            <Badge variant="default" className="bg-primary">
              Your Plan
            </Badge>
          </div>
          <CardDescription>
            {subscriptionEnd && (
              <span>Renews on {new Date(subscriptionEnd).toLocaleDateString()}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={openCustomerPortal}>
            Manage Subscription
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            {PREMIUM_TIER.name}
          </CardTitle>
          <div className="text-right">
            <Badge variant="secondary" className="text-lg font-bold">
              ${PREMIUM_TIER.monthly_price}/mo
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              + ${PREMIUM_TIER.onboarding_fee} one-time setup
            </p>
          </div>
        </div>
        <CardDescription>
          Unlock powerful AI features to supercharge your college application journey
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary" />
            AI Admission Odds Calculator
          </li>
          <li className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary" />
            AI Scholarship Matching
          </li>
          <li className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary" />
            AI Essay Coach with Expert Feedback
          </li>
          <li className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary" />
            AI Application Advisor
          </li>
          <li className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary" />
            Personalized College Matching
          </li>
        </ul>
        <Button onClick={openCheckout} className="w-full" size="lg">
          <Crown className="mr-2 h-4 w-4" />
          Get Started - ${PREMIUM_TIER.onboarding_fee + PREMIUM_TIER.monthly_price} today
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Then ${PREMIUM_TIER.monthly_price}/month. Cancel anytime.
        </p>
      </CardContent>
    </Card>
  );
}
