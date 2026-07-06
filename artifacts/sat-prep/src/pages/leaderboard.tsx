import { useGetLeaderboard, useGetMe } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Trophy, Flame, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const { data: user } = useGetMe();
  const { data: leaderboard, isLoading } = useGetLeaderboard({ limit: 50 });

  if (isLoading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 pb-24 md:pb-8">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
          <Crown className="w-10 h-10 text-yellow-400" />
        </div>
        <h1 className="text-4xl font-black mb-2">Global Rankings</h1>
        <p className="text-muted-foreground text-lg">Top scholars of the week. Resets every Sunday.</p>
      </div>

      <div className="space-y-3">
        {leaderboard?.map((entry, idx) => {
          const isCurrentUser = user?.id === entry.userId;
          const isTop3 = entry.rank <= 3;
          
          let rankStyle = "text-muted-foreground font-bold";
          if (entry.rank === 1) rankStyle = "text-yellow-400 font-black text-2xl drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]";
          else if (entry.rank === 2) rankStyle = "text-gray-300 font-black text-xl drop-shadow-[0_0_5px_rgba(209,213,219,0.8)]";
          else if (entry.rank === 3) rankStyle = "text-amber-600 font-black text-xl drop-shadow-[0_0_5px_rgba(217,119,6,0.8)]";

          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={cn(
                "overflow-hidden transition-transform hover:scale-[1.01]",
                isCurrentUser ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(139,92,246,0.15)]" : "bg-card border-border/50",
                entry.rank === 1 && "border-yellow-500/50 bg-gradient-to-r from-yellow-500/10 to-transparent"
              )}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 text-center">
                    <span className={rankStyle}>
                      {entry.rank === 1 ? <Crown className="w-8 h-8 mx-auto text-yellow-400" /> : `#${entry.rank}`}
                    </span>
                  </div>
                  
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border border-border relative">
                    {entry.avatar ? (
                      <img src={entry.avatar} alt={entry.username} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <UserIcon className="w-6 h-6 text-muted-foreground" />
                    )}
                    {isTop3 && (
                      <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                        <Trophy className={cn("w-4 h-4", 
                          entry.rank === 1 ? "text-yellow-400" : 
                          entry.rank === 2 ? "text-gray-300" : "text-amber-600"
                        )} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className={cn("font-bold text-lg flex items-center gap-2", isCurrentUser && "text-primary")}>
                      {entry.username}
                      {isCurrentUser && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-sm uppercase tracking-wider">You</span>}
                    </h3>
                    <p className="text-xs text-muted-foreground">Level {entry.level}</p>
                  </div>

                  <div className="text-right flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-center">
                      <span className="text-xs text-muted-foreground font-bold mb-1 uppercase">Streak</span>
                      <div className="flex items-center gap-1">
                        <Flame className={cn("w-4 h-4", entry.streak > 0 ? "text-orange-500" : "text-muted-foreground")} />
                        <span className="font-bold">{entry.streak}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-muted-foreground font-bold mb-1 uppercase">Weekly XP</span>
                      <span className="font-black text-xl text-primary">{entry.weeklyXp}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
