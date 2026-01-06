import { ReactNode } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut, Home, Users, MapPin, Calendar, Utensils, FileText, Hotel, Globe, CheckSquare } from "lucide-react";

interface CoupleLayoutProps {
  children: ReactNode;
}

export default function CoupleLayout({ children }: CoupleLayoutProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const navigation = [
    { name: "Dashboard", href: "/couple/dashboard", icon: Home },
    { name: "Guest List", href: "/couple/guests", icon: Users },
    { name: "Seating", href: "/couple/seating", icon: MapPin },
    { name: "Timeline", href: "/couple/timeline", icon: Calendar },
    { name: "Menu", href: "/couple/menu", icon: Utensils },
    { name: "Notes", href: "/couple/notes", icon: FileText },
    { name: "Accommodations", href: "/couple/hotels", icon: Hotel },
    { name: "Website", href: "/couple/website", icon: Globe },
    { name: "Checklist", href: "/couple/checklist", icon: CheckSquare },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Header with Manor branding */}
      <header className="bg-[#2C5F5D] text-white shadow-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif">Manor By The Lake</h1>
              <p className="text-sm text-white/80">Your Wedding Journey</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs text-white/80">Couple Portal</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-1 overflow-x-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => setLocation(item.href)}
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

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">{children}</main>

      {/* Footer */}
      <footer className="bg-[#2C5F5D] text-white mt-16">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm">
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
