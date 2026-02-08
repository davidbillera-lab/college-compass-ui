import { ReactNode } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Lock, Sparkles } from "lucide-react";

interface PremiumGateProps {
  children: ReactNode;
  featureName?: string;
  showUpgradeCard?: boolean;
}

export function PremiumGate({ children, featureName = "This feature", showUpgradeCard = true }: PremiumGateProps) {
  const { isPremium, loading, openCheckout } = useSubscription();

  if (loading) {
    return null;
  }

  if (isPremium) {
    return <>{children}</>;
  }

  if (!showUpgradeCard) {
    return null;
  }

  return (
    <Card className="border-dashed border-muted-foreground/30">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg">Premium Feature</CardTitle>
        <CardDescription>
          {featureName} is available with CampusClimb Premium
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button onClick={openCheckout} size="sm">
          <Crown className="mr-2 h-4 w-4" />
          Upgrade to Unlock
        </Button>
      </CardContent>
    </Card>
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
  disabled = false 
}: PremiumButtonProps) {
  const { isPremium, loading, openCheckout } = useSubscription();

  if (loading) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        {children}
      </Button>
    );
  }

  if (!isPremium) {
    return (
      <Button 
        variant="outline" 
        size={size} 
        className={className}
        onClick={openCheckout}
      >
        <Crown className="mr-2 h-4 w-4 text-primary" />
        Upgrade for {typeof children === 'string' ? children : 'this feature'}
      </Button>
    );
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={className} 
      onClick={onClick}
      disabled={disabled}
    >
      <Sparkles className="mr-2 h-4 w-4" />
      {children}
    </Button>
  );
}
