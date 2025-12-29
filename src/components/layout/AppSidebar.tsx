import { Link, useLocation } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  User,
  GraduationCap,
  Award,
  FileText,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  roles: ('student' | 'parent' | 'counselor')[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ['student', 'parent', 'counselor'] },
  { href: "/profile", label: "Profile Builder", icon: User, roles: ['student'] },
  { href: "/colleges", label: "College Fit", icon: GraduationCap, roles: ['student', 'parent'] },
  { href: "/scholarships", label: "Scholarships", icon: Award, badge: "3 new", roles: ['student', 'parent'] },
  { href: "/essays", label: "Essays & Story", icon: FileText, roles: ['student'] },
  { href: "/verification", label: "Verification", icon: ShieldCheck, roles: ['student', 'counselor'] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ['student', 'parent', 'counselor'] },
];

export function AppSidebar() {
  const { currentRole } = useApp();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(currentRole)
  );

  return (
    <aside
      className={cn(
        "sticky top-16 h-[calc(100vh-4rem)] border-r border-sidebar-border bg-sidebar transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary shadow-soft"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-sidebar-primary")} />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <Badge variant="info" size="sm">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Pro upgrade card */}
      {!collapsed && (
        <div className="p-3">
          <div className="rounded-xl bg-gradient-hero p-4 text-primary-foreground">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold text-sm">Upgrade to Pro</span>
            </div>
            <p className="text-xs opacity-90 mb-3">
              Get unlimited college matches and AI essay assistance.
            </p>
            <Button 
              size="sm" 
              variant="secondary" 
              className="w-full bg-card/20 text-primary-foreground border-0 hover:bg-card/30"
            >
              Learn More
            </Button>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-muted-foreground hover:text-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Collapse
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
