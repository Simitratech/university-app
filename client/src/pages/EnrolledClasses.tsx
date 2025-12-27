import { useState } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { GlassCard } from "@/components/GlassCard";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useStudentData } from "@/lib/student-data-provider";
import { Plus, BookOpen, ChevronDown, ChevronUp, GraduationCap, Target, TrendingUp, Star, Trash2, Bell, Calendar, Pencil, Check, Loader2, Settings, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { StudentDataClass, StudentDataExam, StudentDataGradingCategory } from "@shared/schema";
import { format, differenceInDays, isPast, isToday } from "date-fns";

const MOTIVATIONAL_MESSAGES = [
  "You're still on track — consistency matters.",
  "One exam doesn't define the class. Adjust and move forward.",
  "Strong recovery is possible. Let's plan the next steps.",
  "Every step forward counts. Keep going!",
  "Progress, not perfection. You've got this!",
  "Stay focused on your goals. Small wins add up.",
  "Learning is a journey. Each exam teaches something new.",
  "Believe in your ability to improve. You can do this!",
];

function getMotivationalMessage(gradePercent: number | null, targetThreshold: string): string {
  if (gradePercent === null) return "Ready to start tracking your progress!";
  
  const thresholdValues: Record<string, number> = { A: 90, B: 80, C: 70 };
  const target = thresholdValues[targetThreshold] || 70;
  
  if (gradePercent >= target + 10) return "Excellent work! You're exceeding your goals!";
  if (gradePercent >= target) return "Great job! You're on track to pass with flying colors!";
  if (gradePercent >= target - 10) return MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * 3)];
  return MOTIVATIONAL_MESSAGES[3 + Math.floor(Math.random() * 5)];
}

function calculateGradeNeeded(
  currentWeightedSum: number,
  completedWeight: number,
  remainingWeight: number,
  targetPercent: number
): number | null {
  if (remainingWeight <= 0) return null;
  const needed = (targetPercent * 100 - currentWeightedSum) / remainingWeight;
  return Math.max(0, Math.min(100, needed));
}

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

export default function EnrolledClasses() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [isAddPending, setIsAddPending] = useState(false);

  const { studentData, isLoading, addClass } = useStudentData();

  const allClasses = studentData?.classes || [];
  const enrolledClasses = allClasses.filter((c) => c.status === "in_progress");

  const handleAddClass = async (data: Omit<StudentDataClass, "id">) => {
    try {
      setIsAddPending(true);
      await addClass(data);
      setIsAddOpen(false);
      toast({ title: "Class enrolled successfully" });
    } catch {
      toast({ title: "Failed to enroll in class", variant: "destructive" });
    } finally {
      setIsAddPending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Enrolled Classes" />
        <LoadingState />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Enrolled Classes" />

      <main className="px-4 pb-24 safe-bottom">
        <div className="my-6">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 theme-text" />
            <h2 className="text-lg font-semibold theme-text">Current Semester</h2>
            <Badge variant="outline" className="ml-auto">
              {enrolledClasses.length} classes
            </Badge>
          </div>

          {enrolledClasses.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-8 h-8" />}
              title="No enrolled classes"
              description="Add classes you're currently taking this semester"
              action={{ label: "Enroll in Class", onClick: () => setIsAddOpen(true) }}
            />
          ) : (
            <div className="space-y-4">
              {enrolledClasses.map((cls) => (
                <ClassCard
                  key={cls.id}
                  classData={cls}
                  isExpanded={expandedClass === cls.id}
                  onToggle={() => setExpandedClass(expandedClass === cls.id ? null : cls.id)}
                />
              ))}
            </div>
          )}
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button
              className="fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg"
              size="icon"
              data-testid="button-add-enrolled-class"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>Enroll in Class</DialogTitle>
              <DialogDescription>Add a class you're currently taking this semester</DialogDescription>
            </DialogHeader>
            <AddEnrolledClassForm
              onSubmit={handleAddClass}
              isLoading={isAddPending}
            />
          </DialogContent>
        </Dialog>
      </main>

      <BottomNav />
    </div>
  );
}

function ClassCard({
  classData,
  isExpanded,
  onToggle,
}: {
  classData: StudentDataClass;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { toast } = useToast();
  const { studentData, updateClass, deleteClass: deleteClassAction, addExam: addExamAction, updateExam: updateExamAction, deleteExam: deleteExamAction, addGradingCategory: addGradingCategoryAction, updateGradingCategory: updateGradingCategoryAction, deleteGradingCategory: deleteGradingCategoryAction } = useStudentData();
  
  const classId = classData?.id;
  
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDeleteClass = async () => {
    try {
      setIsDeleting(true);
      await deleteClassAction(classId);
      toast({ title: "Class deleted" });
    } catch {
      toast({ title: "Failed to delete class", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const exams = studentData?.exams.filter(e => e.classId === classId) || [];
  const categories = studentData?.gradingCategories.filter(c => c.classId === classId) || [];

  const [isGradingSetupOpen, setIsGradingSetupOpen] = useState(false);

  if (!classData || !classId) {
    return null;
  }

  const completedExams = exams?.filter((e) => e.gradePercent !== null) || [];
  const pendingExams = exams?.filter((e) => e.gradePercent === null) || [];

  // Calculate grade per category and overall grade
  const calculateCategoryGrade = (categoryId: string) => {
    const categoryExams = exams?.filter(e => e.categoryId === categoryId) || [];
    const gradedExams = categoryExams.filter(e => e.gradePercent !== null);
    if (gradedExams.length === 0) return null;
    const totalWeight = gradedExams.reduce((sum, e) => sum + (e.weight || 0), 0);
    if (totalWeight === 0) return null;
    const weightedSum = gradedExams.reduce((sum, e) => sum + (e.gradePercent || 0) * (e.weight || 0), 0);
    return weightedSum / totalWeight;
  };

  const calculateOverallGrade = () => {
    if (!categories || categories.length === 0) return null;
    let totalWeight = 0;
    let weightedSum = 0;
    for (const cat of categories) {
      const catGrade = calculateCategoryGrade(cat.id);
      if (catGrade !== null) {
        weightedSum += catGrade * cat.weight;
        totalWeight += cat.weight;
      }
    }
    if (totalWeight === 0) return null;
    return weightedSum / totalWeight;
  };

  const calculateProjectedGrade = () => {
    if (!categories || categories.length === 0) return null;
    const currentGrade = calculateOverallGrade();
    if (currentGrade === null) return null;
    
    let completedWeight = 0;
    for (const cat of categories || []) {
      const catGrade = calculateCategoryGrade(cat.id);
      if (catGrade !== null) {
        completedWeight += cat.weight;
      }
    }
    
    if (completedWeight >= 100) return currentGrade;
    // Project remaining grades at current average
    return currentGrade;
  };

  const overallGrade = calculateOverallGrade();
  const projectedGrade = calculateProjectedGrade();
  const hasCategories = categories && categories.length > 0;
  const totalCategoryWeight = categories?.reduce((sum, c) => sum + c.weight, 0) || 0;
  
  const completedWeight = completedExams.reduce((sum, e) => sum + (e.weight || 0), 0);
  const remainingWeight = pendingExams.reduce((sum, e) => sum + (e.weight || 0), 0);
  const currentWeightedSum = completedExams.reduce((sum, e) => sum + (e.gradePercent || 0) * (e.weight || 0) / 100, 0);
  
  const currentGrade = completedWeight > 0 ? (currentWeightedSum / completedWeight) * 100 : null;
  const status = getGradeStatus(currentGrade, classData.passingThreshold || "C");
  const message = getMotivationalMessage(currentGrade, classData.passingThreshold || "C");

  const gradeTargets = [
    { letter: "A", percent: 90 },
    { letter: "B", percent: 80 },
    { letter: "C", percent: 70 },
  ];

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <GlassCard className="overflow-visible">
        <CollapsibleTrigger className="w-full text-left p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{classData.courseName}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {classData.credits} credits
                </Badge>
                {classData.semester && (
                  <Badge variant="outline" className="text-xs">
                    {classData.semester}
                  </Badge>
                )}
                {classData.instructor && (
                  <span className="text-xs text-muted-foreground">
                    {classData.instructor}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xl font-bold">
                  {(hasCategories ? overallGrade : currentGrade) !== null 
                    ? `${(hasCategories ? overallGrade : currentGrade)!.toFixed(1)}%` 
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">current grade</p>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground">
                Target: {classData.passingThreshold || "C"} or better
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`absolute left-0 top-0 h-full rounded-full transition-all ${statusColors[status]}`}
                style={{ width: `${Math.min(100, currentGrade || 0)}%` }}
              />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
            {/* Class Grade Bar */}
            {hasCategories && (
              <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Current Grade</p>
                    <p className="text-2xl font-bold">
                      {overallGrade !== null ? `${overallGrade.toFixed(1)}%` : "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Projected</p>
                    <p className="text-lg font-semibold text-muted-foreground">
                      {projectedGrade !== null ? `${projectedGrade.toFixed(1)}%` : "—"}
                    </p>
                  </div>
                </div>
                <div className="relative h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full rounded-full transition-all ${
                      overallGrade !== null
                        ? overallGrade >= 90 ? "bg-green-500"
                        : overallGrade >= 80 ? "bg-yellow-500"
                        : overallGrade >= 70 ? "bg-orange-500"
                        : "bg-red-500"
                        : "bg-muted-foreground/30"
                    }`}
                    style={{ width: `${Math.min(100, overallGrade || 0)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>F</span><span>D</span><span>C</span><span>B</span><span>A</span>
                </div>
              </div>
            )}

            {/* Grading Structure Setup */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Grading Structure</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); setIsGradingSetupOpen(true); }}
                  data-testid={`button-setup-grading-${classId}`}
                >
                  {hasCategories ? "Edit" : "Setup"}
                </Button>
              </div>
              
              {hasCategories ? (
                <div className="flex flex-wrap gap-2">
                  {categories?.map(cat => (
                    <Badge key={cat.id} variant="secondary" className="text-xs">
                      {cat.name}: {cat.weight}%
                    </Badge>
                  ))}
                  {totalCategoryWeight !== 100 && (
                    <Badge variant="destructive" className="text-xs">
                      Total: {totalCategoryWeight}% (must be 100%)
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Set up your grading categories (Exams, Assignments, etc.) to track your grade accurately.
                </p>
              )}
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
              <Star className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm">{message}</p>
            </div>

            {remainingWeight > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">What do I need to pass?</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {gradeTargets.map((target) => {
                    const needed = calculateGradeNeeded(
                      currentWeightedSum,
                      completedWeight,
                      remainingWeight,
                      target.percent
                    );
                    const isPossible = needed !== null && needed <= 100;
                    return (
                      <div
                        key={target.letter}
                        className={`p-2 rounded-lg text-center ${
                          isPossible ? "bg-muted/50" : "bg-muted/20 opacity-50"
                        }`}
                      >
                        <p className="text-lg font-bold">{target.letter}</p>
                        <p className="text-xs text-muted-foreground">
                          {isPossible && needed !== null
                            ? `Need ${needed.toFixed(0)}%`
                            : "Not possible"}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Average needed on remaining {remainingWeight.toFixed(0)}% of grade
                </p>
              </div>
            )}

            {classId && <ExamsList classId={classId} exams={exams || []} categories={categories || []} />}

            {/* Grading Structure Setup Dialog */}
            <Dialog open={isGradingSetupOpen} onOpenChange={setIsGradingSetupOpen}>
              <DialogContent className="glass-card max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Grading Structure</DialogTitle>
                  <DialogDescription>
                    Define how your final grade is calculated. Weights must total 100%.
                  </DialogDescription>
                </DialogHeader>
                <GradingStructureForm 
                  classId={classId} 
                  existingCategories={categories || []}
                  onClose={() => setIsGradingSetupOpen(false)}
                />
              </DialogContent>
            </Dialog>

            <div className="pt-2 border-t border-border/50">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="w-full" data-testid={`button-delete-class-${classId}`}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Class
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Class?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{classData?.courseName || 'this class'}" and all associated exams. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteClass}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CollapsibleContent>
      </GlassCard>
    </Collapsible>
  );
}

function InlineScoreInput({ 
  examId, 
  classId, 
  currentScore,
  currentGradePercent,
  maxScore 
}: { 
  examId: string; 
  classId: string; 
  currentScore: number | null;
  currentGradePercent: number | null;
  maxScore: number | null;
}) {
  const { toast } = useToast();
  const { updateExam } = useStudentData();
  const effectiveMax = maxScore || 100;
  const [scoreValue, setScoreValue] = useState<string>(() => 
    currentScore !== null ? currentScore.toString() : ""
  );
  const [maxValue, setMaxValue] = useState<string>(() => 
    effectiveMax.toString()
  );
  const [isEditing, setIsEditing] = useState(currentScore === null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const numScore = parseFloat(scoreValue);
    const numMax = parseFloat(maxValue) || 100;
    if (!isNaN(numScore) && numScore >= 0) {
      const gradePercent = Math.round((numScore / numMax) * 1000) / 10;
      try {
        setIsSaving(true);
        await updateExam(examId, { 
          score: numScore, 
          maxScore: numMax, 
          gradePercent 
        });
        setIsEditing(false);
        toast({ title: "Score saved" });
      } catch {
        toast({ title: "Failed to save score", variant: "destructive" });
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (!isEditing && currentScore !== null) {
    const displayPercent = currentGradePercent !== null 
      ? currentGradePercent 
      : (currentScore / effectiveMax) * 100;
    return (
      <div 
        className="flex items-center gap-1 cursor-pointer hover-elevate rounded px-2 py-1"
        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
        data-testid={`score-display-${examId}`}
      >
        <span className="text-lg font-bold">{currentScore}/{effectiveMax}</span>
        <span className="text-xs text-muted-foreground">({displayPercent.toFixed(0)}%)</span>
        <Pencil className="w-3 h-3 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <Input
        type="number"
        value={scoreValue}
        onChange={(e) => setScoreValue(e.target.value)}
        placeholder="--"
        className="w-14 h-8 text-center text-sm"
        min={0}
        data-testid={`input-score-${examId}`}
      />
      <span className="text-xs text-muted-foreground">/</span>
      <Input
        type="number"
        value={maxValue}
        onChange={(e) => setMaxValue(e.target.value)}
        placeholder="100"
        className="w-14 h-8 text-center text-sm"
        min={1}
        data-testid={`input-maxscore-${examId}`}
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleSave}
        disabled={isSaving || !scoreValue}
        data-testid={`button-save-score-${examId}`}
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Check className="w-4 h-4 text-green-500" />
        )}
      </Button>
    </div>
  );
}

function GradingStructureForm({
  classId,
  existingCategories,
  onClose,
}: {
  classId: string;
  existingCategories: StudentDataGradingCategory[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const { addGradingCategory, updateGradingCategory, deleteGradingCategory } = useStudentData();
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Array<{ id?: string; name: string; weight: number }>>(() => 
    existingCategories.length > 0 
      ? existingCategories.map(c => ({ id: c.id, name: c.name, weight: c.weight }))
      : [
          { name: "Exams", weight: 40 },
          { name: "Assignments", weight: 40 },
          { name: "Participation", weight: 20 },
        ]
  );

  const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0);
  const isValid = totalWeight === 100;

  const handleSave = async () => {
    if (!isValid) {
      toast({ title: "Weights must total 100%", variant: "destructive" });
      return;
    }

    try {
      setIsSaving(true);
      // Delete removed categories
      const keepIds = new Set(categories.filter(c => c.id).map(c => c.id));
      for (const existingCat of existingCategories) {
        if (!keepIds.has(existingCat.id)) {
          await deleteGradingCategory(existingCat.id);
        }
      }

      // Create or update categories
      for (const cat of categories) {
        if (cat.id) {
          await updateGradingCategory(cat.id, { name: cat.name, weight: cat.weight });
        } else {
          await addGradingCategory({ classId, name: cat.name, weight: cat.weight });
        }
      }

      toast({ title: "Grading structure saved" });
      onClose();
    } catch (error) {
      toast({ title: "Failed to save grading structure", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const addCategory = () => {
    setCategories([...categories, { name: "", weight: 0 }]);
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const updateCategory = (index: number, field: "name" | "weight", value: string | number) => {
    setCategories(categories.map((cat, i) => 
      i === index ? { ...cat, [field]: field === "weight" ? Number(value) : value } : cat
    ));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {categories.map((cat, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={cat.name}
              onChange={(e) => updateCategory(index, "name", e.target.value)}
              placeholder="Category name"
              className="flex-1"
              data-testid={`input-category-name-${index}`}
            />
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={cat.weight}
                onChange={(e) => updateCategory(index, "weight", e.target.value)}
                className="w-16 text-center"
                min={0}
                max={100}
                data-testid={`input-category-weight-${index}`}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeCategory(index)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              data-testid={`button-remove-category-${index}`}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addCategory} className="w-full" data-testid="button-add-category">
        <Plus className="w-4 h-4 mr-2" />
        Add Category
      </Button>

      <div className={`p-2 rounded-lg text-center ${isValid ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
        <p className="text-sm font-medium">
          Total: {totalWeight}% {isValid ? "(Valid)" : "(Must equal 100%)"}
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={!isValid || isSaving}
          className="flex-1"
          data-testid="button-save-grading-structure"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Save Structure
        </Button>
      </div>
    </div>
  );
}

function ExamsList({ classId, exams, categories }: { classId: string; exams: StudentDataExam[]; categories: StudentDataGradingCategory[] }) {
  const { toast } = useToast();
  const { addExam, updateExam, deleteExam: deleteExamAction } = useStudentData();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<StudentDataExam | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleAddExam = async (data: Omit<StudentDataExam, "id">) => {
    try {
      setIsAdding(true);
      await addExam(data);
      setIsAddOpen(false);
      toast({ title: "Exam added" });
    } catch {
      toast({ title: "Failed to add exam", variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateExam = async (id: string, data: Partial<StudentDataExam>) => {
    try {
      setIsUpdating(true);
      await updateExam(id, data);
      setEditingExam(null);
      toast({ title: "Grade recorded" });
    } catch {
      toast({ title: "Failed to update exam", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteExam = async (examId: string) => {
    try {
      setIsDeleting(examId);
      await deleteExamAction(examId);
      toast({ title: "Exam deleted" });
    } catch {
      toast({ title: "Failed to delete exam", variant: "destructive" });
    } finally {
      setIsDeleting(null);
    }
  };

  const getExamReminder = (examDate: Date) => {
    const today = new Date();
    const examDay = new Date(examDate);
    
    if (isPast(examDay) && !isToday(examDay)) {
      return { text: "Past", variant: "secondary" as const };
    }
    if (isToday(examDay)) {
      return { text: "Today!", variant: "destructive" as const };
    }
    
    const daysUntil = differenceInDays(examDay, today);
    if (daysUntil <= 3) {
      return { text: `${daysUntil}d left`, variant: "destructive" as const };
    }
    if (daysUntil <= 7) {
      return { text: `${daysUntil}d left`, variant: "default" as const };
    }
    return { text: `${daysUntil}d`, variant: "outline" as const };
  };

  // Group exams by category
  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Uncategorized";
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : "Uncategorized";
  };

  const groupedExams = categories.length > 0
    ? categories.map(cat => ({
        category: cat,
        items: exams.filter(e => e.categoryId === cat.id),
      }))
    : [{ category: null, items: exams }];

  const uncategorizedExams = exams.filter(e => !e.categoryId && categories.length > 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">Graded Items</span>
        <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)} data-testid="button-add-exam">
          <Plus className="w-4 h-4 mr-1" />
          Add Item
        </Button>
      </div>

      {exams.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No items added yet. Add exams, assignments, and other graded items.
        </p>
      ) : (
        <div className="space-y-4">
          {groupedExams.map(({ category, items }) => {
            if (items.length === 0 && category) return null;
            const catGrade = category ? (() => {
              const gradedItems = items.filter(e => e.gradePercent !== null);
              if (gradedItems.length === 0) return null;
              const totalWeight = gradedItems.reduce((sum, e) => sum + (e.weight || 0), 0);
              if (totalWeight === 0) return null;
              const weightedSum = gradedItems.reduce((sum, e) => sum + (e.gradePercent || 0) * (e.weight || 0), 0);
              return weightedSum / totalWeight;
            })() : null;

            return (
              <div key={category?.id || "uncategorized"} className="space-y-2">
                {category && (
                  <div className="flex items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {category.name}
                      </span>
                      <Badge variant="outline" className="text-[10px]">{category.weight}%</Badge>
                    </div>
                    {catGrade !== null && (
                      <span className="text-sm font-medium">{catGrade.toFixed(1)}%</span>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  {items.map((exam) => {
                    const reminder = exam.gradePercent === null ? getExamReminder(new Date(exam.examDate)) : null;
                    return (
                      <div
                        key={exam.id}
                        className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/30"
                        data-testid={`exam-${exam.id}`}
                      >
                        <div 
                          className="flex-1 min-w-0 cursor-pointer hover-elevate rounded-md p-1 -m-1"
                          onClick={() => setEditingExam(exam)}
                        >
                          <p className="font-medium truncate">{exam.examName}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(exam.examDate), "MMM d, yyyy")}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                            <span>{exam.weight || 0}% weight</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {reminder && exam.gradePercent === null && (
                            <Badge variant={reminder.variant} className="text-xs">
                              <Bell className="w-3 h-3 mr-1" />
                              {reminder.text}
                            </Badge>
                          )}
                          <InlineScoreInput
                            key={`${exam.id}-${exam.score}-${exam.maxScore}`}
                            examId={exam.id}
                            classId={classId}
                            currentScore={exam.score}
                            currentGradePercent={exam.gradePercent}
                            maxScore={exam.maxScore}
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={(e) => e.stopPropagation()}
                                data-testid={`button-delete-exam-${exam.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Item?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{exam.examName}". This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteExam(exam.id)}
                                  disabled={isDeleting === exam.id}
                                >
                                  {isDeleting === exam.id ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {uncategorizedExams.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                Uncategorized
              </span>
              <div className="space-y-2">
                {uncategorizedExams.map((exam) => {
                  const reminder = exam.gradePercent === null ? getExamReminder(new Date(exam.examDate)) : null;
                  return (
                    <div
                      key={exam.id}
                      className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/30"
                      data-testid={`exam-${exam.id}`}
                    >
                      <div 
                        className="flex-1 min-w-0 cursor-pointer hover-elevate rounded-md p-1 -m-1"
                        onClick={() => setEditingExam(exam)}
                      >
                        <p className="font-medium truncate">{exam.examName}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(exam.examDate), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {reminder && exam.gradePercent === null && (
                          <Badge variant={reminder.variant} className="text-xs">
                            <Bell className="w-3 h-3 mr-1" />
                            {reminder.text}
                          </Badge>
                        )}
                        <InlineScoreInput
                          key={`${exam.id}-${exam.score}-${exam.maxScore}`}
                          examId={exam.id}
                          classId={classId}
                          currentScore={exam.score}
                          currentGradePercent={exam.gradePercent}
                          maxScore={exam.maxScore}
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`button-delete-exam-${exam.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Item?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{exam.examName}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteExam(exam.id)}
                                disabled={isDeleting === exam.id}
                              >
                                {isDeleting === exam.id ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Add Exam</DialogTitle>
          </DialogHeader>
          <ExamForm
            classId={classId}
            categories={categories}
            onSubmit={handleAddExam}
            isLoading={isAdding}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingExam} onOpenChange={() => setEditingExam(null)}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Update Grade</DialogTitle>
          </DialogHeader>
          {editingExam && (
            <GradeEntryForm
              exam={editingExam}
              onSubmit={(data) => handleUpdateExam(editingExam.id, data)}
              isLoading={isUpdating}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddEnrolledClassForm({
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
    instructor: "",
    passingThreshold: "C",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      courseName: formData.courseName,
      credits: formData.credits,
      semester: formData.semester || null,
      instructor: formData.instructor || null,
      passingThreshold: formData.passingThreshold,
      status: "in_progress",
      grade: null,
      gpa: null,
      criticalTracking: false,
      estimatedCompletionDate: null,
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
          placeholder="e.g. Introduction to Psychology"
          required
          data-testid="input-enrolled-course-name"
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
            onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
            required
            data-testid="input-enrolled-credits"
          />
        </div>
        <div>
          <Label htmlFor="semester">Semester</Label>
          <Input
            id="semester"
            value={formData.semester}
            onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
            placeholder="Spring 2025"
            data-testid="input-enrolled-semester"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="instructor">Instructor (Optional)</Label>
        <Input
          id="instructor"
          value={formData.instructor}
          onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
          placeholder="Prof. Smith"
          data-testid="input-enrolled-instructor"
        />
      </div>

      <div>
        <Label htmlFor="passingThreshold">Minimum Grade to Pass</Label>
        <Select
          value={formData.passingThreshold}
          onValueChange={(v) => setFormData({ ...formData, passingThreshold: v })}
        >
          <SelectTrigger data-testid="select-passing-threshold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A">A (90%+)</SelectItem>
            <SelectItem value="B">B (80%+)</SelectItem>
            <SelectItem value="C">C (70%+)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full rounded-full" disabled={isLoading} data-testid="button-submit-enrolled-class">
        {isLoading ? "Enrolling..." : "Enroll in Class"}
      </Button>
    </form>
  );
}

function ExamForm({
  classId,
  categories,
  onSubmit,
  isLoading,
}: {
  classId: string;
  categories: StudentDataGradingCategory[];
  onSubmit: (data: Omit<StudentDataExam, "id">) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    examName: "",
    examDate: format(new Date(), "yyyy-MM-dd"),
    weight: 20,
    notes: "",
    categoryId: categories.length > 0 ? categories[0].id : "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      examName: formData.examName,
      classId,
      examDate: new Date(formData.examDate),
      notes: formData.notes || null,
      categoryId: formData.categoryId || null,
      weight: formData.weight,
      grade: null,
      gradePercent: null,
      score: null,
      maxScore: 100,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="examName">Item Name</Label>
        <Input
          id="examName"
          value={formData.examName}
          onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
          placeholder="e.g. Midterm Exam, Assignment 1"
          required
          data-testid="input-exam-name"
        />
      </div>

      {categories.length > 0 && (
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.categoryId}
            onValueChange={(v) => setFormData({ ...formData, categoryId: v })}
          >
            <SelectTrigger data-testid="select-exam-category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name} ({cat.weight}%)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="examDate">Date</Label>
          <Input
            id="examDate"
            type="date"
            value={formData.examDate}
            onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
            required
            data-testid="input-exam-date"
          />
        </div>
        <div>
          <Label htmlFor="weight">Weight within category (%)</Label>
          <Input
            id="weight"
            type="number"
            min={1}
            max={100}
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
            required
            data-testid="input-exam-weight"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Any notes about this item..."
          className="resize-none"
          rows={2}
          data-testid="input-exam-notes"
        />
      </div>

      <Button type="submit" className="w-full rounded-full" disabled={isLoading} data-testid="button-submit-exam">
        {isLoading ? "Adding..." : "Add Item"}
      </Button>
    </form>
  );
}

function GradeEntryForm({
  exam,
  onSubmit,
  isLoading,
}: {
  exam: StudentDataExam;
  onSubmit: (data: Partial<StudentDataExam>) => void;
  isLoading: boolean;
}) {
  const [gradePercent, setGradePercent] = useState(exam.gradePercent?.toString() || "");
  const [notes, setNotes] = useState(exam.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const percent = parseFloat(gradePercent);
    let letterGrade = "";
    if (percent >= 90) letterGrade = "A";
    else if (percent >= 80) letterGrade = "B";
    else if (percent >= 70) letterGrade = "C";
    else if (percent >= 60) letterGrade = "D";
    else letterGrade = "F";

    onSubmit({
      gradePercent: percent,
      grade: letterGrade,
      notes: notes || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center pb-2">
        <p className="font-semibold">{exam.examName}</p>
        <p className="text-sm text-muted-foreground">
          {format(new Date(exam.examDate), "MMMM d, yyyy")} • {exam.weight}% of grade
        </p>
      </div>

      <div>
        <Label htmlFor="gradePercent">Your Score (%)</Label>
        <Input
          id="gradePercent"
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={gradePercent}
          onChange={(e) => setGradePercent(e.target.value)}
          placeholder="85"
          required
          className="text-2xl font-bold text-center"
          data-testid="input-grade-percent"
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Reflections on this exam..."
          className="resize-none"
          rows={2}
          data-testid="input-grade-notes"
        />
      </div>

      <Button type="submit" className="w-full rounded-full" disabled={isLoading} data-testid="button-submit-grade">
        {isLoading ? "Saving..." : "Record Grade"}
      </Button>
    </form>
  );
}
