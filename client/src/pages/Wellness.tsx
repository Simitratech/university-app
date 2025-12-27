import { useState } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { GlassCard, StatCard } from "@/components/GlassCard";
import { EmptyState, LoadingState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useStudentData } from "@/lib/student-data-provider";
import { Dumbbell, Smile, Plus, Calendar, Target, Footprints, Heart, Trash2 } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { getDailyCoachMessage } from "@/lib/coach-messages";

export default function Wellness() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const [showAddGym, setShowAddGym] = useState(false);
  const [showAddHappiness, setShowAddHappiness] = useState(false);
  const { studentData, isLoading, addGymSession, deleteGymSession, addHappinessEntry } = useStudentData();

  const gymSessions = studentData?.gymSessions || [];
  const happinessEntries = studentData?.happinessEntries || [];

  // Calculate gym stats
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  const weekGymSessions = gymSessions?.filter((s) => {
    const d = new Date(s.date);
    return d >= weekStart && d <= weekEnd;
  }) || [];

  const weeklyGymCount = weekGymSessions.length;
  const weeklyGymMinutes = weekGymSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const weeklyGymProgress = Math.min(100, (weeklyGymCount / 3) * 100);
  const weeklyMovementProgress = Math.min(100, (weeklyGymMinutes / 90) * 100);

  const todayHappiness = happinessEntries?.find(
    (e) => format(new Date(e.date), "yyyy-MM-dd") === format(now, "yyyy-MM-dd")
  );

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Wellness" />
        <LoadingState />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Wellness" />

      <main className="px-4 pb-24 safe-bottom">
        <p className="text-sm theme-text-muted my-4 italic" data-testid="text-coach-wellness">
          {getDailyCoachMessage()}
        </p>
        {/* Weekly Goals */}
        <GlassCard className="mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Weekly Goals
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4" />
                  Gym Sessions
                </span>
                <span className="font-medium">{weeklyGymCount} / 3</span>
              </div>
              <Progress value={weeklyGymProgress} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="flex items-center gap-2">
                  <Footprints className="w-4 h-4" />
                  Movement Time
                </span>
                <span className="font-medium">{weeklyGymMinutes} / 90 min</span>
              </div>
              <Progress value={weeklyMovementProgress} className="h-2" />
            </div>
          </div>
        </GlassCard>

        {/* Today's Happiness */}
        <GlassCard className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Smile className="w-5 h-5 text-yellow-500" />
              Today's Happiness
            </h3>
            {!todayHappiness && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddHappiness(true)}
                className="rounded-full"
                data-testid="button-add-happiness"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            )}
          </div>

          {todayHappiness ? (
            <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
              <p className="italic text-foreground">"{todayHappiness.entry}"</p>
              <p className="text-xs text-muted-foreground mt-2">
                {format(new Date(todayHappiness.date), "EEEE, MMMM d")}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              What made you happy today? Add one thing to complete your daily goal.
            </p>
          )}
        </GlassCard>

        <Tabs defaultValue="gym" className="mt-4">
          <TabsList className="grid w-full grid-cols-2 rounded-full">
            <TabsTrigger value="gym" className="rounded-full" data-testid="tab-gym">
              Gym
            </TabsTrigger>
            <TabsTrigger value="happiness" className="rounded-full" data-testid="tab-happiness">
              Happiness
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gym" className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <StatCard
                icon={<Dumbbell className="w-5 h-5" />}
                label="This Week"
                value={`${weeklyGymCount}`}
                subtext="sessions"
                color={weeklyGymCount >= 3 ? "green" : weeklyGymCount >= 1 ? "yellow" : "red"}
              />
              <StatCard
                icon={<Footprints className="w-5 h-5" />}
                label="Movement"
                value={`${weeklyGymMinutes}m`}
                subtext="this week"
                color={weeklyGymMinutes >= 90 ? "green" : "yellow"}
              />
            </div>

            {gymSessions?.length === 0 ? (
              <EmptyState
                icon={<Dumbbell className="w-8 h-8" />}
                title="No gym sessions"
                description="Log your workouts to track your fitness"
                action={isStudent ? { label: "Add Session", onClick: () => setShowAddGym(true) } : undefined}
              />
            ) : (
              gymSessions?.slice(0, 10).map((session) => (
                <GlassCard key={session.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getTypeColor(session.type)}`}>
                      {getTypeIcon(session.type)}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{session.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(session.date), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">{session.durationMinutes}m</p>
                      {session.weight && (
                        <p className="text-xs text-muted-foreground">{session.weight} lbs</p>
                      )}
                    </div>
                    {isStudent && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Workout?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this {session.type} session from {format(new Date(session.date), "MMM d")}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                await deleteGymSession(session.id);
                                toast({ title: "Workout deleted" });
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
              ))
            )}
          </TabsContent>

          <TabsContent value="happiness" className="mt-4 space-y-3">
            {happinessEntries?.length === 0 ? (
              <EmptyState
                icon={<Smile className="w-8 h-8" />}
                title="No happiness entries"
                description="Start journaling what makes you happy each day"
                action={{ label: "Add Entry", onClick: () => setShowAddHappiness(true) }}
              />
            ) : (
              happinessEntries?.slice(0, 20).map((entry) => (
                <GlassCard key={entry.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-500 shrink-0">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium italic">"{entry.entry}"</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(entry.date), "EEEE, MMMM d")}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Add Gym Button - Students only */}
        {isStudent && (
          <>
            <Button
              className="fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg"
              size="icon"
              onClick={() => setShowAddGym(true)}
              data-testid="button-add-gym"
            >
              <Plus className="w-6 h-6" />
            </Button>

            {/* Add Gym Dialog */}
            <Dialog open={showAddGym} onOpenChange={setShowAddGym}>
              <DialogContent className="glass-card">
                <DialogHeader>
                  <DialogTitle>Log Workout</DialogTitle>
                </DialogHeader>
                <AddGymForm onClose={() => setShowAddGym(false)} addGymSession={addGymSession} />
              </DialogContent>
            </Dialog>

            {/* Add Happiness Dialog */}
            <Dialog open={showAddHappiness} onOpenChange={setShowAddHappiness}>
              <DialogContent className="glass-card">
                <DialogHeader>
                  <DialogTitle>What made you happy today?</DialogTitle>
                </DialogHeader>
                <AddHappinessForm onClose={() => setShowAddHappiness(false)} addHappinessEntry={addHappinessEntry} />
              </DialogContent>
            </Dialog>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function getTypeIcon(type: string) {
  switch (type) {
    case "gym":
      return <Dumbbell className="w-5 h-5" />;
    case "walk":
      return <Footprints className="w-5 h-5" />;
    default:
      return <Heart className="w-5 h-5" />;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case "gym":
      return "bg-blue-500/20 text-blue-500";
    case "walk":
      return "bg-green-500/20 text-green-500";
    default:
      return "bg-purple-500/20 text-purple-500";
  }
}

interface AddGymFormProps {
  onClose: () => void;
  addGymSession: (session: { type: string; durationMinutes: number; weight: number | null; date: string }) => Promise<void>;
}

function AddGymForm({ onClose, addGymSession }: AddGymFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    type: "gym",
    durationMinutes: "60",
    weight: "",
  });
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      await addGymSession({
        type: formData.type,
        durationMinutes: parseInt(formData.durationMinutes),
        weight: formData.weight ? parseFloat(formData.weight) : null,
        date: new Date().toISOString(),
      });
      toast({ title: "Workout logged!" });
      onClose();
    } catch {
      toast({ title: "Failed to save workout", variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Type</Label>
        <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
          <SelectTrigger data-testid="select-workout-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gym">Gym</SelectItem>
            <SelectItem value="walk">Walk</SelectItem>
            <SelectItem value="workout">Home Workout</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Duration (minutes)</Label>
        <Input
          type="number"
          min="1"
          value={formData.durationMinutes}
          onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
          required
          data-testid="input-workout-duration"
        />
      </div>

      <div>
        <Label>Weight (optional)</Label>
        <Input
          type="number"
          step="0.1"
          value={formData.weight}
          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
          placeholder="lbs"
          data-testid="input-workout-weight"
        />
      </div>

      <Button type="submit" className="w-full rounded-full" disabled={isPending}>
        {isPending ? "Saving..." : "Log Workout"}
      </Button>
    </form>
  );
}

interface AddHappinessFormProps {
  onClose: () => void;
  addHappinessEntry: (entry: { date: string; entry: string }) => Promise<void>;
}

function AddHappinessForm({ onClose, addHappinessEntry }: AddHappinessFormProps) {
  const { toast } = useToast();
  const [entry, setEntry] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      await addHappinessEntry({
        date: format(new Date(), "yyyy-MM-dd"),
        entry: entry.trim(),
      });
      toast({ title: "Happiness logged!" });
      onClose();
    } catch {
      toast({ title: "Failed to save entry", variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>One thing that made you happy today</Label>
        <Textarea
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          placeholder="Today I'm happy because..."
          maxLength={200}
          rows={3}
          required
          data-testid="input-happiness-entry"
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {entry.length}/200
        </p>
      </div>

      <Button type="submit" className="w-full rounded-full" disabled={isPending || !entry.trim()}>
        {isPending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
