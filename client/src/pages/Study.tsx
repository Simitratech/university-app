import { useState } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { GlassCard, StatCard } from "@/components/GlassCard";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { StudyGroupTimer } from "@/components/StudyGroupTimer";
import { Assignments } from "@/components/Assignments";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useStudentData } from "@/lib/student-data-provider";
import { Clock, BookOpen, TrendingUp, Calendar, Trash2, AlertTriangle, Users, Flame, CheckSquare } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, eachDayOfInterval, differenceInDays } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getDailyCoachMessage, getExamCoachMessage } from "@/lib/coach-messages";
import type { StudentDataClass } from "@shared/schema";

export default function Study() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const [selectedClassId, setSelectedClassId] = useState<string>("none");
  const [activeTab, setActiveTab] = useState("timer");
  const { 
    studentData, 
    isLoading, 
    addStudySession, 
    deleteStudySession,
    addAssignment,
    updateAssignment,
    deleteAssignment,
  } = useStudentData();

  const classes = studentData?.classes || [];
  const exams = studentData?.exams || [];
  const sessions = studentData?.studySessions || [];
  const assignments = studentData?.assignments || [];

  const handleSessionComplete = async (duration: number) => {
    try {
      await addStudySession({
        classId: selectedClassId === "none" ? null : selectedClassId,
        durationMinutes: duration,
        focusDuration: 25,
        breakDuration: 5,
        sessionType: "solo",
        date: new Date().toISOString(),
      });
      toast({ title: "Study session saved!" });
    } catch {
      toast({ title: "Failed to save session", variant: "destructive" });
    }
  };

  const handleGroupSessionComplete = async (duration: number) => {
    try {
      await addStudySession({
        classId: selectedClassId === "none" ? null : selectedClassId,
        durationMinutes: duration,
        focusDuration: 0,
        breakDuration: 0,
        sessionType: "group",
        date: new Date().toISOString(),
      });
      toast({ title: "Study session saved!" });
    } catch {
      toast({ title: "Failed to save session", variant: "destructive" });
    }
  };

  // Calculate study streak
  const studyStreak = (() => {
    let streak = 0;
    const sortedDates = [...new Set(sessions.map(s => s.date.split('T')[0]))].sort().reverse();
    
    if (sortedDates.length === 0) return 0;
    
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const yesterdayStr = format(subDays(new Date(), 1), "yyyy-MM-dd");
    
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
  })();

  // Calculate stats
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const today = format(now, "yyyy-MM-dd");

  const weekSessions = sessions?.filter((s) => {
    const d = new Date(s.date);
    return d >= weekStart && d <= weekEnd;
  }) || [];

  const todaySessions = sessions?.filter((s) => s.date.startsWith(today)) || [];
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const weeklyMinutes = weekSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const weeklyHours = Math.round(weeklyMinutes / 60 * 10) / 10;

  // Upcoming exams
  const upcomingExams = exams
    ?.filter((e) => new Date(e.examDate) >= new Date())
    .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())
    .slice(0, 3) || [];

  // Pending assignments
  const pendingAssignments = assignments?.filter(a => !a.completed).length || 0;

  // Daily chart data
  const last7Days = eachDayOfInterval({
    start: subDays(now, 6),
    end: now,
  });

  const chartData = last7Days.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const dayMinutes = sessions
      ?.filter((s) => s.date.startsWith(dateStr))
      .reduce((sum, s) => sum + s.durationMinutes, 0) || 0;
    
    return {
      day: format(day, "EEE"),
      minutes: dayMinutes,
      hours: Math.round(dayMinutes / 60 * 10) / 10,
    };
  });

  const inProgressClasses = classes?.filter((c) => c.status === "in_progress") || [];

  const getDaysUntil = (date: string) => {
    const days = differenceInDays(new Date(date), new Date());
    if (days <= 1) return "destructive";
    if (days <= 3) return "secondary";
    return "outline";
  };

  const getDaysUntilLabel = (date: string) => {
    const days = differenceInDays(new Date(date), new Date());
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `${days} days`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Study" />
        <LoadingState />
        <BottomNav />
      </div>
    );
  }

  const coachMessage = getDailyCoachMessage("study");

  return (
    <div className="min-h-screen">
      <Header title="Study" />

      <main className="px-4 pb-24 safe-bottom">
        {/* Coach Message */}
        {coachMessage && (
          <GlassCard className="mt-4 mb-4">
            <p className="text-sm text-muted-foreground italic text-center" data-testid="text-coach-study">
              {coachMessage}
            </p>
          </GlassCard>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatCard
            icon={<Clock className="w-4 h-4" />}
            label="Today"
            value={`${todayMinutes}m`}
            color="blue"
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="This Week"
            value={`${weeklyHours}h`}
            color="green"
          />
          <StatCard
            icon={<Flame className="w-4 h-4" />}
            label="Streak"
            value={`${studyStreak}d`}
            color={studyStreak >= 7 ? "green" : studyStreak >= 3 ? "yellow" : "red"}
          />
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="w-full">
            <TabsTrigger value="timer" className="flex-1">
              <Clock className="w-4 h-4 mr-1" />
              Timer
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex-1">
              <CheckSquare className="w-4 h-4 mr-1" />
              Tasks
              {pendingAssignments > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center text-xs">
                  {pendingAssignments}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              <BookOpen className="w-4 h-4 mr-1" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Timer Tab */}
          <TabsContent value="timer" className="mt-4 space-y-4">
            {/* Class Selector */}
            <div className="mb-4">
              <label className="text-sm text-muted-foreground mb-2 block">Study for:</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General Study</SelectItem>
                  {inProgressClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.courseName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Upcoming Exams */}
            {upcomingExams.length > 0 && (
              <GlassCard>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Upcoming Exams
                </h3>
                <div className="space-y-2">
                  {upcomingExams.map((exam) => (
                    <div key={exam.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{exam.examName}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(exam.examDate), "EEE, MMM d")}
                        </p>
                      </div>
                      <Badge variant={getDaysUntil(exam.examDate)}>
                        {getDaysUntilLabel(exam.examDate)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Timers */}
            {isStudent ? (
              <>
                <GlassCard className="py-8">
                  <div className="flex items-center justify-center gap-2 mb-4 text-blue-500">
                    <BookOpen className="w-5 h-5" />
                    <span className="font-medium">Solo Study (Pomodoro)</span>
                  </div>
                  <PomodoroTimer onSessionComplete={handleSessionComplete} />
                </GlassCard>

                <GlassCard className="py-6">
                  <StudyGroupTimer onSessionComplete={handleGroupSessionComplete} />
                </GlassCard>
              </>
            ) : (
              <GlassCard className="py-8">
                <div className="text-center text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">View Only Mode</p>
                  <p className="text-sm mt-1">Parents can view study history but cannot start sessions</p>
                </div>
              </GlassCard>
            )}
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="mt-4">
            <Assignments
              assignments={assignments}
              classes={classes}
              isStudent={isStudent}
              addAssignment={addAssignment}
              updateAssignment={updateAssignment}
              deleteAssignment={deleteAssignment}
            />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4 space-y-4">
            {/* Weekly Chart */}
            <GlassCard>
              <h3 className="font-semibold mb-4">Last 7 Days</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [`${value} min`, "Study Time"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Recent Sessions */}
            <GlassCard>
              <h3 className="font-semibold mb-4">Recent Sessions</h3>
              {sessions?.length === 0 ? (
                <EmptyState
                  icon={<Clock className="w-8 h-8" />}
                  title="No study sessions yet"
                  description="Start a timer to track your study time"
                />
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sessions
                    ?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 20)
                    .map((session) => {
                      const sessionClass = classes?.find((c) => c.id === session.classId);
                      return (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              session.sessionType === "group" ? "bg-purple-500/20 text-purple-500" : "bg-blue-500/20 text-blue-500"
                            }`}>
                              {session.sessionType === "group" ? (
                                <Users className="w-4 h-4" />
                              ) : (
                                <Clock className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {sessionClass?.courseName || "General Study"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(session.date), "MMM d, h:mm a")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{session.durationMinutes}m</span>
                            {isStudent && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Session?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete this study session.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={async () => {
                                        await deleteStudySession(session.id);
                                        toast({ title: "Session deleted" });
                                      }}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </GlassCard>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}
