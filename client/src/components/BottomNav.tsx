import { useLocation, Link } from "wouter";
import { Home, GraduationCap, BookOpen, Clock, Heart, DollarSign, BarChart3 } from "lucide-react";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/degree", icon: GraduationCap, label: "Degree" },
  { path: "/enrolled", icon: BookOpen, label: "Classes" },
  { path: "/study", icon: Clock, label: "Study" },
  { path: "/stats", icon: BarChart3, label: "Stats" },
  { path: "/money", icon: DollarSign, label: "Money" },
  { path: "/wellness", icon: Heart, label: "Wellness" },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="bottom-nav z-50" data-testid="nav-bottom">
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={`flex flex-col items-center justify-center min-w-[44px] py-1.5 px-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon className={`w-5 h-5 mb-0.5 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
                <span className={`text-[9px] font-medium ${isActive ? "font-semibold" : ""}`}>
                  {item.label}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
