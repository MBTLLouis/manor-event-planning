import { ReactNode, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut, Home, Users, MapPin, Calendar, Utensils, FileText, Hotel, Globe, CheckSquare, Menu, X } from "lucide-react";

interface CoupleLayoutProps {
  children: ReactNode;
}

export default function CoupleLayout({ children }: CoupleLayoutProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const navigation = [
    { name: "Dashboard", href: "/couple/dashboard", icon: Home },
    { name: "Guest List", href: "/couple/guests", icon: Users },
    { name: "Seating", href: "/couple/seating-plan", icon: MapPin },
    { name: "Timeline", href: "/couple/timeline", icon: Calendar },
    { name: "Menu", href: "/couple/menu", icon: Utensils },
    { name: "Notes", href: "/couple/notes", icon: FileText },
    { name: "Accommodations", href: "/couple/hotels", icon: Hotel },
    { name: "Website", href: "/couple/website", icon: Globe },
    { name: "Checklist", href: "/couple/checklist", icon: CheckSquare },
  ];

  const handleNavClick = (href: string) => {
    setLocation(href);
    // Close mobile menu after navigation
    if (window.innerWidth < 768) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col">
      {/* Header with Manor branding */}
      <header className="bg-[#2C5F5D] text-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg md:text-2xl font-serif">Manor By The Lake</h1>
              <p className="text-xs md:text-sm text-white/80">Your Wedding Journey</p>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="text-right hidden sm:block">
                <p className="font-medium text-sm md:text-base">{user?.name}</p>
                <p className="text-xs text-white/80">Couple Portal</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-white hover:bg-white/10 h-9 w-9 md:h-10 md:w-10 p-0"
              >
                <LogOut className="w-4 h-4" />
              </Button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation - Desktop */}
      <nav className="hidden md:block bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-1 overflow-x-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.href)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? "border-[#6B8E23] text-[#2C5F5D]"
                      : "border-transparent text-gray-600 hover:text-[#2C5F5D] hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Navigation - Mobile */}
      {mobileMenuOpen && (
        <nav className="md:hidden bg-white border-b border-gray-200 z-40">
          <div className="px-4 py-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.href)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#6B8E23]/10 text-[#2C5F5D]"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {item.name}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 md:px-6 py-6 md:py-8">{children}</main>

      {/* Footer */}
      <footer className="bg-[#2C5F5D] text-white mt-12 md:mt-16">
        <div className="container mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs md:text-sm">
            <p>© 2024 Manor By The Lake. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white/80">
                Contact Us
              </a>
              <a href="#" className="hover:text-white/80">
                Help & Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
