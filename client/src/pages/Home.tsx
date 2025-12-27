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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useStudentData } from "@/lib/student-data-provider";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  GraduationCap, Clock, Dumbbell, Smile, BookOpen, Plus, Check, Sparkles, 
  Flame, Calendar, Droplets, Moon, Target, AlertTriangle, CheckCircle2,
  TrendingUp, Quote
} from "lucide-react";
import { formatDistanceToNow, format, isToday, isTomorrow, differenceInDays, subDays, parseISO } from "date-fns";
import { getDailyCoachMessage, getExamCoachMessage, getRecoveryMessage, getRecoverySuggestedAction, isExamWeek, getExamWeekMessage, getSemesterStartMessage } from "@/lib/coach-messages";
import type { Class, Exam, StudySession, GymSession, HappinessEntry, DailyTracking, InsertGymSession, InsertHappinessEntry, AppProfile, Semester, StudentDataHappinessEntry, StudentDataGymSession } from "@shared/schema";

// Motivational quotes for students
const MOTIVATIONAL_QUOTES = [
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "Education is the passport to the future.", author: "Malcolm X" },
  { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { quote: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { quote: "Your limitation—it's only your imagination.", author: "Unknown" },
  { quote: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { quote: "Great things never come from comfort zones.", author: "Unknown" },
  { quote: "Dream it. Wish it. Do it.", author: "Unknown" },
  { quote: "Success doesn't just find you. You have to go out and get it.", author: "Unknown" },
  { quote: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { quote: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
];

function getDailyQuote() {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}

export default function Home() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const [, setLocation] = useLocation();
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showHappyModal, setShowHappyModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [quickHappiness, setQuickHappiness] = useState("");
  const [happinessSaved, setHappinessSaved] = useState(false);
  const [isAddingHappiness, setIsAddingHappiness] = useState(false);
  const [isAddingGym, setIsAddingGym] = useState(false);

  const { 
    studentData, 
    isLoading: studentDataLoading, 
    addHappinessEntry, 
    addGymSession,
    addSleepEntry,
    updateHydration,
  } = useStudentData();

  const classes = studentData?.classes || [];
  const exams = studentData?.exams || [];
  const studySessions = studentData?.studySessions || [];
  const gymSessions = studentData?.gymSessions || [];
  const happinessEntries = studentData?.happinessEntries || [];
  const assignments = studentData?.assignments || [];
  const sleepEntries = studentData?.sleepEntries || [];
  const hydrationEntries = studentData?.hydrationEntries || [];
  const settings = studentData?.settings;
  
  // Get today's date string
  const today = format(new Date(), "yyyy-MM-dd");
  
  // Get this week's study sessions
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const weekStudySessions = studySessions.filter(s => new Date(s.date) >= startOfWeek);
  const weekGymSessions = gymSessions.filter(s => new Date(s.date) >= startOfWeek);
  
  // Calculate today's tracking
  const todayStudied = studySessions.some(s => s.date.startsWith(today));
  const todayMoved = gymSessions.some(s => s.date.startsWith(today));
  const todayHappy = happinessEntries.some(h => h.date === today);
  
  // Calculate study streak
  const studyStreak = useMemo(() => {
    let streak = 0;
    const sortedDates = [...new Set(studySessions.map(s => s.date.split('T')[0]))].sort().reverse();
    
    if (sortedDates.length === 0) return 0;
    
    // Check if studied today
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const yesterdayStr = format(subDays(new Date(), 1), "yyyy-MM-dd");
    
    // Start from today or yesterday
    let checkDate = sortedDates[0] === todayStr ? new Date() : 
                    sortedDates[0] === yesterdayStr ? subDays(new Date(), 1) : null;
    
    if (!checkDate) return 0;
    
    for (let i = 0; i < 365; i++) {
      const dateStr = format(subDays(checkDate, i), "yyyy-MM-dd");
      if (sortedDates.includes(dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  }, [studySessions]);

  // Today's hydration
  const todayHydration = hydrationEntries.find(h => h.date === today);
  const waterGlasses = todayHydration?.glasses || 0;
  const waterGoal = settings?.dailyWaterGoal || 8;

  // Today's sleep
  const todaySleep = sleepEntries.find(s => s.date === today);
  const sleepHours = todaySleep?.hoursSlept || 0;
  const sleepGoal = settings?.sleepGoalHours || 8;

  // Upcoming assignments (due in next 7 days, not completed)
  const upcomingAssignments = assignments
    .filter(a => !a.completed && new Date(a.dueDate) >= new Date())
    .filter(a => differenceInDays(new Date(a.dueDate), new Date()) <= 7)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

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

  const handleAddWater = async () => {
    if (!isStudent) return;
    try {
      await updateHydration(today, waterGlasses + 1);
      toast({ title: "💧 Water logged!" });
    } catch {
      toast({ title: "Failed to log water", variant: "destructive" });
    }
  };

  const isLoading = studentDataLoading;

  // Calculate degree progress
  const completed = classes?.filter((c) => c.status === "completed").reduce((sum, c) => sum + c.credits, 0) || 0;
  const inProgress = classes?.filter((c) => c.status === "in_progress").reduce((sum, c) => sum + c.credits, 0) || 0;
  const total = settings?.totalCreditsRequired || 60;
  const remaining = Math.max(0, total - completed - inProgress);

  // Weekly study time
  const weeklyStudyMinutes = weekStudySessions?.reduce((sum, s) => sum + s.durationMinutes, 0) || 0;
  const weeklyStudyHours = Math.round(weeklyStudyMinutes / 60 * 10) / 10;

  // Weekly gym sessions
  const weeklyGymCount = weekGymSessions?.length || 0;
  const weeklyMovementMinutes = weekGymSessions?.reduce((sum, s) => sum + s.durationMinutes, 0) || 0;

  // Next exam
  const upcomingExams = exams
    ?.filter((e) => new Date(e.examDate) >= new Date())
    .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime()) || [];
  const nextExam = upcomingExams[0];
  const daysUntilExam = nextExam ? differenceInDays(new Date(nextExam.examDate), new Date()) : null;

  // Exam week mode - activates when exams are within 7 days
  const isExamWeekMode = isExamWeek(exams || []);

  // Daily quote
  const dailyQuote = getDailyQuote();

  // Daily goals completion
  const dailyGoalsCompleted = [todayStudied, todayMoved, todayHappy, waterGlasses >= waterGoal].filter(Boolean).length;
  const totalDailyGoals = 4;

  const getExamDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  const greeting = () => {
    const hour = new Date().getHours();
    const name = user?.firstName || "Student";
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
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
        {/* Greeting & Study Streak */}
        <div className="mt-4 mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{greeting()}</h2>
            <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
          </div>
          {studyStreak > 0 && (
            <div className="flex items-center gap-2 bg-orange-500/20 px-3 py-2 rounded-full">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-bold text-orange-500">{studyStreak} day streak!</span>
            </div>
          )}
        </div>

        {/* Daily Quote */}
        <GlassCard className="mb-4 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-start gap-3">
            <Quote className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm italic">"{dailyQuote.quote}"</p>
              <p className="text-xs text-muted-foreground mt-1">— {dailyQuote.author}</p>
            </div>
          </div>
        </GlassCard>

        {/* Exam Countdown - Prominent when exam is near */}
        {nextExam && daysUntilExam !== null && daysUntilExam <= 14 && (
          <GlassCard className={`mb-4 ${daysUntilExam <= 3 ? 'border-red-500/50 bg-red-500/10' : daysUntilExam <= 7 ? 'border-yellow-500/50 bg-yellow-500/10' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  daysUntilExam <= 3 ? 'bg-red-500/20 text-red-500' : 
                  daysUntilExam <= 7 ? 'bg-yellow-500/20 text-yellow-500' : 
                  'bg-primary/20 text-primary'
                }`}>
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Next Exam</p>
                  <p className="font-semibold">{nextExam.examName}</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(nextExam.examDate), "EEE, MMM d 'at' h:mm a")}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-bold ${
                  daysUntilExam <= 3 ? 'text-red-500' : 
                  daysUntilExam <= 7 ? 'text-yellow-500' : 
                  'text-primary'
                }`}>
                  {daysUntilExam === 0 ? 'TODAY' : `${daysUntilExam}d`}
                </p>
                {daysUntilExam > 0 && <p className="text-xs text-muted-foreground">remaining</p>}
              </div>
            </div>
            {daysUntilExam <= 3 && (
              <div className="mt-3 flex items-center gap-2 text-red-500">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Exam very soon! Focus on review.</span>
              </div>
            )}
          </GlassCard>
        )}

        {/* Daily Goals Progress */}
        <GlassCard className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Today's Goals</h3>
            </div>
            <span className="text-sm text-muted-foreground">{dailyGoalsCompleted}/{totalDailyGoals}</span>
          </div>
          <Progress value={(dailyGoalsCompleted / totalDailyGoals) * 100} className="h-2 mb-4" />
          
          <div className="grid grid-cols-2 gap-3">
            {/* Study Goal */}
            <div className={`flex items-center gap-2 p-2 rounded-lg ${todayStudied ? 'bg-green-500/20' : 'bg-muted/50'}`}>
              {todayStudied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <BookOpen className="w-4 h-4 text-muted-foreground" />}
              <span className={`text-sm ${todayStudied ? 'text-green-500 font-medium' : 'text-muted-foreground'}`}>Study</span>
            </div>
            
            {/* Movement Goal */}
            <div className={`flex items-center gap-2 p-2 rounded-lg ${todayMoved ? 'bg-green-500/20' : 'bg-muted/50'}`}>
              {todayMoved ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Dumbbell className="w-4 h-4 text-muted-foreground" />}
              <span className={`text-sm ${todayMoved ? 'text-green-500 font-medium' : 'text-muted-foreground'}`}>Move</span>
            </div>
            
            {/* Happiness Goal */}
            <div className={`flex items-center gap-2 p-2 rounded-lg ${todayHappy ? 'bg-green-500/20' : 'bg-muted/50'}`}>
              {todayHappy ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Smile className="w-4 h-4 text-muted-foreground" />}
              <span className={`text-sm ${todayHappy ? 'text-green-500 font-medium' : 'text-muted-foreground'}`}>Gratitude</span>
            </div>
            
            {/* Hydration Goal */}
            <div 
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${waterGlasses >= waterGoal ? 'bg-green-500/20' : 'bg-muted/50'}`}
              onClick={isStudent ? handleAddWater : undefined}
            >
              {waterGlasses >= waterGoal ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Droplets className="w-4 h-4 text-blue-400" />}
              <span className={`text-sm ${waterGlasses >= waterGoal ? 'text-green-500 font-medium' : 'text-muted-foreground'}`}>
                Water {waterGlasses}/{waterGoal}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Upcoming Assignments */}
        {upcomingAssignments.length > 0 && (
          <GlassCard className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold">Due Soon</h3>
            </div>
            <div className="space-y-2">
              {upcomingAssignments.map(assignment => {
                const daysUntil = differenceInDays(new Date(assignment.dueDate), new Date());
                return (
                  <div key={assignment.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        assignment.priority === 'high' ? 'bg-red-500' :
                        assignment.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <span className="text-sm font-medium">{assignment.title}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      daysUntil === 0 ? 'bg-red-500/20 text-red-500' :
                      daysUntil <= 2 ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                    </span>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        )}

        {/* Recovery Message - shown when returning after 2+ inactive days */}
        {recoveryData && (
          <GlassCard className="mb-4 border-primary/20">
            <p className="text-base font-medium text-center mb-3" data-testid="text-recovery-message">
              {recoveryData.message}
            </p>
            {isStudent && (
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
            )}
          </GlassCard>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
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

        {/* Quick Actions for Students */}
        {isStudent && !todayHappy && (
          <GlassCard className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Smile className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold">What made you happy today?</h3>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Something good that happened..."
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

        {/* Degree Progress */}
        <GlassCard className="mb-4">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Degree Progress</h3>
          </div>
          <div className="flex items-center gap-6">
            <DegreeProgressPie completed={completed} inProgress={inProgress} remaining={remaining} total={total} size={100} />
            <DegreeProgressLegend completed={completed} inProgress={inProgress} remaining={remaining} />
          </div>
        </GlassCard>

        {/* Last Happiness Entry */}
        {latestHappiness && (
          <GlassCard className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold">Recent Joy</h3>
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
        <DialogContent className="glass-card">
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
        <DialogContent className="glass-card">
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
      date: new Date().toISOString(),
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
