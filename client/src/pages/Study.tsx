import { useState } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { GlassCard, StatCard } from "@/components/GlassCard";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { StudyGroupTimer } from "@/components/StudyGroupTimer";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useStudentData } from "@/lib/student-data-provider";
import { Clock, BookOpen, TrendingUp, Calendar, Trash2, AlertTriangle, Users, Dumbbell, Smile } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, eachDayOfInterval } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getDailyCoachMessage, getExamCoachMessage } from "@/lib/coach-messages";
import type { StudentDataClass } from "@shared/schema";

export default function Study() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const [selectedClassId, setSelectedClassId] = useState<string>("none");
  const { studentData, isLoading, addStudySession, deleteStudySession } = useStudentData();

  const classes = studentData?.classes || [];
  const exams = studentData?.exams || [];
  const sessions = studentData?.studySessions || [];
  const gymSessions = studentData?.gymSessions || [];
  const happinessEntries = studentData?.happinessEntries || [];

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

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteStudySession(id);
      toast({ title: "Session deleted" });
    } catch {
      toast({ title: "Failed to delete session", variant: "destructive" });
    }
  };

  const inProgressClasses = classes.filter((c) => c.status === "in_progress");

  // Calculate stats
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const todaySessions = sessions?.filter(
    (s) => format(new Date(s.date), "yyyy-MM-dd") === format(now, "yyyy-MM-dd")
  ) || [];
  const weekSessions = sessions?.filter((s) => {
    const d = new Date(s.date);
    return d >= weekStart && d <= weekEnd;
  }) || [];
  const monthSessions = sessions?.filter((s) => {
    const d = new Date(s.date);
    return d >= monthStart && d <= monthEnd;
  }) || [];

  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const weekMinutes = weekSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const monthMinutes = monthSessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  // Generate chart data for last 7 days with solo/group breakdown
  const last7Days = eachDayOfInterval({ start: subDays(now, 6), end: now });
  const chartData = last7Days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const daySessions = sessions?.filter((s) => format(new Date(s.date), "yyyy-MM-dd") === dayStr) || [];
    const soloMinutes = daySessions
      .filter((s) => s.sessionType !== "group")
      .reduce((sum, s) => sum + s.durationMinutes, 0);
    const groupMinutes = daySessions
      .filter((s) => s.sessionType === "group")
      .reduce((sum, s) => sum + s.durationMinutes, 0);
    return {
      day: format(day, "EEE"),
      solo: soloMinutes,
      group: groupMinutes,
    };
  });

  // Calculate solo vs group totals
  const soloSessions = sessions?.filter((s) => s.sessionType !== "group") || [];
  const groupSessions = sessions?.filter((s) => s.sessionType === "group") || [];
  const weekSoloMinutes = weekSessions.filter((s) => s.sessionType !== "group").reduce((sum, s) => sum + s.durationMinutes, 0);
  const weekGroupMinutes = weekSessions.filter((s) => s.sessionType === "group").reduce((sum, s) => sum + s.durationMinutes, 0);

  // Generate gym chart data for last 7 days
  const gymChartData = last7Days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayMinutes = gymSessions
      ?.filter((s) => format(new Date(s.date), "yyyy-MM-dd") === dayStr)
      .reduce((sum, s) => sum + s.durationMinutes, 0) || 0;
    return {
      day: format(day, "EEE"),
      minutes: dayMinutes,
    };
  });

  // Generate happiness chart data for last 7 days
  const happinessChartData = last7Days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const hasEntry = happinessEntries?.some((e) => e.date === dayStr) || false;
    return {
      day: format(day, "EEE"),
      completed: hasEntry ? 1 : 0,
    };
  });

  const upcomingExams = exams
    ?.filter((e) => new Date(e.examDate) >= new Date())
    .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())
    .slice(0, 3) || [];

  // Critical Tracking classes and GPA calculation
  const criticalTrackingClasses = classes?.filter((c) => c.criticalTracking) || [];
  const criticalTrackingGPA = calculateGPA(criticalTrackingClasses);
  const criticalTrackingStatus = getCriticalTrackingStatus(criticalTrackingGPA);

  return (
    <div className="min-h-screen">
      <Header title="Study Timer" />

      <main className="px-4 pb-24 safe-bottom">
        <p className="text-sm theme-text-muted my-4 italic" data-testid="text-coach-study">
          {getDailyCoachMessage()}
        </p>
        <Tabs defaultValue="timer">
          <TabsList className="grid w-full grid-cols-2 rounded-full">
            <TabsTrigger value="timer" className="rounded-full" data-testid="tab-timer">
              Timer
            </TabsTrigger>
            <TabsTrigger value="stats" className="rounded-full" data-testid="tab-stats">
              Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timer" className="mt-6">
            {/* Class Selection */}
            {inProgressClasses.length > 0 && (
              <GlassCard className="mb-6">
                <label className="text-sm text-muted-foreground mb-2 block">
                  Link to class (optional)
                </label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger data-testid="select-class">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No class</SelectItem>
                    {inProgressClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.courseName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </GlassCard>
            )}

            {/* Solo Timer (Pomodoro) - Students only */}
            {isStudent ? (
              <>
                <GlassCard className="py-8">
                  <div className="flex items-center justify-center gap-2 mb-4 text-blue-500">
                    <BookOpen className="w-5 h-5" />
                    <span className="font-medium">Solo Study (Pomodoro)</span>
                  </div>
                  <PomodoroTimer onSessionComplete={handleSessionComplete} />
                </GlassCard>

                {/* Study Group Timer */}
                <GlassCard className="py-6 mt-4">
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

            {/* Upcoming Exams */}
            {upcomingExams.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2 theme-text">
                  <Calendar className="w-4 h-4" />
                  Upcoming Exams
                </h3>
                <div className="space-y-2">
                  {upcomingExams.map((exam) => (
                    <GlassCard key={exam.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{exam.examName}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(exam.examDate), "EEEE, MMM d")}
                          </p>
                        </div>
                        <Badge variant={getDaysUntil(exam.examDate)}>
                          {getDaysUntilLabel(exam.examDate)}
                        </Badge>
                      </div>
                      {getExamCoachMessage(exam.examDate, exam.id) && (
                        <p className="text-xs text-muted-foreground/80 mt-2 italic" data-testid={`text-exam-coach-${exam.id}`}>
                          {getExamCoachMessage(exam.examDate, exam.id)}
                        </p>
                      )}
                    </GlassCard>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="mt-6 space-y-4">
            {/* Critical Tracking Section */}
            <GlassCard className="p-4" data-testid="section-critical-tracking">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold">Critical Tracking - Computer Engineering</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                These classes require special attention for program progression.
              </p>
              
              {criticalTrackingClasses.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3 p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm text-muted-foreground">Current GPA</p>
                      <p className="text-2xl font-bold" data-testid="text-critical-gpa">
                        {criticalTrackingGPA !== null ? criticalTrackingGPA.toFixed(2) : "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Required</p>
                      <p className="text-lg font-medium">2.50</p>
                    </div>
                    <CriticalTrackingStatusBadge status={criticalTrackingStatus} />
                  </div>
                  
                  <div className="space-y-2">
                    {criticalTrackingClasses.map((cls) => (
                      <div 
                        key={cls.id} 
                        className="flex items-center justify-between p-2 rounded-md bg-muted/30"
                        data-testid={`row-critical-class-${cls.id}`}
                      >
                        <span className="font-medium text-sm">{cls.courseName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{cls.credits} cr</span>
                          {cls.grade && (
                            <span className="text-sm font-medium">{cls.grade}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No classes marked as Critical Tracking yet.
                </p>
              )}
            </GlassCard>

            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={<Clock className="w-5 h-5" />}
                label="Today"
                value={`${todayMinutes}m`}
                color="blue"
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="This Week"
                value={`${Math.round(weekMinutes / 60 * 10) / 10}h`}
                color="green"
              />
            </div>

            <StatCard
              icon={<Calendar className="w-5 h-5" />}
              label="This Month"
              value={`${Math.round(monthMinutes / 60 * 10) / 10}h`}
              subtext={`${monthSessions.length} sessions`}
              color="default"
            />

            {/* Weekly Study Chart with Solo/Group breakdown */}
            <GlassCard className="p-4">
              <h3 className="font-semibold mb-2">Last 7 Days - Study Time</h3>
              <div className="flex items-center gap-4 mb-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-blue-500" />
                  Solo
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-green-500" />
                  Group
                </span>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 12 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      className="fill-muted-foreground"
                      tickFormatter={(v) => `${v}m`}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `${value} min`, 
                        name === "solo" ? "Solo Study" : "Group Study"
                      ]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="solo" 
                      stackId="study"
                      fill="#3b82f6"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar 
                      dataKey="group" 
                      stackId="study"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Recent Sessions */}
            <h3 className="font-semibold mt-6 mb-3 theme-text">Recent Sessions</h3>
            {sessions?.slice(0, 10).map((session) => (
              <GlassCard key={session.id} className="p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    session.sessionType === "group" 
                      ? "bg-green-500/20 text-green-500" 
                      : "bg-blue-500/20 text-blue-500"
                  }`}>
                    {session.sessionType === "group" ? (
                      <Users className="w-5 h-5" />
                    ) : (
                      <BookOpen className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">
                      {session.durationMinutes} minutes
                      <span className="text-xs text-muted-foreground ml-2">
                        {session.sessionType === "group" ? "Group" : "Solo"}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {format(new Date(session.date), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      data-testid={`button-delete-session-${session.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Session?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this {session.durationMinutes}-minute study session.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteSession(session.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </GlassCard>
            ))}

            {(!sessions || sessions.length === 0) && (
              <EmptyState
                icon={<Clock className="w-8 h-8" />}
                title="No study sessions yet"
                description="Start a Pomodoro timer to log your first session"
              />
            )}

            {/* Weekly Activity Overview */}
            <div className="mt-8" data-testid="section-weekly-activity">
              <h3 className="font-semibold mb-4 flex items-center gap-2 theme-text">
                <TrendingUp className="w-5 h-5" />
                Weekly Activity Overview
              </h3>

              {/* Gym/Movement Graph */}
              <GlassCard className="p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Dumbbell className="w-4 h-4 text-orange-500" />
                  <h4 className="font-medium text-sm">Movement Time</h4>
                </div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gymChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" tickFormatter={(v) => `${v}m`} />
                      <Tooltip 
                        formatter={(value: number) => [`${value} min`, "Movement"]}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="minutes" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* Happiness Completion Graph */}
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Smile className="w-4 h-4 text-pink-500" />
                  <h4 className="font-medium text-sm">Happiness Journal</h4>
                </div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={happinessChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" domain={[0, 1]} tickFormatter={(v) => v === 1 ? "Yes" : "No"} />
                      <Tooltip 
                        formatter={(value: number) => [value === 1 ? "Completed" : "Not completed", "Journal"]}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="completed" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}

function Badge({ variant, children }: { variant: "urgent" | "soon" | "normal"; children: React.ReactNode }) {
  const colors = {
    urgent: "bg-red-500/20 text-red-500",
    soon: "bg-yellow-500/20 text-yellow-500",
    normal: "bg-muted text-muted-foreground",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[variant]}`}>
      {children}
    </span>
  );
}

function getDaysUntil(date: Date | string): "urgent" | "soon" | "normal" {
  const days = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 2) return "urgent";
  if (days <= 7) return "soon";
  return "normal";
}

function getDaysUntilLabel(date: Date | string): string {
  const days = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}

function gradeToPoints(grade: string | null): number | null {
  if (!grade) return null;
  const gradeMap: Record<string, number> = {
    "A+": 4.0, "A": 4.0, "A-": 3.7,
    "B+": 3.3, "B": 3.0, "B-": 2.7,
    "C+": 2.3, "C": 2.0, "C-": 1.7,
    "D+": 1.3, "D": 1.0, "D-": 0.7,
    "F": 0.0
  };
  return gradeMap[grade.toUpperCase()] ?? null;
}

function calculateGPA(classes: StudentDataClass[]): number | null {
  const gradedClasses = classes.filter(c => c.grade && gradeToPoints(c.grade) !== null);
  if (gradedClasses.length === 0) return null;
  
  let totalPoints = 0;
  let totalCredits = 0;
  
  for (const cls of gradedClasses) {
    const points = gradeToPoints(cls.grade);
    if (points !== null) {
      totalPoints += points * cls.credits;
      totalCredits += cls.credits;
    }
  }
  
  return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : null;
}

function getCriticalTrackingStatus(gpa: number | null): "green" | "yellow" | "red" | "none" {
  if (gpa === null) return "none";
  if (gpa >= 2.5) return "green";
  if (gpa >= 2.0) return "yellow";
  return "red";
}

function CriticalTrackingStatusBadge({ status }: { status: "green" | "yellow" | "red" | "none" }) {
  const config = {
    green: { bg: "bg-green-500/20", text: "text-green-500", label: "On Track" },
    yellow: { bg: "bg-yellow-500/20", text: "text-yellow-500", label: "At Risk" },
    red: { bg: "bg-red-500/20", text: "text-red-500", label: "Below Minimum" },
    none: { bg: "bg-muted", text: "text-muted-foreground", label: "No Grades" },
  };
  
  const { bg, text, label } = config[status];
  
  return (
    <span 
      className={`px-3 py-1.5 rounded-full text-xs font-medium ${bg} ${text}`}
      data-testid="badge-critical-status"
    >
      {label}
    </span>
  );
}
