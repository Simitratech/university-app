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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useStudentData } from "@/lib/student-data-provider";
import type { StudentDataExpense, StudentDataIncomeEntry, StudentDataCreditCard, StudentDataEmergencyFundContribution } from "@shared/schema";
import { DollarSign, Plus, CreditCard, TrendingUp, TrendingDown, PiggyBank, AlertTriangle, Check, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { getDailyCoachMessage } from "@/lib/coach-messages";

const currentMonth = format(new Date(), "yyyy-MM");

const EXPENSE_CATEGORIES = [
  { name: "Food", color: "#ef4444" },
  { name: "Rent", color: "#f97316" },
  { name: "Transportation", color: "#eab308" },
  { name: "Entertainment", color: "#22c55e" },
  { name: "School", color: "#3b82f6" },
  { name: "Other", color: "#8b5cf6" },
];

const getCategoryColor = (category: string): string => {
  const cat = EXPENSE_CATEGORIES.find((c) => c.name.toLowerCase() === category.toLowerCase());
  return cat?.color || "#8b5cf6";
};

export default function Money() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const [addType, setAddType] = useState<"income" | "expense" | "card" | "contribution" | null>(null);
  const { 
    studentData, 
    isLoading, 
    addIncomeEntry, 
    deleteIncomeEntry, 
    addExpense, 
    deleteExpense, 
    addCreditCard, 
    updateCreditCard, 
    deleteCreditCard, 
    updateEmergencyFund, 
    addEmergencyFundContribution,
    deleteEmergencyFundContribution
  } = useStudentData();

  const incomeEntries = studentData?.incomeEntries?.filter(e => e.date?.startsWith(currentMonth)) || [];
  const expensesData = studentData?.expenses?.filter(e => e.month === currentMonth) || [];
  const creditCards = studentData?.creditCards || [];
  const emergencyFund = studentData?.emergencyFund || { currentAmount: 0, targetMonths: 3 };
  const contributions = studentData?.emergencyFundContributions || [];

  const totalIncome = incomeEntries?.reduce((sum, e) => sum + e.amount, 0) || 0;
  const totalExpenses = expensesData?.reduce((sum, e) => sum + e.amount, 0) || 0;
  const balance = totalIncome - totalExpenses;

  const unpaidCards = creditCards?.filter((c) => !c.isPaid) || [];

  const monthlyExpenses = expensesData?.filter((e) => e.isFixed).reduce((sum, e) => sum + e.amount, 0) || 500;
  const emergencyTarget = monthlyExpenses * (emergencyFund?.targetMonths || 3);
  const emergencyProgress = Math.min(100, ((emergencyFund?.currentAmount || 0) / emergencyTarget) * 100);

  const expensesByCategory = EXPENSE_CATEGORIES.map((cat) => {
    const catTotal = expensesData
      ?.filter((e) => e.category.toLowerCase() === cat.name.toLowerCase())
      .reduce((sum, e) => sum + e.amount, 0) || 0;
    return {
      name: cat.name,
      value: catTotal,
      color: cat.color,
    };
  }).filter((c) => c.value > 0);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Money" />
        <LoadingState />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Money" />

      <main className="px-4 pb-24 safe-bottom">
        <p className="text-sm theme-text-muted my-4 italic" data-testid="text-coach-money">
          {getDailyCoachMessage()}
        </p>
        <GlassCard className="mb-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Monthly Balance</p>
            <p className={`text-4xl font-bold ${balance >= 0 ? "text-green-500" : "text-red-500"}`}>
              ${balance.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {format(new Date(), "MMMM yyyy")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="text-center p-3 bg-green-500/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-lg font-semibold text-green-500">${totalIncome.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Income</p>
            </div>
            <div className="text-center p-3 bg-red-500/10 rounded-xl">
              <TrendingDown className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-lg font-semibold text-red-500">${totalExpenses.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Expenses</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Emergency Fund</h3>
            </div>
            {isStudent && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddType("contribution")}
                data-testid="button-add-contribution"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            )}
          </div>
          <Progress value={emergencyProgress} className="h-3 mb-2" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              ${emergencyFund?.currentAmount?.toFixed(2) || "0.00"}
            </span>
            <span className="text-muted-foreground">
              ${emergencyTarget.toFixed(2)} ({emergencyFund?.targetMonths || 3} months)
            </span>
          </div>

          {contributions && contributions.length > 0 && (
            <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
              {contributions.slice(0, 5).map((contribution) => (
                <ContributionItem 
                  key={contribution.id} 
                  contribution={contribution} 
                  deleteEmergencyFundContribution={deleteEmergencyFundContribution}
                />
              ))}
            </div>
          )}
        </GlassCard>

        {unpaidCards.length > 0 && (
          <GlassCard className="mb-6 border-yellow-500/50">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold">Unpaid Cards</h3>
            </div>
            <div className="space-y-3">
              {unpaidCards.map((card) => (
                <CreditCardItem 
                  key={card.id} 
                  card={card} 
                  updateCreditCard={updateCreditCard}
                />
              ))}
            </div>
          </GlassCard>
        )}

        <Tabs defaultValue="expenses" className="mt-4">
          <TabsList className="grid w-full grid-cols-3 rounded-full">
            <TabsTrigger value="expenses" className="rounded-full text-xs" data-testid="tab-expenses">
              Expenses
            </TabsTrigger>
            <TabsTrigger value="income" className="rounded-full text-xs" data-testid="tab-income">
              Income
            </TabsTrigger>
            <TabsTrigger value="cards" className="rounded-full text-xs" data-testid="tab-cards">
              Cards
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="mt-4 space-y-3">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">This Month's Expenses</h4>
              {isStudent && (
                <Button variant="outline" size="sm" onClick={() => setAddType("expense")} data-testid="button-add-expense-inline">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              )}
            </div>

            {expensesData?.length === 0 ? (
              <EmptyState
                icon={<DollarSign className="w-8 h-8" />}
                title="No expenses yet"
                description={isStudent ? "Track your spending by adding expenses" : "No expenses recorded this month"}
                action={isStudent ? { label: "Add Expense", onClick: () => setAddType("expense") } : undefined}
              />
            ) : (
              expensesData?.map((expense) => (
                <ExpenseItem 
                  key={expense.id} 
                  expense={expense} 
                  deleteExpense={deleteExpense}
                />
              ))
            )}

            {expensesByCategory.length > 0 && (
              <GlassCard className="mt-6 p-4">
                <h4 className="font-medium mb-4">Expense Breakdown</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensesByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {expensesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            )}
          </TabsContent>

          <TabsContent value="income" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Income Entries</h4>
              {isStudent && (
                <Button variant="outline" size="sm" onClick={() => setAddType("income")} data-testid="button-add-income">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              )}
            </div>

            {(!incomeEntries || incomeEntries.length === 0) ? (
              <EmptyState
                icon={<TrendingUp className="w-8 h-8" />}
                title="No income yet"
                description={isStudent ? "Add your income sources" : "No income recorded this month"}
                action={isStudent ? { label: "Add Income", onClick: () => setAddType("income") } : undefined}
              />
            ) : (
              <div className="space-y-3">
                {incomeEntries.map((entry) => (
                  <IncomeItem 
                    key={entry.id} 
                    entry={entry} 
                    deleteIncomeEntry={deleteIncomeEntry}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cards" className="mt-4 space-y-3">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Credit Cards</h4>
              {isStudent && (
                <Button variant="outline" size="sm" onClick={() => setAddType("card")} data-testid="button-add-card-inline">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              )}
            </div>
            {creditCards?.length === 0 ? (
              <EmptyState
                icon={<CreditCard className="w-8 h-8" />}
                title="No credit cards"
                description={isStudent ? "Add your credit cards to track payments" : "No credit cards added"}
                action={isStudent ? { label: "Add Card", onClick: () => setAddType("card") } : undefined}
              />
            ) : (
              creditCards?.map((card) => (
                <CreditCardItem 
                  key={card.id} 
                  card={card} 
                  updateCreditCard={updateCreditCard}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      {isStudent && (
        <Dialog open={addType !== null} onOpenChange={() => setAddType(null)}>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>
                {addType === "expense" ? "Add Expense" : 
                 addType === "income" ? "Add Income" : 
                 addType === "contribution" ? "Add Contribution" :
                 "Add Card"}
              </DialogTitle>
            </DialogHeader>
            {addType === "expense" && <AddExpenseForm onClose={() => setAddType(null)} addExpense={addExpense} />}
            {addType === "income" && <AddIncomeForm onClose={() => setAddType(null)} addIncomeEntry={addIncomeEntry} />}
            {addType === "contribution" && (
              <AddContributionForm 
                onClose={() => setAddType(null)} 
                addEmergencyFundContribution={addEmergencyFundContribution} 
                updateEmergencyFund={updateEmergencyFund} 
                emergencyFund={emergencyFund} 
              />
            )}
            {addType === "card" && <AddCardForm onClose={() => setAddType(null)} addCreditCard={addCreditCard} />}
          </DialogContent>
        </Dialog>
      )}

      <BottomNav />
    </div>
  );
}

interface ExpenseItemProps {
  expense: StudentDataExpense;
  deleteExpense: (id: string) => Promise<void>;
}

function ExpenseItem({ expense, deleteExpense }: ExpenseItemProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteExpense(expense.id);
      toast({ title: "Expense deleted" });
    } catch {
      toast({ title: "Failed to delete expense", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <GlassCard className="p-4 flex items-center justify-between gap-2">
      <div className="flex items-center gap-3 min-w-0">
        <div 
          className="w-3 h-3 rounded-full shrink-0" 
          style={{ backgroundColor: getCategoryColor(expense.category) }}
        />
        <div className="min-w-0">
          <p className="font-medium truncate">{expense.description}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge 
              variant="outline" 
              className="text-xs"
              style={{ borderColor: getCategoryColor(expense.category), color: getCategoryColor(expense.category) }}
            >
              {expense.category}
            </Badge>
            {expense.isFixed && (
              <Badge variant="outline" className="text-xs">Fixed</Badge>
            )}
            {expense.date && (
              <span className="text-xs text-muted-foreground">{expense.date}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <p className="font-semibold text-red-500">-${expense.amount.toFixed(2)}</p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground" disabled={isDeleting} data-testid={`button-delete-expense-${expense.id}`}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this ${expense.amount.toFixed(2)} expense.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </GlassCard>
  );
}

interface IncomeItemProps {
  entry: StudentDataIncomeEntry;
  deleteIncomeEntry: (id: string) => Promise<void>;
}

function IncomeItem({ entry, deleteIncomeEntry }: IncomeItemProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteIncomeEntry(entry.id);
      toast({ title: "Income entry deleted" });
    } catch {
      toast({ title: "Failed to delete income entry", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const sourceColors: Record<string, string> = {
    Work: "#22c55e",
    Parents: "#3b82f6",
    Other: "#8b5cf6",
  };

  return (
    <GlassCard className="p-4 flex items-center justify-between gap-2">
      <div className="flex items-center gap-3 min-w-0">
        <div 
          className="w-3 h-3 rounded-full shrink-0" 
          style={{ backgroundColor: sourceColors[entry.source] || "#8b5cf6" }}
        />
        <div className="min-w-0">
          <p className="font-medium">${entry.amount.toFixed(2)}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge 
              variant="outline" 
              className="text-xs"
              style={{ borderColor: sourceColors[entry.source] || "#8b5cf6" }}
            >
              {entry.source}
            </Badge>
            <span className="text-xs text-muted-foreground">{entry.date}</span>
          </div>
          {entry.note && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{entry.note}</p>
          )}
        </div>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="text-muted-foreground shrink-0" disabled={isDeleting} data-testid={`button-delete-income-${entry.id}`}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Income Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this ${entry.amount.toFixed(2)} income entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GlassCard>
  );
}

interface ContributionItemProps {
  contribution: StudentDataEmergencyFundContribution;
  deleteEmergencyFundContribution: (id: string) => Promise<void>;
}

function ContributionItem({ contribution, deleteEmergencyFundContribution }: ContributionItemProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteEmergencyFundContribution(contribution.id);
      toast({ title: "Contribution deleted" });
    } catch {
      toast({ title: "Failed to delete contribution", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-green-500">+${contribution.amount.toFixed(2)}</span>
        <span className="text-xs text-muted-foreground">{contribution.date}</span>
        {contribution.note && (
          <span className="text-xs text-muted-foreground truncate max-w-[100px]">{contribution.note}</span>
        )}
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" disabled={isDeleting} data-testid={`button-delete-contribution-${contribution.id}`}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contribution?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove ${contribution.amount.toFixed(2)} from your emergency fund.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface CreditCardItemProps {
  card: StudentDataCreditCard;
  updateCreditCard: (id: string, updates: Partial<StudentDataCreditCard>) => Promise<void>;
}

function CreditCardItem({ card, updateCreditCard }: CreditCardItemProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleTogglePaid = async () => {
    setIsUpdating(true);
    try {
      await updateCreditCard(card.id, { isPaid: !card.isPaid });
      toast({ title: card.isPaid ? "Card marked unpaid" : "Card marked paid" });
    } catch {
      toast({ title: "Failed to update card", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.isPaid ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"}`}>
            {card.isPaid ? <Check className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
          </div>
          <div>
            <p className="font-medium">{card.cardName}</p>
            {card.dueDate && (
              <p className="text-sm text-muted-foreground">
                Due: {format(new Date(card.dueDate), "MMM d")}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold">${card.balance?.toFixed(2) || "0.00"}</p>
          <button
            onClick={handleTogglePaid}
            disabled={isUpdating}
            className={`text-xs ${card.isPaid ? "text-green-500" : "text-yellow-500"}`}
          >
            {isUpdating ? "Updating..." : card.isPaid ? "Paid" : "Mark Paid"}
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

interface AddExpenseFormProps {
  onClose: () => void;
  addExpense: (expense: Omit<StudentDataExpense, "id">) => Promise<void>;
}

function AddExpenseForm({ onClose, addExpense }: AddExpenseFormProps) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    category: "Food",
    description: "",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    isFixed: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      await addExpense({
        month: currentMonth,
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: formData.date,
        isFixed: formData.isFixed,
      });
      toast({ title: "Expense added" });
      onClose();
    } catch {
      toast({ title: "Failed to add expense", variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Category</Label>
        <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXPENSE_CATEGORIES.map((cat) => (
              <SelectItem key={cat.name} value={cat.name}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Description</Label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="What did you spend on?"
          required
          data-testid="input-expense-description"
        />
      </div>
      <div>
        <Label>Amount</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="0.00"
          required
          data-testid="input-expense-amount"
        />
      </div>
      <div>
        <Label>Date</Label>
        <Input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          data-testid="input-expense-date"
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={formData.isFixed}
          onCheckedChange={(v) => setFormData({ ...formData, isFixed: v })}
        />
        <Label>Fixed expense (recurring monthly)</Label>
      </div>
      <Button type="submit" className="w-full rounded-full" disabled={isPending}>
        {isPending ? "Adding..." : "Add Expense"}
      </Button>
    </form>
  );
}

interface AddIncomeFormProps {
  onClose: () => void;
  addIncomeEntry: (entry: Omit<StudentDataIncomeEntry, "id">) => Promise<void>;
}

function AddIncomeForm({ onClose, addIncomeEntry }: AddIncomeFormProps) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    source: "Work",
    date: format(new Date(), "yyyy-MM-dd"),
    note: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      await addIncomeEntry({
        amount: parseFloat(formData.amount),
        source: formData.source,
        date: formData.date,
        note: formData.note || null,
      });
      toast({ title: "Income added" });
      onClose();
    } catch {
      toast({ title: "Failed to add income", variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Amount</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="0.00"
          required
          data-testid="input-income-amount"
        />
      </div>
      <div>
        <Label>Source</Label>
        <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Work">Work</SelectItem>
            <SelectItem value="Parents">Parents</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Date</Label>
        <Input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          data-testid="input-income-date"
        />
      </div>
      <div>
        <Label>Note (optional)</Label>
        <Textarea
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          placeholder="Add a note..."
          className="resize-none"
          data-testid="input-income-note"
        />
      </div>
      <Button type="submit" className="w-full rounded-full" disabled={isPending}>
        {isPending ? "Adding..." : "Add Income"}
      </Button>
    </form>
  );
}

interface AddContributionFormProps {
  onClose: () => void;
  addEmergencyFundContribution: (contribution: Omit<StudentDataEmergencyFundContribution, "id">) => Promise<void>;
  updateEmergencyFund: (amount: number, targetMonths?: number) => Promise<void>;
  emergencyFund: { currentAmount: number; targetMonths: number };
}

function AddContributionForm({ onClose, addEmergencyFundContribution, updateEmergencyFund, emergencyFund }: AddContributionFormProps) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    note: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const contributionAmount = parseFloat(formData.amount);
      await addEmergencyFundContribution({
        amount: contributionAmount,
        date: formData.date,
        note: formData.note || null,
      });
      await updateEmergencyFund(
        emergencyFund.currentAmount + contributionAmount, 
        emergencyFund.targetMonths
      );
      toast({ title: "Contribution added" });
      onClose();
    } catch {
      toast({ title: "Failed to add contribution", variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Amount</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="0.00"
          required
          data-testid="input-contribution-amount"
        />
      </div>
      <div>
        <Label>Date</Label>
        <Input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          data-testid="input-contribution-date"
        />
      </div>
      <div>
        <Label>Note (optional)</Label>
        <Textarea
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          placeholder="What's this contribution for?"
          className="resize-none"
          data-testid="input-contribution-note"
        />
      </div>
      <Button type="submit" className="w-full rounded-full" disabled={isPending}>
        {isPending ? "Adding..." : "Add Contribution"}
      </Button>
    </form>
  );
}

interface AddCardFormProps {
  onClose: () => void;
  addCreditCard: (card: Omit<StudentDataCreditCard, "id">) => Promise<void>;
}

function AddCardForm({ onClose, addCreditCard }: AddCardFormProps) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    cardName: "",
    balance: "",
    dueDate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      await addCreditCard({
        cardName: formData.cardName,
        balance: parseFloat(formData.balance) || 0,
        dueDate: formData.dueDate || null,
        isPaid: false,
      });
      toast({ title: "Card added" });
      onClose();
    } catch {
      toast({ title: "Failed to add card", variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Card Name</Label>
        <Input
          value={formData.cardName}
          onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
          placeholder="e.g. Chase Sapphire"
          required
        />
      </div>
      <div>
        <Label>Balance</Label>
        <Input
          type="number"
          step="0.01"
          value={formData.balance}
          onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
          placeholder="0.00"
        />
      </div>
      <div>
        <Label>Due Date</Label>
        <Input
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
        />
      </div>
      <Button type="submit" className="w-full rounded-full" disabled={isPending}>
        {isPending ? "Adding..." : "Add Card"}
      </Button>
    </form>
  );
}
