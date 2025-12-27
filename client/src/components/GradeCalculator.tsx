import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, TrendingUp } from "lucide-react";

interface GradeCalculatorProps {
  currentGrade?: number;
  className?: string;
}

export function GradeCalculator({ currentGrade = 0, className }: GradeCalculatorProps) {
  const [desiredGrade, setDesiredGrade] = useState("90");
  const [finalWeight, setFinalWeight] = useState("30");
  const [result, setResult] = useState<number | null>(null);

  const calculateNeededScore = () => {
    const desired = parseFloat(desiredGrade);
    const weight = parseFloat(finalWeight) / 100;
    const current = currentGrade;
    
    // Formula: (desired - current * (1 - weight)) / weight
    const needed = (desired - current * (1 - weight)) / weight;
    setResult(Math.round(needed * 10) / 10);
  };

  const getResultMessage = () => {
    if (result === null) return null;
    if (result <= 0) return { text: "You've already achieved this grade! 🎉", color: "text-green-500" };
    if (result <= 60) return { text: "Very achievable! Keep studying.", color: "text-green-500" };
    if (result <= 80) return { text: "Definitely possible with good preparation.", color: "text-blue-500" };
    if (result <= 100) return { text: "Challenging but doable. Study hard!", color: "text-yellow-500" };
    return { text: "This would require extra credit. Talk to your professor.", color: "text-red-500" };
  };

  const resultMessage = getResultMessage();

  return (
    <GlassCard className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Grade Calculator</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        What do you need on your final to get your desired grade?
      </p>

      <div className="space-y-4">
        <div>
          <Label>Current Grade (%)</Label>
          <div className="text-2xl font-bold text-primary">{currentGrade.toFixed(1)}%</div>
        </div>

        <div>
          <Label>Desired Final Grade (%)</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={desiredGrade}
            onChange={(e) => setDesiredGrade(e.target.value)}
            placeholder="e.g., 90"
          />
        </div>

        <div>
          <Label>Final Exam Weight (%)</Label>
          <Input
            type="number"
            min="1"
            max="100"
            value={finalWeight}
            onChange={(e) => setFinalWeight(e.target.value)}
            placeholder="e.g., 30"
          />
        </div>

        <Button onClick={calculateNeededScore} className="w-full">
          <TrendingUp className="w-4 h-4 mr-2" />
          Calculate Needed Score
        </Button>

        {result !== null && (
          <div className="mt-4 p-4 rounded-lg bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground mb-1">You need to score:</p>
            <p className={`text-3xl font-bold ${result > 100 ? 'text-red-500' : result <= 80 ? 'text-green-500' : 'text-yellow-500'}`}>
              {result > 0 ? `${result}%` : "Already achieved!"}
            </p>
            {resultMessage && (
              <p className={`text-sm mt-2 ${resultMessage.color}`}>
                {resultMessage.text}
              </p>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// GPA Simulator Component
interface GPASimulatorProps {
  currentGPA: number;
  completedCredits: number;
  classes: Array<{ courseName: string; credits: number; status: string; gpa?: number | null }>;
}

export function GPASimulator({ currentGPA, completedCredits, classes }: GPASimulatorProps) {
  const [simulations, setSimulations] = useState<Record<string, string>>({});
  const [simulatedGPA, setSimulatedGPA] = useState<number | null>(null);

  const inProgressClasses = classes.filter(c => c.status === "in_progress");

  const gradeToGPA: Record<string, number> = {
    "A": 4.0, "A-": 3.7,
    "B+": 3.3, "B": 3.0, "B-": 2.7,
    "C+": 2.3, "C": 2.0, "C-": 1.7,
    "D+": 1.3, "D": 1.0, "D-": 0.7,
    "F": 0.0
  };

  const calculateSimulatedGPA = () => {
    let totalPoints = currentGPA * completedCredits;
    let totalCredits = completedCredits;

    inProgressClasses.forEach(cls => {
      const grade = simulations[cls.courseName];
      if (grade && gradeToGPA[grade] !== undefined) {
        totalPoints += gradeToGPA[grade] * cls.credits;
        totalCredits += cls.credits;
      }
    });

    if (totalCredits > completedCredits) {
      setSimulatedGPA(Math.round((totalPoints / totalCredits) * 100) / 100);
    }
  };

  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">GPA Simulator</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        See how your current classes will affect your GPA
      </p>

      <div className="mb-4 p-3 rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground">Current GPA</p>
        <p className="text-2xl font-bold">{currentGPA.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground">{completedCredits} credits completed</p>
      </div>

      {inProgressClasses.length > 0 ? (
        <div className="space-y-3">
          {inProgressClasses.map(cls => (
            <div key={cls.courseName} className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{cls.courseName}</p>
                <p className="text-xs text-muted-foreground">{cls.credits} credits</p>
              </div>
              <select
                className="w-20 p-2 rounded border bg-background text-sm"
                value={simulations[cls.courseName] || ""}
                onChange={(e) => setSimulations({ ...simulations, [cls.courseName]: e.target.value })}
              >
                <option value="">Grade</option>
                {Object.keys(gradeToGPA).map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
          ))}

          <Button onClick={calculateSimulatedGPA} className="w-full mt-4">
            Simulate GPA
          </Button>

          {simulatedGPA !== null && (
            <div className="mt-4 p-4 rounded-lg bg-primary/10 text-center">
              <p className="text-sm text-muted-foreground mb-1">Projected GPA</p>
              <p className={`text-3xl font-bold ${
                simulatedGPA >= currentGPA ? 'text-green-500' : 'text-red-500'
              }`}>
                {simulatedGPA.toFixed(2)}
              </p>
              <p className={`text-sm mt-1 ${
                simulatedGPA >= currentGPA ? 'text-green-500' : 'text-red-500'
              }`}>
                {simulatedGPA >= currentGPA 
                  ? `+${(simulatedGPA - currentGPA).toFixed(2)} increase` 
                  : `${(simulatedGPA - currentGPA).toFixed(2)} decrease`}
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No classes in progress to simulate
        </p>
      )}
    </GlassCard>
  );
}
