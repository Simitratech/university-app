import { Check, BookOpen, Footprints, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyChecklistProps {
  studyCompleted: boolean;
  movementCompleted: boolean;
  happinessCompleted: boolean;
  onStudyClick?: () => void;
  onMoveClick?: () => void;
  onHappyClick?: () => void;
}

export function DailyChecklist({ 
  studyCompleted, 
  movementCompleted, 
  happinessCompleted,
  onStudyClick,
  onMoveClick,
  onHappyClick,
}: DailyChecklistProps) {
  const items = [
    { label: "Study", completed: studyCompleted, icon: BookOpen, onClick: onStudyClick },
    { label: "Move", completed: movementCompleted, icon: Footprints, onClick: onMoveClick },
    { label: "Happy", completed: happinessCompleted, icon: Smile, onClick: onHappyClick },
  ];

  const allComplete = items.every((item) => item.completed);

  return (
    <div className="flex items-center justify-center gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            onClick={item.onClick}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-xl transition-all touch-target",
              item.completed ? "text-green-500" : "text-muted-foreground",
              item.onClick && "cursor-pointer hover-elevate active-elevate-2"
            )}
            data-testid={`button-goal-${item.label.toLowerCase()}`}
          >
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all",
                item.completed
                  ? "bg-green-500/20 border-green-500"
                  : "bg-muted/50 border-muted-foreground/30"
              )}
            >
              {item.completed ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        );
      })}
      {allComplete && (
        <div className="ml-2 px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-xs font-semibold">
          Day Complete!
        </div>
      )}
    </div>
  );
}
