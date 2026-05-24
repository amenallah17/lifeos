'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Focus,
  Coffee,
  BarChart3,
  History,
  Zap,
  Trophy,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import { useLocalStorage } from '@/lib/usePersistence';
import type { PomodoroSession } from '@/types';

type PomodoroType = 'focus' | 'short-break' | 'long-break';

const DURATIONS: Record<PomodoroType, number> = {
  focus: 25 * 60,
  'short-break': 5 * 60,
  'long-break': 15 * 60,
};

const TYPE_LABELS: Record<PomodoroType, string> = {
  focus: 'Focus',
  'short-break': 'Short Break',
  'long-break': 'Long Break',
};

interface TimerState {
  running: boolean;
  remaining: number;
  type: PomodoroType;
  updatedAt: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function playBeep(): void {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const play = (startTime: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    };
    play(ctx.currentTime);
    play(ctx.currentTime + 0.5);
  } catch {}
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getStreak(sessions: PomodoroSession[]): number {
  const dates = sessions
    .filter((s) => s.type === 'focus' && s.completed === 1)
    .map((s) => s.date)
    .filter(Boolean);

  if (dates.length === 0) return 0;

  const uniqueDays = [...new Set(dates)].sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const latest = new Date(uniqueDays[0] + 'T00:00:00');
  const diffFromToday = Math.round(
    (today.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffFromToday > 1) return 0;

  let checkDate = today;
  if (diffFromToday === 1) checkDate = latest;

  let streak = 0;
  for (const day of uniqueDays) {
    const d = new Date(day + 'T00:00:00');
    const diff = Math.round(
      (checkDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === streak) {
      streak++;
    } else if (diff > streak) {
      break;
    }
  }
  return streak;
}

export default function ProductivityPage() {
  const [timerState, setTimerState] = useLocalStorage<TimerState>('pomo-timer', {
    running: false,
    remaining: DURATIONS.focus,
    type: 'focus',
    updatedAt: Date.now(),
  });
  const [sessions, setSessions] = useLocalStorage<PomodoroSession[]>(
    'pomo-sessions',
    []
  );

  const [remaining, setRemaining] = useState(timerState.remaining);
  const [running, setRunning] = useState(timerState.running);
  const [pomoType, setPomoType] = useState<PomodoroType>(timerState.type);
  const [completedSession, setCompletedSession] = useState(false);
  const [hasRecovered, setHasRecovered] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const pomoTypeRef = useRef(pomoType);
  pomoTypeRef.current = pomoType;

  const completeTimer = useCallback(() => {
    playBeep();
    const currentType = pomoTypeRef.current;
    if (currentType === 'focus') {
      const session: PomodoroSession = {
        id: generateId(),
        duration: DURATIONS[currentType],
        type: 'focus',
        completed: 1,
        date: getToday(),
      };
      setSessions((prev) => [...prev, session]);
      setCompletedSession(true);
    }
    setRunning(false);
  }, [setSessions]);

  // Recover timer state on mount (page refresh while running)
  useEffect(() => {
    let shouldBeep = false;
    if (timerState.running && timerState.remaining > 0) {
      const elapsed = Math.floor(
        (Date.now() - timerState.updatedAt) / 1000
      );
      const newRemaining = Math.max(0, timerState.remaining - elapsed);
      setRemaining(newRemaining);
      if (newRemaining <= 0) {
        setRunning(false);
        if (timerState.type === 'focus') {
          const session: PomodoroSession = {
            id: generateId(),
            duration: timerState.remaining,
            type: 'focus',
            completed: 1,
            date: getToday(),
          };
          setSessions((prev) => [...prev, session]);
          setCompletedSession(true);
        }
        shouldBeep = true;
      } else {
        setRunning(true);
      }
    } else if (timerState.running) {
      setRunning(false);
    }
    setHasRecovered(true);
    if (shouldBeep) setTimeout(playBeep, 200);
  }, []);

  // Interval tick
  useEffect(() => {
    if (!hasRecovered || !running) return;
    intervalRef.current = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [hasRecovered, running]);

  // Completion watcher
  useEffect(() => {
    if (hasRecovered && remaining === 0 && running) {
      completeTimer();
    }
  }, [remaining, running, hasRecovered, completeTimer]);

  // Persist timer state
  useEffect(() => {
    if (hasRecovered) {
      setTimerState({
        running,
        remaining,
        type: pomoType,
        updatedAt: Date.now(),
      });
    }
  }, [running, remaining, pomoType, hasRecovered, setTimerState]);

  const toggleTimer = useCallback(() => {
    if (remaining <= 0) {
      const duration = DURATIONS[pomoType];
      setRemaining(duration);
      setRunning(true);
      setCompletedSession(false);
    } else {
      setRunning((prev) => !prev);
    }
  }, [remaining, pomoType]);

  const resetTimer = useCallback(() => {
    setRunning(false);
    setCompletedSession(false);
    setRemaining(DURATIONS[pomoType]);
  }, [pomoType]);

  const changeType = useCallback((type: PomodoroType) => {
    setRunning(false);
    setCompletedSession(false);
    setPomoType(type);
    setRemaining(DURATIONS[type]);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggleTimer();
      } else if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        resetTimer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTimer, resetTimer]);

  // Stats
  const todaySessions = sessions.filter((s) => s.date === getToday());
  const todayFocusSessions = todaySessions.filter(
    (s) => s.type === 'focus' && s.completed
  );
  const todayFocusTime = todayFocusSessions.reduce(
    (sum, s) => sum + s.duration,
    0
  );
  const totalFocusSessions = sessions.filter(
    (s) => s.type === 'focus' && s.completed
  ).length;
  const streak = getStreak(sessions);
  const recentSessions = [...sessions].reverse().slice(0, 10);

  const progress =
    DURATIONS[pomoType] > 0 ? 1 - remaining / DURATIONS[pomoType] : 0;
  const circumference = 2 * Math.PI * 96;

  return (
    <div className="min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto max-w-7xl space-y-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/30">
            <Zap size={20} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Productivity
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Main Timer */}
          <div className="space-y-6 xl:col-span-2">
            <GlassCard className="p-6">
              <div className="flex flex-col items-center">
                {/* Mode Toggle */}
                <div className="mb-4 flex gap-1.5 sm:gap-2">
                  {(
                    ['focus', 'short-break', 'long-break'] as PomodoroType[]
                  ).map((type) => (
                    <motion.button
                      key={type}
                      onClick={() => changeType(type)}
                      whileTap={{ scale: 0.95 }}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all sm:px-3 ${
                        pomoType === type
                          ? 'bg-white/10 text-white shadow-sm'
                          : 'text-white/40 hover:text-white/70'
                      }`}
                    >
                      {type === 'focus' ? (
                        <Focus size={12} className="mr-1 inline" />
                      ) : (
                        <Coffee size={12} className="mr-1 inline" />
                      )}
                      {TYPE_LABELS[type]}
                    </motion.button>
                  ))}
                </div>

                {/* Timer + Progress Ring */}
                <div className="relative mb-6">
                  <svg
                    width="220"
                    height="220"
                    viewBox="0 0 220 220"
                    className="-rotate-90"
                  >
                    <defs>
                      <linearGradient
                        id="pomoGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="110"
                      cy="110"
                      r="96"
                      fill="none"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="8"
                    />
                    <motion.circle
                      cx="110"
                      cy="110"
                      r="96"
                      fill="none"
                      stroke="url(#pomoGradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      initial={false}
                      animate={{
                        strokeDashoffset: circumference * (1 - progress),
                      }}
                      transition={{ duration: 0.5, ease: 'linear' }}
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`${pomoType}-${Math.floor(remaining / 10)}`}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ duration: 0.15 }}
                        className="font-mono text-5xl font-light tracking-[0.1em] text-white"
                      >
                        {formatTime(remaining)}
                      </motion.span>
                    </AnimatePresence>
                    <span className="mt-1 text-xs text-white/40 uppercase tracking-wider">
                      {TYPE_LABELS[pomoType]}
                      {completedSession && pomoType === 'focus' && (
                        <motion.span
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="ml-2 text-emerald-400"
                        >
                          &#10003; Done
                        </motion.span>
                      )}
                    </span>
                    <AnimatePresence>
                      {running ? (
                        <motion.span
                          key="running"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="mt-1 text-[10px] text-white/20 uppercase tracking-widest"
                        >
                          &#9679; Running
                        </motion.span>
                      ) : remaining > 0 &&
                        remaining < DURATIONS[pomoType] ? (
                        <motion.span
                          key="paused"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="mt-1 text-[10px] text-white/20 uppercase tracking-widest"
                        >
                          &#9632; Paused
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex gap-3">
                  <Button
                    onClick={toggleTimer}
                    icon={
                      running ? <Pause size={16} /> : <Play size={16} />
                    }
                    className="min-w-[130px]"
                  >
                    {running
                      ? 'Pause'
                      : remaining <= 0
                        ? 'Start'
                        : remaining === DURATIONS[pomoType]
                          ? 'Start'
                          : 'Resume'}
                  </Button>
                  <Button
                    variant="ghost"
                    icon={<RotateCcw size={16} />}
                    onClick={resetTimer}
                  >
                    Reset
                  </Button>
                </div>

                {/* Shortcut hints */}
                <div className="mt-4 flex gap-4 text-[10px] text-white/20">
                  <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px]">
                    Space
                  </kbd>
                  <span className="text-white/20">Toggle</span>
                  <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px]">
                    R
                  </kbd>
                  <span className="text-white/20">Reset</span>
                </div>

                {/* Session Counter */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 flex items-center gap-2 rounded-xl bg-white/[0.03] px-4 py-2"
                >
                  <Trophy size={14} className="text-amber-400/60" />
                  <span className="text-xs text-white/40">
                    Today&apos;s Pomodoros:
                  </span>
                  <motion.span
                    key={todayFocusSessions.length}
                    initial={{ scale: 1.4 }}
                    animate={{ scale: 1 }}
                    className="text-sm font-semibold text-white"
                  >
                    {todayFocusSessions.length}
                  </motion.span>
                </motion.div>
              </div>
            </GlassCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <GlassCard className="p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/40">
                <BarChart3 size={16} />
                Today&apos;s Statistics
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Focus Time</span>
                    <span className="font-medium text-white">
                      {Math.floor(todayFocusTime / 60)}h{' '}
                      {todayFocusTime % 60}m
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, (todayFocusTime / (8 * 25 * 60)) * 100)}%`,
                      }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Sessions Today</span>
                    <span className="font-medium text-white">
                      {todayFocusSessions.length}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, (todayFocusSessions.length / 8) * 100)}%`,
                      }}
                      transition={{
                        duration: 1,
                        ease: 'easeOut',
                        delay: 0.1,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Total Sessions</span>
                    <span className="font-medium text-white">
                      {totalFocusSessions}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, (totalFocusSessions / 50) * 100)}%`,
                      }}
                      transition={{
                        duration: 1,
                        ease: 'easeOut',
                        delay: 0.2,
                      }}
                    />
                  </div>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-5 flex items-center gap-2 rounded-xl bg-indigo-500/10 px-4 py-3"
              >
                <Zap size={16} className="text-indigo-400 shrink-0" />
                <span className="text-sm text-white/70">
                  {streak > 0 ? (
                    <>
                      You&apos;re on a{' '}
                      <strong className="text-white">
                        {streak}-day streak
                      </strong>
                      !
                    </>
                  ) : (
                    <>Complete a pomodoro to start your streak</>
                  )}
                </span>
              </motion.div>
            </GlassCard>

            <GlassCard className="p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/40">
                <History size={16} />
                Recent Sessions
              </h3>
              <div className="space-y-1.5">
                {recentSessions.length === 0 ? (
                  <p className="py-4 text-center text-xs text-white/30">
                    No sessions yet
                  </p>
                ) : (
                  recentSessions.slice(0, 6).map((session, i) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${
                            session.completed
                              ? 'bg-emerald-400'
                              : 'bg-white/20'
                          }`}
                        />
                        <span className="text-xs text-white/40">
                          {session.type === 'focus'
                            ? 'Focus'
                            : session.type === 'short-break'
                              ? 'Short Break'
                              : 'Long Break'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-white/30">
                          {session.date === getToday()
                            ? 'Today'
                            : session.date.slice(5)}
                        </span>
                        <span className="font-mono text-xs text-white/60">
                          {Math.floor(session.duration / 60)}m
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
                {recentSessions.length > 6 && (
                  <p className="pt-1 text-center text-[10px] text-white/20">
                    +{recentSessions.length - 6} more
                  </p>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
