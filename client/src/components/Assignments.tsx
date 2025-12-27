import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Plus, Calendar, CheckCircle2, Circle, Trash2, AlertTriangle } from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";
import type { StudentDataAssignment, StudentDataClass } from "@shared/schema";

interface AssignmentsProps {
  assignments: StudentDataAssignment[];
  classes: StudentDataClass[];
  isStudent: boolean;
  addAssignment: (assignment: Omit<StudentDataAssignment, "id">) => Promise<void>;
  updateAssignment: (id: string, updates: Partial<StudentDataAssignment>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
}

export function Assignments({ 
  assignments, 
  classes, 
  isStudent, 
  addAssignment, 
  updateAssignment, 
  deleteAssignment 
}: AssignmentsProps) {
  const { toast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending");

  const filteredAssignments = assignments
    .filter(a => {
      if (filter === "pending") return !a.completed;
      if (filter === "completed") return a.completed;
      return true;
    })
    .sort((a, b) => {
      // Sort by: completed status, then by due date
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  const pendingCount = assignments.filter(a => !a.completed).length;
  const overdueCount = assignments.filter(a => !a.completed && isPast(new Date(a.dueDate))).length;

  const handleToggleComplete = async (assignment: StudentDataAssignment) => {
    if (!isStudent) return;
    try {
      await updateAssignment(assignment.id, { completed: !assignment.completed });
      toast({ title: assignment.completed ? "Marked as pending" : "Marked as complete! 🎉" });
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const getClassName = (classId: string | null) => {
    if (!classId) return null;
    return classes.find(c => c.id === classId)?.courseName || null;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      default: return "bg-green-500";
    }
  };

  const getDueLabel = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days < 0) return { label: "Overdue", color: "text-red-500 bg-red-500/20" };
    if (days === 0) return { label: "Today", color: "text-red-500 bg-red-500/20" };
    if (days === 1) return { label: "Tomorrow", color: "text-yellow-500 bg-yellow-500/20" };
    if (days <= 3) return { label: `${days} days`, color: "text-yellow-500 bg-yellow-500/20" };
    return { label: `${days} days`, color: "text-muted-foreground bg-muted" };
  };

  return (
    <div>
      {/* Header Stats */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Assignments
          </h3>
          <p className="text-sm text-muted-foreground">
            {pendingCount} pending
            {overdueCount > 0 && <span className="text-red-500 ml-1">({overdueCount} overdue)</span>}
          </p>
        </div>
        {isStudent && (
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {(["pending", "completed", "all"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8" />}
          title={filter === "completed" ? "No completed assignments" : "No assignments"}
          description={filter === "pending" ? "You're all caught up!" : "Add assignments to track"}
        />
      ) : (
        <div className="space-y-3">
          {filteredAssignments.map((assignment) => {
            const dueInfo = getDueLabel(assignment.dueDate);
            const className = getClassName(assignment.classId);
            
            return (
              <GlassCard key={assignment.id} className={`p-4 ${assignment.completed ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  {isStudent && (
                    <button 
                      onClick={() => handleToggleComplete(assignment)}
                      className="mt-0.5"
                    >
                      {assignment.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
                      )}
                    </button>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-medium ${assignment.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {assignment.title}
                        </p>
                        {className && (
                          <p className="text-xs text-muted-foreground">{className}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(assignment.priority)}`} />
                        <span className={`text-xs px-2 py-0.5 rounded ${dueInfo.color}`}>
                          {dueInfo.label}
                        </span>
                      </div>
                    </div>
                    
                    {assignment.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {assignment.description}
                      </p>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      Due: {format(new Date(assignment.dueDate), "EEE, MMM d 'at' h:mm a")}
                    </p>
                  </div>

                  {/* Delete Button */}
                  {isStudent && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{assignment.title}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              await deleteAssignment(assignment.id);
                              toast({ title: "Assignment deleted" });
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
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Add Assignment Dialog */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Add Assignment</DialogTitle>
          </DialogHeader>
          <AddAssignmentForm 
            classes={classes}
            onClose={() => setShowAddModal(false)} 
            addAssignment={addAssignment} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add Assignment Form
interface AddAssignmentFormProps {
  classes: StudentDataClass[];
  onClose: () => void;
  addAssignment: (assignment: Omit<StudentDataAssignment, "id">) => Promise<void>;
}

function AddAssignmentForm({ classes, onClose, addAssignment }: AddAssignmentFormProps) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    classId: "",
    dueDate: format(new Date(), "yyyy-MM-dd"),
    dueTime: "23:59",
    priority: "medium",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    try {
      setIsPending(true);
      await addAssignment({
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        classId: formData.classId || null,
        dueDate: `${formData.dueDate}T${formData.dueTime}:00`,
        completed: false,
        priority: formData.priority,
      });
      toast({ title: "Assignment added!" });
      onClose();
    } catch {
      toast({ title: "Failed to add assignment", variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  const inProgressClasses = classes.filter(c => c.status === "in_progress");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Title *</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Chapter 5 Homework"
          required
        />
      </div>

      <div>
        <Label>Class (optional)</Label>
        <Select value={formData.classId} onValueChange={(v) => setFormData({ ...formData, classId: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select a class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No class</SelectItem>
            {inProgressClasses.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>{cls.courseName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Due Date *</Label>
          <Input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Due Time</Label>
          <Input
            type="time"
            value={formData.dueTime}
            onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label>Priority</Label>
        <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">🟢 Low</SelectItem>
            <SelectItem value="medium">🟡 Medium</SelectItem>
            <SelectItem value="high">🔴 High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Description (optional)</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Additional notes..."
          rows={2}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending || !formData.title.trim()}>
        {isPending ? "Adding..." : "Add Assignment"}
      </Button>
    </form>
  );
}
