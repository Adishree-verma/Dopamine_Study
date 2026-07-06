import { useGetMyStats, useGetCategoryStats, useGetProgressHistory } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Cell } from "recharts";
import { Activity, Target, Brain, Award, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Stats() {
  const { data: stats, isLoading: isStatsLoading } = useGetMyStats();
  const { data: catStats, isLoading: isCatLoading } = useGetCategoryStats();
  const { data: history, isLoading: isHistoryLoading } = useGetProgressHistory();

  if (isStatsLoading || isCatLoading || isHistoryLoading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  }

  if (!stats) return null;

  const weakAreas = (catStats ?? [])
    .filter(c => c.totalAnswered >= 3 && c.accuracyPercent < 60)
    .sort((a, b) => a.accuracyPercent - b.accuracyPercent);

  const strongAreas = (catStats ?? [])
    .filter(c => c.totalAnswered >= 3 && c.accuracyPercent >= 75)
    .sort((a, b) => b.accuracyPercent - a.accuracyPercent);

  const categoryColors: Record<string, string> = {
    math: "#6366f1",
    reading: "#3b82f6",
    writing: "#10b981",
    vocabulary: "#8b5cf6",
    grammar: "#f59e0b",
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-24 md:pb-8">
      <div>
        <h1 className="text-3xl font-black mb-2">Performance Analytics</h1>
        <p className="text-muted-foreground">Data-driven insights to guide your training.</p>
      </div>

      {/* Top Level KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-6">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-4 text-primary">
              <Activity className="w-5 h-5" />
            </div>
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-1">Total XP</p>
            <h3 className="text-3xl font-black">{stats.totalXp}</h3>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-6">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-4 text-green-500">
              <Target className="w-5 h-5" />
            </div>
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-1">Accuracy</p>
            <h3 className="text-3xl font-black">{Math.round(stats.accuracyPercent)}%</h3>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-6">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 text-blue-500">
              <Brain className="w-5 h-5" />
            </div>
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-1">Questions</p>
            <h3 className="text-3xl font-black">{stats.totalAnswered}</h3>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-6">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center mb-4 text-orange-500">
              <Award className="w-5 h-5" />
            </div>
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-1">Max Streak</p>
            <h3 className="text-3xl font-black">{stats.maxStreak}</h3>
          </CardContent>
        </Card>
      </div>

      {/* Weak Score / Strong Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weak Areas */}
        <Card className={cn("bg-card border-border/50", weakAreas.length > 0 && "border-red-500/30")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className={cn("w-5 h-5", weakAreas.length > 0 ? "text-red-400" : "text-muted-foreground")} />
              Weak Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weakAreas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">
                  {(catStats ?? []).some(c => c.totalAnswered >= 3)
                    ? "No weak areas detected — great work!"
                    : "Answer at least 3 questions per category to see weak areas."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {weakAreas.map(cat => (
                  <div key={cat.category} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                    <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold capitalize">{cat.category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500 rounded-full"
                            style={{ width: `${cat.accuracyPercent}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-red-400 shrink-0">{cat.accuracyPercent}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{cat.totalAnswered} attempts, {cat.totalCorrect} correct</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Strong Areas */}
        <Card className={cn("bg-card border-border/50", strongAreas.length > 0 && "border-green-500/30")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className={cn("w-5 h-5", strongAreas.length > 0 ? "text-green-400" : "text-muted-foreground")} />
              Strong Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {strongAreas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">
                  Keep practicing to build strong areas!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {strongAreas.map(cat => (
                  <div key={cat.category} className="flex items-center gap-3 p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold capitalize">{cat.category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${cat.accuracyPercent}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-green-400 shrink-0">{cat.accuracyPercent}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{cat.totalAnswered} attempts, {cat.totalCorrect} correct</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* XP History Chart */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-primary" /> XP Velocity (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(val) => new Date(val).getDate().toString()} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area type="monotone" dataKey="xpGained" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorXp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Accuracy Chart */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-blue-500" /> Accuracy by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={catStats || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(val) => val.substring(0,3).toUpperCase()} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--secondary))' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number, name: string) => [`${value}%`, 'Accuracy']}
                  />
                  <Bar dataKey="accuracyPercent" radius={[4, 4, 0, 0]} maxBarSize={50}>
                    {(catStats || []).map((entry) => (
                      <Cell
                        key={entry.category}
                        fill={entry.accuracyPercent < 60 && entry.totalAnswered >= 3
                          ? "#ef4444"
                          : categoryColors[entry.category] ?? "hsl(var(--primary))"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">Red bars indicate weak areas (below 60% accuracy)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
