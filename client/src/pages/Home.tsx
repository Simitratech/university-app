import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { GlassCard, StatCard } from "@/components/GlassCard";
import { DegreeProgressPie, DegreeProgressLegend } from "@/components/DegreeProgress";
import { DailyChecklist } from "@/components/DailyChecklist";
import { LoadingState } from "@/components/EmptyState";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useStudentData } from "@/lib/student-data-provider";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { GraduationCap, Clock, Dumbbell, Smile, BookOpen, Plus, Check, Sparkles } from "lucide-react";
import { formatDistanceToNow, format, isToday, isTomorrow } from "date-fns";
import { getDailyCoachMessage, getExamCoachMessage, getRecoveryMessage, getRecoverySuggestedAction, isExamWeek, getExamWeekMessage, getSemesterStartMessage } from "@/lib/coach-messages";
import type { Class, Exam, StudySession, GymSession, HappinessEntry, DailyTracking, InsertGymSession, InsertHappinessEntry, AppProfile, Semester, StudentDataHappinessEntry, StudentDataGymSession } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showHappyModal, setShowHappyModal] = useState(false);
  const [quickHappiness, setQuickHappiness] = useState("");
  const [happinessSaved, setHappinessSaved] = useState(false);
  const [isAddingHappiness, setIsAddingHappiness] = useState(false);
  const [isAddingGym, setIsAddingGym] = useState(false);

  const { studentData, isLoading: studentDataLoading, addHappinessEntry, addGymSession } = useStudentData();

  const classes = studentData?.classes || [];
  const exams = studentData?.exams || [];
  const studySessions = studentData?.studySessions || [];
  const gymSessions = studentData?.gymSessions || [];
  const happinessEntries = studentData?.happinessEntries || [];
  
  // Get today's date string
  const today = format(new Date(), "yyyy-MM-dd");
  
  // Get this week's study sessions
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const weekStudySessions = studySessions.filter(s => new Date(s.date) >= startOfWeek);
  const weekGymSessions = gymSessions.filter(s => new Date(s.date) >= startOfWeek);
  
  // Calculate today's tracking
  const todayStudied = studySessions.some(s => s.date === today);
  const todayMoved = gymSessions.some(s => s.date === today);
  const todayHappy = happinessEntries.some(h => h.date === today);
  
  const todayTracking = {
    studyCompleted: todayStudied,
    movementCompleted: todayMoved,
    happinessCompleted: todayHappy,
  };
  
  // Get latest happiness
  const latestHappiness = happinessEntries.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];

  const { data: appProfile } = useQuery<AppProfile | null>({
    queryKey: ["/api/profile"],
  });

  const { data: recoveryStatus } = useQuery<{ recoveryMode: boolean; consecutiveInactiveDays: number }>({
    queryKey: ["/api/daily-tracking/recovery-status"],
  });

  const { data: activeSemester } = useQuery<Semester | null>({
    queryKey: ["/api/semesters/active"],
  });

  const dismissSemesterWelcome = useMutation({
    mutationFn: (semesterId: string) => 
      apiRequest("POST", `/api/semesters/${semesterId}/dismiss-welcome`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/semesters/active"] });
    },
  });

  const recoveryData = useMemo(() => {
    if (!recoveryStatus?.recoveryMode) return null;
    return {
      message: getRecoveryMessage(),
      action: getRecoverySuggestedAction(),
    };
  }, [recoveryStatus?.recoveryMode]);

  const handleQuickHappiness = async () => {
    if (quickHappiness.trim()) {
      try {
        setIsAddingHappiness(true);
        await addHappinessEntry({
          date: format(new Date(), "yyyy-MM-dd"),
          entry: quickHappiness.trim(),
        });
        setQuickHappiness("");
        setHappinessSaved(true);
        setTimeout(() => setHappinessSaved(false), 2000);
        toast({ title: "Happiness saved!" });
      } catch {
        toast({ title: "Failed to save happiness", variant: "destructive" });
      } finally {
        setIsAddingHappiness(false);
      }
    }
  };
  
  const handleQuickGym = async (data: Omit<StudentDataGymSession, "id">) => {
    try {
      setIsAddingGym(true);
      await addGymSession(data);
      setShowMoveModal(false);
      toast({ title: "Workout logged!" });
    } catch {
      toast({ title: "Failed to log workout", variant: "destructive" });
    } finally {
      setIsAddingGym(false);
    }
  };

  const isLoading = studentDataLoading;

  // Calculate degree progress
  const completed = classes?.filter((c) => c.status === "completed").reduce((sum, c) => sum + c.credits, 0) || 0;
  const inProgress = classes?.filter((c) => c.status === "in_progress").reduce((sum, c) => sum + c.credits, 0) || 0;
  const total = 60;
  const remaining = Math.max(0, total - completed - inProgress);

  // Weekly study time
  const weeklyStudyMinutes = studySessions?.reduce((sum, s) => sum + s.durationMinutes, 0) || 0;
  const weeklyStudyHours = Math.round(weeklyStudyMinutes / 60 * 10) / 10;

  // Weekly gym sessions
  const weeklyGymCount = gymSessions?.length || 0;
  const weeklyMovementMinutes = gymSessions?.reduce((sum, s) => sum + s.durationMinutes, 0) || 0;

  // Next exam
  const upcomingExams = exams
    ?.filter((e) => new Date(e.examDate) >= new Date())
    .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime()) || [];
  const nextExam = upcomingExams[0];

  // Exam week mode - activates when exams are within 7 days
  const isExamWeekMode = isExamWeek(exams || []);

  const getExamDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Home" />
        <LoadingState />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isExamWeekMode ? 'exam-week-mode' : ''}`}>
      <div className={isExamWeekMode ? "exam-week-bg" : "santa-fe-bg"} />
      <div className={isExamWeekMode ? "exam-week-overlay" : "santa-fe-overlay"} />
      <Header title="Home" />
      
      <main className="px-4 pb-24 safe-bottom">
        {/* Recovery Message - shown when returning after 2+ inactive days */}
        {recoveryData && (
          <GlassCard className="mt-4 mb-2 border-primary/20">
            <p className="text-base font-medium text-center mb-3" data-testid="text-recovery-message">
              {recoveryData.message}
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                if (recoveryData.action.type === "study") {
                  setLocation("/study");
                } else if (recoveryData.action.type === "move") {
                  setShowMoveModal(true);
                } else if (recoveryData.action.type === "happy") {
                  setShowHappyModal(true);
                }
              }}
              data-testid="button-recovery-action"
            >
              {recoveryData.action.label}
            </Button>
          </GlassCard>
        )}

        {/* New Semester Welcome - shown once when a new semester starts */}
        {activeSemester?.isNew && !recoveryData && (
          <GlassCard className="mt-4 mb-2 border-primary/20">
            <p className="text-lg font-medium text-center mb-1" data-testid="text-semester-welcome">
              New semester. Clean slate.
            </p>
            <p className="text-sm text-muted-foreground text-center mb-3">
              {getSemesterStartMessage()}
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                if (activeSemester?.id) {
                  dismissSemesterWelcome.mutate(activeSemester.id);
                }
              }}
              disabled={dismissSemesterWelcome.isPending}
              data-testid="button-dismiss-semester-welcome"
            >
              Let's go
            </Button>
          </GlassCard>
        )}

        {/* Greeting */}
        <div className="py-6">
          <h2 className="text-2xl font-bold theme-text" data-testid="text-greeting">
            {greeting()}, {appProfile?.name?.split(" ")[0] || "Student"}!
          </h2>
          <p className="theme-text-muted mt-1">
            {format(new Date(), "EEEE, MMMM d")}
          </p>
          {!recoveryData && (
            <p className="text-lg font-medium theme-text mt-3" data-testid="text-coach-home">
              {isExamWeekMode ? getExamWeekMessage() : getDailyCoachMessage()}
            </p>
          )}
        </div>

        {/* Exam Week Mode: Show Next Exam prominently at top */}
        {isExamWeekMode && nextExam && (
          <GlassCard className="mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Exam</p>
                  <p className="font-semibold">{nextExam.examName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary">
                  {getExamDateLabel(new Date(nextExam.examDate))}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(nextExam.examDate), { addSuffix: true })}
                </p>
              </div>
            </div>
            {getExamCoachMessage(nextExam.examDate, nextExam.id) && (
              <p className="text-xs text-muted-foreground/80 mt-3 italic" data-testid="text-exam-coach">
                {getExamCoachMessage(nextExam.examDate, nextExam.id)}
              </p>
            )}
          </GlassCard>
        )}

        {/* Daily Checklist - Always visible, prioritizes study during exam week */}
        <GlassCard className="mb-6">
          <h3 className="font-semibold mb-4">Today's Goals</h3>
          <DailyChecklist
            studyCompleted={todayTracking?.studyCompleted || false}
            movementCompleted={todayTracking?.movementCompleted || false}
            happinessCompleted={todayTracking?.happinessCompleted || false}
            onStudyClick={() => setLocation("/study")}
            onMoveClick={() => setShowMoveModal(true)}
            onHappyClick={() => setShowHappyModal(true)}
          />
        </GlassCard>

        {/* Degree Progress Card - hidden during exam week to reduce noise */}
        {!isExamWeekMode && (
          <GlassCard className="mb-6">
            <div className="flex items-center gap-2 mb-6">
              <GraduationCap className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Degree Progress</h3>
            </div>
            <div className="flex flex-col items-center">
              <DegreeProgressPie
                completed={completed}
                inProgress={inProgress}
                remaining={remaining}
                total={total}
              />
              <DegreeProgressLegend
                completed={completed}
                inProgress={inProgress}
                remaining={remaining}
                total={total}
              />
            </div>
          </GlassCard>
        )}

        {/* Quick Happiness Input - hidden during exam week */}
        {!isExamWeekMode && !todayTracking?.happinessCompleted && (
          <GlassCard className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold">Add Today's Happiness</h3>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="What made you happy today?"
                value={quickHappiness}
                onChange={(e) => setQuickHappiness(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuickHappiness()}
                className="flex-1"
                maxLength={200}
                data-testid="input-quick-happiness"
              />
              <Button 
                size="icon" 
                onClick={handleQuickHappiness}
                disabled={isAddingHappiness || !quickHappiness.trim()}
                data-testid="button-save-happiness"
              >
                {happinessSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>
          </GlassCard>
        )}

        {/* Stats Grid - hidden during exam week */}
        {!isExamWeekMode && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatCard
              icon={<Clock className="w-5 h-5" />}
              label="Weekly Study"
              value={`${weeklyStudyHours}h`}
              color="blue"
            />
            <StatCard
              icon={<Dumbbell className="w-5 h-5" />}
              label="Gym Sessions"
              value={`${weeklyGymCount}/3`}
              subtext={`${weeklyMovementMinutes}min total`}
              color={weeklyGymCount >= 3 ? "green" : weeklyGymCount >= 1 ? "yellow" : "red"}
            />
          </div>
        )}

        {/* Next Exam - shown in normal position when NOT in exam week mode */}
        {!isExamWeekMode && nextExam && (
          <GlassCard className="mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Exam</p>
                  <p className="font-semibold">{nextExam.examName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary">
                  {getExamDateLabel(new Date(nextExam.examDate))}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(nextExam.examDate), { addSuffix: true })}
                </p>
              </div>
            </div>
            {getExamCoachMessage(nextExam.examDate, nextExam.id) && (
              <p className="text-xs text-muted-foreground/80 mt-3 italic" data-testid="text-exam-coach">
                {getExamCoachMessage(nextExam.examDate, nextExam.id)}
              </p>
            )}
          </GlassCard>
        )}

        {/* Happiness Entry - hidden during exam week */}
        {!isExamWeekMode && latestHappiness && (
          <GlassCard className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Smile className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold">Last Happiness</h3>
            </div>
            <p className="text-muted-foreground italic">"{latestHappiness.entry}"</p>
            <p className="text-xs text-muted-foreground/70 mt-2">
              {format(new Date(latestHappiness.date), "EEEE, MMM d")}
            </p>
          </GlassCard>
        )}
      </main>

      <BottomNav />

      {/* Movement Modal */}
      <Dialog open={showMoveModal} onOpenChange={setShowMoveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Movement</DialogTitle>
          </DialogHeader>
          <QuickMoveForm 
            onSubmit={handleQuickGym}
            isPending={isAddingGym}
          />
        </DialogContent>
      </Dialog>

      {/* Happiness Modal */}
      <Dialog open={showHappyModal} onOpenChange={setShowHappyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What Made You Happy Today?</DialogTitle>
          </DialogHeader>
          <QuickHappyForm 
            onSubmit={async (entry) => {
              try {
                setIsAddingHappiness(true);
                await addHappinessEntry({
                  date: format(new Date(), "yyyy-MM-dd"),
                  entry,
                });
                setShowHappyModal(false);
                toast({ title: "Happiness saved!" });
              } catch {
                toast({ title: "Failed to save happiness", variant: "destructive" });
              } finally {
                setIsAddingHappiness(false);
              }
            }}
            isPending={isAddingHappiness}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuickMoveForm({ onSubmit, isPending }: { onSubmit: (data: any) => void; isPending: boolean }) {
  const [formData, setFormData] = useState({
    type: "gym",
    durationMinutes: "30",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type: formData.type,
      durationMinutes: parseInt(formData.durationMinutes),
      weight: null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Activity Type</Label>
        <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
          <SelectTrigger data-testid="select-move-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gym">Gym</SelectItem>
            <SelectItem value="walk">Walk</SelectItem>
            <SelectItem value="home_workout">Home Workout</SelectItem>
            <SelectItem value="sport">Sport</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Duration (minutes)</Label>
        <Input
          type="number"
          min="1"
          value={formData.durationMinutes}
          onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
          required
          data-testid="input-move-duration"
        />
      </div>
      <Button type="submit" className="w-full rounded-full" disabled={isPending}>
        {isPending ? "Saving..." : "Log Movement"}
      </Button>
    </form>
  );
}

function QuickHappyForm({ onSubmit, isPending }: { onSubmit: (entry: string) => void; isPending: boolean }) {
  const [entry, setEntry] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (entry.trim()) {
      onSubmit(entry.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Share something that made you smile</Label>
        <Input
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          placeholder="Today I'm grateful for..."
          maxLength={200}
          required
          data-testid="input-happiness-modal"
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">{entry.length}/200</p>
      </div>
      <Button type="submit" className="w-full rounded-full" disabled={isPending || !entry.trim()}>
        {isPending ? "Saving..." : "Save Happiness"}
      </Button>
    </form>
  );
}
