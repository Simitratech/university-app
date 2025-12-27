import { useMemo } from "react";

interface DegreeProgressProps {
  completed: number;
  inProgress: number;
  remaining: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}

export function DegreeProgressPie({
  completed,
  inProgress,
  remaining,
  total,
  size = 200,
  strokeWidth = 24,
}: DegreeProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const segments = useMemo(() => {
    const completedPercent = (completed / total) * 100;
    const inProgressPercent = (inProgress / total) * 100;
    const remainingPercent = (remaining / total) * 100;

    const completedDash = (completedPercent / 100) * circumference;
    const inProgressDash = (inProgressPercent / 100) * circumference;
    const remainingDash = (remainingPercent / 100) * circumference;

    let offset = 0;
    const result = [];

    if (completed > 0) {
      result.push({
        dash: completedDash,
        offset: -offset,
        color: "#22c55e", // green
        label: "Completed",
      });
      offset += completedDash;
    }

    if (inProgress > 0) {
      result.push({
        dash: inProgressDash,
        offset: -offset,
        color: "#eab308", // yellow
        label: "In Progress",
      });
      offset += inProgressDash;
    }

    if (remaining > 0) {
      result.push({
        dash: remainingDash,
        offset: -offset,
        color: "#ef4444", // red
        label: "Remaining",
      });
    }

    return result;
  }, [completed, inProgress, remaining, total, circumference]);

  const percentage = Math.round((completed / total) * 100);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />

        {/* Segments */}
        {segments.map((segment, index) => (
          <circle
            key={index}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${segment.dash} ${circumference}`}
            strokeDashoffset={segment.offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        ))}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tracking-tight">{percentage}%</span>
        <span className="text-sm text-muted-foreground font-medium">Complete</span>
      </div>
    </div>
  );
}

export function DegreeProgressLegend({
  completed,
  inProgress,
  remaining,
  total,
}: DegreeProgressProps) {
  const items = [
    { label: "Completed", value: completed, color: "bg-green-500" },
    { label: "In Progress", value: inProgress, color: "bg-yellow-500" },
    { label: "Remaining", value: remaining, color: "bg-red-500" },
  ];

  return (
    <div className="flex flex-wrap gap-4 justify-center mt-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${item.color}`} />
          <span className="text-sm">
            <span className="font-medium">{item.value}</span>
            <span className="text-muted-foreground"> / {total}</span>
          </span>
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
