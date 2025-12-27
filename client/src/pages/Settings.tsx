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
  Plus
} from "lucide-react";
import type { AppProfile, Semester, SemesterArchive } from "@shared/schema";

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { universityTheme, setUniversityTheme } = useUniversityTheme();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [showNewSemesterModal, setShowNewSemesterModal] = useState(false);
  const [showArchivesModal, setShowArchivesModal] = useState(false);
  const [newSemesterName, setNewSemesterName] = useState("");

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
            <div>
              <h2 className="text-xl font-bold" data-testid="text-user-name">
                {appProfile?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User"}
              </h2>
              <p className="text-muted-foreground" data-testid="text-user-email">
                {appProfile?.email || user?.email}
              </p>
              {appProfile?.role && (
                <p className="text-xs text-muted-foreground/70 capitalize mt-1">
                  {appProfile.role}
                </p>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Preferences */}
        <div className="mb-6">
          <h3 className="text-sm font-medium theme-text-muted uppercase tracking-wide mb-3 px-1">
            Preferences
          </h3>
          <GlassCard className="divide-y divide-border/50">
            <SettingRow
              icon={theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              title="Dark Mode"
              description="Switch between light and dark themes"
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
              title="University Theme"
              description="Change app colors and gradient"
              action={
                <Select 
                  value={universityTheme} 
                  onValueChange={(val) => setUniversityTheme(val as UniversityTheme)}
                >
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNewSemesterModal(true)}
                  data-testid="button-new-semester"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New
                </Button>
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
          <h3 className="text-sm font-medium theme-text-muted uppercase tracking-wide mb-3 px-1">
            Goals
          </h3>
          <GlassCard className="divide-y divide-border/50">
            <SettingRow
              icon={<GraduationCap className="w-5 h-5" />}
              title="Degree Credits"
              description="Total credits required for graduation"
              value="60"
            />
            <SettingRow
              icon={<Clock className="w-5 h-5" />}
              title="Daily Study Goal"
              description="Target study time per day"
              value="60 min"
            />
            <SettingRow
              icon={<Dumbbell className="w-5 h-5" />}
              title="Weekly Gym Sessions"
              description="Target gym sessions per week"
              value="3"
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
              description="No surveillance, no tracking"
              action={<ChevronRight className="w-5 h-5 text-muted-foreground" />}
            />
            <SettingRow
              icon={<HelpCircle className="w-5 h-5" />}
              title="Help & Support"
              description="Get help with the app"
              action={<ChevronRight className="w-5 h-5 text-muted-foreground" />}
            />
          </GlassCard>
        </div>

        {/* App Info */}
        <div className="text-center py-4">
          <p className="text-sm theme-text-muted">University App</p>
          <p className="text-xs theme-text-muted">Version 1.0.0</p>
        </div>

        {/* Sign Out */}
        <Button
          variant="ghost"
          className="w-full rounded-full text-red-500 hover:text-red-600 hover:bg-red-500/10"
          onClick={() => logout()}
          data-testid="button-sign-out"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </Button>
      </main>

      <BottomNav />

      {/* New Semester Modal */}
      <Dialog open={showNewSemesterModal} onOpenChange={setShowNewSemesterModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Semester</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-muted-foreground text-sm">
              Starting a new semester will archive your current progress and give you a fresh start.
            </p>
            <div className="space-y-2">
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
        <DialogContent>
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
