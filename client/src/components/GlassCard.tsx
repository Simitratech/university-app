import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function GlassCard({ children, className, onClick, hover = false }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-card p-6 transition-all duration-300",
        hover && "hover-elevate cursor-pointer active:scale-[0.98]",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  color?: "default" | "green" | "yellow" | "red" | "blue";
  className?: string;
}

export function StatCard({ icon, label, value, subtext, color = "default", className }: StatCardProps) {
  const colorClasses = {
    default: "text-foreground",
    green: "text-green-500 dark:text-green-400",
    yellow: "text-yellow-500 dark:text-yellow-400",
    red: "text-red-500 dark:text-red-400",
    blue: "text-primary",
  };

  return (
    <GlassCard className={cn("flex flex-col gap-2", className)}>
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-muted", colorClasses[color])}>
        {icon}
      </div>
      <div>
        <p className={cn("text-2xl font-bold tracking-tight", colorClasses[color])}>
          {value}
        </p>
        <p className="text-sm font-medium text-muted-foreground">
          {label}
        </p>
        {subtext && (
          <p className="text-xs text-muted-foreground/70 mt-1">
            {subtext}
          </p>
        )}
      </div>
    </GlassCard>
  );
}
