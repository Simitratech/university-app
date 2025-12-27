import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Play, Pause, RotateCcw, Coffee, CheckCircle, PartyPopper } from "lucide-react";
import { getStudyCompleteMessage } from "@/lib/coach-messages";

interface PomodoroTimerProps {
  focusDuration?: number;
  breakDuration?: number;
  onSessionComplete?: (duration: number) => void;
}

type TimerState = "idle" | "focus" | "break" | "paused";

interface TimerStorage {
  timeLeft: number;
  timerState: TimerState;
  sessionMinutes: number;
  startTimestamp: number;
}

const STORAGE_KEY = "pomodoro_timer_state";

function getStoredTimer(): TimerStorage | null {
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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save timer state:", e);
  }
}

function clearTimerState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear timer state:", e);
  }
}

export function PomodoroTimer({
  focusDuration = 25,
  breakDuration = 5,
  onSessionComplete,
}: PomodoroTimerProps) {
  const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [coachMessage, setCoachMessage] = useState("");
  
  const savedCallbackRef = useRef(onSessionComplete);
  const startTimestampRef = useRef<number | null>(null);

  savedCallbackRef.current = onSessionComplete;

  useEffect(() => {
    const stored = getStoredTimer();
    if (stored && stored.timerState !== "idle") {
      if (stored.timerState === "paused") {
        setTimeLeft(stored.timeLeft);
        setTimerState("paused");
        setSessionMinutes(stored.sessionMinutes);
        startTimestampRef.current = null;
      } else {
        const elapsed = Math.floor((Date.now() - stored.startTimestamp) / 1000);
        const remaining = stored.timeLeft - elapsed;
        
        if (remaining > 0) {
          setTimeLeft(remaining);
          setTimerState(stored.timerState);
          setSessionMinutes(stored.sessionMinutes);
          startTimestampRef.current = Date.now();
        } else {
          if (stored.timerState === "focus") {
            const newSessionMinutes = stored.sessionMinutes + focusDuration;
            setSessionMinutes(newSessionMinutes);
            setTimerState("break");
            setTimeLeft(breakDuration * 60);
            setShowCompletionModal(true);
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 3000);
            startTimestampRef.current = Date.now();
            
            if (savedCallbackRef.current) {
              savedCallbackRef.current(newSessionMinutes);
            }
          } else {
            setTimerState("idle");
            setTimeLeft(focusDuration * 60);
            clearTimerState();
          }
        }
      }
    }
    setIsInitialized(true);
  }, [focusDuration, breakDuration]);

  useEffect(() => {
    if (!isInitialized) return;
    
    if (timerState === "focus" || timerState === "break") {
      if (startTimestampRef.current === null) {
        startTimestampRef.current = Date.now();
      }
      saveTimerState({
        timeLeft,
        timerState,
        sessionMinutes,
        startTimestamp: startTimestampRef.current,
      });
    } else if (timerState === "paused") {
      saveTimerState({
        timeLeft,
        timerState,
        sessionMinutes,
        startTimestamp: 0,
      });
    } else {
      clearTimerState();
    }
  }, [timerState, timeLeft, sessionMinutes, isInitialized]);

  const totalSeconds = timerState === "break" ? breakDuration * 60 : focusDuration * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerState === "focus" || timerState === "break") {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState]);

  useEffect(() => {
    if (timeLeft === 0 && (timerState === "focus" || timerState === "break")) {
      if (timerState === "focus") {
        const newSessionMinutes = sessionMinutes + focusDuration;
        setSessionMinutes(newSessionMinutes);
        setShowCompletionModal(true);
        setShowCelebration(true);
        setCoachMessage(getStudyCompleteMessage());
        setTimeout(() => setShowCelebration(false), 3000);
        
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Focus Session Complete!", {
            body: "Great work! Time for a break.",
            icon: "/favicon.ico",
          });
        }
        
        setTimerState("break");
        setTimeLeft(breakDuration * 60);
        startTimestampRef.current = Date.now();
      } else {
        setTimerState("idle");
        setTimeLeft(focusDuration * 60);
        startTimestampRef.current = null;
        clearTimerState();
      }
    }
  }, [timeLeft, timerState, sessionMinutes, focusDuration, breakDuration]);

  const handleStart = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    
    if (timerState === "idle") {
      setTimeLeft(focusDuration * 60);
      startTimestampRef.current = Date.now();
      setTimerState("focus");
    } else if (timerState === "paused") {
      startTimestampRef.current = Date.now();
      setTimerState("focus");
    }
  };

  const handlePause = () => {
    startTimestampRef.current = null;
    setTimerState("paused");
  };

  const handleReset = () => {
    if (sessionMinutes > 0 && savedCallbackRef.current) {
      savedCallbackRef.current(sessionMinutes);
    }
    setTimerState("idle");
    setTimeLeft(focusDuration * 60);
    setSessionMinutes(0);
    startTimestampRef.current = null;
    clearTimerState();
  };

  const handleCompletionDismiss = () => {
    setShowCompletionModal(false);
    if (savedCallbackRef.current && sessionMinutes > 0) {
      savedCallbackRef.current(sessionMinutes);
    }
  };

  const size = 280;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-8">
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-bounce">
            <PartyPopper className="w-24 h-24 text-yellow-500" />
          </div>
        </div>
      )}

      <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              Focus Session Complete!
            </DialogTitle>
            <DialogDescription>
              Great work! You completed {focusDuration} minutes of focused study. 
              Your session has been saved automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{sessionMinutes} minutes</p>
            <p className="text-muted-foreground">Total session time</p>
            {coachMessage && (
              <p className="text-sm text-muted-foreground/80 italic mt-3 text-center" data-testid="text-coach-study-complete">
                {coachMessage}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleCompletionDismiss} className="w-full">
              Start Break
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={timerState === "break" ? "#22c55e" : "#3b82f6"}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-bold tracking-tight font-mono">
            {formatTime(timeLeft)}
          </span>
          <span className="text-lg text-muted-foreground font-medium mt-2 flex items-center gap-2">
            {timerState === "break" ? (
              <>
                <Coffee className="w-4 h-4" />
                Break Time
              </>
            ) : timerState === "focus" ? (
              "Focus Mode"
            ) : timerState === "paused" ? (
              "Paused"
            ) : (
              "Ready"
            )}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleReset}
          className="rounded-full w-14 h-14"
          data-testid="button-timer-reset"
        >
          <RotateCcw className="w-6 h-6" />
        </Button>

        <Button
          onClick={timerState === "focus" || timerState === "break" ? handlePause : handleStart}
          className="rounded-full w-20 h-20 text-lg font-semibold"
          data-testid="button-timer-toggle"
        >
          {timerState === "focus" || timerState === "break" ? (
            <Pause className="w-8 h-8" />
          ) : (
            <Play className="w-8 h-8 ml-1" />
          )}
        </Button>

        <div className="w-14 h-14 rounded-full flex items-center justify-center text-muted-foreground">
          <span className="text-sm font-medium">{sessionMinutes}m</span>
        </div>
      </div>

      {sessionMinutes > 0 && (
        <p className="text-sm text-muted-foreground">
          Session total: <span className="font-medium text-foreground">{sessionMinutes} minutes</span>
        </p>
      )}
    </div>
  );
}
