import { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Calendar, LayoutDashboard, MessageSquare, Package, Users as UsersIcon, LogOut, Menu, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface EmployeeLayoutProps {
  children: ReactNode;
}

export default function EmployeeLayout({ children }: EmployeeLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logged out successfully");
      setLocation("/login");
      window.location.reload();
    },
  });

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: UsersIcon, label: "Events", path: "/events" },
    { icon: Calendar, label: "Calendar", path: "/calendar" },
    { icon: MessageSquare, label: "Messages", path: "/messages-center" },
    { icon: Package, label: "Vendors", path: "/vendors" },
  ];

  const NavContent = () => (
    <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.path || location.startsWith(item.path + "/");
        return (
          <button
            key={item.path}
            onClick={() => {
              setLocation(item.path);
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-secondary"
            }`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium hidden sm:inline">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col sm:flex-row">
      {/* Mobile Header */}
      <div className="sm:hidden flex items-center justify-between bg-white border-b border-border p-3 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary font-elegant">MBTL</span>
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-sm truncate">Manor By The Lake</h2>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 top-14 bg-black/50 z-30" onClick={() => setMobileMenuOpen(false)} />
      )}
      <div className={`sm:hidden fixed top-14 left-0 right-0 bg-white border-b border-border z-30 transform transition-all duration-200 ${
        mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
      }`}>
        <div className="flex flex-col">
          <NavContent />
          <div className="p-3 border-t border-border space-y-2">
            <div className="flex items-center gap-2 px-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-primary">
                  {user?.name?.charAt(0) || "SM"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user?.name || "Staff Member"}</p>
                <p className="text-xs text-muted-foreground">Employee</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="w-4 h-4 mr-2 flex-shrink-0" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden sm:flex w-full sm:w-56 lg:w-64 bg-white border-r border-border flex-col shrink-0">
        <div className="p-4 sm:p-6 border-b border-border">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-base sm:text-xl font-bold text-primary font-elegant">MBTL</span>
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm sm:text-lg truncate">Manor By The Lake</h2>
              <p className="text-xs text-muted-foreground hidden sm:block">Event Planning</p>
            </div>
          </div>
        </div>

        <NavContent />

        <div className="p-3 sm:p-4 border-t border-border">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 px-2">
            <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs sm:text-sm font-semibold text-primary">
                {user?.name?.charAt(0) || "SM"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium truncate">{user?.name || "Staff Member"}</p>
              <p className="text-xs text-muted-foreground hidden sm:block">Employee</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs sm:text-sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="hidden sm:inline">Sign Out</span>
            <span className="sm:hidden">Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}
