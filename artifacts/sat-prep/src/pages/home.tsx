import { useGetMe, useGetMyStats, useListSessions } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Play, Flame, Trophy, Target, ArrowRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function Home() {
  const { data: user, isLoading: isUserLoading } = useGetMe();
  const { data: stats, isLoading: isStatsLoading } = useGetMyStats();
  const { data: sessions } = useListSessions({ limit: 3 });

  if (isUserLoading || isStatsLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground font-mono">LOADING HUD...</p>
        </div>
      </div>
    );
  }

  if (!user || !stats) return null;

  const xpProgress = (user.xp % 1000) / 10; // Assuming 1000 XP per level

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-24 md:pb-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-card border border-border p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight">
              Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">{user.username}</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl">
              Ready to crush your goals today? Your streak is calling.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/practice">
                <Button size="lg" className="h-14 px-8 text-lg font-bold rounded-xl shadow-[0_0_20px_var(--color-primary)] hover:shadow-[0_0_30px_var(--color-primary)] transition-all">
                  <Play className="w-6 h-6 mr-2 fill-current" /> Quick Start
                </Button>
              </Link>
              <Link href="/daily">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold rounded-xl bg-card hover:bg-secondary border-primary/30">
                  <Target className="w-6 h-6 mr-2 text-primary" /> Daily Challenge
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Level & XP Card */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card border-border/50 h-full">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">CURRENT LEVEL</p>
                  <h3 className="text-4xl font-black text-white">{user.level}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
              </div>
              
              <div className="space-y-2 mt-auto">
                <div className="flex justify-between text-sm font-medium">
                  <span>{user.xp % 1000} XP</span>
                  <span className="text-muted-foreground">1000 XP</span>
                </div>
                <Progress value={xpProgress} className="h-3 bg-secondary [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-blue-500" />
                <p className="text-xs text-center text-muted-foreground mt-2">{1000 - (user.xp % 1000)} XP to next level</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Summary */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="md:col-span-2">
          <Card className="bg-card border-border/50 h-full">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Performance Overview
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-secondary/50 border border-border text-center">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">STREAK</p>
                  <p className="text-2xl font-black flex items-center justify-center gap-1">
                    <Flame className={cn("w-5 h-5", user.streak > 0 ? "text-orange-500" : "text-muted-foreground")} />
                    {user.streak}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 border border-border text-center">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">ACCURACY</p>
                  <p className="text-2xl font-black text-green-400">{Math.round(stats.accuracyPercent)}%</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 border border-border text-center">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">ANSWERED</p>
                  <p className="text-2xl font-black text-blue-400">{stats.totalAnswered}</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 border border-border text-center">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">RANK</p>
                  <p className="text-2xl font-black text-purple-400">#{stats.rank}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Recent Missions</h2>
          <Link href="/stats">
             <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
               View All <ArrowRight className="w-4 h-4 ml-1" />
             </Button>
          </Link>
        </div>
        
        <div className="space-y-3">
          {sessions && sessions.length > 0 ? (
            sessions.map((session, i) => (
              <Card key={session.id} className="bg-card border-border/50 hover:bg-secondary/20 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold capitalize">{session.mode} Mode</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.startedAt).toLocaleDateString()} • {session.questions.length} Questions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-400">{session.score} Correct</p>
                    <p className="text-sm text-muted-foreground">{session.status}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
             <div className="text-center p-8 bg-card border border-border rounded-xl">
               <p className="text-muted-foreground mb-4">No recent activity found. Start your first mission!</p>
               <Link href="/practice">
                 <Button>Start Practice</Button>
               </Link>
             </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
