import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { GlassCard } from "@/components/GlassCard";
import { LoadingState } from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from "recharts";
import { Clock, Dumbbell, Heart, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, startOfMonth, endOfMonth, eachWeekOfInterval } from "date-fns";
import { useStudentData } from "@/lib/student-data-provider";

export default function Progress() {
  const { studentData, isLoading } = useStudentData();

  const studySessions = studentData?.studySessions || [];
  const gymSessions = studentData?.gymSessions || [];
  const happiness = studentData?.happinessEntries || [];
  const expenses = studentData?.expenses || [];
  const incomeEntries = studentData?.incomeEntries || [];

  const now = new Date();
  const weekStartDate = startOfWeek(now, { weekStartsOn: 1 });
  const weekEndDate = endOfWeek(now, { weekStartsOn: 1 });

  const weekStudySessions = studySessions.filter((s) => {
    const d = new Date(s.date);
    return d >= weekStartDate && d <= weekEndDate;
  });

  const weekGymSessions = gymSessions.filter((s) => {
    const d = new Date(s.date);
    return d >= weekStartDate && d <= weekEndDate;
  });

  // Weekly stats
  const weeklyStudyMinutes = weekStudySessions?.reduce((sum, s) => sum + s.durationMinutes, 0) || 0;
  const weeklyStudyHours = Math.round(weeklyStudyMinutes / 60 * 10) / 10;
  const weeklyGymCount = weekGymSessions?.length || 0;
  const weeklyMovementMinutes = weekGymSessions?.reduce((sum, s) => sum + s.durationMinutes, 0) || 0;

  // Happiness completion this week
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const daysThisWeek = eachDayOfInterval({ start: weekStart, end: new Date() });
  const happinessThisWeek = happiness?.filter((h) => {
    const date = new Date(h.date);
    return date >= weekStart && date <= weekEnd;
  }) || [];
  const happinessPercent = Math.round((happinessThisWeek.length / daysThisWeek.length) * 100);

  // Weekly chart data - last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    
    const dayStudy = studySessions?.filter((s) => {
      const sessionDate = format(new Date(s.date), "yyyy-MM-dd");
      return sessionDate === dateStr;
    }).reduce((sum, s) => sum + s.durationMinutes, 0) || 0;

    const dayGym = gymSessions?.filter((g) => {
      const gymDate = format(new Date(g.date), "yyyy-MM-dd");
      return gymDate === dateStr;
    }).length || 0;

    const hasHappiness = happiness?.some((h) => h.date === dateStr) ? 1 : 0;

    return {
      day: format(date, "EEE"),
      study: Math.round(dayStudy / 60 * 10) / 10,
      gym: dayGym,
      happiness: hasHappiness,
    };
  });

  // Monthly data - last 4 weeks
  const monthStart = startOfMonth(new Date());
  const weeks = eachWeekOfInterval({ start: monthStart, end: new Date() }, { weekStartsOn: 1 });
  
  const monthlyData = weeks.map((weekStart, index) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    
    const weekStudy = studySessions?.filter((s) => {
      const date = new Date(s.date);
      return date >= weekStart && date <= weekEnd;
    }).reduce((sum, s) => sum + s.durationMinutes, 0) || 0;

    const weekGym = gymSessions?.filter((g) => {
      const date = new Date(g.date);
      return date >= weekStart && date <= weekEnd;
    }).length || 0;

    return {
      week: `Week ${index + 1}`,
      study: Math.round(weekStudy / 60 * 10) / 10,
      gym: weekGym,
    };
  });

  // Monthly expenses vs income
  const currentMonth = format(new Date(), "yyyy-MM");
  const monthlyExpenses = expenses?.filter((e) => e.month === currentMonth).reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const monthlyIncome = incomeEntries?.filter((e) => e.date?.startsWith(currentMonth)).reduce((sum, e) => sum + Number(e.amount), 0) || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Progress" />
        <LoadingState />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Progress" />

      <main className="px-4 pb-24 safe-bottom">
        <Tabs defaultValue="weekly" className="mt-4">
          <TabsList className="grid w-full grid-cols-2 rounded-full">
            <TabsTrigger value="weekly" className="rounded-full" data-testid="tab-weekly">
              This Week
            </TabsTrigger>
            <TabsTrigger value="monthly" className="rounded-full" data-testid="tab-monthly">
              This Month
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="mt-6 space-y-4">
            {/* Weekly Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Study Time</span>
                </div>
                <p className="text-2xl font-bold" data-testid="text-weekly-study">{weeklyStudyHours}h</p>
                <p className="text-xs text-muted-foreground">{weeklyStudyMinutes} minutes total</p>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Gym Sessions</span>
                </div>
                <p className="text-2xl font-bold" data-testid="text-weekly-gym">{weeklyGymCount}</p>
                <p className="text-xs text-muted-foreground">{weeklyMovementMinutes} min movement</p>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  <span className="text-sm text-muted-foreground">Happiness</span>
                </div>
                <p className="text-2xl font-bold" data-testid="text-weekly-happiness">{happinessPercent}%</p>
                <p className="text-xs text-muted-foreground">{happinessThisWeek.length} of {daysThisWeek.length} days</p>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Goal Target</span>
                </div>
                <p className="text-2xl font-bold">90min</p>
                <p className="text-xs text-muted-foreground">weekly movement</p>
              </GlassCard>
            </div>

            {/* Weekly Study Chart */}
            <GlassCard>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Daily Study Hours
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7Days}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="study" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Hours" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Weekly Activity Chart */}
            <GlassCard>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Dumbbell className="w-4 h-4" />
                Daily Activity
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={last7Days}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="gym" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Gym" />
                    <Line type="monotone" dataKey="happiness" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Happy" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="monthly" className="mt-6 space-y-4">
            {/* Monthly Study Chart */}
            <GlassCard>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Monthly Study Hours
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="study" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Hours" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Monthly Gym Sessions */}
            <GlassCard>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Dumbbell className="w-4 h-4" />
                Monthly Gym Sessions
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="gym" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Sessions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Income vs Expenses */}
            <GlassCard>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Income vs Expenses ({format(new Date(), "MMM")})
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={[
                      { name: 'Income', amount: monthlyIncome },
                      { name: 'Expenses', amount: monthlyExpenses },
                    ]}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={70} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                    />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-500 font-medium">Income: ${monthlyIncome.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-500 font-medium">Expenses: ${monthlyExpenses.toFixed(2)}</span>
                </div>
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}
