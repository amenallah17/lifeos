'use client';

import { useState, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, BookOpen, FileText, FolderOpen, Video, ClipboardList,
  Target, Calendar, Clock, BarChart3, Bell, Star, Search, Plus,
  Upload, Download, Trash2, Eye, CheckCircle, Circle, Timer,
  File, FileImage, Archive,
  Pen, GraduationCap, Users, Award, TrendingUp, Layers,
  AlertTriangle, ChevronRight, Grid3X3, List,
  MoreVertical, Tag, Zap, MapPin, Edit3, X,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import ProgressBar from '@/components/ui/ProgressBar';
import { useLocalStorage } from '@/lib/usePersistence';
import { UniSubject } from '@/types';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

type Tab = 'overview' | 'materials' | 'notes' | 'lectures' | 'exams' | 'assignments';

type FileItem = {
  id: string; name: string; type: 'pdf' | 'doc' | 'image' | 'slides' | 'archive' | 'video' | 'other';
  size: string; folderId: string; isFavorite: boolean; updatedAt: string; owner: string;
};

type Note = {
  id: string; title: string; preview: string; tags: string[]; updatedAt: string;
};

type Lecture = {
  id: string; title: string; chapter: string; type: 'Lecture' | 'TD' | 'Lab' | 'Revision';
  date: string; duration: string; completed: boolean; recording?: string;
};

type Exam = {
  id: string; title: string; type: 'Midterm' | 'Final' | 'Quiz' | 'Oral';
  date: string; time: string; location: string; weight: number; priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
};

type Assignment = {
  id: string; title: string; due: string; daysLeft: number;
  status: 'todo' | 'in-progress' | 'submitted' | 'graded';
  grade?: string; maxGrade?: number;
};

type Activity = {
  id: string; type: 'note' | 'file' | 'lecture' | 'exam' | 'assignment';
  text: string; time: string;
};

type SubjectFolder = { id: string; name: string; color: string; itemCount: number; };

type SubjectData = {
  files: FileItem[];
  notes: Note[];
  lectures: Lecture[];
  exams: Exam[];
  assignments: Assignment[];
  folders: SubjectFolder[];
  recentActivity: Activity[];
};

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 size={15} /> },
  { id: 'materials', label: 'Materials & Files', icon: <FolderOpen size={15} /> },
  { id: 'notes', label: 'Notes', icon: <FileText size={15} /> },
  { id: 'lectures', label: 'Lectures', icon: <Video size={15} /> },
  { id: 'exams', label: 'Exams', icon: <ClipboardList size={15} /> },
  { id: 'assignments', label: 'Assignments', icon: <Target size={15} /> },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const FOLDER_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6'];

function getFileIcon(type: FileItem['type']) {
  switch (type) {
    case 'pdf': return <FileText size={16} />;
    case 'doc': return <File size={16} />;
    case 'image': return <FileImage size={16} />;
    case 'slides': return <FileText size={16} />;
    case 'archive': return <Archive size={16} />;
    case 'video': return <Video size={16} />;
    default: return <File size={16} />;
  }
}

function getFileColor(type: FileItem['type']) {
  switch (type) {
    case 'pdf': return '#ef4444';
    case 'doc': return '#3b82f6';
    case 'image': return '#10b981';
    case 'slides': return '#f59e0b';
    case 'archive': return '#8b5cf6';
    case 'video': return '#ec4899';
    default: return '#78716c';
  }
}

function getActivityIcon(type: Activity['type']) {
  switch (type) {
    case 'note': return <Pen size={14} />;
    case 'file': return <Upload size={14} />;
    case 'lecture': return <Eye size={14} />;
    case 'exam': return <ClipboardList size={14} />;
    case 'assignment': return <Target size={14} />;
    default: return <Circle size={14} />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'todo': return { label: 'To Do', variant: 'warning' as const };
    case 'in-progress': return { label: 'In Progress', variant: 'info' as const };
    case 'submitted': return { label: 'Submitted', variant: 'success' as const };
    case 'graded': return { label: 'Graded', variant: 'default' as const };
    default: return { label: status, variant: 'default' as const };
  }
}

function getDaysLeftText(days: number) {
  if (days === 0) return 'Due today!';
  if (days < 0) return 'Overdue!';
  return `${days}d left`;
}

function getDaysLeftColor(days: number) {
  if (days <= 0) return 'text-red-400';
  if (days <= 3) return 'text-orange-400';
  if (days <= 7) return 'text-yellow-400';
  return 'text-emerald-400';
}

function getPriorityColor(p: string) {
  switch (p) {
    case 'High': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'Low': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    default: return 'bg-white/10 text-white/50';
  }
}

function getExamTypeColor(t: string) {
  switch (t) {
    case 'Midterm': return 'bg-indigo-500/20 text-indigo-400';
    case 'Final': return 'bg-red-500/20 text-red-400';
    case 'Quiz': return 'bg-amber-500/20 text-amber-400';
    case 'Oral': return 'bg-purple-500/20 text-purple-400';
    default: return 'bg-white/10 text-white/50';
  }
}

function getLectureTypeColor(t: string) {
  switch (t) {
    case 'Lecture': return 'bg-indigo-500/20 text-indigo-400';
    case 'TD': return 'bg-emerald-500/20 text-emerald-400';
    case 'Lab': return 'bg-cyan-500/20 text-cyan-400';
    case 'Revision': return 'bg-purple-500/20 text-purple-400';
    default: return 'bg-white/10 text-white/50';
  }
}

function SubjectContent() {
  const searchParams = useSearchParams();
  const subjectId = searchParams.get('subjectId');
  const [subjects] = useLocalStorage<UniSubject[]>('uni-subjects', []);
  const [subjectsData, setSubjectsData] = useLocalStorage<Record<string, SubjectData>>('uni-subjects-data', {});
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [fileSearch, setFileSearch] = useState('');
  const [fileView, setFileView] = useState<'grid' | 'list'>('grid');
  const [activeFolder, setActiveFolder] = useState('All');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false);
  const [showAddLectureModal, setShowAddLectureModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newExamForm, setNewExamForm] = useState({ title: '', type: 'Midterm' as Exam['type'], date: '', time: '', location: '', weight: 0, priority: 'Medium' as Exam['priority'] });
  const [newAssignmentForm, setNewAssignmentForm] = useState({ title: '', due: '', status: 'todo' as Assignment['status'] });
  const [newLectureForm, setNewLectureForm] = useState({ title: '', chapter: '', date: '', type: 'Lecture' as Lecture['type'], duration: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'note' | 'file' | 'lecture' | 'exam' | 'assignment' | 'folder'>('note');

  const subject = useMemo(() => subjects.find(s => s.id === subjectId), [subjects, subjectId]);
  const subjectData = useMemo(() => (subjectId ? subjectsData[subjectId] : null) || { files: [], notes: [], lectures: [], exams: [], assignments: [], folders: [], recentActivity: [] }, [subjectsData, subjectId]);

  const updateData = (updater: (prev: SubjectData) => SubjectData) => {
    if (!subjectId) return;
    setSubjectsData(prev => ({
      ...prev,
      [subjectId]: updater(prev[subjectId] || { files: [], notes: [], lectures: [], exams: [], assignments: [], folders: [], recentActivity: [] }),
    }));
  };

  const filteredFiles = useMemo(() => {
    if (!subject) return [];
    let files = subjectData.files;
    if (activeFolder !== 'All') {
      const folder = subjectData.folders.find(f => f.name === activeFolder);
      if (folder) files = files.filter(f => f.folderId === folder.id);
    }
    if (fileSearch) files = files.filter(f => f.name.toLowerCase().includes(fileSearch.toLowerCase()));
    return files;
  }, [subject, subjectData, activeFolder, fileSearch]);

  const localFolders = useMemo(() => {
    if (!subject) return [];
    return [{ id: 'all', name: 'All', color: '#6366f1', itemCount: subjectData.files.length }, ...subjectData.folders];
  }, [subject, subjectData]);

  const groupedLectures = useMemo(() => {
    if (!subject) return [];
    const groups: { chapter: string; lectures: Lecture[] }[] = [];
    const map = new Map<string, Lecture[]>();
    subjectData.lectures.forEach(l => {
      const existing = map.get(l.chapter) || [];
      existing.push(l);
      map.set(l.chapter, existing);
    });
    map.forEach((lectures, chapter) => groups.push({ chapter, lectures }));
    return groups;
  }, [subject, subjectData]);

  const overviewStats = useMemo(() => {
    if (!subject) return [];
    return [
      { label: 'Files', value: subjectData.files.length, icon: 'FileText' as const, color: '#6366f1' },
      { label: 'Notes', value: subjectData.notes.length, icon: 'Pen' as const, color: '#10b981' },
      { label: 'Lectures', value: subjectData.lectures.length, icon: 'Video' as const, color: '#f59e0b' },
      { label: 'Exams', value: subjectData.exams.length, icon: 'Clock' as const, color: '#ef4444' },
      { label: 'Assignments', value: subjectData.assignments.length, icon: 'Target' as const, color: '#06b6d4' },
    ];
  }, [subject, subjectData]);

  const statIconMap: Record<string, React.ReactNode> = {
    FileText: <FileText size={20} />,
    Pen: <Pen size={20} />,
    Video: <Video size={20} />,
    Clock: <Clock size={20} />,
    Award: <Award size={20} />,
    Target: <Target size={20} />,
  };

  const addActivity = (type: Activity['type'], text: string) => {
    updateData(d => ({
      ...d,
      recentActivity: [{ id: generateId(), type, text, time: new Date().toLocaleDateString() }, ...d.recentActivity].slice(0, 20),
    }));
  };

  if (!subject) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-7xl p-6">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-32">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 mb-4">
              <BookOpen size={32} className="text-white/20" />
            </div>
            <h2 className="text-xl font-semibold text-white/50 mb-2">Select a Subject</h2>
            <p className="text-sm text-white/30 mb-6">Choose a subject from your list to view its workspace</p>
            <Link href="/study">
              <Button icon={<ArrowLeft size={16} />}>Back to Study Dashboard</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const handleAddFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const fileTypeMap: Record<string, FileItem['type']> = { pdf: 'pdf', doc: 'doc', docx: 'doc', png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', svg: 'image', ppt: 'slides', pptx: 'slides', zip: 'archive', rar: 'archive', mp4: 'video', mov: 'video' };
      const fType = fileTypeMap[ext] || 'other';
      const newFile: FileItem = {
        id: generateId(),
        name: file.name,
        type: fType,
        size: file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${(file.size / 1024).toFixed(1)} KB`,
        folderId: activeFolder === 'All' ? '' : (subjectData.folders.find(f => f.name === activeFolder)?.id || ''),
        isFavorite: false,
        updatedAt: new Date().toLocaleDateString(),
        owner: 'Me',
      };
      updateData(d => ({ ...d, files: [...d.files, newFile] }));
      addActivity('file', `Uploaded ${file.name}`);
    };
    input.click();
  };

  const handleDeleteFile = (fileId: string) => {
    updateData(d => ({ ...d, files: d.files.filter(f => f.id !== fileId) }));
  };

  const toggleFileFavorite = (fileId: string) => {
    updateData(d => ({ ...d, files: d.files.map(f => f.id === fileId ? { ...f, isFavorite: !f.isFavorite } : f) }));
  };

  const handleDeleteNote = (noteId: string) => {
    updateData(d => ({ ...d, notes: d.notes.filter(n => n.id !== noteId) }));
  };

  const toggleLectureCompleted = (lectureId: string) => {
    updateData(d => ({ ...d, lectures: d.lectures.map(l => l.id === lectureId ? { ...l, completed: !l.completed } : l) }));
  };

  const handleDeleteLecture = (lectureId: string) => {
    updateData(d => ({ ...d, lectures: d.lectures.filter(l => l.id !== lectureId) }));
  };

  const handleAddLecture = () => {
    if (!newLectureForm.title || !newLectureForm.date) return;
    const lecture: Lecture = {
      id: generateId(),
      title: newLectureForm.title,
      chapter: newLectureForm.chapter || 'General',
      type: newLectureForm.type,
      date: newLectureForm.date,
      duration: newLectureForm.duration || '1h',
      completed: false,
    };
    updateData(d => ({ ...d, lectures: [...d.lectures, lecture] }));
    addActivity('lecture', `Added lecture: ${newLectureForm.title}`);
    setNewLectureForm({ title: '', chapter: '', date: '', type: 'Lecture', duration: '' });
    setShowAddLectureModal(false);
  };

  const handleAddExam = () => {
    if (!newExamForm.title || !newExamForm.date) return;
    const exam: Exam = {
      id: generateId(),
      title: newExamForm.title,
      type: newExamForm.type,
      date: newExamForm.date,
      time: newExamForm.time || 'TBD',
      location: newExamForm.location || '',
      weight: newExamForm.weight,
      priority: newExamForm.priority,
      completed: false,
    };
    updateData(d => ({ ...d, exams: [...d.exams, exam] }));
    addActivity('exam', `Added exam: ${newExamForm.title}`);
    setNewExamForm({ title: '', type: 'Midterm', date: '', time: '', location: '', weight: 0, priority: 'Medium' });
    setShowAddExamModal(false);
  };

  const toggleExamPrepared = (examId: string) => {
    updateData(d => ({ ...d, exams: d.exams.map(e => e.id === examId ? { ...e, completed: !e.completed } : e) }));
  };

  const handleDeleteExam = (examId: string) => {
    updateData(d => ({ ...d, exams: d.exams.filter(e => e.id !== examId) }));
  };

  const handleAddAssignment = () => {
    if (!newAssignmentForm.title || !newAssignmentForm.due) return;
    const dueDate = new Date(newAssignmentForm.due);
    const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const assignment: Assignment = {
      id: generateId(),
      title: newAssignmentForm.title,
      due: newAssignmentForm.due,
      daysLeft: Math.max(0, daysLeft),
      status: newAssignmentForm.status,
    };
    updateData(d => ({ ...d, assignments: [...d.assignments, assignment] }));
    addActivity('assignment', `Added assignment: ${newAssignmentForm.title}`);
    setNewAssignmentForm({ title: '', due: '', status: 'todo' });
    setShowAddAssignmentModal(false);
  };

  const toggleAssignmentStatus = (assignmentId: string) => {
    updateData(d => ({
      ...d,
      assignments: d.assignments.map(a => {
        if (a.id !== assignmentId) return a;
        const next = a.status === 'todo' ? 'in-progress' : a.status === 'in-progress' ? 'submitted' : 'todo';
        return { ...a, status: next };
      }),
    }));
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    updateData(d => ({ ...d, assignments: d.assignments.filter(a => a.id !== assignmentId) }));
  };

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    const folder: SubjectFolder = {
      id: generateId(),
      name: newFolderName,
      color: FOLDER_COLORS[subjectData.folders.length % FOLDER_COLORS.length],
      itemCount: 0,
    };
    updateData(d => ({ ...d, folders: [...d.folders, folder] }));
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  const handleDeleteFolder = (folderId: string) => {
    updateData(d => ({
      ...d,
      folders: d.folders.filter(f => f.id !== folderId),
      files: d.files.map(f => f.folderId === folderId ? { ...f, folderId: '' } : f),
    }));
  };

  function renderOverview() {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {overviewStats.map(stat => (
            <GlassCard key={stat.label} className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${stat.color}15`, color: stat.color }}
                >
                  {statIconMap[stat.icon] || <BarChart3 size={20} />}
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/50">{stat.label}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Recent Activity */}
            <motion.div variants={itemVariants}>
              <GlassCard className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Bell size={18} className="text-cyan-400" />
                  <h3 className="font-semibold text-white">Recent Activity</h3>
                </div>
                <div className="space-y-0">
                  {subjectData.recentActivity.length === 0 ? (
                    <p className="text-sm text-white/30 py-6 text-center">No activity yet</p>
                  ) : (
                    subjectData.recentActivity.slice(0, 10).map((activity, i) => (
                      <motion.div
                        key={activity.id}
                        className="relative flex gap-3 pb-4 pl-6"
                      >
                        {i < Math.min(subjectData.recentActivity.length, 10) - 1 && (
                          <div className="absolute left-[7px] top-5 bottom-0 w-px bg-white/5" />
                        )}
                        <div
                          className="absolute left-0 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full"
                          style={{ background: subject!.color }}
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span style={{ color: subject!.color }}>{getActivityIcon(activity.type)}</span>
                            <p className="text-xs text-white/80">{activity.text}</p>
                          </div>
                          <span className="text-[10px] text-white/40">{activity.time}</span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </GlassCard>
            </motion.div>

            {/* Upcoming Deadlines */}
            <motion.div variants={itemVariants}>
              <GlassCard className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-rose-400" />
                    <h3 className="font-semibold text-white">Upcoming Deadlines</h3>
                  </div>
                </div>
                <div className="space-y-2">
                  {[...subjectData.exams.map(e => ({ ...e, type: 'exam' as const, daysLeft: (() => { const m = e.date.match(/(\w+) (\d+)/); if (!m) return 30; const mn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(m[1]); return Math.max(0, Math.ceil((new Date(2026, mn, parseInt(m[2])).getTime() - Date.now()) / (1000*60*60*24))); })() })), ...subjectData.assignments].sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 5).map(item => {
                    const isExam = 'type' in item && item.type === 'exam';
                    return (
                      <div key={item.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3 hover:bg-white/[0.06] transition-colors">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isExam ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {isExam ? <ClipboardList size={14} /> : <Target size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{item.title}</p>
                          <p className="text-xs text-white/40">{isExam ? (item as any).date : (item as any).due}</p>
                        </div>
                        <span className={`shrink-0 text-xs font-medium ${getDaysLeftColor(item.daysLeft)}`}>{getDaysLeftText(item.daysLeft)}</span>
                      </div>
                    );
                  })}
                  {subjectData.exams.length === 0 && subjectData.assignments.length === 0 && (
                    <p className="text-sm text-white/30 py-6 text-center">No upcoming deadlines</p>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Study Progress */}
            <motion.div variants={itemVariants}>
              <GlassCard className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <BarChart3 size={18} className="text-indigo-400" />
                  <h3 className="font-semibold text-white">Study Progress</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-white/50">Overall Progress</span>
                      <span className="text-xs font-medium" style={{ color: subject!.color }}>{subject!.progress}%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${subject!.color}, ${subject!.color}88)` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${subject!.progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                  <div className="space-y-3 pt-2">
                    {[
                      { label: 'Lectures Completed', value: subjectData.lectures.filter(l => l.completed).length, max: subjectData.lectures.length, color: '#10b981' },
                      { label: 'Assignments Done', value: subjectData.assignments.filter(a => a.status === 'submitted' || a.status === 'graded').length, max: subjectData.assignments.length, color: '#06b6d4' },
                      { label: 'Exams Prepared', value: subjectData.exams.filter(e => e.completed).length, max: subjectData.exams.length, color: '#f59e0b' },
                    ].map(item => {
                      const pct = item.max > 0 ? Math.round((item.value / item.max) * 100) : 0;
                      return (
                        <div key={item.label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-white/50">{item.label}</span>
                            <span className="text-xs text-white/60">{item.value}/{item.max}</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                            <motion.div className="h-full rounded-full" style={{ background: item.color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Course Info */}
            <motion.div variants={itemVariants}>
              <GlassCard className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <GraduationCap size={18} className="text-indigo-400" />
                  <h3 className="font-semibold text-white">Course Info</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Code</span>
                    <span className="text-white/80 font-medium">{subject!.code || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Professor</span>
                    <span className="text-white/80">{subject!.professor || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Category</span>
                    <Badge variant="info">{subject!.category || 'General'}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Files</span>
                    <span className="text-white/80">{subjectData.files.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Notes</span>
                    <span className="text-white/80">{subjectData.notes.length}</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  }

  function renderMaterials() {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-56">
              <Input
                placeholder="Search files..."
                value={fileSearch}
                onChange={e => setFileSearch(e.target.value)}
                icon={<Search size={15} />}
              />
            </div>
            <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                onClick={() => setFileView('grid')}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${fileView === 'grid' ? 'bg-indigo-500/20 text-indigo-300' : 'text-white/40 hover:text-white/70'}`}
              >
                <Grid3X3 size={15} />
              </button>
              <button
                onClick={() => setFileView('list')}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${fileView === 'list' ? 'bg-indigo-500/20 text-indigo-300' : 'text-white/40 hover:text-white/70'}`}
              >
                <List size={15} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => setShowNewFolderModal(true)}>
              New Folder
            </Button>
            <Button size="sm" icon={<Upload size={14} />} onClick={handleAddFile}>Upload</Button>
          </div>
        </motion.div>

        {/* Folders */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
          {localFolders.map(folder => (
            <div key={folder.id} className="relative group">
              <button
                onClick={() => setActiveFolder(folder.name)}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm transition-colors ${
                  activeFolder === folder.name
                    ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-300'
                    : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                }`}
              >
                <FolderOpen size={14} style={{ color: folder.color }} />
                <span>{folder.name}</span>
                <span className="text-[10px] text-white/30 ml-1">{folder.itemCount}</span>
              </button>
              {folder.id !== 'all' && (
                <button
                  onClick={() => { setDeleteType('folder'); setDeleteConfirm(folder.id); }}
                  className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={8} />
                </button>
              )}
            </div>
          ))}
        </motion.div>

        {/* Files */}
        <motion.div variants={itemVariants}>
          {filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-16">
              <FolderOpen size={40} className="text-white/20" />
              <p className="mt-3 text-sm text-white/40">No files found</p>
              <Button size="sm" variant="secondary" className="mt-3" onClick={handleAddFile} icon={<Upload size={14} />}>
                Upload a file
              </Button>
            </div>
          ) : fileView === 'grid' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredFiles.map(file => (
                <GlassCard key={file.id} className="p-4" hover>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${getFileColor(file.type)}15`, color: getFileColor(file.type) }}>
                      {getFileIcon(file.type)}
                    </div>
                    <button onClick={() => toggleFileFavorite(file.id)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <Star size={13} className={file.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-white/30'} />
                    </button>
                  </div>
                  <p className="text-sm font-medium text-white truncate">{file.name}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-white/40">
                    <span>{file.size}</span>
                    <span>·</span>
                    <span>{subjectData.folders.find(f => f.id === file.folderId)?.name || 'Unfiled'}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-white/30">{file.updatedAt}</span>
                    <div className="flex items-center gap-1">
                      <button className="flex h-6 w-6 items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                        <Download size={12} />
                      </button>
                      <button onClick={() => handleDeleteFile(file.id)} className="flex h-6 w-6 items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map(file => (
                <div key={file.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3 hover:bg-white/[0.06] transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${getFileColor(file.type)}15`, color: getFileColor(file.type) }}>
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <span>{file.size}</span>
                      <span>·</span>
                      <span>{subjectData.folders.find(f => f.id === file.folderId)?.name || 'Unfiled'}</span>
                      <span>·</span>
                      <span>{file.owner}</span>
                    </div>
                  </div>
                  <span className="hidden text-xs text-white/30 sm:block">{file.updatedAt}</span>
                  <button onClick={() => toggleFileFavorite(file.id)} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/5 transition-colors">
                    <Star size={13} className={file.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-white/30'} />
                  </button>
                  <button onClick={() => handleDeleteFile(file.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {showNewFolderModal && (
            <Modal onClose={() => setShowNewFolderModal(false)}>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">New Folder</h3>
                <Input label="Folder Name" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="e.g. Lecture Notes" />
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="secondary" onClick={() => setShowNewFolderModal(false)}>Cancel</Button>
                  <Button onClick={handleAddFolder} disabled={!newFolderName.trim()}>Create</Button>
                </div>
              </div>
            </Modal>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  function renderNotes() {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <p className="text-sm text-white/40">{subjectData.notes.length} notes</p>
          <Link href={`/study/notes/editor?subjectId=${subject!.id}`}>
            <Button size="sm" icon={<Plus size={14} />}>New Note</Button>
          </Link>
        </motion.div>
        {subjectData.notes.length === 0 ? (
          <motion.div variants={itemVariants} className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-16">
            <FileText size={40} className="text-white/20" />
            <p className="mt-3 text-sm text-white/40">No notes yet for this subject</p>
            <Link href={`/study/notes/editor?subjectId=${subject!.id}`}>
              <Button size="sm" variant="secondary" className="mt-3" icon={<Plus size={14} />}>Create Note</Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjectData.notes.map(note => (
              <div key={note.id} className="group relative">
                <Link href={`/study/notes/editor?noteId=${note.id}&subjectId=${subject!.id}`}>
                  <GlassCard className="p-4" hover>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-6 w-1 shrink-0 rounded-full" style={{ background: subject!.color }} />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">{note.title}</h3>
                        <p className="mt-1.5 text-xs text-white/40 leading-relaxed line-clamp-3">{note.preview}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex flex-wrap gap-1.5">
                            {note.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="default" className="text-[10px] px-1.5 py-0.5">{tag}</Badge>
                            ))}
                          </div>
                          <span className="text-[10px] text-white/30 shrink-0 ml-2">{note.updatedAt}</span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                >
                  <Trash2 size={11} className="text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  function renderLectures() {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <span className="text-sm text-white/40">{subjectData.lectures.filter(l => l.completed).length}/{subjectData.lectures.length} completed</span>
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowAddLectureModal(true)}>Add Lecture</Button>
        </motion.div>

        {subjectData.lectures.length === 0 ? (
          <motion.div variants={itemVariants} className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-16">
            <Video size={40} className="text-white/20" />
            <p className="mt-3 text-sm text-white/40">No lectures yet</p>
            <Button size="sm" variant="secondary" className="mt-3" icon={<Plus size={14} />} onClick={() => setShowAddLectureModal(true)}>Add Lecture</Button>
          </motion.div>
        ) : (
          groupedLectures.map(group => (
            <motion.div key={group.chapter} variants={itemVariants}>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} className="text-white/40" />
                <h3 className="text-sm font-semibold text-white/70">{group.chapter}</h3>
                <span className="text-xs text-white/30">{group.lectures.length} sessions</span>
              </div>
              <div className="space-y-2">
                {group.lectures.map(lecture => (
                  <div key={lecture.id} className={`group relative flex items-center gap-3 rounded-xl bg-white/[0.03] p-3.5 border border-white/5 hover:bg-white/[0.06] transition-colors ${lecture.completed ? 'opacity-60' : ''}`}>
                    <button onClick={() => toggleLectureCompleted(lecture.id)} className="shrink-0">
                      {lecture.completed ? <CheckCircle size={18} className="text-emerald-400" /> : <Circle size={18} className="text-white/30 hover:text-white/50 transition-colors" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${lecture.completed ? 'text-white/50 line-through' : 'text-white'}`}>{lecture.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getLectureTypeColor(lecture.type)}`}>{lecture.type}</span>
                        <span className="text-xs text-white/40">{lecture.date}</span>
                        <span className="text-xs text-white/30">{lecture.duration}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteLecture(lecture.id)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20">
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          ))
        )}

        <AnimatePresence>
          {showAddLectureModal && (
            <Modal onClose={() => setShowAddLectureModal(false)}>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Add Lecture</h3>
                <Input label="Title" value={newLectureForm.title} onChange={e => setNewLectureForm({ ...newLectureForm, title: e.target.value })} placeholder="e.g. Network Security" />
                <Input label="Chapter" value={newLectureForm.chapter} onChange={e => setNewLectureForm({ ...newLectureForm, chapter: e.target.value })} placeholder="e.g. Chapter 6" />
                <Input label="Date" type="date" value={newLectureForm.date} onChange={e => setNewLectureForm({ ...newLectureForm, date: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/50 mb-1.5">Type</label>
                    <select value={newLectureForm.type} onChange={e => setNewLectureForm({ ...newLectureForm, type: e.target.value as Lecture['type'] })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50">
                      <option value="Lecture" className="bg-gray-900">Lecture</option>
                      <option value="TD" className="bg-gray-900">TD</option>
                      <option value="Lab" className="bg-gray-900">Lab</option>
                      <option value="Revision" className="bg-gray-900">Revision</option>
                    </select>
                  </div>
                  <Input label="Duration" value={newLectureForm.duration} onChange={e => setNewLectureForm({ ...newLectureForm, duration: e.target.value })} placeholder="e.g. 1h30" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="secondary" onClick={() => setShowAddLectureModal(false)}>Cancel</Button>
                  <Button onClick={handleAddLecture} disabled={!newLectureForm.title || !newLectureForm.date}>Add</Button>
                </div>
              </div>
            </Modal>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  function renderExams() {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <p className="text-sm text-white/40">{subjectData.exams.length} exams</p>
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowAddExamModal(true)}>Add Exam</Button>
        </motion.div>

        {subjectData.exams.length === 0 ? (
          <motion.div variants={itemVariants} className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-16">
            <ClipboardList size={40} className="text-white/20" />
            <p className="mt-3 text-sm text-white/40">No exams scheduled</p>
            <Button size="sm" variant="secondary" className="mt-3" icon={<Plus size={14} />} onClick={() => setShowAddExamModal(true)}>Add Exam</Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {subjectData.exams.map(exam => {
              const match = exam.date.match(/(\w+) (\d+)/);
              let daysLeft = 30;
              if (match) {
                const mn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(match[1]);
                const d = parseInt(match[2]);
                daysLeft = Math.max(0, Math.ceil((new Date(2026, mn, d).getTime() - Date.now()) / (1000*60*60*24)));
              }
              return (
                <GlassCard key={exam.id} className="p-5" hover>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getExamTypeColor(exam.type)}`}>{exam.type}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(exam.priority)}`}>{exam.priority}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center">
                        <span className={`text-lg font-bold ${daysLeft <= 7 ? 'text-red-400' : 'text-white'}`}>{daysLeft}</span>
                        <span className="text-[9px] uppercase tracking-wider text-white/40">days</span>
                      </div>
                      <button onClick={() => handleDeleteExam(exam.id)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 transition-colors">
                        <Trash2 size={12} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{exam.title}</h3>
                  <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                    <div className="flex items-center gap-2 text-white/50"><Calendar size={13} />{exam.date}</div>
                    <div className="flex items-center gap-2 text-white/50"><Clock size={13} />{exam.time}</div>
                    <div className="flex items-center gap-2 text-white/50"><MapPin size={13} />{exam.location}</div>
                    <div className="flex items-center gap-2 text-white/50"><Target size={13} />{exam.weight}% weight</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/40">Preparedness</span>
                        <span className="text-xs text-white/60">{exam.completed ? 'Ready' : 'Not ready'}</span>
                      </div>
                      <ProgressBar value={exam.completed ? 100 : 25} />
                    </div>
                    <button onClick={() => toggleExamPrepared(exam.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${exam.completed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}>
                      {exam.completed ? <CheckCircle size={13} /> : <Circle size={13} />}
                      {exam.completed ? 'Prepared' : 'Mark Ready'}
                    </button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {showAddExamModal && (
            <Modal onClose={() => setShowAddExamModal(false)}>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Add Exam</h3>
                <Input label="Title" value={newExamForm.title} onChange={e => setNewExamForm({ ...newExamForm, title: e.target.value })} placeholder="e.g. Midterm Exam" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Date" type="date" value={newExamForm.date} onChange={e => setNewExamForm({ ...newExamForm, date: e.target.value })} />
                  <Input label="Time" type="time" value={newExamForm.time} onChange={e => setNewExamForm({ ...newExamForm, time: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/50 mb-1.5">Type</label>
                    <select value={newExamForm.type} onChange={e => setNewExamForm({ ...newExamForm, type: e.target.value as Exam['type'] })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50">
                      <option value="Midterm" className="bg-gray-900">Midterm</option>
                      <option value="Final" className="bg-gray-900">Final</option>
                      <option value="Quiz" className="bg-gray-900">Quiz</option>
                      <option value="Oral" className="bg-gray-900">Oral</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/50 mb-1.5">Priority</label>
                    <select value={newExamForm.priority} onChange={e => setNewExamForm({ ...newExamForm, priority: e.target.value as Exam['priority'] })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50">
                      <option value="High" className="bg-gray-900">High</option>
                      <option value="Medium" className="bg-gray-900">Medium</option>
                      <option value="Low" className="bg-gray-900">Low</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Location" value={newExamForm.location} onChange={e => setNewExamForm({ ...newExamForm, location: e.target.value })} placeholder="Room 301" />
                  <Input label="Weight (%)" type="number" value={String(newExamForm.weight)} onChange={e => setNewExamForm({ ...newExamForm, weight: Number(e.target.value) })} placeholder="30" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="secondary" onClick={() => setShowAddExamModal(false)}>Cancel</Button>
                  <Button onClick={handleAddExam} disabled={!newExamForm.title || !newExamForm.date}>Add</Button>
                </div>
              </div>
            </Modal>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  function renderAssignments() {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <p className="text-sm text-white/40">{subjectData.assignments.filter(a => a.status !== 'submitted' && a.status !== 'graded').length} pending</p>
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowAddAssignmentModal(true)}>Add Assignment</Button>
        </motion.div>

        {subjectData.assignments.length === 0 ? (
          <motion.div variants={itemVariants} className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-16">
            <Target size={40} className="text-white/20" />
            <p className="mt-3 text-sm text-white/40">No assignments yet</p>
            <Button size="sm" variant="secondary" className="mt-3" icon={<Plus size={14} />} onClick={() => setShowAddAssignmentModal(true)}>Add Assignment</Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {subjectData.assignments.map(a => {
              const badge = getStatusBadge(a.status);
              return (
                <GlassCard key={a.id} className="p-5" hover>
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${getDaysLeftColor(a.daysLeft)}`}>{getDaysLeftText(a.daysLeft)}</span>
                      <button onClick={() => handleDeleteAssignment(a.id)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 transition-colors">
                        <Trash2 size={12} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{a.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-white/50 mb-3">
                    <Calendar size={13} />
                    <span>Due {a.due}</span>
                  </div>
                  {a.grade && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Award size={14} className="text-yellow-400" />
                      <span className="text-yellow-400 font-medium">{a.grade}</span>
                      {a.maxGrade && <span className="text-white/40">/ {a.maxGrade}</span>}
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => toggleAssignmentStatus(a.id)} className="flex-1">
                      {a.status === 'todo' ? 'Start' : a.status === 'in-progress' ? 'Continue' : a.status === 'submitted' ? 'Submitted ✓' : 'View'}
                    </Button>
                    <Button size="sm" variant="ghost" className="px-2"><MoreVertical size={14} /></Button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {showAddAssignmentModal && (
            <Modal onClose={() => setShowAddAssignmentModal(false)}>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Add Assignment</h3>
                <Input label="Title" value={newAssignmentForm.title} onChange={e => setNewAssignmentForm({ ...newAssignmentForm, title: e.target.value })} placeholder="e.g. Homework 5" />
                <Input label="Due Date" type="date" value={newAssignmentForm.due} onChange={e => setNewAssignmentForm({ ...newAssignmentForm, due: e.target.value })} />
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="secondary" onClick={() => setShowAddAssignmentModal(false)}>Cancel</Button>
                  <Button onClick={handleAddAssignment} disabled={!newAssignmentForm.title || !newAssignmentForm.due}>Add</Button>
                </div>
              </div>
            </Modal>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  const tabContent: Record<Tab, () => React.ReactNode> = {
    overview: renderOverview,
    materials: renderMaterials,
    notes: renderNotes,
    lectures: renderLectures,
    exams: renderExams,
    assignments: renderAssignments,
  };

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl p-6">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          {/* ─── Subject Header ─── */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4">
            <Link href="/study">
              <motion.div
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft size={18} />
              </motion.div>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="h-8 w-1.5 rounded-full shrink-0" style={{ background: subject!.color }} />
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold tracking-tight text-white">{subject!.name}</h1>
                    <Badge variant="info">{subject!.category || 'General'}</Badge>
                    <span className="text-sm text-white/30">{subject!.code}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/40 mt-0.5">
                    <Users size={14} />
                    <span>{subject!.professor || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full sm:w-48 shrink-0">
              <ProgressBar value={subject!.progress} showPercentage label="Progress" />
            </div>
          </motion.div>

          {/* ─── Tab Navigation ─── */}
          <motion.div variants={itemVariants} className="flex flex-wrap gap-1.5 rounded-2xl bg-white/[0.02] border border-white/5 p-1.5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-white shadow-lg shadow-indigo-500/20'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </span>
              </button>
            ))}
          </motion.div>

          {/* ─── Tab Content ─── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {tabContent[activeTab]()}
            </motion.div>
          </AnimatePresence>

          {/* Delete Confirmation */}
          {deleteConfirm && (
            <Modal onClose={() => setDeleteConfirm(null)}>
              <div className="text-center space-y-4 py-4">
                <Trash2 size={40} className="mx-auto text-red-400" />
                <h3 className="text-lg font-semibold text-white">Delete?</h3>
                <p className="text-sm text-white/50">This action cannot be undone.</p>
                <div className="flex justify-center gap-3">
                  <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                  <Button variant="danger" onClick={() => {
                    const id = deleteConfirm;
                    setDeleteConfirm(null);
                    if (deleteType === 'file') handleDeleteFile(id);
                    else if (deleteType === 'folder') handleDeleteFolder(id);
                    else if (deleteType === 'lecture') handleDeleteLecture(id);
                    else if (deleteType === 'exam') handleDeleteExam(id);
                    else if (deleteType === 'assignment') handleDeleteAssignment(id);
                    else if (deleteType === 'note') handleDeleteNote(id);
                  }}>Delete</Button>
                </div>
              </div>
            </Modal>
          )}

          {/* ─── Footer ─── */}
          <motion.div variants={itemVariants} className="flex items-center justify-center gap-2 border-t border-white/5 pt-6 pb-2">
            <GraduationCap size={14} className="text-white/20" />
            <span className="text-xs text-white/20">LifeOS · {subject!.code} · {subject!.name}</span>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}

function SubjectPageFallback() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl p-6">
        <div className="flex flex-col items-center justify-center py-32">
          <motion.div
            className="h-10 w-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="mt-4 text-sm text-white/40">Loading subject workspace...</p>
        </div>
      </div>
    </main>
  );
}

export default function SubjectPage() {
  return (
    <Suspense fallback={<SubjectPageFallback />}>
      <SubjectContent />
    </Suspense>
  );
}
