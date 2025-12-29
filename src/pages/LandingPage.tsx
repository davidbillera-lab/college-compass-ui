import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  Target, 
  Sparkles,
  ArrowRight,
  Star,
  Users,
  Trophy,
  CheckCircle2,
  Quote,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.png";

const features = [
  {
    icon: ShieldCheck,
    title: "Verified Student Profile",
    description: "Build a profile that colleges can trust with verified activities, awards, and counselor sign-offs.",
  },
  {
    icon: Target,
    title: "College Fit Intelligence",
    description: "Get personalized college recommendations based on your unique profile, interests, and goals.",
  },
  {
    icon: Sparkles,
    title: "Scholarship Matching",
    description: "Discover scholarships you actually qualify for with AI-powered eligibility matching.",
  },
];

const testimonials = [
  {
    quote: "CollegeApp helped me find 5 scholarships I never knew existed. I ended up with $45,000 in awards!",
    author: "Sarah M.",
    role: "Stanford '28",
    avatar: "SM",
  },
  {
    quote: "The verification feature gave my application credibility. Admissions officers noticed.",
    author: "Marcus J.",
    role: "MIT '27",
    avatar: "MJ",
  },
  {
    quote: "As a parent, I finally understood where my daughter stood. The fit scores were incredibly accurate.",
    author: "Jennifer L.",
    role: "Parent",
    avatar: "JL",
  },
];

const stats = [
  { value: "50K+", label: "Students Matched" },
  { value: "$12M", label: "Scholarships Found" },
  { value: "94%", label: "Acceptance Rate" },
  { value: "500+", label: "Partner Schools" },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-light via-background to-background" />
          <img 
            src={heroBg} 
            alt="" 
            className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-soft-light"
          />
        </div>

        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <Badge variant="info" className="mb-6 px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Now in Early Access
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Build a profile{" "}
              <span className="text-primary">colleges can trust</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8">
              Create a verified student profile, discover colleges that truly fit you, 
              and unlock scholarships you never knew existed.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="xl" variant="hero" asChild>
                <Link to="/waitlist">
                  Join Waitlist
                  <ArrowRight className="h-5 w-5 ml-1" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link to="/login">
                  See Demo
                </Link>
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 mt-10 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {['AJ', 'SM', 'MJ', 'JL'].map((initials, i) => (
                  <div 
                    key={i}
                    className="w-8 h-8 rounded-full bg-primary-light border-2 border-background flex items-center justify-center text-xs font-semibold text-primary"
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <span>Join 2,500+ students on the waitlist</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-card py-8">
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

      {/* Features Section */}
      <section className="py-20 md:py-28">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need to stand out
            </h2>
            <p className="text-lg text-muted-foreground">
              A complete platform designed by counselors, built for students, and trusted by colleges.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, i) => (
              <Card key={i} variant="feature" className="group hover-lift">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-xl bg-primary-light flex items-center justify-center mb-6 group-hover:shadow-glow transition-shadow">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Get started in minutes
            </h2>
            <p className="text-lg text-muted-foreground">
              Three simple steps to transform your college application journey.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: 1, title: "Build Your Profile", desc: "Add your activities, awards, and story. We'll verify what matters." },
              { step: 2, title: "Get Matched", desc: "Our AI finds colleges and scholarships that fit your unique profile." },
              { step: 3, title: "Apply with Confidence", desc: "Use insights and tools to craft standout applications." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-hero text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-6 shadow-card">
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
      <section id="testimonials" className="py-20 md:py-28">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Students love CollegeApp
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of students who found their perfect fit.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial, i) => (
              <Card key={i} variant="default" className="relative">
                <CardContent className="p-6 pt-8">
                  <Quote className="absolute top-6 left-6 h-8 w-8 text-primary/20" />
                  <p className="text-foreground mb-6 relative z-10 leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-sm font-semibold text-primary">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{testimonial.author}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-20 md:py-28 bg-gradient-hero text-primary-foreground">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-6 bg-card/20 text-primary-foreground border-0">
              <Trophy className="h-3.5 w-3.5 mr-1.5" />
              Early Access Pricing
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Free during beta. Premium launching soon.
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
              Join now to lock in founding member pricing and get lifetime access to premium features.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="bg-card text-primary hover:bg-card/90" asChild>
                <Link to="/waitlist">
                  Join the Waitlist
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm opacity-90">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Cancel anytime
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Priority support
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to build your future?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start creating your verified student profile today.
            </p>
            <Button size="xl" variant="hero" asChild>
              <Link to="/waitlist">
                Get Started Free
                <ArrowRight className="h-5 w-5 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
