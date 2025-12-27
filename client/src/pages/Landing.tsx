import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, BookOpen, DollarSign, Dumbbell, Clock, User, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function Landing() {
  const [name, setName] = useState("");
  const [role, setRole] = useState<"student" | "parent">("student");
  const [error, setError] = useState("");
  const { loginAsync, isLoggingIn } = useAuth();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name) {
      setError("Please enter your name");
      return;
    }

    try {
      await loginAsync({ name, role });
      // Wait for cookie to be fully established before navigation
      await new Promise(resolve => setTimeout(resolve, 500));
      // Force page reload to ensure session is picked up
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col uni-gradient">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
        {/* Logo */}
        <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-xl flex items-center justify-center mb-6 shadow-xl border border-white/30">
          <GraduationCap className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 drop-shadow-lg">
          University App
        </h1>
        <p className="text-sm text-white/90 max-w-sm mb-6 drop-shadow">
          Your shared family academic and life platform
        </p>

        {/* Login Form */}
        <div className="w-full max-w-sm p-6 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="name" className="text-white/90">Your Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                data-testid="input-name"
              />
            </div>

            <div className="space-y-2 text-left">
              <Label className="text-white/90">I am a...</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={role === "student" ? "default" : "outline"}
                  className={`flex-1 ${role === "student" 
                    ? "bg-white text-blue-600" 
                    : "bg-white/20 border-white/30 text-white"}`}
                  onClick={() => setRole("student")}
                  data-testid="button-role-student"
                >
                  <User className="w-4 h-4 mr-2" />
                  Student
                </Button>
                <Button
                  type="button"
                  variant={role === "parent" ? "default" : "outline"}
                  className={`flex-1 ${role === "parent" 
                    ? "bg-white text-blue-600" 
                    : "bg-white/20 border-white/30 text-white"}`}
                  onClick={() => setRole("parent")}
                  data-testid="button-role-parent"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Parent
                </Button>
              </div>
            </div>

            {error && (
              <p className="text-red-200 text-sm" data-testid="text-error">{error}</p>
            )}

            <Button 
              type="submit" 
              size="lg" 
              className="w-full rounded-full bg-white text-blue-600 hover:bg-white/90 font-semibold"
              disabled={isLoggingIn}
              data-testid="button-login"
            >
              {isLoggingIn ? "Signing in..." : "Get Started"}
            </Button>
          </form>
        </div>

        <p className="text-xs text-white/60 mt-4 max-w-xs">
          {role === "parent" 
            ? "Parents can view student progress but cannot modify entries" 
            : "Students can track and manage all activities"}
        </p>
      </div>

      {/* Features Grid */}
      <div className="px-6 pb-8">
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          <FeatureCard icon={<BookOpen className="w-5 h-5" />} title="Degree Tracking" />
          <FeatureCard icon={<Clock className="w-5 h-5" />} title="Study Timer" />
          <FeatureCard icon={<DollarSign className="w-5 h-5" />} title="Budget" />
          <FeatureCard icon={<Dumbbell className="w-5 h-5" />} title="Fitness" />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="p-3 rounded-xl bg-white/10 border border-white/20 backdrop-blur-xl">
      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white mb-2">
        {icon}
      </div>
      <p className="text-xs font-medium text-white">{title}</p>
    </div>
  );
}
