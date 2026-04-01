import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Anchor, Ship, CheckCircle2, XCircle, RefreshCcw, Trophy, ChevronRight, HelpCircle, Compass, Waves, Wind } from 'lucide-react';
import { questions, Question } from './questions';

type AppState = 'START' | 'QUIZ' | 'RESULTS';

// Decorative Wave Component
const WaveBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
    <motion.div
      animate={{
        x: [0, -100, 0],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "linear"
      }}
      className="absolute bottom-0 left-0 right-0 h-64 text-blue-400"
    >
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-[200%] h-full fill-current">
        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
      </svg>
    </motion.div>
  </div>
);

export default function App() {
  const [state, setState] = useState<AppState>('START');
  const [level, setLevel] = useState<'KB II' | 'KB III' | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<(Question & { options: string[] })[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const shuffle = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

  const startQuiz = (selectedLevel: 'KB II' | 'KB III') => {
    setLevel(selectedLevel);
    
    // Load history from localStorage
    const historyKey = `seen_questions_${selectedLevel}`;
    const seenIdsRaw = localStorage.getItem(historyKey);
    let seenIds: number[] = seenIdsRaw ? JSON.parse(seenIdsRaw) : [];

    let available = questions.filter(q => q.level === selectedLevel && !seenIds.includes(q.id));
    
    // If not enough questions left, reset history for this level
    if (available.length < 3) {
      seenIds = [];
      available = questions.filter(q => q.level === selectedLevel);
    }

    const randomThree = shuffle(available).slice(0, 3);
    
    // Update history
    const newSeenIds = [...seenIds, ...randomThree.map(q => q.id)];
    localStorage.setItem(historyKey, JSON.stringify(newSeenIds));
    
    const quizData = randomThree.map(q => {
      // Use specific distractors if they exist, otherwise fall back to category logic
      let distractors: string[] = [];
      
      if (q.distractors && q.distractors.length >= 3) {
        distractors = q.distractors.slice(0, 3);
      } else {
        // Find distractors from the same category first
        let categoryAnswers = questions
          .filter(other => other.category === q.category && other.id !== q.id)
          .map(other => other.answer);
        
        // If not enough in category, add from same level
        if (categoryAnswers.length < 3) {
          const levelAnswers = questions
            .filter(other => other.level === q.level && other.id !== q.id && !categoryAnswers.includes(other.answer))
            .map(other => other.answer);
          categoryAnswers = [...categoryAnswers, ...shuffle(levelAnswers)];
        }

        // If still not enough (unlikely), add from all
        if (categoryAnswers.length < 3) {
          const allAnswers = questions
            .filter(other => other.id !== q.id && !categoryAnswers.includes(other.answer))
            .map(other => other.answer);
          categoryAnswers = [...categoryAnswers, ...shuffle(allAnswers)];
        }
        
        distractors = shuffle(Array.from(new Set(categoryAnswers))).slice(0, 3);
      }

      return {
        ...q,
        options: shuffle([q.answer, ...distractors])
      };
    });

    setCurrentQuestions(quizData);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setState('QUIZ');
  };

  const handleAnswer = (answer: string) => {
    if (isAnswered) return;
    setSelectedAnswer(answer);
    setIsAnswered(true);
    if (answer === currentQuestions[currentIndex].answer) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < currentQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setState('RESULTS');
    }
  };

  const reset = () => {
    setState('START');
    setLevel(null);
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] text-slate-900 font-sans selection:bg-blue-100 relative overflow-hidden">
      <WaveBackground />
      
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 text-blue-200 pointer-events-none hidden lg:block">
        <Compass size={120} strokeWidth={1} />
      </div>
      <div className="absolute bottom-10 right-10 text-blue-200 pointer-events-none hidden lg:block">
        <Wind size={120} strokeWidth={1} />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12 relative z-10">
        
        {/* Header */}
        <header className="text-center mb-12">
          <motion.div 
            initial={{ rotate: -10, scale: 0.8, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-[#003366] text-white rounded-full shadow-2xl mb-6 border-4 border-white"
          >
            <Anchor size={40} />
          </motion.div>
          <h1 className="text-5xl font-black tracking-tighter text-[#003366] mb-2 uppercase italic">
            CWO Kielboot Quiz
          </h1>
          <div className="flex items-center justify-center gap-2 text-blue-600 font-bold uppercase tracking-[0.2em] text-xs">
            <Waves size={16} />
            <span>Navigeer door de theorie</span>
            <Waves size={16} />
          </div>
        </header>

        <main>
          <AnimatePresence mode="wait">
            {state === 'START' && (
              <motion.div
                key="start"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -30, opacity: 0 }}
                className="space-y-6"
              >
                <div className="bg-white/80 backdrop-blur-md p-10 rounded-[2rem] shadow-xl border border-white/50 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400"></div>
                  
                  <h2 className="text-2xl font-bold mb-8 text-center text-[#003366]">Kies je CWO Niveau</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <button
                      onClick={() => startQuiz('KB II')}
                      className="group relative flex flex-col items-center p-8 bg-white hover:bg-blue-600 border-2 border-blue-100 hover:border-blue-600 rounded-2xl transition-all duration-500 shadow-sm hover:shadow-blue-200"
                    >
                      <div className="w-16 h-16 bg-blue-50 group-hover:bg-white/20 rounded-full flex items-center justify-center mb-4 transition-colors">
                        <Ship className="text-blue-600 group-hover:text-white transition-colors" size={32} />
                      </div>
                      <span className="font-black text-xl text-[#003366] group-hover:text-white transition-colors">Kielboot 2</span>
                      <span className="text-[10px] text-slate-400 group-hover:text-blue-100 mt-2 uppercase tracking-widest font-bold">Basisvaardigheden</span>
                    </button>

                    <button
                      onClick={() => startQuiz('KB III')}
                      className="group relative flex flex-col items-center p-8 bg-white hover:bg-blue-600 border-2 border-blue-100 hover:border-blue-600 rounded-2xl transition-all duration-500 shadow-sm hover:shadow-blue-200"
                    >
                      <div className="w-16 h-16 bg-blue-50 group-hover:bg-white/20 rounded-full flex items-center justify-center mb-4 transition-colors">
                        <Anchor className="text-blue-600 group-hover:text-white transition-colors" size={32} />
                      </div>
                      <span className="font-black text-xl text-[#003366] group-hover:text-white transition-colors">Kielboot 3</span>
                      <span className="text-[10px] text-slate-400 group-hover:text-blue-100 mt-2 uppercase tracking-widest font-bold">Gevorderd & Theorie</span>
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-4 text-slate-400">
                  <div className="h-px bg-slate-200 flex-1"></div>
                  <p className="text-[10px] uppercase tracking-[0.3em] font-bold">3 willekeurige vragen per sessie</p>
                  <div className="h-px bg-slate-200 flex-1"></div>
                </div>
              </motion.div>
            )}

            {state === 'QUIZ' && currentQuestions[currentIndex] && (
              <motion.div
                key="quiz"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-end px-4">
                  <div>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] block mb-1">Niveau</span>
                    <span className="text-lg font-black text-[#003366]">{level}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Voortgang</span>
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <div 
                          key={i} 
                          className={`h-1.5 w-8 rounded-full transition-colors duration-500 ${i <= currentIndex ? 'bg-blue-600' : 'bg-slate-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-blue-50 relative">
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-black shadow-lg">
                    {currentIndex + 1}
                  </div>
                  
                  <h3 className="text-2xl font-bold leading-tight mb-10 text-[#003366]">
                    {currentQuestions[currentIndex].question}
                  </h3>

                  <div className="space-y-4">
                    {currentQuestions[currentIndex].options.map((option, idx) => {
                      const isCorrect = option === currentQuestions[currentIndex].answer;
                      const isSelected = option === selectedAnswer;
                      
                      let buttonClass = "w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between group ";
                      
                      if (!isAnswered) {
                        buttonClass += "border-slate-100 hover:border-blue-600 hover:bg-blue-50 text-slate-700 hover:translate-x-2";
                      } else {
                        if (isCorrect) {
                          buttonClass += "border-green-500 bg-green-50 text-green-700 ring-4 ring-green-100";
                        } else if (isSelected) {
                          buttonClass += "border-red-500 bg-red-50 text-red-700 ring-4 ring-red-100";
                        } else {
                          buttonClass += "border-slate-50 text-slate-300 opacity-40";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={isAnswered}
                          onClick={() => handleAnswer(option)}
                          className={buttonClass}
                        >
                          <span className="font-medium">{option}</span>
                          {isAnswered && isCorrect && <CheckCircle2 size={24} className="text-green-500 ml-4 flex-shrink-0" />}
                          {isAnswered && isSelected && !isCorrect && <XCircle size={24} className="text-red-500 ml-4 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {isAnswered && (
                  <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={nextQuestion}
                    className="w-full bg-[#003366] text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 hover:bg-blue-900 transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
                  >
                    {currentIndex === 2 ? 'Resultaten' : 'Volgende Vraag'}
                    <ChevronRight size={24} />
                  </motion.button>
                )}
              </motion.div>
            )}

            {state === 'RESULTS' && (
              <motion.div
                key="results"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-blue-50 mb-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-yellow-400"></div>
                  
                  <motion.div 
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-flex items-center justify-center w-28 h-28 bg-yellow-50 text-yellow-600 rounded-full mb-8 border-4 border-yellow-100"
                  >
                    <Trophy size={56} />
                  </motion.div>
                  
                  <h2 className="text-4xl font-black mb-2 text-[#003366] uppercase italic">Behouden Vaart!</h2>
                  <p className="text-slate-500 mb-6 font-medium">Je hebt <span className="text-blue-600 font-black text-2xl">{score}</span> van de 3 vragen correct.</p>
                  
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-10">
                    <p className="text-[#003366] font-bold text-lg leading-snug">
                      {score <= 1 && "Helaas, je hebt geen vlag verdiend. Oefen nog even verder!"}
                      {score === 2 && "Goed gedaan! Je krijgt 1 vlag voor je team."}
                      {score === 3 && (
                        <>
                          Fantastisch! Je krijgt <span className="text-blue-700 underline decoration-2 underline-offset-4">2 vlaggen</span>. 
                          <span className="block mt-2 text-sm font-medium opacity-80 italic">
                            Is alles al veroverd? Dan mag je je vlag wisselen met een vlag van een ander team!
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <button
                      onClick={() => startQuiz(level!)}
                      className="w-full bg-[#003366] text-white py-5 rounded-2xl font-black shadow-xl hover:bg-blue-900 transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
                    >
                      <RefreshCcw size={22} />
                      Opnieuw ({level})
                    </button>
                    <button
                      onClick={reset}
                      className="w-full bg-slate-100 text-slate-600 py-5 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase tracking-widest text-sm"
                    >
                      Kies ander niveau
                    </button>
                  </div>
                </div>
                
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  Gefeliciteerd met het afronden van de quiz!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer info */}
        <footer className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/50 backdrop-blur-sm rounded-full border border-white/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            <HelpCircle size={14} className="text-blue-400" />
            <span>Officiële CWO Kielboot Theorie</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
