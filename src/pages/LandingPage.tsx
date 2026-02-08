import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Sparkles,
  ArrowRight,
  Star,
  CheckCircle2,
  Quote,
  Zap,
  Eye,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.png";

const features = [
  {
    icon: Target,
    title: "AI-Powered Scholarship Matching",
    description: "Stop wasting time on irrelevant scholarships. Our AI matches you to 545+ active opportunities you actually qualify for.",
  },
  {
    icon: Sparkles,
    title: "Complete Application Hub",
    description: "Essays, portfolios, deadline tracking—everything in one place. No juggling between 5 different apps.",
  },
  {
    icon: DollarSign,
    title: "Essay Coaching Included",
    description: "Get AI feedback on every essay. No $150-300 per essay fees like CollegeVine. Included with your subscription.",
  },
  {
    icon: Eye,
    title: "Parent Visibility Dashboard",
    description: "Parents see the full picture—deadlines, scholarship status, EFC estimates. Know exactly where you stand.",
  },
  {
    icon: Zap,
    title: "Real-Time Scholarship Updates",
    description: "Scholarships expire fast. We scrape 20+ sources daily so you never miss a deadline.",
  },
  {
    icon: TrendingUp,
    title: "Personalized College Matching",
    description: "Get colleges ranked by fit, affordability, and admit probability. Not just generic rankings.",
  },
];

const testimonials = [
  {
    quote: "Fastweb spammed me constantly. Campus Climb Kit found 8 scholarships I actually qualified for in one week. Just won $15,000!",
    author: "Alex M.",
    role: "High School Senior",
    avatar: "AM",
  },
  {
    quote: "CollegeVine wanted $300 per essay review. Campus Climb Kit's AI Essay Coach gave me better feedback for FREE. Game changer.",
    author: "Jordan T.",
    role: "College Applicant",
    avatar: "JT",
  },
  {
    quote: "As a parent, I hated not knowing what my daughter was doing. Now I see her entire scholarship pipeline and all deadlines. Peace of mind.",
    author: "Patricia L.",
    role: "Parent of Senior",
    avatar: "PL",
  },
  {
    quote: "First-gen student with no counselor guidance. This app was like having a private advisor. Already got into 3 colleges!",
    author: "Maya K.",
    role: "First-Generation Student",
    avatar: "MK",
  },
];

const stats = [
  { value: "545+", label: "Active Scholarships" },
  { value: "3,237", label: "Verified Colleges" },
  { value: "$19.99", label: "Per Month" },
  { value: "100%", label: "No Spam" },
];

const comparisonData = [
  { feature: "Spam Emails", fastweb: "10+ daily", collegevine: "Minimal", ours: "✓ Zero" },
  { feature: "Essay Coaching", fastweb: "Not included", collegevine: "$150-300/essay", ours: "✓ Free" },
  { feature: "College Matching", fastweb: "Not included", collegevine: "Limited", ours: "✓ AI-powered" },
  { feature: "Scholarship Database", fastweb: "Outdated", collegevine: "Small", ours: "✓ 545+ active" },
  { feature: "Application Tracking", fastweb: "❌ No", collegevine: "❌ No", ours: "✓ Full pipeline" },
  { feature: "Parent Dashboard", fastweb: "❌ No", collegevine: "❌ No", ours: "✓ Yes" },
  { feature: "Monthly Price", fastweb: "Free*", collegevine: "$200-300", ours: "✓ $19.99" },
];

export default function LandingPage() {
  return (
    <main className="flex flex-col" role="main">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32" aria-labelledby="hero-heading">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
          <img 
            src={heroBg} 
            alt="" 
            className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-soft-light"
          />
        </div>

        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-6 px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Now Accepting Students
            </Badge>
            
            <h1 id="hero-heading" className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Stop searching.<br/>
              <span className="text-primary">Start winning scholarships.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8">
              Fastweb spams you. CollegeVine charges $150 per essay. Campus Climb Kit gives you AI-powered scholarship matching, essay coaching, and college planning—all for $19.99/month.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="default" asChild className="text-base">
                <Link to="/auth">
                  Start Free (No Credit Card)
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base">
                <Link to="/dashboard">
                  See Live Demo
                </Link>
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex flex-col gap-4 mt-12">
              <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                <div className="flex -space-x-2">
                  {['AM', 'JT', 'PL', 'MK'].map((initials, i) => (
                    <div 
                      key={i}
                      className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-semibold text-primary"
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <span>Join 2,500+ students</span>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  No spam
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  Real-time updates
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  AI matching
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-card py-8" aria-label="Platform statistics">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 md:py-28 bg-muted/30" aria-labelledby="comparison-heading">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 id="comparison-heading" className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Students Switch to Campus Climb Kit
            </h2>
            <p className="text-lg text-muted-foreground">
              We fixed what other platforms got wrong.
            </p>
          </div>

          <div className="max-w-5xl mx-auto overflow-x-auto">
            <table className="w-full text-sm md:text-base">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left font-semibold text-foreground py-4 px-4">Feature</th>
                  <th className="text-center font-semibold text-muted-foreground py-4 px-4">Fastweb</th>
                  <th className="text-center font-semibold text-muted-foreground py-4 px-4">CollegeVine</th>
                  <th className="text-center font-semibold text-primary py-4 px-4">Campus Climb</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, i) => (
                  <tr key={i} className="border-b border-border hover:bg-white/50 transition-colors">
                    <td className="font-medium text-foreground py-4 px-4">{row.feature}</td>
                    <td className="text-center text-muted-foreground py-4 px-4">{row.fastweb}</td>
                    <td className="text-center text-muted-foreground py-4 px-4">{row.collegevine}</td>
                    <td className="text-center font-semibold text-green-600 py-4 px-4">{row.ours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-xs text-muted-foreground mt-4 px-4">
              *Fastweb is free but data is sold to third parties and users receive 10+ daily emails.
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-28" aria-labelledby="features-heading">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 id="features-heading" className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything included, no hidden fees
            </h2>
            <p className="text-lg text-muted-foreground">
              One affordable subscription covers all premium features.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="border border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 md:py-28 bg-muted/30" aria-labelledby="how-it-works-heading">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 id="how-it-works-heading" className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Get started in minutes
            </h2>
            <p className="text-lg text-muted-foreground">
              Three simple steps to transform your college application journey.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: 1, title: "Sign Up Free", desc: "Create your account. No credit card required." },
              { step: 2, title: "Build Your Profile", desc: "Add activities, test scores, and interests." },
              { step: 3, title: "Get AI Matches", desc: "Discover colleges and scholarships that fit you." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28" aria-labelledby="testimonials-heading">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 id="testimonials-heading" className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Real students, real results
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands finding their perfect fit.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, i) => (
              <Card key={i} className="flex flex-col">
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-foreground mb-6 flex-1 leading-relaxed text-sm">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                      {testimonial.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{testimonial.author}</p>
                      <p className="text-xs text-muted-foreground truncate">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-20 md:py-28 bg-gradient-to-r from-primary/5 to-primary/10" aria-labelledby="pricing-heading">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 id="pricing-heading" className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Ready to level up your applications?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join students who are securing scholarships, getting into better colleges, and having peace of mind throughout the entire process.
            </p>
            
            <div className="bg-white rounded-lg p-8 mb-8 border border-border">
              <div className="text-4xl font-bold text-primary mb-2">
                $19.99<span className="text-lg text-muted-foreground">/month</span>
              </div>
              <p className="text-muted-foreground mb-6">Everything included. Cancel anytime.</p>
              
              <ul className="text-left max-w-sm mx-auto space-y-3 mb-8 text-foreground">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  545+ active scholarships
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  AI essay coaching
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  College matching
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  Parent dashboard
                </li>
              </ul>

              <Button size="lg" variant="default" asChild className="w-full mb-4">
                <Link to="/auth">
                  Start Your Free Account
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              
              <div className="flex flex-wrap gap-4 justify-center text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  No credit card
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Cancel anytime
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Full access
                </span>
              </div>
            </div>

            <p className="text-muted-foreground text-sm">
              No hidden fees. No spam. No data selling. We make money when you succeed.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-28" aria-labelledby="faq-heading">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl mx-auto">
            <h2 id="faq-heading" className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
              Common questions answered
            </h2>

            <div className="space-y-6">
              {[
                {
                  q: "Is there really no credit card required?",
                  a: "Correct. You can create an account and explore the app completely free. Only pay if you upgrade to premium features."
                },
                {
                  q: "How is this different from Fastweb?",
                  a: "Fastweb sells your data, sends 10+ daily emails, and has outdated scholarships. We don't sell data, send zero spam, and update scholarships daily."
                },
                {
                  q: "Why is your essay coaching better than CollegeVine?",
                  a: "CollegeVine charges $150-300 per essay. Our AI coaches you for free as part of your subscription, and we provide feedback on unlimited essays."
                },
                {
                  q: "Can my parents see my progress?",
                  a: "Yes! We include a parent dashboard so your family can track deadlines, scholarship status, and overall progress."
                },
                {
                  q: "Do I need a counselor to use this?",
                  a: "No. Our app is designed specifically for students without access to counselors. It's like having an AI advisor 24/7."
                },
              ].map((item, i) => (
                <details key={i} className="group border border-border rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer">
                  <summary className="flex items-center justify-between font-semibold text-foreground cursor-pointer">
                    {item.q}
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-foreground text-primary-foreground">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Don't let this application cycle be stressful
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Thousands of students are already using Campus Climb Kit to find scholarships, plan for college, and apply with confidence.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth">
                Create Your Free Account
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}