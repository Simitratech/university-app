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
import { Dumbbell, Smile, Plus, Calendar, Target, Footprints, Heart, Trash2, Moon, Droplets, Sun } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { getDailyCoachMessage } from "@/lib/coach-messages";

export default function Wellness() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const [showAddGym, setShowAddGym] = useState(false);
  const [showAddHappiness, setShowAddHappiness] = useState(false);
  const [showAddSleep, setShowAddSleep] = useState(false);
  const { 
    studentData, 
    isLoading, 
    addGymSession, 
    deleteGymSession, 
    addHappinessEntry,
    addSleepEntry,
    updateHydration,
  } = useStudentData();

  const gymSessions = studentData?.gymSessions || [];
  const happinessEntries = studentData?.happinessEntries || [];
  const sleepEntries = studentData?.sleepEntries || [];
  const hydrationEntries = studentData?.hydrationEntries || [];
  const settings = studentData?.settings;

  // Calculate gym stats
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const today = format(now, "yyyy-MM-dd");

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

  // Sleep stats
  const todaySleep = sleepEntries?.find(s => s.date === today);
  const weekSleepEntries = sleepEntries?.filter(s => {
    const d = new Date(s.date);
    return d >= weekStart && d <= weekEnd;
  }) || [];
  const avgSleepHours = weekSleepEntries.length > 0 
    ? weekSleepEntries.reduce((sum, s) => sum + (s.hoursSlept || 0), 0) / weekSleepEntries.length 
    : 0;
  const sleepGoal = settings?.sleepGoalHours || 8;

  // Hydration stats
  const todayHydration = hydrationEntries?.find(h => h.date === today);
  const waterGlasses = todayHydration?.glasses || 0;
  const waterGoal = settings?.dailyWaterGoal || 8;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "gym": return <Dumbbell className="w-5 h-5" />;
      case "walk": return <Footprints className="w-5 h-5" />;
      default: return <Heart className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "gym": return "bg-blue-500/20 text-blue-500";
      case "walk": return "bg-green-500/20 text-green-500";
      default: return "bg-purple-500/20 text-purple-500";
    }
  };

  const handleAddWater = async () => {
    if (!isStudent) return;
    try {
      await updateHydration(today, waterGlasses + 1);
      toast({ title: "💧 Water logged!" });
    } catch {
      toast({ title: "Failed to log water", variant: "destructive" });
    }
  };

  const handleRemoveWater = async () => {
    if (!isStudent || waterGlasses <= 0) return;
    try {
      await updateHydration(today, waterGlasses - 1);
    } catch {
      toast({ title: "Failed to update water", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Wellness" />
        <LoadingState />
        <BottomNav />
      </div>
    );
  }

  const coachMessage = getDailyCoachMessage("wellness");

  return (
    <div className="min-h-screen">
      <Header title="Wellness" />
      
      <main className="px-4 pb-24 safe-bottom">
        {/* Coach Message */}
        {coachMessage && (
          <GlassCard className="mt-4 mb-4">
            <p className="text-sm text-muted-foreground italic text-center" data-testid="text-coach-wellness">
              {coachMessage}
            </p>
          </GlassCard>
        )}

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Sleep Card */}
          <GlassCard className="p-4" onClick={isStudent ? () => setShowAddSleep(true) : undefined}>
            <div className="flex items-center gap-2 mb-2">
              <Moon className="w-4 h-4 text-indigo-400" />
              <span className="text-xs text-muted-foreground">Last Night</span>
            </div>
            <p className="text-2xl font-bold">
              {todaySleep?.hoursSlept ? `${todaySleep.hoursSlept}h` : "--"}
            </p>
            <p className="text-xs text-muted-foreground">Goal: {sleepGoal}h</p>
          </GlassCard>

          {/* Water Card */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Water Today</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{waterGlasses}/{waterGoal}</p>
              {isStudent && (
                <div className="flex gap-1 ml-auto">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleRemoveWater} disabled={waterGlasses <= 0}>
                    <span className="text-lg">-</span>
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleAddWater}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            <Progress value={(waterGlasses / waterGoal) * 100} className="h-1.5 mt-2" />
          </GlassCard>
        </div>

        {/* Weekly Progress */}
        <GlassCard className="mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Weekly Progress</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Gym Sessions</span>
                <span className="font-medium">{weeklyGymCount}/3</span>
              </div>
              <Progress value={weeklyGymProgress} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Movement Minutes</span>
                <span className="font-medium">{weeklyGymMinutes}/90 min</span>
              </div>
              <Progress value={weeklyMovementProgress} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Avg Sleep</span>
                <span className="font-medium">{avgSleepHours.toFixed(1)}h/{sleepGoal}h</span>
              </div>
              <Progress value={(avgSleepHours / sleepGoal) * 100} className="h-2" />
            </div>
          </div>
        </GlassCard>

        <Tabs defaultValue="gym" className="mb-4">
          <TabsList className="w-full">
            <TabsTrigger value="gym" className="flex-1">
              <Dumbbell className="w-4 h-4 mr-1" />
              Gym
            </TabsTrigger>
            <TabsTrigger value="sleep" className="flex-1">
              <Moon className="w-4 h-4 mr-1" />
              Sleep
            </TabsTrigger>
            <TabsTrigger value="happiness" className="flex-1">
              <Smile className="w-4 h-4 mr-1" />
              Joy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gym" className="mt-4 space-y-3">
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

          <TabsContent value="sleep" className="mt-4 space-y-3">
            {sleepEntries?.length === 0 ? (
              <EmptyState
                icon={<Moon className="w-8 h-8" />}
                title="No sleep entries"
                description="Track your sleep for better health insights"
                action={isStudent ? { label: "Log Sleep", onClick: () => setShowAddSleep(true) } : undefined}
              />
            ) : (
              sleepEntries?.slice(0, 10).map((entry) => (
                <GlassCard key={entry.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                        <Moon className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-medium">{format(new Date(entry.date), "EEEE, MMM d")}</p>
                        <p className="text-sm text-muted-foreground">
                          {entry.bedtime && entry.waketime ? `${entry.bedtime} → ${entry.waketime}` : "No times logged"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{entry.hoursSlept || "--"}h</p>
                      {entry.quality && (
                        <div className="flex gap-0.5 justify-end">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={star <= entry.quality ? "text-yellow-400" : "text-muted/30"}>★</span>
                          ))}
                        </div>
                      )}
                    </div>
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
                description="Record what makes you happy"
                action={isStudent ? { label: "Add Entry", onClick: () => setShowAddHappiness(true) } : undefined}
              />
            ) : (
              happinessEntries
                ?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map((entry) => (
                  <GlassCard key={entry.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                        <Smile className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="italic text-muted-foreground">"{entry.entry}"</p>
                        <p className="text-xs text-muted-foreground/70 mt-2">
                          {format(new Date(entry.date), "EEEE, MMM d")}
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                ))
            )}
          </TabsContent>
        </Tabs>

        {/* Add Buttons - Students only */}
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

            {/* Add Sleep Dialog */}
            <Dialog open={showAddSleep} onOpenChange={setShowAddSleep}>
              <DialogContent className="glass-card">
                <DialogHeader>
                  <DialogTitle>Log Sleep</DialogTitle>
                </DialogHeader>
                <AddSleepForm onClose={() => setShowAddSleep(false)} addSleepEntry={addSleepEntry} />
              </DialogContent>
            </Dialog>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

// Add Gym Form
interface AddGymFormProps {
  onClose: () => void;
  addGymSession: (session: { type: string; durationMinutes: number; weight: number | null; date: string }) => Promise<void>;
}

function AddGymForm({ onClose, addGymSession }: AddGymFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    type: "gym",
    durationMinutes: "30",
    weight: "",
  });
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsPending(true);
      await addGymSession({
        type: formData.type,
        durationMinutes: parseInt(formData.durationMinutes),
        weight: formData.weight ? parseFloat(formData.weight) : null,
        date: new Date().toISOString(),
      });
      toast({ title: "Workout logged!" });
      onClose();
    } catch {
      toast({ title: "Failed to log workout", variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Activity Type</Label>
        <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gym">Gym</SelectItem>
            <SelectItem value="walk">Walk</SelectItem>
            <SelectItem value="home_workout">Home Workout</SelectItem>
            <SelectItem value="sport">Sport</SelectItem>
            <SelectItem value="run">Run</SelectItem>
            <SelectItem value="swim">Swim</SelectItem>
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
        />
      </div>
      <div>
        <Label>Weight (optional)</Label>
        <Input
          type="number"
          placeholder="Your weight in lbs"
          value={formData.weight}
          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving..." : "Log Workout"}
      </Button>
    </form>
  );
}

// Add Happiness Form
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
    if (!entry.trim()) return;
    try {
      setIsPending(true);
      await addHappinessEntry({
        date: format(new Date(), "yyyy-MM-dd"),
        entry: entry.trim(),
      });
      toast({ title: "Happiness saved!" });
      onClose();
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>What made you happy or grateful today?</Label>
        <Textarea
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          placeholder="Today I'm grateful for..."
          maxLength={200}
          rows={3}
          required
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">{entry.length}/200</p>
      </div>
      <Button type="submit" className="w-full" disabled={isPending || !entry.trim()}>
        {isPending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}

// Add Sleep Form
interface AddSleepFormProps {
  onClose: () => void;
  addSleepEntry: (entry: { date: string; bedtime: string | null; waketime: string | null; hoursSlept: number | null; quality: number }) => Promise<void>;
}

function AddSleepForm({ onClose, addSleepEntry }: AddSleepFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    bedtime: "22:30",
    waketime: "06:30",
    quality: "3",
  });
  const [isPending, setIsPending] = useState(false);

  const calculateHours = () => {
    if (!formData.bedtime || !formData.waketime) return null;
    const [bedHour, bedMin] = formData.bedtime.split(":").map(Number);
    const [wakeHour, wakeMin] = formData.waketime.split(":").map(Number);
    
    let hours = wakeHour - bedHour;
    let mins = wakeMin - bedMin;
    
    if (hours < 0) hours += 24;
    if (mins < 0) {
      hours -= 1;
      mins += 60;
    }
    
    return Math.round((hours + mins / 60) * 10) / 10;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsPending(true);
      await addSleepEntry({
        date: format(new Date(), "yyyy-MM-dd"),
        bedtime: formData.bedtime,
        waketime: formData.waketime,
        hoursSlept: calculateHours(),
        quality: parseInt(formData.quality),
      });
      toast({ title: "Sleep logged!" });
      onClose();
    } catch {
      toast({ title: "Failed to log sleep", variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  const estimatedHours = calculateHours();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Bedtime</Label>
          <Input
            type="time"
            value={formData.bedtime}
            onChange={(e) => setFormData({ ...formData, bedtime: e.target.value })}
          />
        </div>
        <div>
          <Label>Wake Time</Label>
          <Input
            type="time"
            value={formData.waketime}
            onChange={(e) => setFormData({ ...formData, waketime: e.target.value })}
          />
        </div>
      </div>

      {estimatedHours && (
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">Estimated Sleep</p>
          <p className="text-2xl font-bold">{estimatedHours} hours</p>
        </div>
      )}

      <div>
        <Label>Sleep Quality</Label>
        <Select value={formData.quality} onValueChange={(v) => setFormData({ ...formData, quality: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">⭐ Poor</SelectItem>
            <SelectItem value="2">⭐⭐ Fair</SelectItem>
            <SelectItem value="3">⭐⭐⭐ Good</SelectItem>
            <SelectItem value="4">⭐⭐⭐⭐ Great</SelectItem>
            <SelectItem value="5">⭐⭐⭐⭐⭐ Excellent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving..." : "Log Sleep"}
      </Button>
    </form>
  );
}
