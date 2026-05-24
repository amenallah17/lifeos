'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap, BookOpen, Calendar, Clock, FileText, CheckCircle,
  AlertCircle, Star, Search, Plus, TrendingUp, Layers, ChevronRight,
  ArrowRight, BarChart3, Target, Pen, Upload, Eye, Timer, Bell,
  Network, Monitor, GitBranch, Sigma, Database, Code2, Globe,
  ChevronDown, Pin, Circle, Zap, Trash2, Edit3,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useLocalStorage } from '@/lib/usePersistence';
import AiStudyAssistant from '@/components/dashboard/AiStudyAssistant';
import { UniSubject, Exam, Assignment, Lecture, UniNote } from '@/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

const PRESET_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];

const defaultIconMap: Record<string, React.ReactNode> = {
  Networks: <Network size={18} />,
  'Operating Systems': <Monitor size={18} />,
  Algorithms: <GitBranch size={18} />,
  Mathematics: <Sigma size={18} />,
  Databases: <Database size={18} />,
  Programming: <Code2 size={18} />,
  'Web Development': <Globe size={18} />,
};

function getSubjectIcon(name: string) {
  return defaultIconMap[name] ?? <BookOpen size={18} />;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending': return { label: 'Pending', variant: 'warning' as const };
    case 'submitted': return { label: 'Submitted', variant: 'success' as const };
    case 'graded': return { label: 'Graded', variant: 'default' as const };
    default: return { label: status, variant: 'default' as const };
  }
}

function getPriorityLabel(p: string) {
  if (p === 'high') return 'High';
  if (p === 'medium') return 'Medium';
  return 'Low';
}

function getDaysLeft(dateStr: string): number {
  if (!dateStr) return 99;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.max(0, Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatDateDisplay(d: string) {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getSubjectColor(subjectId: string, subjects: UniSubject[]): string {
  const s = subjects.find(sub => sub.id === subjectId);
  return s?.color ?? '#6366f1';
}

function getSubjectName(subjectId: string, subjects: UniSubject[]): string {
  const s = subjects.find(sub => sub.id === subjectId);
  return s?.name ?? 'Unknown';
}

export default function StudyPage() {
  const [subjects, setSubjects] = useLocalStorage<UniSubject[]>('uni-subjects', []);
  const [exams, setExams] = useLocalStorage<Exam[]>('uni-exams', []);
  const [assignments, setAssignments] = useLocalStorage<Assignment[]>('uni-assignments', []);
  const [lectures] = useLocalStorage<Lecture[]>('uni-lectures', []);
  const [, setStudySessions] = useLocalStorage<any[]>('study-sessions', []);

  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [selectedSemester, setSelectedSemester] = useState('Semester 2');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<UniSubject | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', code: '', professor: '', color: PRESET_COLORS[0], category: '', description: '',
  });

  const categories = useMemo(() => {
    const cats = new Set(subjects.map(s => s.category).filter(Boolean) as string[]);
    return ['All', ...Array.from(cats)];
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    let result = [...subjects].filter(s => !s.archived);
    if (activeCategory !== 'All') {
      result = result.filter(s => s.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.code && s.code.toLowerCase().includes(q)) ||
        (s.professor && s.professor.toLowerCase().includes(q))
      );
    }
    result.sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1));
    return result;
  }, [subjects, activeCategory, searchQuery]);

  const pinnedSubjects = useMemo(() => subjects.filter(s => s.pinned), [subjects]);

  const upcomingExams = useMemo(() => {
    const now = new Date();
    return exams
      .filter(e => new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [exams]);

  const pendingAssignments = useMemo(() =>
    assignments.filter(a => a.status === 'pending'),
  [assignments]);

  const togglePin = (id: string) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, pinned: !s.pinned } : s));
  };

  const openSubject = (id: string) => {
    window.location.href = '/study/subject?subjectId=' + id;
  };

  const openFormForSubject = (subject: UniSubject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code || '',
      professor: subject.professor || '',
      color: subject.color,
      category: subject.category || '',
      description: subject.description || '',
    });
    setShowSubjectModal(true);
  };

  const handleSaveSubject = () => {
    if (!formData.name.trim()) return;
    if (editingSubject) {
      setSubjects(prev => prev.map(s =>
        s.id === editingSubject.id
          ? {
              ...s,
              name: formData.name,
              code: formData.code,
              professor: formData.professor,
              color: formData.color,
              category: formData.category,
              description: formData.description,
            }
          : s
      ));
    } else {
      const newSubject: UniSubject = {
        id: generateId(),
        semester_id: '',
        name: formData.name,
        code: formData.code,
        professor: formData.professor,
        color: formData.color,
        category: formData.category,
        description: formData.description,
        pinned: false,
        archived: false,
        progress: 0,
        created_at: new Date().toISOString(),
      };
      setSubjects(prev => [...prev, newSubject]);
    }
    setShowSubjectModal(false);
    setEditingSubject(null);
    setFormData({ name: '', code: '', professor: '', color: PRESET_COLORS[0], category: '', description: '' });
  };

  const handleDeleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    setDeleteConfirm(null);
  };

  const handleNewNote = () => {
    window.location.href = '/study/notes/editor';
  };

  const quickStats = [
    { label: 'Total Subjects', value: subjects.length, icon: <Layers size={22} />, color: '#6366f1' },
    { label: 'Lectures', value: lectures.length, icon: <BookOpen size={22} />, color: '#10b981' },
    { label: 'Pending Assignments', value: pendingAssignments.length, icon: <FileText size={22} />, color: '#f59e0b' },
    { label: 'Study Sessions', value: 0, icon: <Clock size={22} />, color: '#06b6d4' },
    { label: 'Upcoming Exams', value: upcomingExams.length, icon: <AlertCircle size={22} />, color: '#ef4444' },
  ];

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl p-6">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">

          {/* ─── Header ─── */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/30">
                <GraduationCap size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">University</h1>
                <div className="flex items-center gap-2 text-sm text-white/40">
                  <span>{selectedSemester} · {selectedYear}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                  className="appearance-none rounded-xl bg-white/5 border border-white/10 px-4 py-2 pr-8 text-sm text-white/70 outline-none backdrop-blur-xl focus:border-indigo-500/50 cursor-pointer"
                >
                  <option value="2025-2026">2025-2026</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2023-2024">2023-2024</option>
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
              </div>
              <div className="relative">
                <select
                  value={selectedSemester}
                  onChange={e => setSelectedSemester(e.target.value)}
                  className="appearance-none rounded-xl bg-white/5 border border-white/10 px-4 py-2 pr-8 text-sm text-white/70 outline-none backdrop-blur-xl focus:border-indigo-500/50 cursor-pointer"
                >
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                  <option value="Semester 3">Semester 3</option>
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
              </div>
              <Button icon={<Plus size={16} />} onClick={() => { setEditingSubject(null); setFormData({ name: '', code: '', professor: '', color: PRESET_COLORS[0], category: '', description: '' }); setShowSubjectModal(true); }}>
                New Subject
              </Button>
            </div>
          </motion.div>

          {/* ─── Quick Stats ─── */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {quickStats.map(stat => (
              <GlassCard key={stat.label} className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `${stat.color}15`, color: stat.color }}
                  >
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-white/50">{stat.label}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </motion.div>

          {/* ─── Main Grid ─── */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* Left Column */}
            <div className="space-y-6 lg:col-span-2">

              {/* Upcoming Exams */}
              <GlassCard className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer size={18} className="text-rose-400" />
                    <h3 className="font-semibold text-white">Upcoming Exams</h3>
                  </div>
                  <span className="text-xs text-white/40">{upcomingExams.length} scheduled</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {upcomingExams.length === 0 ? (
                    <p className="col-span-2 text-sm text-white/30 py-6 text-center">No upcoming exams</p>
                  ) : (
                    upcomingExams.slice(0, 4).map(exam => {
                      const daysLeft = getDaysLeft(exam.date);
                      const subjColor = getSubjectColor(exam.subject_id, subjects);
                      return (
                        <motion.div
                          key={exam.id}
                          className="relative overflow-hidden rounded-xl bg-white/[0.03] border border-white/5 p-4 cursor-pointer hover:bg-white/[0.06] transition-colors"
                          whileHover={{ y: -2 }}
                        >
                          <div
                            className="absolute left-0 top-0 h-full w-1"
                            style={{ background: subjColor }}
                          />
                          <div className="flex items-start justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white">{exam.title}</p>
                              <p className="mt-0.5 text-xs text-white/50">{getSubjectName(exam.subject_id, subjects)}</p>
                              <p className="mt-1 text-xs text-white/40">{formatDateDisplay(exam.date)}</p>
                            </div>
                            <div
                              className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg text-white"
                              style={{ background: subjColor }}
                            >
                              <span className="text-lg font-bold leading-none">{daysLeft}</span>
                              <span className="text-[9px] uppercase tracking-wider opacity-90">days</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </GlassCard>

              {/* Pending Assignments */}
              <GlassCard className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target size={18} className="text-amber-400" />
                    <h3 className="font-semibold text-white">Pending Assignments</h3>
                  </div>
                  <span className="text-xs text-white/40">{pendingAssignments.length} pending</span>
                </div>
                <div className="space-y-2">
                  {pendingAssignments.length === 0 ? (
                    <p className="text-sm text-white/30 py-6 text-center">No pending assignments</p>
                  ) : (
                    pendingAssignments.slice(0, 5).map(a => {
                      const daysLeft = getDaysLeft(a.due_date);
                      const badge = getStatusBadge(a.status);
                      const subjColor = getSubjectColor(a.subject_id, subjects);
                      return (
                        <motion.div
                          key={a.id}
                          className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3 hover:bg-white/[0.06] transition-colors cursor-pointer"
                          whileHover={{ x: 2 }}
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${subjColor}20`, color: subjColor }}>
                            <FileText size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{a.title}</p>
                            <p className="text-xs text-white/40">{getSubjectName(a.subject_id, subjects)} · Due {formatDateDisplay(a.due_date)}</p>
                          </div>
                          <div className="hidden items-center gap-2 sm:flex">
                            <span className={`shrink-0 text-xs font-medium ${daysLeft <= 1 ? 'text-rose-400' : 'text-white/50'}`}>
                              {daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
                            </span>
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </GlassCard>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Recent Activity Stats */}
              <GlassCard className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Bell size={18} className="text-cyan-400" />
                  <h3 className="font-semibold text-white">Study Overview</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Subjects</span>
                    <span className="text-white/80">{subjects.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Total Exams</span>
                    <span className="text-white/80">{exams.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Total Assignments</span>
                    <span className="text-white/80">{assignments.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Total Lectures</span>
                    <span className="text-white/80">{lectures.length}</span>
                  </div>
                </div>
              </GlassCard>

              {/* Semester Progress */}
              <GlassCard className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <BarChart3 size={18} className="text-indigo-400" />
                  <h3 className="font-semibold text-white">Progress</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">Subjects</span>
                    <span className="text-white">{subjects.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">Exams completed</span>
                    <span className="text-white">{exams.filter(e => e.completed).length}/{exams.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">Assignments submitted</span>
                    <span className="text-white">{assignments.filter(a => a.status === 'submitted' || a.status === 'graded').length}/{assignments.length}</span>
                  </div>
                </div>
                {pinnedSubjects.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Pinned Subjects</p>
                    {pinnedSubjects.map(s => (
                      <div key={s.id} className="flex items-center gap-2 rounded-lg bg-white/[0.03] p-2">
                        <div className="h-6 w-6 shrink-0 rounded-md flex items-center justify-center" style={{ background: s.color }}>
                          {getSubjectIcon(s.name)}
                        </div>
                        <span className="flex-1 text-xs text-white/70 truncate">{s.name}</span>
                        <Star size={11} className="text-amber-400 fill-amber-400" />
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>

              {/* Quick Actions */}
              <GlassCard className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Zap size={18} className="text-purple-400" />
                  <h3 className="font-semibold text-white">Quick Actions</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleNewNote} className="flex items-center gap-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-3 py-2.5 text-sm text-indigo-300 hover:bg-indigo-500/20 transition-colors">
                    <Pen size={14} />
                    New Note
                  </button>
                  <button onClick={() => window.location.href = '/study/exams'} className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 text-sm text-emerald-300 hover:bg-emerald-500/20 transition-colors">
                    <Timer size={14} />
                    Study Session
                  </button>
                  <button className="flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 px-3 py-2.5 text-sm text-cyan-300 hover:bg-cyan-500/20 transition-colors">
                    <Upload size={14} />
                    Upload File
                  </button>
                  <button className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2.5 text-sm text-amber-300 hover:bg-amber-500/20 transition-colors">
                    <Calendar size={14} />
                    Exams
                  </button>
                </div>
              </GlassCard>
            </div>
          </motion.div>

          {/* ─── AI Study Assistant ─── */}
          <motion.div variants={itemVariants}>
            <AiStudyAssistant />
          </motion.div>

          {/* ─── Subjects Grid Section ─── */}
          <motion.div variants={itemVariants}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-white/70" />
                <h2 className="text-lg font-semibold text-white">Subjects</h2>
              </div>
              <div className="w-56">
                <Input
                  placeholder="Search subjects..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  icon={<Search size={15} />}
                />
              </div>
            </div>

            {/* Category filter chips */}
            <div className="mb-4 flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeCategory === cat
                      ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-300'
                      : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                  }`}
                >
                  {cat === '' ? 'Uncategorized' : cat}
                </button>
              ))}
            </div>

            {/* Subjects grid or empty state */}
            {subjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-24">
                <GraduationCap size={48} className="text-white/20" />
                <p className="mt-4 text-lg font-medium text-white/40">No subjects yet</p>
                <p className="mt-1 text-sm text-white/30">Add your first subject to get started</p>
                <Button
                  className="mt-4"
                  icon={<Plus size={16} />}
                  onClick={() => { setEditingSubject(null); setFormData({ name: '', code: '', professor: '', color: PRESET_COLORS[0], category: '', description: '' }); setShowSubjectModal(true); }}
                >
                  Add Subject
                </Button>
              </div>
            ) : filteredSubjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-16">
                <BookOpen size={40} className="text-white/20" />
                <p className="mt-3 text-sm text-white/40">No subjects match your search</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredSubjects.map(subject => (
                  <motion.div
                    key={subject.id}
                    layout
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.07] transition-colors"
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openSubject(subject.id)}
                  >
                    <div className="h-1.5 w-full" style={{ background: subject.color }} />

                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg"
                          style={{ background: subject.color }}
                        >
                          {getSubjectIcon(subject.name)}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={e => { e.stopPropagation(); openFormForSubject(subject); }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                          >
                            <Edit3 size={13} className="text-white/40" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); togglePin(subject.id); }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Star
                              size={14}
                              className={subject.pinned ? 'fill-amber-400 text-amber-400' : 'text-white/40'}
                            />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setDeleteConfirm(subject.id); }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                          >
                            <Trash2 size={13} className="text-red-400" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3">
                        <h3 className="text-sm font-semibold text-white">{subject.name}</h3>
                        <p className="text-xs text-white/40">{subject.code}</p>
                        <p className="mt-0.5 text-xs text-white/30">{subject.professor}</p>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-white/40">Progress</span>
                          <span className="text-[10px] font-medium" style={{ color: subject.color }}>{subject.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${subject.color}, ${subject.color}88)` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${subject.progress}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                      </div>

                      {subject.pinned && (
                        <div className="mt-2 flex items-center gap-1">
                          <Pin size={10} className="text-amber-400" />
                          <span className="text-[10px] text-amber-400/70">Pinned</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* ─── New/Edit Subject Modal ─── */}
          {showSubjectModal && (
            <Modal onClose={() => { setShowSubjectModal(false); setEditingSubject(null); }}>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">{editingSubject ? 'Edit Subject' : 'New Subject'}</h3>
                <Input
                  label="Subject Name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Computer Networks"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Code"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. CS-301"
                  />
                  <Input
                    label="Professor"
                    value={formData.professor}
                    onChange={e => setFormData({ ...formData, professor: e.target.value })}
                    placeholder="Dr. Smith"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: c })}
                        className={`h-8 w-8 rounded-xl border-2 transition-all ${
                          formData.color === c ? 'border-white scale-110' : 'border-transparent'
                        }`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Category"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Programming"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description..."
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-500/50 resize-none h-20"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="ghost" onClick={() => { setShowSubjectModal(false); setEditingSubject(null); }}>Cancel</Button>
                  {editingSubject && (
                    <Button variant="danger" onClick={() => { handleDeleteSubject(editingSubject.id); setShowSubjectModal(false); setEditingSubject(null); }}>
                      Delete
                    </Button>
                  )}
                  <Button onClick={handleSaveSubject} disabled={!formData.name.trim()}>
                    {editingSubject ? 'Save Changes' : 'Create Subject'}
                  </Button>
                </div>
              </div>
            </Modal>
          )}

          {/* ─── Delete Confirmation ─── */}
          {deleteConfirm && (
            <Modal onClose={() => setDeleteConfirm(null)}>
              <div className="text-center space-y-4 py-4">
                <Trash2 size={40} className="mx-auto text-red-400" />
                <h3 className="text-lg font-semibold text-white">Delete Subject?</h3>
                <p className="text-sm text-white/50">This action cannot be undone.</p>
                <div className="flex justify-center gap-3">
                  <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                  <Button variant="danger" onClick={() => handleDeleteSubject(deleteConfirm)}>Delete</Button>
                </div>
              </div>
            </Modal>
          )}

          {/* ─── Footer ─── */}
          <motion.div variants={itemVariants} className="flex items-center justify-center gap-2 border-t border-white/5 pt-6 pb-2">
            <GraduationCap size={14} className="text-white/20" />
            <span className="text-xs text-white/20">LifeOS University · {selectedSemester} {selectedYear}</span>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
