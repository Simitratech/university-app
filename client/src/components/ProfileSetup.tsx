import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GlassCard } from "@/components/GlassCard";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, GraduationCap, Users } from "lucide-react";
import type { InsertAppProfile } from "@shared/schema";

interface ProfileSetupProps {
  open: boolean;
  onComplete: () => void;
}

export function ProfileSetup({ open, onComplete }: ProfileSetupProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"student" | "parent">("student");

  const createProfileMutation = useMutation({
    mutationFn: (data: Partial<InsertAppProfile>) => apiRequest("POST", "/api/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Profile created!", description: `Welcome, ${name}!` });
      onComplete();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create profile. Please try again.", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast({ title: "Missing fields", description: "Please fill in your name and email.", variant: "destructive" });
      return;
    }
    createProfileMutation.mutate({ name: name.trim(), email: email.trim(), role });
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Welcome to University App
          </DialogTitle>
          <DialogDescription>
            Let's set up your profile. This will be used to personalize your experience.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="e.g., Michael"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              data-testid="input-profile-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="input-profile-email"
            />
          </div>

          <div className="space-y-3">
            <Label>I am a...</Label>
            <RadioGroup value={role} onValueChange={(v) => setRole(v as "student" | "parent")} className="flex gap-4">
              <label
                className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  role === "student" ? "border-primary bg-primary/10" : "border-muted hover-elevate"
                }`}
              >
                <RadioGroupItem value="student" id="student" className="sr-only" />
                <GraduationCap className="w-5 h-5" />
                <div>
                  <p className="font-medium">Student</p>
                  <p className="text-xs text-muted-foreground">Track my academics</p>
                </div>
              </label>
              <label
                className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  role === "parent" ? "border-primary bg-primary/10" : "border-muted hover-elevate"
                }`}
              >
                <RadioGroupItem value="parent" id="parent" className="sr-only" />
                <Users className="w-5 h-5" />
                <div>
                  <p className="font-medium">Parent</p>
                  <p className="text-xs text-muted-foreground">Support my student</p>
                </div>
              </label>
            </RadioGroup>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={createProfileMutation.isPending}
            data-testid="button-create-profile"
          >
            {createProfileMutation.isPending ? "Creating..." : "Get Started"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
