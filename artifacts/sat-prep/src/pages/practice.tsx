import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Zap, Clock, Brain, ChevronRight, BookOpen, PenTool, Hash, Type } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "math", label: "Math", icon: Hash, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  { id: "reading", label: "Reading", icon: BookOpen, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  { id: "writing", label: "Writing", icon: PenTool, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/30" },
  { id: "vocabulary", label: "Vocabulary", icon: Type, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  { id: "grammar", label: "Grammar", icon: Brain, color: "text-pink-500", bg: "bg-pink-500/10", border: "border-pink-500/30" },
];

const MODES = [
  { id: "practice", label: "Practice", description: "Learn at your own pace", icon: Target },
  { id: "timed", label: "Timed", description: "Beat the clock", icon: Clock },
  { id: "blitz", label: "Blitz", description: "Fast-paced rapid fire", icon: Zap },
  { id: "adaptive", label: "Adaptive", description: "Adjusts to your skill", icon: Brain },
];

const DIFFICULTIES = ["easy", "medium", "hard"];

export default function Practice() {
  const [, setLocation] = useLocation();

  const [category, setCategory] = useState<string>("math");
  const [mode, setMode] = useState<string>("practice");
  const [difficulty, setDifficulty] = useState<string>("medium");

  const handleStart = () => {
    setLocation(`/quiz?mode=${mode}&category=${category}&difficulty=${difficulty}`);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 pb-24 md:pb-8">
      <div>
        <h1 className="text-3xl font-black mb-2">Mission Control</h1>
        <p className="text-muted-foreground">Configure your next training session.</p>
      </div>

      <div className="space-y-6">
        {/* Category Selection */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs border border-primary/50">1</span>
            Select Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200",
                  category === cat.id 
                    ? `bg-secondary border-primary shadow-[0_0_15px_rgba(139,92,246,0.3)] scale-105` 
                    : "bg-card border-border hover:bg-secondary/50"
                )}
              >
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-3 border", cat.bg, cat.color, cat.border)}>
                  <cat.icon className="w-6 h-6" />
                </div>
                <span className="font-bold text-sm">{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Mode Selection */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
             <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs border border-primary/50">2</span>
             Select Mode
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MODES.map((m) => (
              <Card 
                key={m.id} 
                className={cn(
                  "cursor-pointer transition-all duration-200 border-2",
                  mode === m.id 
                    ? "bg-secondary border-primary shadow-[inset_0_0_20px_rgba(139,92,246,0.1)]" 
                    : "bg-card border-border hover:border-primary/50"
                )}
                onClick={() => setMode(m.id)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    mode === m.id ? "bg-primary text-white" : "bg-secondary text-muted-foreground border border-border"
                  )}>
                    <m.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{m.label}</h3>
                    <p className="text-sm text-muted-foreground">{m.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Difficulty Selection */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
             <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs border border-primary/50">3</span>
             Select Difficulty
          </h2>
          <div className="flex gap-3">
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficulty(diff)}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl font-bold capitalize transition-all border-2",
                  difficulty === diff 
                    ? "bg-primary text-white border-primary shadow-[0_0_15px_rgba(139,92,246,0.5)]" 
                    : "bg-card text-muted-foreground border-border hover:bg-secondary"
                )}
              >
                {diff}
              </button>
            ))}
          </div>
        </section>

        <div className="pt-6">
          <Button 
            size="lg" 
            className="w-full h-16 text-xl font-black rounded-xl shadow-[0_0_20px_var(--color-primary)] hover:shadow-[0_0_40px_var(--color-primary)] transition-all"
            onClick={handleStart}
          >
            LAUNCH MISSION
            <ChevronRight className="w-6 h-6 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
