import { useState, useMemo } from "react";
import { useStudentData } from "@/lib/student-data-provider";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BottomNav } from "@/components/BottomNav";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks, startOfMonth, endOfMonth } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { 
  BarChart3, 
  BookOpen, 
  Dumbbell, 
  CheckSquare, 
  TrendingUp,
  Calendar,
  Clock,
  Target,
  Award,
  Smile,
  Droplets,
  Moon
} from "lucide-react";

export default function Statistics() {
  const { studentData } = useStudentData();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("week");

  const studySessions = studentData?.studySessions || [];
  const gymSessions = studentData?.gymSessions || [];
  const assignments = studentData?.assignments || [];
  const happinessEntries = studentData?.happinessEntries || [];
  const hydrationEntries = studentData?.hydrationEntries || [];
  const sleepEntries = studentData?.sleepEntries || [];
  const classes = studentData?.classes || [];
  const settings = studentData?.settings;

  // Date range calculation
  const dateRange = useMemo(() => {
    const today = new Date();
    if (timeRange === "week") {
      return { start: subDays(today, 6), end: today };
    } else if (timeRange === "month") {
      return { start: subDays(today, 29), end: today };
    }
    return { start: subDays(today, 89), end: today }; // 90 days for "all"
  }, [timeRange]);

  // Study data by day
  const studyByDay = useMemo(() => {
    const days = eachDayOfInterval(dateRange);
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const daySessions = studySessions.filter(s => 
        format(new Date(s.date), "yyyy-MM-dd") === dayStr
      );
      const totalMinutes = daySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
      const soloMinutes = daySessions.filter(s => s.sessionType === "solo").reduce((sum, s) => sum + s.durationMinutes, 0);
      const groupMinutes = daySessions.filter(s => s.sessionType === "group").reduce((sum, s) => sum + s.durationMinutes, 0);
      
      return {
        date: format(day, timeRange === "week" ? "EEE" : "MMM d"),
        fullDate: dayStr,
        total: totalMinutes,
        solo: soloMinutes,
        group: groupMinutes,
        sessions: daySessions.length
      };
    });
  }, [studySessions, dateRange, timeRange]);

  // Gym data by day
  const gymByDay = useMemo(() => {
    const days = eachDayOfInterval(dateRange);
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const daySessions = gymSessions.filter(s => 
        format(new Date(s.date), "yyyy-MM-dd") === dayStr
      );
      const totalMinutes = daySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
      
      return {
        date: format(day, timeRange === "week" ? "EEE" : "MMM d"),
        fullDate: dayStr,
        minutes: totalMinutes,
        sessions: daySessions.length
      };
    });
  }, [gymSessions, dateRange, timeRange]);

  // Assignments stats
  const assignmentStats = useMemo(() => {
    const completed = assignments.filter(a => a.completed).length;
    const pending = assignments.filter(a => !a.completed).length;
    const total = assignments.length;
    
    // Completed by priority
    const highPriority = assignments.filter(a => a.priority === "high");
    const medPriority = assignments.filter(a => a.priority === "medium");
    const lowPriority = assignments.filter(a => a.priority === "low");
    
    return {
      completed,
      pending,
      total,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      byPriority: [
        { name: "High", total: highPriority.length, completed: highPriority.filter(a => a.completed).length, color: "#ef4444" },
        { name: "Medium", total: medPriority.length, completed: medPriority.filter(a => a.completed).length, color: "#eab308" },
        { name: "Low", total: lowPriority.length, completed: lowPriority.filter(a => a.completed).length, color: "#22c55e" }
      ]
    };
  }, [assignments]);

  // Study by class
  const studyByClass = useMemo(() => {
    const classMap = new Map<string, number>();
    classMap.set("General", 0);
    
    classes.forEach(c => classMap.set(c.id, 0));
    
    studySessions.forEach(s => {
      const key = s.classId || "General";
      classMap.set(key, (classMap.get(key) || 0) + s.durationMinutes);
    });
    
    return Array.from(classMap.entries())
      .map(([id, minutes]) => ({
        name: id === "General" ? "General" : classes.find(c => c.id === id)?.courseName || "Unknown",
        minutes,
        hours: Math.round(minutes / 60 * 10) / 10
      }))
      .filter(c => c.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes);
  }, [studySessions, classes]);

  // Gym by type
  const gymByType = useMemo(() => {
    const typeMap = new Map<string, number>();
    
    gymSessions.forEach(s => {
      typeMap.set(s.type, (typeMap.get(s.type) || 0) + s.durationMinutes);
    });
    
    const colors: Record<string, string> = {
      gym: "#3b82f6",
      walk: "#22c55e",
      workout: "#8b5cf6",
      run: "#f97316",
      other: "#6b7280"
    };
    
    return Array.from(typeMap.entries()).map(([type, minutes]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      minutes,
      hours: Math.round(minutes / 60 * 10) / 10,
      color: colors[type] || colors.other
    }));
  }, [gymSessions]);

  // Overall stats
  const overallStats = useMemo(() => {
    const totalStudyMinutes = studySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const totalGymMinutes = gymSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const soloStudy = studySessions.filter(s => s.sessionType === "solo").reduce((sum, s) => sum + s.durationMinutes, 0);
    const groupStudy = studySessions.filter(s => s.sessionType === "group").reduce((sum, s) => sum + s.durationMinutes, 0);
    
    // Study streak calculation
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = format(subDays(today, i), "yyyy-MM-dd");
      const hasSession = studySessions.some(s => format(new Date(s.date), "yyyy-MM-dd") === checkDate);
      if (hasSession) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return {
      totalStudyHours: Math.round(totalStudyMinutes / 60 * 10) / 10,
      totalGymHours: Math.round(totalGymMinutes / 60 * 10) / 10,
      totalStudySessions: studySessions.length,
      totalGymSessions: gymSessions.length,
      soloStudyPercent: totalStudyMinutes > 0 ? Math.round((soloStudy / totalStudyMinutes) * 100) : 0,
      groupStudyPercent: totalStudyMinutes > 0 ? Math.round((groupStudy / totalStudyMinutes) * 100) : 0,
      studyStreak: streak,
      avgStudyPerDay: studySessions.length > 0 ? Math.round(totalStudyMinutes / 7) : 0, // weekly avg
      avgGymPerWeek: gymSessions.length > 0 ? Math.round(gymSessions.length / 4) : 0 // monthly avg
    };
  }, [studySessions, gymSessions]);

  // Sleep data
  const sleepByDay = useMemo(() => {
    const days = eachDayOfInterval(dateRange);
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const entry = sleepEntries.find(s => s.date === dayStr);
      
      return {
        date: format(day, timeRange === "week" ? "EEE" : "MMM d"),
        hours: entry?.hoursSlept || 0,
        quality: entry?.quality || 0
      };
    });
  }, [sleepEntries, dateRange, timeRange]);

  // Hydration data
  const hydrationByDay = useMemo(() => {
    const days = eachDayOfInterval(dateRange);
    const goal = settings?.dailyWaterGoal || 8;
    
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const entry = hydrationEntries.find(h => h.date === dayStr);
      
      return {
        date: format(day, timeRange === "week" ? "EEE" : "MMM d"),
        glasses: entry?.glasses || 0,
        goal
      };
    });
  }, [hydrationEntries, dateRange, timeRange, settings]);

  const COLORS = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#8b5cf6", "#f97316"];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Statistics</h1>
          </div>
          <div className="flex gap-1">
            <Button
              variant={timeRange === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeRange("week")}
            >
              Week
            </Button>
            <Button
              variant={timeRange === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeRange("month")}
            >
              Month
            </Button>
            <Button
              variant={timeRange === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeRange("all")}
            >
              90d
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <GlassCard className="text-center py-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Study</span>
            </div>
            <p className="text-2xl font-bold">{overallStats.totalStudyHours}h</p>
            <p className="text-xs text-muted-foreground">{overallStats.totalStudySessions} sessions</p>
          </GlassCard>
          
          <GlassCard className="text-center py-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Dumbbell className="w-4 h-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Gym</span>
            </div>
            <p className="text-2xl font-bold">{overallStats.totalGymHours}h</p>
            <p className="text-xs text-muted-foreground">{overallStats.totalGymSessions} sessions</p>
          </GlassCard>
          
          <GlassCard className="text-center py-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckSquare className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">Tasks</span>
            </div>
            <p className="text-2xl font-bold">{assignmentStats.completionRate}%</p>
            <p className="text-xs text-muted-foreground">{assignmentStats.completed}/{assignmentStats.total} done</p>
          </GlassCard>
          
          <GlassCard className="text-center py-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Award className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Streak</span>
            </div>
            <p className="text-2xl font-bold">{overallStats.studyStreak}</p>
            <p className="text-xs text-muted-foreground">days studying</p>
          </GlassCard>
        </div>

        <Tabs defaultValue="study" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="study" className="text-xs">
              <BookOpen className="w-3 h-3 mr-1" />
              Study
            </TabsTrigger>
            <TabsTrigger value="gym" className="text-xs">
              <Dumbbell className="w-3 h-3 mr-1" />
              Gym
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">
              <CheckSquare className="w-3 h-3 mr-1" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="wellness" className="text-xs">
              <Smile className="w-3 h-3 mr-1" />
              Wellness
            </TabsTrigger>
          </TabsList>

          {/* Study Tab */}
          <TabsContent value="study" className="space-y-4 mt-4">
            {/* Study Minutes Chart */}
            <GlassCard>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Study Time (minutes)
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studyByDay}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="solo" stackId="a" fill="#3b82f6" name="Solo" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="group" stackId="a" fill="#22c55e" name="Group" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-blue-500" />
                  <span>Solo ({overallStats.soloStudyPercent}%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-500" />
                  <span>Group ({overallStats.groupStudyPercent}%)</span>
                </div>
              </div>
            </GlassCard>

            {/* Study by Class */}
            {studyByClass.length > 0 && (
              <GlassCard>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Time by Class
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={studyByClass}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="minutes"
                        label={({ name, hours }) => `${name}: ${hours}h`}
                        labelLine={false}
                      >
                        {studyByClass.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            )}
          </TabsContent>

          {/* Gym Tab */}
          <TabsContent value="gym" className="space-y-4 mt-4">
            {/* Gym Minutes Chart */}
            <GlassCard>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Dumbbell className="w-4 h-4" />
                Workout Time (minutes)
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={gymByDay}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="minutes" 
                      stroke="#22c55e" 
                      fill="#22c55e" 
                      fillOpacity={0.3}
                      name="Minutes"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Gym by Type */}
            {gymByType.length > 0 && (
              <GlassCard>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Workout Types
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={gymByType}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="minutes"
                        label={({ name, hours }) => `${name}: ${hours}h`}
                        labelLine={false}
                      >
                        {gymByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            )}

            {/* Gym Stats */}
            <div className="grid grid-cols-2 gap-3">
              <GlassCard className="text-center py-3">
                <p className="text-2xl font-bold text-green-500">{overallStats.totalGymSessions}</p>
                <p className="text-xs text-muted-foreground">Total Workouts</p>
              </GlassCard>
              <GlassCard className="text-center py-3">
                <p className="text-2xl font-bold text-green-500">{overallStats.avgGymPerWeek}</p>
                <p className="text-xs text-muted-foreground">Avg/Week</p>
              </GlassCard>
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4 mt-4">
            {/* Completion Overview */}
            <GlassCard>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Assignment Completion
              </h3>
              
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-muted/30"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${assignmentStats.completionRate * 3.52} 352`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{assignmentStats.completionRate}%</span>
                    <span className="text-xs text-muted-foreground">Complete</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <p className="text-lg font-bold text-green-500">{assignmentStats.completed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <p className="text-lg font-bold text-orange-500">{assignmentStats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </GlassCard>

            {/* By Priority */}
            <GlassCard>
              <h3 className="font-semibold mb-4">By Priority</h3>
              <div className="space-y-3">
                {assignmentStats.byPriority.map(priority => (
                  <div key={priority.name} className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: priority.color }}
                    />
                    <span className="flex-1 text-sm">{priority.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {priority.completed}/{priority.total}
                    </span>
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full"
                        style={{ 
                          width: `${priority.total > 0 ? (priority.completed / priority.total) * 100 : 0}%`,
                          backgroundColor: priority.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </TabsContent>

          {/* Wellness Tab */}
          <TabsContent value="wellness" className="space-y-4 mt-4">
            {/* Sleep Chart */}
            <GlassCard>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Moon className="w-4 h-4" />
                Sleep Hours
              </h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sleepByDay}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 12]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="hours" fill="#8b5cf6" name="Hours" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Hydration Chart */}
            <GlassCard>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Droplets className="w-4 h-4" />
                Hydration (glasses)
              </h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hydrationByDay}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="glasses" fill="#3b82f6" name="Glasses" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Happiness Entries Count */}
            <GlassCard>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Smile className="w-4 h-4 text-yellow-500" />
                Gratitude Journal
              </h3>
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-yellow-500">{happinessEntries.length}</p>
                <p className="text-sm text-muted-foreground">Total entries</p>
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}
