'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Plus,
  Flame,
  CalendarDays,
  CheckCircle2,
  TrendingUp,
  Trophy,
  ListChecks,
  Edit3,
  Trash2,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useLocalStorage } from '@/lib/usePersistence';
import type { Goal, Habit, HabitLog } from '@/types';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

type Tab = 'goals' | 'habits';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

function ProgressCircle({ value, size = 80 }: { value: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="url(#circleGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - value / 100) }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-sm font-bold text-white">{value}%</span>
    </div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useLocalStorage<Goal[]>('lifeos-goals', []);
  const [habits, setHabits] = useLocalStorage<Habit[]>('lifeos-habits', []);
  const [habitLogs, setHabitLogs] = useLocalStorage<HabitLog[]>('lifeos-habit-logs', []);
  const [activeTab, setActiveTab] = useState<Tab>('goals');
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', type: 'monthly' as Goal['type'], targetDate: '' });
  const [newHabit, setNewHabit] = useState({ name: '', description: '', frequency: 'daily' as Habit['frequency'] });
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editGoalModal, setEditGoalModal] = useState(false);

  const annualGoals = goals.filter((g) => g.type === 'annual');
  const monthlyGoals = goals.filter((g) => g.type === 'monthly');
  const weeklyGoals = goals.filter((g) => g.type === 'weekly');

  const todayStr = new Date().toISOString().split('T')[0];

  const weekDates = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    return weekDays.map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  }, []);

  function isHabitLogged(habitId: string, date: string): boolean {
    return habitLogs.some((log) => log.habit_id === habitId && log.date === date);
  }

  function toggleHabitLog(habitId: string, date: string) {
    setHabitLogs((prev) => {
      const existing = prev.find((log) => log.habit_id === habitId && log.date === date);
      if (existing) return prev.filter((log) => log.id !== existing.id);
      return [...prev, { id: generateId(), habit_id: habitId, date, completed: 1 }];
    });
  }

  function calculateStreak(habitId: string): number {
    const logs = habitLogs
      .filter((log) => log.habit_id === habitId)
      .map((log) => log.date)
      .sort()
      .reverse();
    if (logs.length === 0) return 0;
    let streak = 1;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (logs[0] !== today && logs[0] !== yesterday) return 0;
    for (let i = 1; i < logs.length; i++) {
      const prev = new Date(logs[i - 1]);
      const curr = new Date(logs[i]);
      const diff = Math.floor((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) streak++;
      else break;
    }
    return streak;
  }

  const totalCompletions = habitLogs.filter((log) => weekDates.includes(log.date)).length;
  const totalPossible = habits.length * 7;
  const completionRate = totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0;

  const maxCurrentStreak = habits.reduce((max, h) => Math.max(max, calculateStreak(h.id)), 0);

  const longestStreak = habits.reduce((max, h) => {
    const logs = habitLogs
      .filter((log) => log.habit_id === h.id)
      .map((log) => log.date)
      .sort();
    if (logs.length === 0) return max;
    let longest = 1;
    let curr = 1;
    for (let i = 1; i < logs.length; i++) {
      const prev = new Date(logs[i - 1]);
      const currD = new Date(logs[i]);
      const diff = Math.floor((currD.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        curr++;
        longest = Math.max(longest, curr);
      } else {
        curr = 1;
      }
    }
    return Math.max(max, longest);
  }, 0);

  function addGoal() {
    if (!newGoal.title.trim()) return;
    const goal: Goal = {
      id: generateId(),
      title: newGoal.title,
      description: newGoal.description,
      type: newGoal.type,
      target_date: newGoal.targetDate,
      progress: 0,
      created_at: new Date().toISOString(),
    };
    setGoals((prev) => [goal, ...prev]);
    setNewGoal({ title: '', description: '', type: 'monthly', targetDate: '' });
    setGoalModalOpen(false);
  }

  function updateGoal(goal: Goal) {
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? goal : g)));
  }

  function deleteGoal(id: string) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  function openEditGoal(goal: Goal) {
    setEditingGoal(goal);
    setEditGoalModal(true);
  }

  function saveEditGoal() {
    if (!editingGoal || !editingGoal.title.trim()) return;
    updateGoal(editingGoal);
    setEditGoalModal(false);
    setEditingGoal(null);
  }

  function setGoalProgress(goalId: string, progress: number) {
    setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, progress } : g)));
  }

  function addHabit() {
    if (!newHabit.name.trim()) return;
    const habit: Habit = {
      id: generateId(),
      name: newHabit.name,
      description: newHabit.description,
      frequency: newHabit.frequency,
      streak: 0,
      created_at: new Date().toISOString(),
    };
    setHabits((prev) => [habit, ...prev]);
    setNewHabit({ name: '', description: '', frequency: 'daily' });
    setHabitModalOpen(false);
  }

  function deleteHabit(id: string) {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setHabitLogs((prev) => prev.filter((log) => log.habit_id !== id));
  }

  return (
    <div className="min-h-screen p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl space-y-6"
      >
        <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/30">
              <Target size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Goals & Habits</h1>
          </div>
          <Button
            onClick={() => activeTab === 'goals' ? setGoalModalOpen(true) : setHabitModalOpen(true)}
            icon={<Plus size={16} />}
          >
            Add {activeTab === 'goals' ? 'Goal' : 'Habit'}
          </Button>
        </motion.div>

        <motion.div variants={itemVariants} className="flex gap-2">
          {(['goals', 'habits'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab === 'goals' ? <Target size={14} className="mr-1.5 inline" /> : <ListChecks size={14} className="mr-1.5 inline" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </motion.div>

        {activeTab === 'goals' && (
          <>
            {annualGoals.length > 0 && (
              <motion.div variants={itemVariants}>
                <h2 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
                  <Trophy size={18} className="text-amber-400" />
                  Annual Goals
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {annualGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={() => openEditGoal(goal)}
                      onDelete={() => deleteGoal(goal.id)}
                      onSetProgress={(p) => setGoalProgress(goal.id, p)}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {monthlyGoals.length > 0 && (
              <motion.div variants={itemVariants}>
                <h2 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
                  <CalendarDays size={18} className="text-sky-400" />
                  Monthly Goals
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {monthlyGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={() => openEditGoal(goal)}
                      onDelete={() => deleteGoal(goal.id)}
                      onSetProgress={(p) => setGoalProgress(goal.id, p)}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {weeklyGoals.length > 0 && (
              <motion.div variants={itemVariants}>
                <h2 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
                  <ListChecks size={18} className="text-emerald-400" />
                  Weekly Goals
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {weeklyGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={() => openEditGoal(goal)}
                      onDelete={() => deleteGoal(goal.id)}
                      onSetProgress={(p) => setGoalProgress(goal.id, p)}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {goals.length === 0 && (
              <motion.div variants={itemVariants}>
                <GlassCard className="flex flex-col items-center gap-3 py-16">
                  <Target size={40} className="text-white/20" />
                  <p className="text-sm text-white/40">No goals yet. Create your first goal to get started.</p>
                  <Button onClick={() => setGoalModalOpen(true)} icon={<Plus size={16} />}>Create Goal</Button>
                </GlassCard>
              </motion.div>
            )}
          </>
        )}

        {activeTab === 'habits' && (
          <>
            <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <GlassCard className="p-5 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
                  <Flame size={22} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{maxCurrentStreak}</p>
                  <p className="text-xs text-white/50">Current Streak</p>
                </div>
              </GlassCard>
              <GlassCard className="p-5 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                  <Trophy size={22} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{longestStreak}</p>
                  <p className="text-xs text-white/50">Longest Streak</p>
                </div>
              </GlassCard>
              <GlassCard className="p-5 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                  <TrendingUp size={22} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{completionRate}%</p>
                  <p className="text-xs text-white/50">Completion Rate</p>
                </div>
              </GlassCard>
            </motion.div>

            {habits.length > 0 ? (
              <motion.div variants={itemVariants}>
                <div className="space-y-3">
                  {habits.map((habit) => {
                    const streak = calculateStreak(habit.id);
                    const completedToday = isHabitLogged(habit.id, todayStr);
                    return (
                      <GlassCard key={habit.id} className="p-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              onClick={() => toggleHabitLog(habit.id, todayStr)}
                              className={`shrink-0 transition-colors ${
                                completedToday ? 'text-emerald-400' : 'text-white/20 hover:text-white/40'
                              }`}
                            >
                              <CheckCircle2 size={28} />
                            </button>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-white">{habit.name}</h3>
                                <Badge variant={streak > 0 ? 'success' : 'default'}>
                                  <Flame size={10} className="mr-1 inline" />
                                  {streak} day{streak !== 1 ? 's' : ''}
                                </Badge>
                                <button
                                  onClick={() => deleteHabit(habit.id)}
                                  className="text-white/20 hover:text-red-400 transition-colors ml-1"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              <p className="text-xs text-white/40 mt-0.5">{habit.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {weekDays.map((day, i) => {
                              const logged = isHabitLogged(habit.id, weekDates[i]);
                              return (
                                <button
                                  key={day}
                                  onClick={() => toggleHabitLog(habit.id, weekDates[i])}
                                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                                    logged
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-white/5 text-white/30 border border-white/5 hover:bg-white/10'
                                  }`}
                                  title={day}
                                >
                                  {day[0]}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div variants={itemVariants}>
                <GlassCard className="flex flex-col items-center gap-3 py-16">
                  <ListChecks size={40} className="text-white/20" />
                  <p className="text-sm text-white/40">No habits yet. Create your first habit to get started.</p>
                  <Button onClick={() => setHabitModalOpen(true)} icon={<Plus size={16} />}>Create Habit</Button>
                </GlassCard>
              </motion.div>
            )}
          </>
        )}
      </motion.div>

      <Modal open={goalModalOpen} onClose={() => setGoalModalOpen(false)}>
        <h2 className="mb-5 text-xl font-bold text-white">New Goal</h2>
        <div className="space-y-4">
          <Input label="Goal Title" placeholder="Enter goal title..." value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} />
          <Input label="Description" placeholder="Describe your goal..." value={newGoal.description} onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Type</label>
            <select value={newGoal.type} onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value as Goal['type'] })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white backdrop-blur-xl focus:border-indigo-500/40 focus:outline-none">
              <option value="annual">Annual</option>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <Input label="Target Date" type="date" value={newGoal.targetDate} onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setGoalModalOpen(false)}>Cancel</Button>
            <Button onClick={addGoal}>Create Goal</Button>
          </div>
        </div>
      </Modal>

      <Modal open={editGoalModal} onClose={() => { setEditGoalModal(false); setEditingGoal(null); }}>
        <h2 className="mb-5 text-xl font-bold text-white">Edit Goal</h2>
        {editingGoal && (
          <div className="space-y-4">
            <Input label="Goal Title" placeholder="Enter goal title..." value={editingGoal.title} onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })} />
            <Input label="Description" placeholder="Describe your goal..." value={editingGoal.description || ''} onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/70">Type</label>
              <select value={editingGoal.type} onChange={(e) => setEditingGoal({ ...editingGoal, type: e.target.value as Goal['type'] })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white backdrop-blur-xl focus:border-indigo-500/40 focus:outline-none">
                <option value="annual">Annual</option>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <Input label="Target Date" type="date" value={editingGoal.target_date || ''} onChange={(e) => setEditingGoal({ ...editingGoal, target_date: e.target.value })} />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => { setEditGoalModal(false); setEditingGoal(null); }}>Cancel</Button>
              <Button onClick={saveEditGoal}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={habitModalOpen} onClose={() => setHabitModalOpen(false)}>
        <h2 className="mb-5 text-xl font-bold text-white">New Habit</h2>
        <div className="space-y-4">
          <Input label="Habit Name" placeholder="Enter habit name..." value={newHabit.name} onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })} />
          <Input label="Description" placeholder="Describe your habit..." value={newHabit.description} onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Frequency</label>
            <select value={newHabit.frequency} onChange={(e) => setNewHabit({ ...newHabit, frequency: e.target.value as Habit['frequency'] })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white backdrop-blur-xl focus:border-indigo-500/40 focus:outline-none">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setHabitModalOpen(false)}>Cancel</Button>
            <Button onClick={addHabit}>Create Habit</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function GoalCard({ goal, onEdit, onDelete, onSetProgress }: {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
  onSetProgress: (p: number) => void;
}) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white">{goal.title}</h3>
          <p className="mt-1 text-sm text-white/50">{goal.description}</p>
        </div>
        <ProgressCircle value={goal.progress} size={64} />
      </div>
      <div className="mb-3">
        <ProgressBar value={goal.progress} showPercentage />
      </div>
      <div className="flex items-center gap-2 text-xs text-white/40 mb-3">
        <CalendarDays size={12} />
        Target: {goal.target_date || 'No date set'}
      </div>
      <div className="flex items-center gap-2 mb-3">
        {[0, 25, 50, 75, 100].map((p) => (
          <button
            key={p}
            onClick={() => onSetProgress(p)}
            className={`px-2 py-1 text-xs rounded-lg transition-all ${
              goal.progress === p
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10 hover:text-white'
            }`}
          >
            {p}%
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
        <button onClick={onEdit} className="flex items-center gap-1 text-xs text-white/40 hover:text-indigo-400 transition-colors">
          <Edit3 size={12} /> Edit
        </button>
        <button onClick={onDelete} className="flex items-center gap-1 text-xs text-white/40 hover:text-red-400 transition-colors">
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </GlassCard>
  );
}
