import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { UniversityThemeProvider } from "@/lib/university-theme";
import { StudentDataProvider } from "@/lib/student-data-provider";
import { useAuth } from "@/hooks/use-auth";
import { LoadingState } from "@/components/EmptyState";
import { ProfileSetup } from "@/components/ProfileSetup";

import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Degree from "@/pages/Degree";
import EnrolledClasses from "@/pages/EnrolledClasses";
import Study from "@/pages/Study";
import Money from "@/pages/Money";
import Wellness from "@/pages/Wellness";
import WeeklyReport from "@/pages/WeeklyReport";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import type { AppProfile } from "@shared/schema";

function AuthenticatedRoutes() {
  const [profileSetupDismissed, setProfileSetupDismissed] = useState(false);
  
  const { data: profile, isFetched } = useQuery<AppProfile | null>({
    queryKey: ["/api/profile"],
    staleTime: 1000 * 60 * 5,
  });

  const showProfileSetup = isFetched && profile === null && !profileSetupDismissed;

  return (
    <StudentDataProvider>
      <ProfileSetup 
        open={showProfileSetup} 
        onComplete={() => setProfileSetupDismissed(true)} 
      />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/degree" component={Degree} />
        <Route path="/enrolled" component={EnrolledClasses} />
        <Route path="/study" component={Study} />
        <Route path="/money" component={Money} />
        <Route path="/wellness" component={Wellness} />
        <Route path="/reports" component={WeeklyReport} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </StudentDataProvider>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState />
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  return <AuthenticatedRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <UniversityThemeProvider>
          <TooltipProvider>
            <div className="min-h-screen uni-bg-gradient">
              <Router />
            </div>
            <Toaster />
          </TooltipProvider>
        </UniversityThemeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
