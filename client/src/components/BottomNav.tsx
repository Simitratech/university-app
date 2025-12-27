import { useLocation, Link } from "wouter";
import { Home, GraduationCap, BookOpen, Clock, Heart, DollarSign } from "lucide-react";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/degree", icon: GraduationCap, label: "Degree" },
  { path: "/enrolled", icon: BookOpen, label: "Classes" },
  { path: "/study", icon: Clock, label: "Study" },
  { path: "/money", icon: DollarSign, label: "Money" },
  { path: "/wellness", icon: Heart, label: "Wellness" },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="bottom-nav z-50" data-testid="nav-bottom">
      <div className="flex items-center justify-around py-2 px-2 gap-1">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={`flex flex-col items-center justify-center min-w-[48px] py-2 px-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "uni-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon className={`w-5 h-5 mb-0.5 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
                <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>
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
