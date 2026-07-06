import { useListAchievements, useGetUserAchievements } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Star, Shield, Crown, Zap, Flame, Target } from "lucide-react";
import { cn } from "@/lib/utils";

// Map server rarity to visual styles
const RARITY_STYLES: Record<string, { color: string, border: string, bg: string, glow: string }> = {
  common: { color: "text-gray-400", border: "border-gray-500/30", bg: "bg-gray-500/10", glow: "hover:shadow-[0_0_15px_rgba(156,163,175,0.3)]" },
  rare: { color: "text-blue-400", border: "border-blue-500/40", bg: "bg-blue-500/10", glow: "hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]" },
  epic: { color: "text-purple-400", border: "border-purple-500/50", bg: "bg-purple-500/10", glow: "hover:shadow-[0_0_25px_rgba(168,85,247,0.5)]" },
  legendary: { color: "text-yellow-400", border: "border-yellow-500/60", bg: "bg-yellow-500/10", glow: "hover:shadow-[0_0_30px_rgba(234,179,8,0.6)]" },
};

const ICON_MAP: Record<string, React.ElementType> = {
  "trophy": Trophy,
  "star": Star,
  "shield": Shield,
  "crown": Crown,
  "zap": Zap,
  "flame": Flame,
  "target": Target
};

export default function Achievements() {
  const { data: allAchievements, isLoading: isAllLoading } = useListAchievements();
  const { data: userAchievements, isLoading: isUserLoading } = useGetUserAchievements();

  if (isAllLoading || isUserLoading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  }

  const earnedIds = new Set(userAchievements?.map(ua => ua.achievement.id) || []);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-2">Trophy Room</h1>
          <p className="text-muted-foreground">Unlock legendary badges and show off your mastery.</p>
        </div>
        <div className="bg-secondary/50 border border-border px-4 py-2 rounded-xl flex items-center gap-3">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <span className="font-bold">{earnedIds.size} / {allAchievements?.length || 0} UNLOCKED</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {allAchievements?.map((achievement, i) => {
          const isUnlocked = earnedIds.has(achievement.id);
          const style = RARITY_STYLES[achievement.rarity] || RARITY_STYLES.common;
          const Icon = ICON_MAP[achievement.icon] || Trophy;

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card 
                className={cn(
                  "h-full overflow-hidden transition-all duration-300 relative group",
                  isUnlocked 
                    ? cn("bg-card", style.border, style.glow) 
                    : "bg-secondary/30 border-border/50 opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                )}
              >
                {isUnlocked && (
                  <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-br from-transparent via-transparent to-current", style.color)} />
                )}
                
                <CardContent className="p-6 flex flex-col items-center text-center h-full relative z-10">
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110",
                    isUnlocked ? cn(style.bg, style.color, "border", style.border) : "bg-secondary text-muted-foreground"
                  )}>
                    <Icon className="w-8 h-8" />
                  </div>
                  
                  <h3 className={cn(
                    "font-bold mb-2",
                    isUnlocked ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {achievement.title}
                  </h3>
                  
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-3">
                    {achievement.description}
                  </p>
                  
                  <div className="mt-auto">
                    <span className={cn(
                      "text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded-sm",
                      isUnlocked ? cn(style.bg, style.color) : "bg-background text-muted-foreground"
                    )}>
                      {achievement.rarity}
                    </span>
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
