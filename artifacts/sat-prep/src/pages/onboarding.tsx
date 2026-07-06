import { useState } from "react";
import { useInitUser } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Zap, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateUsername } from "@/App";

interface OnboardingProps {
  onUserCreated: (userId: number) => void;
}

const ADJECTIVES = ["Swift", "Bright", "Sharp", "Elite", "Pro", "Smart", "Quick", "Ace", "Bold", "Keen", "Top", "Prime"];
const NOUNS = ["Scholar", "Learner", "Reader", "Writer", "Solver", "Wizard", "Expert", "Champion", "Star", "Prodigy", "Thinker", "Achiever"];

function randomUsername() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${adj}${noun}${num}`;
}

export default function Onboarding({ onUserCreated }: OnboardingProps) {
  const [username, setUsername] = useState(() => randomUsername());
  const initUser = useInitUser();

  const handleStart = () => {
    initUser.mutate(
      { data: { username } },
      {
        onSuccess: (data) => {
          onUserCreated(data.id);
        },
      }
    );
  };

  const reroll = () => {
    setUsername(randomUsername());
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center dark p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_20px_var(--color-primary)]">
              <Zap className="text-white w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
              ScoreMaster
            </h1>
          </div>

          {/* Headline */}
          <div className="mb-8">
            <h2 className="text-3xl font-black mb-2">Welcome, Scholar.</h2>
            <p className="text-muted-foreground">
              Sharpen your SAT skills, climb the leaderboard, and master every category. Your journey starts here.
            </p>
          </div>

          {/* Username Section */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-3">Your Username</p>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary border border-border">
              <div className="flex-1">
                <p className="font-black text-xl text-white">{username}</p>
                <p className="text-xs text-muted-foreground mt-0.5">This is your unique identity on the leaderboard</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={reroll}
                className="text-muted-foreground hover:text-white shrink-0"
                title="Generate new username"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: "⚡", label: "Earn XP" },
              { icon: "🏆", label: "Leaderboard" },
              { icon: "📊", label: "Track Progress" },
            ].map((f) => (
              <div key={f.label} className="p-3 rounded-xl bg-background border border-border/50 text-center">
                <div className="text-2xl mb-1">{f.icon}</div>
                <p className="text-xs font-bold text-muted-foreground">{f.label}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Button
            size="lg"
            className="w-full h-14 text-lg font-bold rounded-xl shadow-[0_0_20px_var(--color-primary)] hover:shadow-[0_0_30px_var(--color-primary)] transition-all"
            onClick={handleStart}
            disabled={initUser.isPending}
          >
            {initUser.isPending ? (
              <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                Start Your Journey <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          {initUser.isError && (
            <p className="text-red-400 text-sm text-center mt-3">
              Something went wrong. Please try again.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
