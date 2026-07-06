import { useState } from "react";
import { useLocation } from "wouter";
import { useGetDailyChallenge, useGetMe } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Zap, Clock, ShieldCheck, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Daily() {
  const [, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const { data: challenge, isLoading } = useGetDailyChallenge();

  if (isLoading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  }

  if (!challenge) {
    return <div className="p-8 text-center text-muted-foreground">No challenge available today.</div>;
  }

  const handleStart = () => {
    // In a real app, we'd start a special session type for the daily challenge
    // For this demo, we'll route to quiz with mode=blitz as a proxy
    setLocation(`/quiz?mode=blitz&count=${challenge.questions.length}`);
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto flex flex-col min-h-[85vh] justify-center pb-24 md:pb-8">
      
      {challenge.completed ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8">
          <div className="w-32 h-32 rounded-full bg-green-500/20 flex items-center justify-center mx-auto border-4 border-green-500 shadow-[0_0_40px_rgba(34,197,94,0.4)]">
            <ShieldCheck className="w-16 h-16 text-green-400" />
          </div>
          <div>
            <h1 className="text-4xl font-black mb-4">CHALLENGE CLEARED</h1>
            <p className="text-xl text-muted-foreground max-w-md mx-auto">
              You've conquered today's mission. Return tomorrow for a new challenge and more rewards.
            </p>
          </div>
          <Card className="bg-secondary/50 border-border inline-block min-w-[300px]">
            <CardContent className="p-6">
               <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Rewards Claimed</div>
               <div className="flex items-center justify-center gap-2 text-2xl font-black text-primary">
                 <Zap className="w-6 h-6 fill-current" />
                 {challenge.xpBonus} XP BONUS
               </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-black mb-2 text-primary tracking-tight">DAILY DIRECTIVE</h1>
            <p className="text-xl text-muted-foreground">{challenge.theme}</p>
          </div>

          <Card className="bg-card border-2 border-primary/50 shadow-[0_0_30px_rgba(139,92,246,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 bg-primary text-white font-black text-xl rounded-bl-3xl">
              {challenge.bonusMultiplier}x XP
            </div>
            <CardContent className="p-8 md:p-12 space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 bg-secondary/50 p-4 rounded-xl border border-border">
                  <Target className="w-8 h-8 text-blue-400" />
                  <div>
                    <h3 className="font-bold">Objective</h3>
                    <p className="text-sm text-muted-foreground">{challenge.questions.length} Questions</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-secondary/50 p-4 rounded-xl border border-border">
                  <Clock className="w-8 h-8 text-orange-400" />
                  <div>
                    <h3 className="font-bold">Time Limit</h3>
                    <p className="text-sm text-muted-foreground">Blitz Mode</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/30 p-6 rounded-xl text-center">
                <h3 className="font-black text-lg mb-2 flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5 text-primary fill-current" /> COMPLETION REWARD
                </h3>
                <p className="text-3xl font-black text-primary">+{challenge.xpBonus} XP</p>
              </div>

              <Button 
                size="lg" 
                className="w-full h-16 text-xl font-black shadow-[0_0_20px_var(--color-primary)] hover:shadow-[0_0_40px_var(--color-primary)] transition-all"
                onClick={handleStart}
              >
                ACCEPT MISSION <ChevronRight className="w-6 h-6 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
