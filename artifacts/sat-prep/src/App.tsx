import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import { setExtraHeaders } from "@workspace/api-client-react";

import Home from "@/pages/home";
import Practice from "@/pages/practice";
import Quiz from "@/pages/quiz";
import Flashcards from "@/pages/flashcards";
import Achievements from "@/pages/achievements";
import Leaderboard from "@/pages/leaderboard";
import Stats from "@/pages/stats";
import Daily from "@/pages/daily";
import Onboarding from "@/pages/onboarding";

const queryClient = new QueryClient();

export function generateUsername(): string {
  const ADJECTIVES = ["Swift", "Bright", "Sharp", "Elite", "Pro", "Smart", "Quick", "Ace", "Bold", "Keen", "Top", "Prime"];
  const NOUNS = ["Scholar", "Learner", "Reader", "Writer", "Solver", "Wizard", "Expert", "Champion", "Star", "Prodigy", "Thinker", "Achiever"];
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${adj}${noun}${num}`;
}

function AppRoutes() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/practice" component={Practice} />
        <Route path="/quiz" component={Quiz} />
        <Route path="/flashcards" component={Flashcards} />
        <Route path="/achievements" component={Achievements} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/stats" component={Stats} />
        <Route path="/daily" component={Daily} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  const [isReady, setIsReady] = useState(false);
  const [hasUser, setHasUser] = useState(false);

  useEffect(() => {
    const storedId = localStorage.getItem("userId");
    if (!storedId) {
      setIsReady(true);
      return;
    }

    // Verify the stored userId still exists on the server.
    // If the account was deleted (e.g. app reset), fall back to onboarding.
    setExtraHeaders({ "x-user-id": storedId });

    fetch("/api/users/me", { headers: { "x-user-id": storedId } })
      .then((res) => {
        if (res.ok) {
          setHasUser(true);
        } else {
          // User no longer exists — clear stale data and show onboarding
          localStorage.removeItem("userId");
          setExtraHeaders({});
        }
      })
      .catch(() => {
        // Network error — trust the stored ID and let individual pages handle errors
        setHasUser(true);
      })
      .finally(() => {
        setIsReady(true);
      });
  }, []);

  const handleUserCreated = (userId: number) => {
    localStorage.setItem("userId", userId.toString());
    setExtraHeaders({ "x-user-id": userId.toString() });
    setHasUser(true);
    queryClient.clear();
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center dark">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          {!hasUser ? (
            <Onboarding onUserCreated={handleUserCreated} />
          ) : (
            <AppRoutes />
          )}
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
