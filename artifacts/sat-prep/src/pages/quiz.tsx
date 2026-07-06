import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useStartSession, useGetMe, useAnswerQuestion, useCompleteSession } from "@workspace/api-client-react";
import type { Session, Question, AnswerResult, SessionResult } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, Target, Flame, Diamond, Zap, XCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Quiz() {
  const [, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const startSession = useStartSession();
  const answerQuestion = useAnswerQuestion();
  const completeSession = useCompleteSession();

  const [session, setSession] = useState<Session | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [score, setScore] = useState(0);

  const initRef = useRef(false);
  const startTimeRef = useRef(Date.now());
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || initRef.current) return;
    initRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode") || "practice";
    const category = params.get("category") || "math";
    const difficulty = params.get("difficulty") || "medium";

    startSession.mutate(
      { 
        data: { 
          userId: user.id, 
          mode, 
          category, 
          difficulty, 
          questionCount: mode === "blitz" ? 20 : 5 
        } 
      },
      {
        onSuccess: (data) => {
          setSession(data);
          startTimeRef.current = Date.now();
        }
      }
    );
  }, [user, startSession]);

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
        <h2 className="text-xl font-bold animate-pulse text-primary">INITIALIZING MISSION...</h2>
      </div>
    );
  }

  if (sessionResult) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto text-center space-y-8 flex flex-col items-center justify-center min-h-[70vh]">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto border-2 border-primary shadow-[0_0_30px_var(--color-primary)]">
            <Target className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-black">MISSION ACCOMPLISHED</h1>
          <p className="text-xl text-muted-foreground">Accuracy: {Math.round(sessionResult.accuracyPercent)}%</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <Card className="bg-secondary/50 border-primary/20">
            <CardContent className="p-6">
              <Zap className="w-8 h-8 text-primary mx-auto mb-2" />
              <h3 className="text-3xl font-bold text-white">+{sessionResult.xpGained}</h3>
              <p className="text-muted-foreground uppercase text-xs font-bold tracking-wider">XP Earned</p>
            </CardContent>
          </Card>
          <Card className="bg-secondary/50 border-cyan-500/20">
            <CardContent className="p-6">
              <Diamond className="w-8 h-8 text-cyan-400 mx-auto mb-2 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
              <h3 className="text-3xl font-bold text-white">+{sessionResult.gemsGained}</h3>
              <p className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Gems Found</p>
            </CardContent>
          </Card>
        </div>

        <Button size="lg" className="w-full h-14 text-lg font-bold" onClick={() => setLocation("/")}>
          RETURN TO BASE
        </Button>
      </div>
    );
  }

  const question = session.questions[currentIdx];
  const isAnswered = result !== null;

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [result]);

  const handleSelect = (idx: number) => {
    if (isAnswered || !user) return;
    setSelectedIdx(idx);

    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
    
    answerQuestion.mutate(
      { id: question.id, data: { userId: user.id, selectedIndex: idx, timeSpentSeconds: timeSpent } },
      {
        onSuccess: (data) => {
          setResult(data);
          if (data.correct) setScore(s => s + 1);
        }
      }
    );
  };

  const handleNext = () => {
    if (!user) return;
    
    if (currentIdx < session.questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedIdx(null);
      setResult(null);
      startTimeRef.current = Date.now();
    } else {
      // Complete Session
      const totalTime = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
      completeSession.mutate(
        { id: session.id, data: { userId: user.id, score, totalQuestions: session.questions.length, timeSpentSeconds: totalTime } },
        {
          onSuccess: (data) => {
            setSessionResult(data);
          }
        }
      );
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto flex flex-col min-h-[85vh]">
      {/* HUD Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex-1 mr-8">
          <div className="flex justify-between text-xs font-bold text-muted-foreground mb-2">
            <span>QUESTION {currentIdx + 1} OF {session.questions.length}</span>
            <span className="text-primary">{Math.round((currentIdx / session.questions.length) * 100)}%</span>
          </div>
          <Progress value={(currentIdx / session.questions.length) * 100} className="h-2 bg-secondary [&>div]:bg-primary [&>div]:shadow-[0_0_10px_var(--color-primary)]" />
        </div>
        <div className="flex gap-3">
          {result?.streakBonus ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 bg-orange-500/20 text-orange-500 px-3 py-1.5 rounded-lg border border-orange-500/50">
              <Flame className="w-4 h-4" />
              <span className="font-bold text-sm">COMBO!</span>
            </motion.div>
          ) : null}
        </div>
      </div>

      {/* Question Card */}
      <Card className="flex-1 bg-card border-border shadow-xl flex flex-col">
        <CardContent className="p-6 md:p-8 flex flex-col flex-1">
          <div className="mb-8">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20 mb-4 uppercase tracking-wider">
              {question.subcategory}
            </span>
            <h2 className="text-2xl md:text-3xl font-medium leading-relaxed">
              {question.questionText}
            </h2>
          </div>

          <div className="space-y-3 mt-auto">
            <AnimatePresence mode="wait">
              {question.options.map((opt, idx) => {
                let stateClass = "bg-secondary/50 border-border hover:border-primary/50 hover:bg-secondary";
                let Icon = null;
                
                if (isAnswered) {
                  if (idx === question.correctIndex) {
                    stateClass = "bg-green-500/20 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]";
                    Icon = CheckCircle2;
                  } else if (idx === selectedIdx) {
                    stateClass = "bg-red-500/20 border-red-500 text-white";
                    Icon = XCircle;
                  } else {
                    stateClass = "bg-secondary/20 border-transparent opacity-50";
                  }
                } else if (idx === selectedIdx) {
                  stateClass = "bg-primary/20 border-primary text-white";
                }

                return (
                  <motion.button
                    key={idx}
                    layout
                    disabled={isAnswered || answerQuestion.isPending}
                    onClick={() => handleSelect(idx)}
                    className={cn(
                      "w-full p-4 rounded-xl border-2 text-left text-lg font-medium transition-all duration-300 flex items-center justify-between group",
                      stateClass
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <span className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold border",
                        isAnswered && idx === question.correctIndex ? "bg-green-500 border-green-400 text-white" :
                        isAnswered && idx === selectedIdx ? "bg-red-500 border-red-400 text-white" :
                        "bg-background border-border text-muted-foreground group-hover:text-foreground"
                      )}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {opt}
                    </div>
                    {Icon && <Icon className={cn("w-6 h-6", idx === question.correctIndex ? "text-green-400" : "text-red-400")} />}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Result Feedback */}
      <AnimatePresence>
        {isAnswered && (
          <motion.div
            ref={resultRef}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 pb-4"
          >
            <Card className={cn(
              "border-2 overflow-hidden",
              result.correct ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
            )}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className={cn(
                      "text-xl font-black mb-2 flex items-center gap-2",
                      result.correct ? "text-green-400" : "text-red-400"
                    )}>
                      {result.correct ? (
                        <><CheckCircle2 className="w-6 h-6" /> EXCELLENT!</>
                      ) : (
                        <><XCircle className="w-6 h-6" /> INCORRECT</>
                      )}
                    </h3>
                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                      {question.explanation}
                    </p>
                  </div>
                  {result.correct && (
                    <div className="bg-green-500/20 border border-green-500/50 text-green-400 font-bold px-4 py-2 rounded-xl flex items-center gap-2">
                      <Zap className="w-5 h-5 fill-current" />
                      +{result.xpGained} XP
                    </div>
                  )}
                </div>
                <Button 
                  size="lg" 
                  className={cn(
                    "w-full mt-6 h-14 text-lg font-bold shadow-xl",
                    result.correct 
                      ? "bg-green-600 hover:bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]" 
                      : "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                  )}
                  onClick={handleNext}
                >
                  {currentIdx < session.questions.length - 1 ? "CONTINUE" : "FINISH MISSION"}
                  <ChevronRight className="w-6 h-6 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
