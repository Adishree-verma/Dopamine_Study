import { useState } from "react";
import { useListDecks, useGetDeckCards, useReviewCard, useGetMe } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Layers, RotateCw, Check, X, ArrowLeft, Brain, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Flashcards() {
  const { data: user } = useGetMe();
  const { data: decks, isLoading: isDecksLoading } = useListDecks();
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);

  if (isDecksLoading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  }

  if (selectedDeckId) {
    return <ReviewSession deckId={selectedDeckId} onBack={() => setSelectedDeckId(null)} userId={user?.id || 1} />;
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-24 md:pb-8">
      <div>
        <h1 className="text-3xl font-black mb-2">Memory Vault</h1>
        <p className="text-muted-foreground">Master vocabulary and concepts using spaced repetition.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decks?.map((deck) => (
          <Card 
            key={deck.id}
            className="group cursor-pointer bg-card border-border hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
            onClick={() => setSelectedDeckId(deck.id)}
          >
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${deck.color}20`, color: deck.color }}>
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{deck.title}</h3>
              <p className="text-sm text-muted-foreground mb-6 line-clamp-2">{deck.description}</p>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="font-medium">{deck.cardCount} Cards</span>
                </div>
                {deck.masteredCount !== undefined && (
                   <span className="text-green-400 font-bold">{Math.round((deck.masteredCount / deck.cardCount) * 100)}% Mastered</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ReviewSession({ deckId, onBack, userId }: { deckId: number, onBack: () => void, userId: number }) {
  const { data: cards, isLoading } = useGetDeckCards(deckId);
  const reviewCard = useReviewCard();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (isLoading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  }

  if (!cards || cards.length === 0 || currentIndex >= cards.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-500/50">
          <Check className="w-12 h-12 text-green-500" />
        </div>
        <div>
          <h2 className="text-3xl font-black mb-2">Deck Complete</h2>
          <p className="text-muted-foreground">You've reviewed all due cards in this deck.</p>
        </div>
        <Button onClick={onBack} size="lg" className="h-12 px-8">Return to Vault</Button>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleRate = (quality: number) => {
    reviewCard.mutate({ id: currentCard.id, data: { userId, quality } });
    setIsFlipped(false);
    setCurrentIndex(i => i + 1);
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto flex flex-col min-h-[85vh]">
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="text-sm font-bold text-muted-foreground">
          CARD {currentIndex + 1} OF {cards.length}
        </div>
      </div>

      {/* Flashcard 3D container */}
      <div className="flex-1 flex flex-col items-center justify-center relative perspective-1000 mb-8 w-full max-w-lg mx-auto">
        <motion.div
          className="w-full aspect-[4/3] cursor-pointer"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
          onClick={() => !isFlipped && setIsFlipped(true)}
        >
          {/* Front */}
          <Card className="absolute inset-0 backface-hidden bg-card border-border shadow-xl flex flex-col items-center justify-center p-8 text-center hover:border-primary/50 transition-colors">
            <CardContent>
              <h2 className="text-3xl md:text-4xl font-black mb-4">{currentCard.front}</h2>
              <div className="flex items-center gap-2 text-muted-foreground font-medium mt-8 opacity-50">
                <RotateCw className="w-5 h-5" /> Tap to reveal
              </div>
            </CardContent>
          </Card>

          {/* Back */}
          <Card 
            className="absolute inset-0 backface-hidden bg-secondary border-primary/30 shadow-[0_0_30px_rgba(139,92,246,0.15)] flex flex-col items-center justify-center p-8 text-center"
            style={{ transform: "rotateY(180deg)" }}
          >
            <CardContent>
              <h3 className="text-2xl font-bold mb-4 text-primary">{currentCard.back}</h3>
              {currentCard.example && (
                <p className="text-lg text-muted-foreground italic max-w-md mx-auto">"{currentCard.example}"</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="h-24">
        <AnimatePresence>
          {isFlipped && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-4 gap-2 md:gap-4"
            >
              <Button 
                variant="outline" 
                className="h-16 flex flex-col gap-1 bg-card hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 border-border"
                onClick={() => handleRate(1)}
              >
                <X className="w-5 h-5" />
                <span className="text-xs font-bold">AGAIN</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 flex flex-col gap-1 bg-card hover:bg-orange-500/20 hover:text-orange-400 hover:border-orange-500/50 border-border"
                onClick={() => handleRate(3)}
              >
                <Brain className="w-5 h-5" />
                <span className="text-xs font-bold">HARD</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 flex flex-col gap-1 bg-card hover:bg-green-500/20 hover:text-green-400 hover:border-green-500/50 border-border"
                onClick={() => handleRate(4)}
              >
                <Check className="w-5 h-5" />
                <span className="text-xs font-bold">GOOD</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 flex flex-col gap-1 bg-card hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/50 border-border"
                onClick={() => handleRate(5)}
              >
                <Zap className="w-5 h-5" />
                <span className="text-xs font-bold">EASY</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
