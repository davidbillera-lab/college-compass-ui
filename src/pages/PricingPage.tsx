import { useSubscription, PREMIUM_TIER } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Crown, Check, Sparkles, GraduationCap, Award, FileText,
  TrendingUp, FolderOpen, CalendarDays, Brain, ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";

const FEATURES = [
  { icon: Brain, label: "AI College Matching Engine", desc: "Personalized match scores across 5,900+ colleges" },
  { icon: Award, label: "AI Scholarship Matching", desc: "Find scholarships you actually qualify for" },
  { icon: FileText, label: "AI Essay Coach", desc: "5 coaching modes powered by Claude — preserves your voice" },
  { icon: GraduationCap, label: "College Discovery & Compare", desc: "Filter, explore, and compare colleges side-by-side" },
  { icon: FolderOpen, label: "Student Portfolio", desc: "Upload transcripts, awards, and share with counselors" },
  { icon: TrendingUp, label: "Application Tracker", desc: "Kanban pipeline from interest to submission" },
  { icon: CalendarDays, label: "Deadline Hub", desc: "All college and scholarship deadlines in one place" },
  { icon: Sparkles, label: "Guided Application Walkthroughs", desc: "Step-by-step guidance for every application" },
];

export default function PricingPage() {
  const { isPremium, hasAccess, trial, loading, openCheckout, openCustomerPortal } = useSubscription();

  const totalToday = PREMIUM_TIER.onboarding_fee + PREMIUM_TIER.monthly_price;

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in py-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <Badge variant="secondary" className="text-sm px-4 py-1">
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          {PREMIUM_TIER.trial_days}-Day Free Trial Included
        </Badge>
        <h1 className="text-4xl font-bold text-foreground">
          Simple, Transparent Pricing
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Everything you need to find the right college, win scholarships, and submit a standout application.
        </p>
      </div>

      {/* Pricing Card */}
      <div className="flex justify-center">
        <Card className="w-full max-w-lg border-primary/30 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
          <CardHeader className="text-center pb-4 pt-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">{PREMIUM_TIER.name}</CardTitle>
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-foreground">${PREMIUM_TIER.monthly_price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground">
                + ${PREMIUM_TIER.onboarding_fee} one-time setup fee
              </p>
              <p className="text-sm font-semibold text-primary">
                ${totalToday} due today — then ${PREMIUM_TIER.monthly_price}/mo
              </p>
            </div>
            <CardDescription className="mt-3 text-base">
              {PREMIUM_TIER.trial_days}-day free trial included. Cancel anytime.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            {/* Features list */}
            <ul className="space-y-3">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <li key={label} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* CTA */}
            {loading ? (
              <Button className="w-full" size="lg" disabled>
                Loading...
              </Button>
            ) : isPremium ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 py-3 rounded-lg bg-primary/10 text-primary font-semibold">
                  <Check className="h-5 w-5" />
                  You're subscribed — Premium Active
                </div>
                <Button variant="outline" className="w-full" onClick={openCustomerPortal}>
                  Manage Subscription
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : trial.isInTrial ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-center">
                  <p className="text-sm font-medium text-amber-800">
                    Free trial active — {trial.trialDaysRemaining} day{trial.trialDaysRemaining !== 1 ? "s" : ""} remaining
                  </p>
                </div>
                <Button onClick={openCheckout} className="w-full" size="lg">
                  <Crown className="mr-2 h-4 w-4" />
                  Subscribe Now — ${totalToday} today
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Subscribe before your trial ends to avoid any interruption.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Button onClick={openCheckout} className="w-full" size="lg">
                  <Crown className="mr-2 h-4 w-4" />
                  Get Started — ${totalToday} today
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Secure checkout via Stripe. Cancel anytime.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              q: "What is the one-time setup fee for?",
              a: `The $${PREMIUM_TIER.onboarding_fee} setup fee covers your personalized onboarding, initial AI profile analysis, and college/scholarship matching run. It's charged once at signup.`,
            },
            {
              q: "Can I cancel anytime?",
              a: "Yes. You can cancel your subscription at any time from the billing portal. You'll retain access through the end of your current billing period.",
            },
            {
              q: "What happens to my data if I cancel?",
              a: "Your profile, college lists, essays, and portfolio are always saved. You can resubscribe at any time to regain full access.",
            },
            {
              q: "Is there a free trial?",
              a: `Yes — every new account gets a ${PREMIUM_TIER.trial_days}-day free trial with full access to all features. No credit card required to start.`,
            },
            {
              q: "How does the AI Essay Coach work?",
              a: "The Essay Coach is powered by Claude and offers 5 modes: Review, Polish, Improve, Brainstorm, and Chat. It preserves your voice while teaching you why changes improve your essay.",
            },
            {
              q: "How many colleges are in the database?",
              a: "College Compass includes data on 5,900+ U.S. colleges and universities, sourced from the College Scorecard and continuously updated.",
            },
          ].map(({ q, a }) => (
            <Card key={q} variant="ghost" className="p-5">
              <h3 className="font-semibold text-foreground mb-2">{q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Back to dashboard */}
      <div className="text-center">
        <Button variant="ghost" asChild>
          <Link to="/dashboard">← Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
