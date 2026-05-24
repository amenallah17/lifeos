'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brain, MessageSquare, Play, Sparkles, AlertCircle, Clock } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { useLocalStorage } from '@/lib/usePersistence';
import type { Task, FlashCard, StudySession } from '@/types';

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

const cannedResponses: Record<string, string> = {
  study: "Try the Pomodoro technique: 25 minutes of focused study followed by a 5-minute break. Repeat 4 times, then take a longer break.",
  time: "Use a priority matrix to categorize tasks by urgency and importance. Focus on what matters most each day.",
  motivate: "Remember why you started. Every small step brings you closer to your goals. Progress, not perfection!",
  exam: "Create a study schedule, review past papers, and teach concepts to someone else to reinforce your understanding.",
  focus: "Eliminate distractions, use noise-canceling headphones, and try the 2-minute rule to overcome procrastination.",
  default: "I'm your AI Study Assistant. Ask me about study tips, time management, exam prep, or motivation!",
};

function getCannedResponse(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('study') || q.includes('learn') || q.includes('read')) return cannedResponses.study;
  if (q.includes('time') || q.includes('manage') || q.includes('schedule') || q.includes('plan')) return cannedResponses.time;
  if (q.includes('motiv') || q.includes('tired') || q.includes('burnout') || q.includes('give up')) return cannedResponses.motivate;
  if (q.includes('exam') || q.includes('test') || q.includes('quiz') || q.includes('final')) return cannedResponses.exam;
  if (q.includes('focus') || q.includes('distract') || q.includes('procrast') || q.includes('concentrate')) return cannedResponses.focus;
  return cannedResponses.default;
}

const motivationalTips = [
  "Consistency beats intensity. Study a little every day.",
  "Active recall is one of the most effective study techniques.",
  "Take short breaks every 25-30 minutes to maintain focus.",
  "Teaching concepts to others helps solidify your understanding.",
  "Review material within 24 hours to improve long-term retention.",
  "Stay hydrated and get enough sleep — your brain needs rest to learn.",
  "Mix up your study methods: read, write, speak, and practice.",
];

interface Suggestion {
  id: string;
  type: 'warning' | 'info' | 'tip';
  message: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function AiStudyAssistant() {
  const [tasks] = useLocalStorage<Task[]>('kanban-tasks', []);
  const [flashcards] = useLocalStorage<FlashCard[]>('flashcard-cards', []);
  const [sessions, setSessions] = useLocalStorage<StudySession[]>('study-sessions', []);
  const [savedSuggestions, setSavedSuggestions] = useLocalStorage<Suggestion[]>('ai-suggestions', []);
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');

  const overdueTasks = useMemo(() => {
    return tasks.filter(t => t.due_date && isOverdue(t.due_date) && t.status !== 'done');
  }, [tasks]);

  const cardsDue = useMemo(() => {
    return flashcards.filter(c => c.next_review && (isToday(c.next_review) || isOverdue(c.next_review)));
  }, [flashcards]);

  const studiedToday = useMemo(() => {
    return sessions.some(s => isToday(s.date));
  }, [sessions]);

  const suggestions = useMemo((): Suggestion[] => {
    const result: Suggestion[] = [];
    if (overdueTasks.length > 0) {
      result.push({
        id: 'overdue-tasks',
        type: 'warning',
        message: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}. Consider prioritizing them.`,
      });
    }
    if (cardsDue.length > 0) {
      result.push({
        id: 'cards-due',
        type: 'info',
        message: `You have ${cardsDue.length} card${cardsDue.length > 1 ? 's' : ''} to review.`,
      });
    }
    if (!studiedToday) {
      result.push({
        id: 'no-study',
        type: 'info',
        message: "You haven't studied today. Start a session!",
      });
    }
    if (result.length === 0) {
      const tip = motivationalTips[Math.floor(Math.random() * motivationalTips.length)];
      result.push({
        id: 'motivational-tip',
        type: 'tip',
        message: tip,
      });
    }
    return result;
  }, [overdueTasks, cardsDue, studiedToday]);

  const handleAskQuestion = () => {
    if (!question.trim()) return;
    const answer = getCannedResponse(question);
    setResponse(answer);
    setQuestion('');
  };

  const handleStartSession = () => {
    const newSession: StudySession = {
      id: generateId(),
      duration: 0,
      type: 'study',
      date: new Date().toISOString(),
    };
    setSessions(prev => [...prev, newSession]);
    setSavedSuggestions(prev => [...prev, {
      id: generateId(),
      type: 'tip',
      message: 'New study session started! Keep up the momentum.',
    }]);
  };

  const iconConfig = {
    warning: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    info: { icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    tip: { icon: Sparkles, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  };

  return (
    <GlassCard className="p-5">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/30">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Study Assistant</h3>
            <p className="text-xs text-gray-400">Personalized study insights</p>
          </div>
        </motion.div>

        {/* Suggestions */}
        <motion.div variants={itemVariants} className="space-y-2">
          {suggestions.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl bg-white/60 border border-gray-200/60 p-4">
              <Brain size={24} className="text-gray-300" />
              <p className="mt-2 text-sm text-gray-400">No suggestions available. Add some data to get started!</p>
            </div>
          ) : (
            suggestions.map(s => {
              const cfg = iconConfig[s.type];
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={s.id}
                  className={`flex items-start gap-3 rounded-xl ${cfg.bg} ${cfg.border} border p-3`}
                  whileHover={{ x: 2 }}
                >
                  <div className={`mt-0.5 shrink-0 ${cfg.color}`}>
                    <Icon size={16} />
                  </div>
                    <p className="text-sm text-gray-600">{s.message}</p>
                </motion.div>
              );
            })
          )}
        </motion.div>

        {/* Quick Question */}
        <motion.div variants={itemVariants} className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
            <MessageSquare size={12} />
            Ask a Question
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAskQuestion(); }}
              placeholder="Ask about study tips, motivation, focus..."
              className="flex-1 rounded-xl bg-white/60 border border-gray-200/60 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-500/50 transition-colors"
            />
            <button
              onClick={handleAskQuestion}
              disabled={!question.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white disabled:opacity-50 transition-opacity hover:shadow-lg hover:shadow-indigo-500/30"
            >
              <MessageSquare size={15} />
            </button>
          </div>
          {response && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3"
            >
              <div className="flex items-start gap-2">
                <Brain size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                <p className="text-sm text-emerald-600">{response}</p>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Start Study Session Button */}
        <motion.div variants={itemVariants}>
          <button
            onClick={handleStartSession}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40 active:scale-[0.98]"
          >
            <Play size={16} />
            Start Study Session
          </button>
        </motion.div>
      </motion.div>
    </GlassCard>
  );
}
