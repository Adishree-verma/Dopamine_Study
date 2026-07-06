import { Link, useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { Home, Dumbbell, Layers, Trophy, Crown, BarChart2, Calendar, Flame, Diamond, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/practice", label: "Practice", icon: Dumbbell },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
  { href: "/daily", label: "Daily Challenge", icon: Calendar },
  { href: "/achievements", label: "Achievements", icon: Trophy },
  { href: "/leaderboard", label: "Leaderboard", icon: Crown },
  { href: "/stats", label: "Stats", icon: BarChart2 },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: user } = useGetMe();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row dark">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r border-border flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_15px_var(--color-primary)]">
            <Zap className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
            ScoreMaster
          </h1>
        </div>

        {user && (
          <div className="px-6 pb-6 border-b border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold truncate max-w-[130px]" title={user.username}>{user.username}</span>
              <span className="text-xs font-mono bg-primary/20 text-primary px-2 py-1 rounded-full border border-primary/30 shrink-0">
                Lv {user.level}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="flex items-center gap-1.5 bg-background p-2 rounded-lg border border-border">
                <Flame className={cn("w-4 h-4", user.streak > 0 ? "text-orange-500 drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]" : "text-muted-foreground")} />
                <span className="text-sm font-bold">{user.streak}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-background p-2 rounded-lg border border-border">
                <Diamond className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
                <span className="text-sm font-bold">{user.gems}</span>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer relative overflow-hidden group",
                    isActive
                      ? "text-white bg-primary/10 border border-primary/30 shadow-[inset_0_0_20px_rgba(139,92,246,0.1)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                  <item.icon className={cn("w-5 h-5", isActive && "text-primary drop-shadow-[0_0_5px_var(--color-primary)]")} />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="text-white w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold">ScoreMaster</h1>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Flame className={cn("w-4 h-4", user.streak > 0 ? "text-orange-500" : "text-muted-foreground")} />
              <span className="text-sm font-bold">{user.streak}</span>
            </div>
            <div className="flex items-center gap-1">
              <Diamond className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold">{user.gems}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex items-center justify-around p-2 pb-safe z-50">
        {navItems.slice(0, 5).map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn("flex flex-col items-center p-2 rounded-lg", isActive ? "text-primary" : "text-muted-foreground")}>
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
