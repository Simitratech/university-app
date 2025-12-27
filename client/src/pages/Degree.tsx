import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { GlassCard } from "@/components/GlassCard";
import { DegreeProgressPie, DegreeProgressLegend } from "@/components/DegreeProgress";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useStudentData } from "@/lib/student-data-provider";
import { Plus, BookOpen, Check, Clock, AlertCircle, X, Trash2, Target, GraduationCap, AlertTriangle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getDailyCoachMessage } from "@/lib/coach-messages";
import type { Class, InsertClass, UserSettings, StudentDataClass } from "@shared/schema";

type ClassStatus = "in_progress" | "remaining" | "completed";

function getStatusOrder(status: string): number {
  switch (status) {
    case "in_progress": return 0;
    case "remaining": return 1;
    case "completed": return 2;
    default: return 3;
  }
}

function sortClasses(classes: StudentDataClass[]): StudentDataClass[] {
  return [...classes].sort((a, b) => {
    // Critical classes always first
    if (a.criticalTracking && !b.criticalTracking) return -1;
    if (!a.criticalTracking && b.criticalTracking) return 1;
    // Then sort by status order
    return getStatusOrder(a.status || "in_progress") - getStatusOrder(b.status || "in_progress");
  });
}

function calculateOverallGpa(classes: StudentDataClass[]): number {
  if (!classes || classes.length === 0) return 0;
  
  const classesWithGpa = classes.filter(
    (c) => c.gpa !== null && c.gpa !== undefined
  );
  
  if (classesWithGpa.length === 0) return 0;
  
  let totalPoints = 0;
  let totalCredits = 0;
  
  for (const cls of classesWithGpa) {
    const gpaValue = cls.gpa ?? 0;
    const credits = cls.credits ?? 0;
    totalPoints += gpaValue * credits;
    totalCredits += credits;
  }
  
  return totalCredits > 0 ? totalPoints / totalCredits : 0;
}

export default function Degree() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [localTargetGpa, setLocalTargetGpa] = useState<string>("");
  const [isAddPending, setIsAddPending] = useState(false);
  const [isUpdatePending, setIsUpdatePending] = useState(false);
  const [isDeletePending, setIsDeletePending] = useState(false);
  const [isSettingsPending, setIsSettingsPending] = useState(false);

  const { studentData, isLoading, addClass, updateClass, deleteClass, updateSettings } = useStudentData();

  const classes = studentData?.classes || [];
  const settings = studentData?.settings;

  const handleAddClass = async (data: Omit<StudentDataClass, "id">) => {
    try {
      setIsAddPending(true);
      await addClass(data);
      setIsAddOpen(false);
      toast({ title: "Class added successfully" });
    } catch {
      toast({ title: "Failed to add class", variant: "destructive" });
    } finally {
      setIsAddPending(false);
    }
  };

  const handleUpdateClass = async (id: string, data: Partial<StudentDataClass>) => {
    try {
      setIsUpdatePending(true);
      await updateClass(id, data);
      toast({ title: "Class updated" });
    } catch {
      toast({ title: "Failed to update class", variant: "destructive" });
    } finally {
      setIsUpdatePending(false);
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      setIsDeletePending(true);
      await deleteClass(id);
      toast({ title: "Class removed" });
    } catch {
      toast({ title: "Failed to delete class", variant: "destructive" });
    } finally {
      setIsDeletePending(false);
    }
  };

  const handleUpdateSettings = async (data: Partial<typeof settings>) => {
    try {
      setIsSettingsPending(true);
      await updateSettings(data as any);
      toast({ title: "Target GPA updated" });
    } catch {
      toast({ title: "Failed to update settings", variant: "destructive" });
    } finally {
      setIsSettingsPending(false);
    }
  };

  // Use persisted status from database
  const completedClasses = classes?.filter((c) => c.status === "completed") || [];
  const inProgressClasses = classes?.filter((c) => c.status === "in_progress" || !c.status) || [];
  const remainingClasses = classes?.filter((c) => c.status === "remaining") || [];
  const criticalTrackingClasses = classes?.filter((c) => c.criticalTracking) || [];

  // Sort all classes for display
  const sortedClasses = sortClasses(classes || []);

  const completedCredits = completedClasses.reduce((sum, c) => sum + (c.credits ?? 0), 0);
  const inProgressCredits = inProgressClasses.reduce((sum, c) => sum + (c.credits ?? 0), 0);
  const remainingCredits = remainingClasses.reduce((sum, c) => sum + (c.credits ?? 0), 0);
  const total = settings?.totalCreditsRequired || 60;
  const remaining = Math.max(0, total - completedCredits - inProgressCredits);

  const overallGpa = calculateOverallGpa(classes || []);
  const targetGpa = settings?.targetGpa || 3.5;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <Check className="w-4 h-4" />;
      case "in_progress":
        return <Clock className="w-4 h-4" />;
      case "failed":
        return <X className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      case "in_progress":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case "remaining":
        return "bg-red-500/20 text-red-500 border-red-500/30";
      default:
        return "bg-muted text-muted-foreground border-muted";
    }
  };

  const getCardBackgroundColor = (cls: StudentDataClass) => {
    // Critical classes get orange background (override)
    if (cls.criticalTracking) {
      return "bg-orange-500/10 dark:bg-orange-500/15 border-orange-500/30";
    }
    // Otherwise based on status
    switch (cls.status) {
      case "completed":
        return "bg-green-500/10 dark:bg-green-500/15 border-green-500/30";
      case "in_progress":
        return "bg-yellow-500/10 dark:bg-yellow-500/15 border-yellow-500/30";
      case "remaining":
        return "bg-red-500/10 dark:bg-red-500/15 border-red-500/30";
      default:
        return "bg-yellow-500/10 dark:bg-yellow-500/15 border-yellow-500/30";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Degree Progress" />
        <LoadingState />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Degree Progress" />

      <main className="px-4 pb-24 safe-bottom">
        <p className="text-sm theme-text-muted my-4 italic" data-testid="text-coach-degree">
          {getDailyCoachMessage()}
        </p>
        <GlassCard className="mb-6">
          <div className="flex flex-col items-center">
            <DegreeProgressPie
              completed={completedCredits}
              inProgress={inProgressCredits}
              remaining={remaining}
              total={total}
            />
            <DegreeProgressLegend
              completed={completedCredits}
              inProgress={inProgressCredits}
              remaining={remaining}
              total={total}
            />
          </div>
        </GlassCard>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Overall GPA</span>
            </div>
            <p className={`text-2xl font-bold ${overallGpa >= targetGpa ? "text-green-500" : "text-foreground"}`}>
              {overallGpa.toFixed(2)}
            </p>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Target GPA</span>
            </div>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="4.0"
              value={localTargetGpa || targetGpa.toString()}
              onChange={(e) => setLocalTargetGpa(e.target.value)}
              onBlur={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value >= 0 && value <= 4.0) {
                  handleUpdateSettings({ targetGpa: value });
                }
                setLocalTargetGpa("");
              }}
              className="text-2xl font-bold h-auto py-0 px-0 border-0 bg-transparent focus-visible:ring-0 w-20"
              data-testid="input-target-gpa"
            />
          </GlassCard>
        </div>

        {/* Class counts summary */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="text-orange-500 border-orange-500">
            {criticalTrackingClasses.length} Critical
          </Badge>
          <Badge variant="outline" className="text-yellow-500 border-yellow-500">
            {inProgressClasses.length} In Progress
          </Badge>
          <Badge variant="outline" className="text-red-500 border-red-500">
            {remainingClasses.length} Remaining
          </Badge>
          <Badge variant="outline" className="text-green-500 border-green-500">
            {completedClasses.length} Completed
          </Badge>
        </div>

        {/* All classes sorted: Critical first, then In Progress, Remaining, Completed */}
        {sortedClasses.length > 0 && (
          <div className="space-y-3 mb-6">
            {sortedClasses.map((cls) => (
              <ClassCard
                key={cls.id}
                cls={cls}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                getCardBackgroundColor={getCardBackgroundColor}
                onUpdate={handleUpdateClass}
                onDelete={handleDeleteClass}
              />
            ))}
          </div>
        )}

        {(!classes || classes.length === 0) && (
          <EmptyState
            icon={<BookOpen className="w-8 h-8" />}
            title="No classes yet"
            description="Add your first class to start tracking your degree progress"
            action={{ label: "Add Class", onClick: () => setIsAddOpen(true) }}
          />
        )}

        {isStudent && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button
                className="fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg"
                size="icon"
                data-testid="button-add-class"
              >
                <Plus className="w-6 h-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle>Add Class</DialogTitle>
              </DialogHeader>
              <AddClassForm
                onSubmit={handleAddClass}
                isLoading={isAddPending}
              />
            </DialogContent>
          </Dialog>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function ClassCard({
  cls,
  getStatusIcon,
  getStatusColor,
  getCardBackgroundColor,
  onUpdate,
  onDelete,
}: {
  cls: StudentDataClass;
  getStatusIcon: (status: string) => JSX.Element;
  getStatusColor: (status: string) => string;
  getCardBackgroundColor: (cls: StudentDataClass) => string;
  onUpdate: (id: string, data: Partial<StudentDataClass>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [localGpa, setLocalGpa] = useState<string>(cls?.gpa?.toString() ?? "");

  useEffect(() => {
    setLocalGpa(cls?.gpa?.toString() ?? "");
  }, [cls?.gpa]);

  if (!cls || !cls.id) {
    return null;
  }

  const status = cls.status || "in_progress";
  const isRemaining = status === "remaining";
  const isCompleted = status === "completed";
  const needsGpaWarning = isCompleted && (cls.gpa === null || cls.gpa === undefined);
  const isCriticalWarning = cls.criticalTracking && cls.gpa !== null && cls.gpa !== undefined && cls.gpa < 2.5;
  const cardBgClass = getCardBackgroundColor(cls);

  const handleGpaBlur = () => {
    const trimmed = localGpa.trim();
    if (trimmed === "") {
      onUpdate(cls.id, { gpa: null });
      return;
    }
    const value = parseFloat(trimmed);
    if (!isNaN(value) && value >= 0 && value <= 4.0) {
      onUpdate(cls.id, { gpa: value });
    } else {
      setLocalGpa(cls.gpa?.toString() ?? "");
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case "completed": return "Completed";
      case "in_progress": return "In Progress";
      case "remaining": return "Remaining";
      default: return "Unknown";
    }
  };

  return (
    <GlassCard 
      className={`p-4 border ${cardBgClass}`} 
      hover
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold truncate">{cls.courseName ?? "Untitled Class"}</p>
            {cls.criticalTracking && (
              <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 text-xs">
                Critical
              </Badge>
            )}
            <Badge className={`text-xs ${getStatusColor(status)}`}>
              {getStatusIcon(status)}
              <span className="ml-1">{getStatusLabel(status)}</span>
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {cls.credits ?? 0} credits
            </Badge>
            {cls.semester && (
              <Badge variant="outline" className="text-xs">
                {cls.semester}
              </Badge>
            )}
          </div>
          {isCriticalWarning && (
            <div className="flex items-center gap-1 mt-2 text-yellow-500 text-xs">
              <AlertTriangle className="w-3 h-3" />
              <span>Critical GPA below requirement (2.5)</span>
            </div>
          )}
          {needsGpaWarning && (
            <div className="flex items-center gap-1 mt-2 text-amber-500 text-xs">
              <AlertCircle className="w-3 h-3" />
              <span>Please enter GPA for completed class</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">GPA:</span>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="4.0"
              value={localGpa}
              onChange={(e) => setLocalGpa(e.target.value)}
              onBlur={handleGpaBlur}
              disabled={isRemaining}
              className={`w-16 h-8 text-sm px-2 ${isRemaining ? "opacity-50 cursor-not-allowed" : ""}`}
              placeholder={isRemaining ? "N/A" : "--"}
              data-testid={`input-gpa-${cls.id}`}
            />
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-muted-foreground"
                data-testid={`button-delete-class-${cls.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Class?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{cls.courseName ?? "this class"}" and all associated data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(cls.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </GlassCard>
  );
}

function AddClassForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (data: Omit<StudentDataClass, "id">) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    courseName: "",
    credits: 3,
    semester: "",
    status: "in_progress" as ClassStatus,
    criticalTracking: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      courseName: formData.courseName,
      credits: formData.credits,
      semester: formData.semester || null,
      status: formData.status,
      gpa: null,
      criticalTracking: formData.criticalTracking,
      estimatedCompletionDate: null,
      grade: null,
      instructor: null,
      passingThreshold: "C",
      currentGradePercent: null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="courseName">Course Name</Label>
        <Input
          id="courseName"
          value={formData.courseName}
          onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
          placeholder="e.g. Calculus I"
          required
          data-testid="input-course-name"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="credits">Credits</Label>
          <Input
            id="credits"
            type="number"
            min={1}
            max={6}
            value={formData.credits}
            onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 3 })}
            required
            data-testid="input-credits"
          />
        </div>
        <div>
          <Label htmlFor="semester">Semester</Label>
          <Input
            id="semester"
            value={formData.semester}
            onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
            placeholder="Fall 2024"
            data-testid="input-semester"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value: ClassStatus) => setFormData({ ...formData, status: value })}
        >
          <SelectTrigger data-testid="select-status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="remaining">Remaining</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="criticalTracking"
          checked={formData.criticalTracking}
          onCheckedChange={(checked) => setFormData({ ...formData, criticalTracking: checked })}
          data-testid="switch-critical-tracking"
        />
        <Label htmlFor="criticalTracking">Critical Tracking Class</Label>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-submit-class">
        {isLoading ? "Adding..." : "Add Class"}
      </Button>
    </form>
  );
}
