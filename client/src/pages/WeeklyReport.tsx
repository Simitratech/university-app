import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { GlassCard } from "@/components/GlassCard";
import { LoadingState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, BookOpen, Clock, Target, TrendingUp, Heart, Dumbbell, Star, Download } from "lucide-react";
import { format, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { jsPDF } from "jspdf";
import { useStudentData } from "@/lib/student-data-provider";
import type { StudentDataClass, StudentDataExam } from "@shared/schema";

function getGradeStatus(gradePercent: number | null, threshold: string): "green" | "yellow" | "red" {
  if (gradePercent === null) return "yellow";
  const thresholdValues: Record<string, number> = { A: 90, B: 80, C: 70 };
  const target = thresholdValues[threshold] || 70;
  
  if (gradePercent >= target) return "green";
  if (gradePercent >= target - 10) return "yellow";
  return "red";
}

const statusColors = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
};

const statusText = {
  green: "On Track",
  yellow: "At Risk",
  red: "Needs Attention",
};

interface ReportData {
  weekStart: Date;
  weekEnd: Date;
  enrolledClasses: StudentDataClass[];
  exams: StudentDataExam[];
  completedExamsThisWeek: StudentDataExam[];
  upcomingExamsThisWeek: StudentDataExam[];
  totalStudyHours: number;
  remainingMinutes: number;
  studySessionCount: number;
  gymSessionCount: number;
  totalGymMinutes: number;
  happinessCount: number;
}

function generatePDF(data: ReportData) {
  const doc = new jsPDF();
  let y = 20;
  const lineHeight = 7;
  const margin = 20;
  
  doc.setFontSize(20);
  doc.text("University App - Weekly Report", margin, y);
  y += lineHeight * 2;
  
  doc.setFontSize(12);
  doc.text(`Week of ${format(data.weekStart, "MMM d")} - ${format(data.weekEnd, "MMM d, yyyy")}`, margin, y);
  y += lineHeight * 2;

  doc.setFontSize(14);
  doc.text("Enrolled Classes", margin, y);
  y += lineHeight;
  
  doc.setFontSize(10);
  if (data.enrolledClasses.length === 0) {
    doc.text("No enrolled classes", margin + 5, y);
    y += lineHeight;
  } else {
    data.enrolledClasses.forEach((cls) => {
      const classExams = data.exams.filter((e) => e.classId === cls.id);
      const completedExams = classExams.filter((e) => e.gradePercent !== null);
      const completedWeight = completedExams.reduce((sum, e) => sum + (e.weight || 0), 0);
      const currentWeightedSum = completedExams.reduce(
        (sum, e) => sum + (e.gradePercent || 0) * (e.weight || 0) / 100,
        0
      );
      const currentGrade = completedWeight > 0 ? (currentWeightedSum / completedWeight) * 100 : null;
      const gradeText = currentGrade !== null ? `${currentGrade.toFixed(1)}%` : "—";
      
      doc.text(`• ${cls.courseName} (${cls.credits} credits): ${gradeText}`, margin + 5, y);
      y += lineHeight;
    });
  }
  y += lineHeight;

  doc.setFontSize(14);
  doc.text("Exams This Week", margin, y);
  y += lineHeight;
  
  doc.setFontSize(10);
  if (data.completedExamsThisWeek.length > 0) {
    doc.text("Completed:", margin + 5, y);
    y += lineHeight;
    data.completedExamsThisWeek.forEach((exam) => {
      doc.text(`  • ${exam.examName}: ${exam.gradePercent}%`, margin + 5, y);
      y += lineHeight;
    });
  }
  
  if (data.upcomingExamsThisWeek.length > 0) {
    doc.text("Upcoming:", margin + 5, y);
    y += lineHeight;
    data.upcomingExamsThisWeek.forEach((exam) => {
      doc.text(`  • ${exam.examName} (${format(new Date(exam.examDate), "MMM d")})`, margin + 5, y);
      y += lineHeight;
    });
  }
  
  if (data.completedExamsThisWeek.length === 0 && data.upcomingExamsThisWeek.length === 0) {
    doc.text("No exams this week", margin + 5, y);
    y += lineHeight;
  }
  y += lineHeight;

  doc.setFontSize(14);
  doc.text("Study Summary", margin, y);
  y += lineHeight;
  
  doc.setFontSize(10);
  doc.text(`Total study time: ${data.totalStudyHours}h ${data.remainingMinutes}m (${data.studySessionCount} sessions)`, margin + 5, y);
  y += lineHeight * 2;

  doc.setFontSize(14);
  doc.text("Wellness", margin, y);
  y += lineHeight;
  
  doc.setFontSize(10);
  doc.text(`Movement: ${data.gymSessionCount} sessions (${data.totalGymMinutes} min)`, margin + 5, y);
  y += lineHeight;
  doc.text(`Happiness entries: ${data.happinessCount}`, margin + 5, y);

  doc.save(`weekly-report-${format(data.weekStart, "yyyy-MM-dd")}.pdf`);
}

export default function WeeklyReport() {
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  const { studentData, isLoading } = useStudentData();

  const classes = studentData?.classes || [];
  const exams = studentData?.exams || [];
  const allStudySessions = studentData?.studySessions || [];
  const allGymSessions = studentData?.gymSessions || [];
  const happiness = studentData?.happinessEntries || [];

  const enrolledClasses = classes.filter((c) => c.status === "in_progress");
  
  const weeklyExams = exams.filter((e) => {
    const examDate = new Date(e.examDate);
    return isWithinInterval(examDate, { start: weekStart, end: weekEnd });
  });

  const completedExamsThisWeek = weeklyExams.filter((e) => e.gradePercent !== null);
  const upcomingExamsThisWeek = weeklyExams.filter((e) => e.gradePercent === null);

  const studySessions = allStudySessions.filter((s) => {
    const d = new Date(s.date);
    return isWithinInterval(d, { start: weekStart, end: weekEnd });
  });

  const gymSessions = allGymSessions.filter((s) => {
    const d = new Date(s.date);
    return isWithinInterval(d, { start: weekStart, end: weekEnd });
  });

  const totalStudyMinutes = studySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalStudyHours = Math.floor(totalStudyMinutes / 60);
  const remainingMinutes = totalStudyMinutes % 60;

  const totalGymMinutes = gymSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const gymSessionCount = gymSessions.length;

  const weeklyHappiness = happiness.filter((h) => {
    const entryDate = new Date(h.date);
    return isWithinInterval(entryDate, { start: weekStart, end: weekEnd });
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Weekly Report" />
        <LoadingState />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Weekly Report" />

      <main className="px-4 pb-24 safe-bottom">
        <div className="my-6 space-y-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 theme-text" />
              <h2 className="text-lg font-semibold theme-text">
                Week of {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
              </h2>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => generatePDF({
                weekStart,
                weekEnd,
                enrolledClasses,
                exams: exams || [],
                completedExamsThisWeek,
                upcomingExamsThisWeek,
                totalStudyHours,
                remainingMinutes,
                studySessionCount: studySessions?.length || 0,
                gymSessionCount,
                totalGymMinutes,
                happinessCount: weeklyHappiness.length,
              })}
              data-testid="button-export-pdf"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>

          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Enrolled Classes</h3>
              <Badge variant="outline" className="ml-auto">
                {enrolledClasses.length} classes
              </Badge>
            </div>

            {enrolledClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No enrolled classes this semester
              </p>
            ) : (
              <div className="space-y-3">
                {enrolledClasses.map((cls) => {
                  const classExams = exams?.filter((e) => e.classId === cls.id) || [];
                  const completedExams = classExams.filter((e) => e.gradePercent !== null);
                  const completedWeight = completedExams.reduce((sum, e) => sum + (e.weight || 0), 0);
                  const currentWeightedSum = completedExams.reduce(
                    (sum, e) => sum + (e.gradePercent || 0) * (e.weight || 0) / 100,
                    0
                  );
                  const currentGrade = completedWeight > 0 ? (currentWeightedSum / completedWeight) * 100 : null;
                  const status = getGradeStatus(currentGrade, cls.passingThreshold || "C");

                  return (
                    <div key={cls.id} className="p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{cls.courseName}</p>
                          <p className="text-xs text-muted-foreground">
                            {cls.credits} credits • {cls.semester || "Current"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {currentGrade !== null ? `${currentGrade.toFixed(1)}%` : "—"}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${statusColors[status].replace("bg-", "text-")}`}
                          >
                            {statusText[status]}
                          </Badge>
                        </div>
                      </div>
                      <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`absolute left-0 top-0 h-full rounded-full ${statusColors[status]}`}
                          style={{ width: `${Math.min(100, currentGrade || 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Exams This Week</h3>
            </div>

            {weeklyExams.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No exams scheduled this week
              </p>
            ) : (
              <div className="space-y-3">
                {completedExamsThisWeek.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Completed</p>
                    <div className="space-y-2">
                      {completedExamsThisWeek.map((exam) => (
                        <div key={exam.id} className="flex items-center justify-between p-2 rounded-lg bg-green-500/10">
                          <div>
                            <p className="font-medium text-sm">{exam.examName}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(exam.examDate), "EEEE, MMM d")}
                            </p>
                          </div>
                          <p className="font-bold text-green-500">{exam.gradePercent}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {upcomingExamsThisWeek.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Upcoming</p>
                    <div className="space-y-2">
                      {upcomingExamsThisWeek.map((exam) => (
                        <div key={exam.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium text-sm">{exam.examName}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(exam.examDate), "EEEE, MMM d")}
                            </p>
                          </div>
                          <Badge variant="outline">{exam.weight}%</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Study Time Summary</h3>
            </div>

            <div className="flex items-center justify-center py-4">
              <div className="text-center">
                <p className="text-4xl font-bold">
                  {totalStudyHours}h {remainingMinutes}m
                </p>
                <p className="text-sm text-muted-foreground">
                  across {studySessions?.length || 0} sessions
                </p>
              </div>
            </div>
          </GlassCard>

          <div className="grid grid-cols-2 gap-4">
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Movement</span>
              </div>
              <p className="text-2xl font-bold">{gymSessionCount}</p>
              <p className="text-xs text-muted-foreground">
                sessions ({totalGymMinutes} min)
              </p>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Happiness</span>
              </div>
              <p className="text-2xl font-bold">{weeklyHappiness.length}</p>
              <p className="text-xs text-muted-foreground">entries this week</p>
            </GlassCard>
          </div>

          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Weekly Motivation</h3>
            </div>

            <div className="p-4 rounded-lg bg-primary/10 text-center">
              <p className="text-sm italic">
                {enrolledClasses.length > 0
                  ? "You're making progress every day. Keep showing up and putting in the work!"
                  : "Ready to start your academic journey? Enroll in your classes to begin tracking."}
              </p>
            </div>
          </GlassCard>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
