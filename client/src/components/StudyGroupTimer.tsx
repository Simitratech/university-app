import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Users } from "lucide-react";

interface StudyGroupTimerProps {
  onSessionComplete?: (duration: number) => void;
}

type TimerState = "idle" | "running" | "paused";

interface TimerStorage {
  elapsedSeconds: number;
  timerState: TimerState;
  startTimestamp: number;
}

const STORAGE_KEY = "study_group_timer_state";

function getStoredTimer(): TimerStorage | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load timer state:", e);
  }
  return null;
}

function saveTimerState(state: TimerStorage) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save timer state:", e);
  }
}

function clearTimerState() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear timer state:", e);
  }
}

export function StudyGroupTimer({ onSessionComplete }: StudyGroupTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [isInitialized, setIsInitialized] = useState(false);
  
  const savedCallbackRef = useRef(onSessionComplete);
  const startTimestampRef = useRef<number | null>(null);

  savedCallbackRef.current = onSessionComplete;

  useEffect(() => {
    const stored = getStoredTimer();
    if (stored && stored.timerState !== "idle") {
      if (stored.timerState === "paused") {
        setElapsedSeconds(stored.elapsedSeconds);
        setTimerState("paused");
        startTimestampRef.current = null;
      } else {
        const additionalElapsed = Math.floor((Date.now() - stored.startTimestamp) / 1000);
        setElapsedSeconds(stored.elapsedSeconds + additionalElapsed);
        setTimerState("running");
        startTimestampRef.current = Date.now();
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    
    if (timerState === "running") {
      if (startTimestampRef.current === null) {
        startTimestampRef.current = Date.now();
      }
      saveTimerState({
        elapsedSeconds,
        timerState,
        startTimestamp: startTimestampRef.current,
      });
    } else if (timerState === "paused") {
      saveTimerState({
        elapsedSeconds,
        timerState,
        startTimestamp: 0,
      });
    } else {
      clearTimerState();
    }
  }, [timerState, elapsedSeconds, isInitialized]);

  const formatTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerState === "running") {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState]);

  const handleStart = () => {
    startTimestampRef.current = Date.now();
    setTimerState("running");
  };

  const handlePause = () => {
    startTimestampRef.current = null;
    setTimerState("paused");
  };

  const handleStop = () => {
    if (elapsedSeconds > 0 && savedCallbackRef.current) {
      const minutes = Math.ceil(elapsedSeconds / 60);
      savedCallbackRef.current(minutes);
    }
    setTimerState("idle");
    setElapsedSeconds(0);
    startTimestampRef.current = null;
    clearTimerState();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 text-green-500">
        <Users className="w-5 h-5" />
        <span className="font-medium">Study Group</span>
      </div>
      
      <div className="text-4xl font-bold font-mono tracking-tight">
        {formatTime(elapsedSeconds)}
      </div>
      
      <p className="text-sm text-muted-foreground">
        {timerState === "running" ? "Group session in progress" : 
         timerState === "paused" ? "Paused" : "Start a group study session"}
      </p>

      <div className="flex items-center gap-3">
        {timerState === "idle" ? (
          <Button
            onClick={handleStart}
            className="rounded-full bg-green-600 hover:bg-green-700"
            data-testid="button-group-start"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Group Study
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={timerState === "running" ? handlePause : handleStart}
              className="rounded-full"
              data-testid="button-group-toggle"
            >
              {timerState === "running" ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={handleStop}
              className="rounded-full"
              data-testid="button-group-stop"
            >
              <Square className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
      
      {elapsedSeconds > 0 && timerState !== "idle" && (
        <p className="text-xs text-muted-foreground">
          Press stop to save your session
        </p>
      )}
    </div>
  );
}
