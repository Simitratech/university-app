import { useState } from "react";
import { useStudentData } from "@/lib/student-data-provider";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, differenceInHours, isPast, isToday, isTomorrow } from "date-fns";
import { 
  BookOpen, 
  Plus, 
  Clock, 
  Users, 
  User, 
  AlertTriangle,
  CheckCircle,
  Bell,
  FileText,
  GraduationCap,
  TrendingUp,
  Trash2
} from "lucide-react";

export default function Study() {
  const { toast } = useToast();
  const { 
    studentData, 
    addStudySession,
    deleteStudySession,
    updateAssignment
  } = useStudentData();
  
  const [showLogModal, setShowLogModal] = useState(false);
  const [minutes, setMinutes] = useState("25");
  const [sessionType, setSessionType] = useState<"solo" | "group">("solo");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const classes = studentData?.classes || [];
  const exams = studentData?.exams || [];
  const assignments = studentData?.assignments || [];
  const studySessions = studentData?.studySessions || [];
  const settings = studentData?.settings;

  // Get upcoming exams (next 14 days)
  const upcomingExams = exams
    .filter(e => {
      const examDate = new Date(e.examDate);
      const daysUntil = differenceInDays(examDate, new Date());
      return daysUntil >= 0 && daysUntil <= 14;
    })
    .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());

  // Get upcoming assignments (not completed, due within 7 days)
  const upcomingAssignments = assignments
    .filter(a => {
      if (a.completed) return false;
      const dueDate = new Date(a.dueDate);
      const daysUntil = differenceInDays(dueDate, new Date());
      return daysUntil <= 7;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Calculate study stats
  const todaySessions = studySessions.filter(s => 
    format(new Date(s.date), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
  );
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const dailyGoal = settings?.dailyStudyGoalMinutes || 60;
  const goalProgress = Math.min(100, (todayMinutes / dailyGoal) * 100);

  // Weekly stats
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekSessions = studySessions.filter(s => new Date(s.date) >= weekStart);
  const weekMinutes = weekSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const weekHours = Math.round(weekMinutes / 60 * 10) / 10;

  // Recent sessions (last 10)
  const recentSessions = [...studySessions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const handleLogSession = async () => {
    const mins = parseInt(minutes);
    if (isNaN(mins) || mins <= 0) {
      toast({ title: "Enter valid minutes", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await addStudySession({
        classId: selectedClass || null,
        durationMinutes: mins,
        sessionType,
        focusDuration: mins,
        breakDuration: 0,
      });
      toast({ title: `${mins} minutes logged!`, description: sessionType === "group" ? "Group study session" : "Solo study session" });
      setShowLogModal(false);
      setMinutes("25");
      setSessionType("solo");
      setSelectedClass("");
    } catch {
      toast({ title: "Failed to log session", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteStudySession(id);
      toast({ title: "Session deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const handleToggleAssignment = async (assignment: typeof assignments[0]) => {
    try {
      await updateAssignment(assignment.id, { completed: !assignment.completed });
      toast({ title: assignment.completed ? "Marked incomplete" : "Marked complete!" });
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const getExamUrgency = (examDate: Date) => {
    const days = differenceInDays(examDate, new Date());
    if (days <= 1) return "destructive";
    if (days <= 3) return "warning";
    return "secondary";
  };

  const getAssignmentUrgency = (dueDate: Date) => {
    if (isPast(dueDate) && !isToday(dueDate)) return "destructive";
    if (isToday(dueDate)) return "destructive";
    if (isTomorrow(dueDate)) return "warning";
    return "secondary";
  };

  const formatTimeUntil = (date: Date) => {
    const days = differenceInDays(date, new Date());
    
    if (isPast(date) && !isToday(date)) return "OVERDUE";
    if (isToday(date)) return "TODAY";
    if (isTomorrow(date)) return "Tomorrow";
    if (days === 1) return "1 day";
    return `${days} days`;
  };

  const getClassName = (classId: string | null) => {
    if (!classId) return "General";
    const cls = classes.find(c => c.id === classId);
    return cls?.courseName || "Unknown";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Study</h1>
          </div>
          <Button onClick={() => setShowLogModal(true)} size="sm" data-testid="button-log-study">
            <Plus className="w-4 h-4 mr-1" />
            Log Session
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Today's Progress */}
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Today's Progress</h3>
            </div>
            <span className="text-sm text-muted-foreground">{weekHours}h this week</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>{todayMinutes} min studied</span>
                <span className="text-muted-foreground">Goal: {dailyGoal} min</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${goalProgress >= 100 ? 'bg-green-500' : 'bg-primary'}`}
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
            </div>
            {goalProgress >= 100 && (
              <CheckCircle className="w-8 h-8 text-green-500" />
            )}
          </div>
        </GlassCard>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <GlassCard className="text-center py-4">
            <p className="text-3xl font-bold text-primary">{todaySessions.length}</p>
            <p className="text-sm text-muted-foreground">Sessions Today</p>
          </GlassCard>
          <GlassCard className="text-center py-4">
            <p className="text-3xl font-bold text-primary">{weekSessions.length}</p>
            <p className="text-sm text-muted-foreground">This Week</p>
          </GlassCard>
        </div>

        <Tabs defaultValue="reminders" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reminders" className="flex items-center gap-1">
              <Bell className="w-4 h-4" />
              Reminders
              {(upcomingExams.length + upcomingAssignments.length) > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {upcomingExams.length + upcomingAssignments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reminders" className="space-y-4 mt-4">
            {/* Exam Reminders */}
            <GlassCard>
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold">Upcoming Exams</h3>
              </div>
              
              {upcomingExams.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No exams in the next 2 weeks 🎉
                </p>
              ) : (
                <div className="space-y-2">
                  {upcomingExams.map(exam => {
                    const examDate = new Date(exam.examDate);
                    const urgency = getExamUrgency(examDate);
                    const daysUntil = differenceInDays(examDate, new Date());
                    
                    return (
                      <div 
                        key={exam.id} 
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          daysUntil <= 1 ? 'bg-red-500/20 border border-red-500/50' :
                          daysUntil <= 3 ? 'bg-yellow-500/20 border border-yellow-500/50' :
                          'bg-muted/50'
                        }`}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{exam.examName}</p>
                          <p className="text-sm text-muted-foreground">
                            {getClassName(exam.classId)} • {format(examDate, "EEE, MMM d")}
                          </p>
                        </div>
                        <Badge variant={urgency as any}>
                          {daysUntil <= 1 && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {formatTimeUntil(examDate)}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>

            {/* Assignment Reminders */}
            <GlassCard>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold">Assignments Due</h3>
              </div>
              
              {upcomingAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No assignments due soon ✅
                </p>
              ) : (
                <div className="space-y-2">
                  {upcomingAssignments.map(assignment => {
                    const dueDate = new Date(assignment.dueDate);
                    const urgency = getAssignmentUrgency(dueDate);
                    
                    return (
                      <div 
                        key={assignment.id} 
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          isPast(dueDate) && !isToday(dueDate) ? 'bg-red-500/20 border border-red-500/50' :
                          isToday(dueDate) ? 'bg-red-500/20 border border-red-500/50' :
                          isTomorrow(dueDate) ? 'bg-yellow-500/20 border border-yellow-500/50' :
                          'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <button
                            onClick={() => handleToggleAssignment(assignment)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              assignment.completed 
                                ? 'bg-green-500 border-green-500' 
                                : 'border-muted-foreground'
                            }`}
                          >
                            {assignment.completed && <CheckCircle className="w-4 h-4 text-white" />}
                          </button>
                          <div>
                            <p className={`font-medium ${assignment.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {assignment.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {assignment.classId ? getClassName(assignment.classId) : "General"}
                            </p>
                          </div>
                        </div>
                        <Badge variant={urgency as any}>
                          {(isPast(dueDate) && !isToday(dueDate)) && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {formatTimeUntil(dueDate)}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            <GlassCard>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Recent Sessions</h3>
              </div>
              
              {recentSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No study sessions yet. Tap "Log Session" to start!
                </p>
              ) : (
                <div className="space-y-2">
                  {recentSessions.map(session => (
                    <div 
                      key={session.id} 
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {session.sessionType === "group" ? (
                          <Users className="w-5 h-5 text-blue-500" />
                        ) : (
                          <User className="w-5 h-5 text-primary" />
                        )}
                        <div>
                          <p className="font-medium">{session.durationMinutes} minutes</p>
                          <p className="text-sm text-muted-foreground">
                            {getClassName(session.classId)} • {format(new Date(session.date), "EEE, MMM d")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {session.sessionType === "group" ? "Group" : "Solo"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteSession(session.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />

      {/* Log Session Modal */}
      <Dialog open={showLogModal} onOpenChange={setShowLogModal}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Log Study Session
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Duration */}
            <div>
              <Label>How many minutes did you study?</Label>
              <Input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="25"
                min="1"
                max="480"
                className="mt-1"
                data-testid="input-study-minutes"
              />
            </div>

            {/* Session Type */}
            <div>
              <Label>Session Type</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  variant={sessionType === "solo" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setSessionType("solo")}
                >
                  <User className="w-4 h-4 mr-2" />
                  Solo
                </Button>
                <Button
                  type="button"
                  variant={sessionType === "group" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setSessionType("group")}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Group
                </Button>
              </div>
            </div>

            {/* Class Selection */}
            <div>
              <Label>Class (optional)</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Study</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.courseName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogSession} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Log Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
