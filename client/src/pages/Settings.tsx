import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/lib/theme-provider";
import { useUniversityTheme, UNIVERSITY_THEMES, type UniversityTheme } from "@/lib/university-theme";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useStudentData } from "@/lib/student-data-provider";
import { format } from "date-fns";
import { 
  Moon, 
  Sun, 
  LogOut, 
  GraduationCap, 
  Clock, 
  Dumbbell,
  DollarSign,
  Shield,
  HelpCircle,
  ChevronRight,
  Palette,
  Calendar,
  Archive,
  Plus,
  Droplets,
  Target,
  Edit2
} from "lucide-react";
import type { AppProfile, Semester, SemesterArchive } from "@shared/schema";

export default function Settings() {
  const { user, logout } = useAuth();
  const isStudent = user?.role === "student";
  const { theme, toggleTheme } = useTheme();
  const { universityTheme, setUniversityTheme } = useUniversityTheme();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [showNewSemesterModal, setShowNewSemesterModal] = useState(false);
  const [showArchivesModal, setShowArchivesModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [newSemesterName, setNewSemesterName] = useState("");

  const { studentData, updateSettings } = useStudentData();
  const settings = studentData?.settings;

  const { data: appProfile } = useQuery<AppProfile | null>({
    queryKey: ["/api/profile"],
  });

  const { data: activeSemester } = useQuery<Semester | null>({
    queryKey: ["/api/semesters/active"],
  });

  const { data: archives } = useQuery<SemesterArchive[]>({
    queryKey: ["/api/semester-archives"],
  });

  const createSemesterMutation = useMutation({
    mutationFn: (data: { name: string; startDate: string }) => 
      apiRequest("POST", "/api/semesters", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/semesters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/semesters/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/semester-archives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study-sessions/week"] });
      setShowNewSemesterModal(false);
      setNewSemesterName("");
      toast({ title: "New semester started!" });
    },
  });

  const getInitials = () => {
    if (appProfile?.name) {
      const parts = appProfile.name.split(" ");
      return parts.map(p => p[0]).join("").toUpperCase().slice(0, 2);
    }
    if (!user) return "U";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen">
      <Header title="Settings" />

      <main className="px-4 pb-24 safe-bottom">
        {/* Profile Card */}
        <GlassCard className="my-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user?.profileImageUrl || undefined} alt={appProfile?.name || "User"} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-medium">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{appProfile?.name || user?.firstName || "Student"}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground capitalize">{user?.role || "Student"}</p>
            </div>
          </div>
        </GlassCard>

        {/* Appearance */}
        <div className="mb-6">
          <h3 className="text-sm font-medium theme-text-muted uppercase tracking-wide mb-3 px-1">
            Appearance
          </h3>
          <GlassCard className="divide-y divide-border/50">
            <SettingRow
              icon={theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              title="Dark Mode"
              description="Toggle dark/light theme"
              action={
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={toggleTheme}
                  data-testid="switch-dark-mode"
                />
              }
            />
            <SettingRow
              icon={<Palette className="w-5 h-5" />}
              title="Theme"
              description="Choose your school colors"
              action={
                <Select value={universityTheme} onValueChange={(v) => setUniversityTheme(v as UniversityTheme)}>
                  <SelectTrigger className="w-32" data-testid="select-university-theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(UNIVERSITY_THEMES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
            />
          </GlassCard>
        </div>

        {/* Semester Management */}
        <div className="mb-6">
          <h3 className="text-sm font-medium theme-text-muted uppercase tracking-wide mb-3 px-1">
            Semester
          </h3>
          <GlassCard className="divide-y divide-border/50">
            <SettingRow
              icon={<Calendar className="w-5 h-5" />}
              title="Current Semester"
              description={activeSemester?.name || "No semester set"}
              action={
                isStudent ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowNewSemesterModal(true)}
                    data-testid="button-new-semester"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    New
                  </Button>
                ) : null
              }
            />
            <button 
              onClick={() => setShowArchivesModal(true)}
              className="w-full touch-target hover-elevate active-elevate-2"
              data-testid="button-view-archives"
            >
              <SettingRow
                icon={<Archive className="w-5 h-5" />}
                title="Past Semesters"
                description={`${archives?.length || 0} archived semesters`}
                action={<ChevronRight className="w-5 h-5 text-muted-foreground" />}
              />
            </button>
          </GlassCard>
        </div>

        {/* Quick Access */}
        <div className="mb-6">
          <h3 className="text-sm font-medium theme-text-muted uppercase tracking-wide mb-3 px-1">
            Quick Access
          </h3>
          <GlassCard className="divide-y divide-border/50">
            <button 
              onClick={() => setLocation("/money")}
              className="w-full touch-target hover-elevate active-elevate-2"
              data-testid="link-money"
            >
              <SettingRow
                icon={<DollarSign className="w-5 h-5" />}
                title="Money & Budget"
                description="Track income, expenses, and credit cards"
                action={<ChevronRight className="w-5 h-5 text-muted-foreground" />}
              />
            </button>
          </GlassCard>
        </div>

        {/* Goals */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-medium theme-text-muted uppercase tracking-wide">
              Goals
            </h3>
            {isStudent && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowGoalsModal(true)}
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
          <GlassCard className="divide-y divide-border/50">
            <SettingRow
              icon={<GraduationCap className="w-5 h-5" />}
              title="Degree Credits"
              description="Total credits required"
              value={`${settings?.totalCreditsRequired || 60}`}
            />
            <SettingRow
              icon={<Clock className="w-5 h-5" />}
              title="Daily Study Goal"
              description="Target study time per day"
              value={`${settings?.dailyStudyGoalMinutes || 60} min`}
            />
            <SettingRow
              icon={<Dumbbell className="w-5 h-5" />}
              title="Weekly Gym Sessions"
              description="Target gym sessions per week"
              value={`${settings?.weeklyGymGoal || 3}`}
            />
            <SettingRow
              icon={<Droplets className="w-5 h-5" />}
              title="Daily Water Goal"
              description="Glasses of water per day"
              value={`${settings?.dailyWaterGoal || 8}`}
            />
            <SettingRow
              icon={<Moon className="w-5 h-5" />}
              title="Sleep Goal"
              description="Hours of sleep per night"
              value={`${settings?.sleepGoalHours || 8}h`}
            />
          </GlassCard>
        </div>

        {/* About */}
        <div className="mb-6">
          <h3 className="text-sm font-medium theme-text-muted uppercase tracking-wide mb-3 px-1">
            About
          </h3>
          <GlassCard className="divide-y divide-border/50">
            <SettingRow
              icon={<Shield className="w-5 h-5" />}
              title="Privacy"
              description="Your data stays on your device"
            />
            <SettingRow
              icon={<HelpCircle className="w-5 h-5" />}
              title="Version"
              description="Family Academic Hub v1.0"
            />
          </GlassCard>
        </div>

        {/* Sign Out */}
        <GlassCard className="mb-6">
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 w-full text-red-500"
            data-testid="button-logout"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-medium">Sign Out</span>
          </button>
        </GlassCard>
      </main>

      <BottomNav />

      {/* New Semester Modal */}
      <Dialog open={showNewSemesterModal} onOpenChange={setShowNewSemesterModal}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Start New Semester</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              This will archive your current classes and study sessions, giving you a fresh start.
            </p>
            <div>
              <Label htmlFor="semester-name">Semester Name</Label>
              <Input
                id="semester-name"
                placeholder="e.g., Spring 2025"
                value={newSemesterName}
                onChange={(e) => setNewSemesterName(e.target.value)}
                data-testid="input-semester-name"
              />
            </div>
            <Button
              className="w-full"
              disabled={!newSemesterName.trim() || createSemesterMutation.isPending}
              onClick={() => {
                createSemesterMutation.mutate({
                  name: newSemesterName.trim(),
                  startDate: format(new Date(), "yyyy-MM-dd"),
                });
              }}
              data-testid="button-confirm-new-semester"
            >
              {createSemesterMutation.isPending ? "Creating..." : "Start Fresh"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archives Modal */}
      <Dialog open={showArchivesModal} onOpenChange={setShowArchivesModal}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Past Semesters</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2 max-h-80 overflow-y-auto">
            {archives && archives.length > 0 ? (
              archives.map((archive) => (
                <div 
                  key={archive.id} 
                  className="p-3 rounded-lg bg-muted/50"
                  data-testid={`archive-${archive.id}`}
                >
                  <p className="font-medium">{archive.semesterName}</p>
                  <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                    <p>{archive.classCount} classes, {archive.completedCredits} credits</p>
                    {archive.semesterGpa && (
                      <p>GPA: {archive.semesterGpa.toFixed(2)}</p>
                    )}
                    <p>{Math.round((archive.totalStudyMinutes || 0) / 60)} hours studied</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No archived semesters yet
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Goals Edit Modal */}
      <Dialog open={showGoalsModal} onOpenChange={setShowGoalsModal}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Edit Goals</DialogTitle>
          </DialogHeader>
          <GoalsEditForm 
            settings={settings}
            onSave={async (updates) => {
              await updateSettings(updates);
              setShowGoalsModal(false);
              toast({ title: "Goals updated!" });
            }}
            onClose={() => setShowGoalsModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  value?: string;
  action?: React.ReactNode;
}

function SettingRow({ icon, title, description, value, action }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
        <div>
          <p className="font-medium">{title}</p>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {value && (
        <span className="text-muted-foreground font-medium">{value}</span>
      )}
      {action}
    </div>
  );
}

interface GoalsEditFormProps {
  settings: any;
  onSave: (updates: any) => Promise<void>;
  onClose: () => void;
}

function GoalsEditForm({ settings, onSave, onClose }: GoalsEditFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    totalCreditsRequired: settings?.totalCreditsRequired?.toString() || "60",
    dailyStudyGoalMinutes: settings?.dailyStudyGoalMinutes?.toString() || "60",
    weeklyGymGoal: settings?.weeklyGymGoal?.toString() || "3",
    dailyWaterGoal: settings?.dailyWaterGoal?.toString() || "8",
    sleepGoalHours: settings?.sleepGoalHours?.toString() || "8",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsPending(true);
      await onSave({
        totalCreditsRequired: parseInt(formData.totalCreditsRequired),
        dailyStudyGoalMinutes: parseInt(formData.dailyStudyGoalMinutes),
        weeklyGymGoal: parseInt(formData.weeklyGymGoal),
        dailyWaterGoal: parseInt(formData.dailyWaterGoal),
        sleepGoalHours: parseFloat(formData.sleepGoalHours),
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Total Credits</Label>
          <Input
            type="number"
            min="1"
            value={formData.totalCreditsRequired}
            onChange={(e) => setFormData({ ...formData, totalCreditsRequired: e.target.value })}
          />
        </div>
        <div>
          <Label>Daily Study (min)</Label>
          <Input
            type="number"
            min="1"
            value={formData.dailyStudyGoalMinutes}
            onChange={(e) => setFormData({ ...formData, dailyStudyGoalMinutes: e.target.value })}
          />
        </div>
        <div>
          <Label>Weekly Gym Sessions</Label>
          <Input
            type="number"
            min="1"
            max="7"
            value={formData.weeklyGymGoal}
            onChange={(e) => setFormData({ ...formData, weeklyGymGoal: e.target.value })}
          />
        </div>
        <div>
          <Label>Daily Water (glasses)</Label>
          <Input
            type="number"
            min="1"
            max="20"
            value={formData.dailyWaterGoal}
            onChange={(e) => setFormData({ ...formData, dailyWaterGoal: e.target.value })}
          />
        </div>
        <div className="col-span-2">
          <Label>Sleep Goal (hours)</Label>
          <Input
            type="number"
            min="4"
            max="12"
            step="0.5"
            value={formData.sleepGoalHours}
            onChange={(e) => setFormData({ ...formData, sleepGoalHours: e.target.value })}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? "Saving..." : "Save Goals"}
        </Button>
      </div>
    </form>
  );
}
