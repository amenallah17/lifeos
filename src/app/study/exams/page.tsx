'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Clock, Target, BarChart3, TrendingUp, BookOpen, BrainCircuit,
  ListChecks, ArrowLeft, ArrowRight, Plus, Flame, Award, CheckCircle,
  Circle, AlertTriangle, Timer, Layers, ChevronDown, ChevronUp,
  Trash2, Edit3, GraduationCap,
} from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import ProgressBar from '@/components/ui/ProgressBar'
import { useLocalStorage } from '@/lib/usePersistence'
import { Exam } from '@/types'

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9)

type ExamTypeDisplay = 'Midterm' | 'Final' | 'Quiz' | 'Oral'
type PriorityDisplay = 'High' | 'Medium' | 'Low'
type SessionType = 'Study' | 'Revision' | 'Exam Prep'

interface StudySession {
  id: string
  subject: string
  date: Date
  startTime: string
  duration: number
  type: SessionType
  notes: string
  completed: boolean
}

interface ExamNote {
  id: string
  content: string
  createdAt: Date
}

interface ExtendedExam {
  id: string
  subject: string
  subjectColor: string
  title: string
  type: ExamTypeDisplay
  date: Date
  time: string
  location: string
  weight: number
  priority: PriorityDisplay
  prepared: boolean
  notes: ExamNote[]
  sessions: StudySession[]
  flashcardDeck: string
  flashcardCount: number
  expanded: boolean
}

const COLORS = ['#06b6d4', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6']

const SUBJECTS = ['Networks', 'Algorithms', 'Operating Systems', 'Databases', 'Mathematics']
const SUBJECT_COLORS: Record<string, string> = {
  Networks: '#06b6d4',
  Algorithms: '#8b5cf6',
  'Operating Systems': '#f43f5e',
  Databases: '#10b981',
  Mathematics: '#f59e0b',
}
const SESSION_TYPES: SessionType[] = ['Study', 'Revision', 'Exam Prep']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getDaysLeft(date: Date): number {
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function daysLeftColor(days: number): string {
  if (days <= 2) return 'text-red-400'
  if (days <= 7) return 'text-orange-400'
  if (days <= 14) return 'text-yellow-400'
  return 'text-emerald-400'
}

function getUrgencyBg(days: number): string {
  if (days <= 2) return 'bg-red-500/10 border-red-500/30'
  if (days <= 7) return 'bg-orange-500/10 border-orange-500/30'
  if (days <= 14) return 'bg-yellow-500/10 border-yellow-500/30'
  return ''
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getWeekDays(refDate: Date): Date[] {
  const day = refDate.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(refDate)
  monday.setDate(refDate.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export default function ExamsPage() {
  const [storedExams, setStoredExams] = useLocalStorage<any[]>('uni-exams', [])
  const [exams, setExams] = useState<ExtendedExam[]>(() =>
    storedExams.map((e: any) => ({
      ...e,
      date: new Date(e.date),
      notes: e.notes || [],
      sessions: e.sessions || [],
      expanded: false,
    }))
  )
  const [pastSessions, setPastSessions] = useLocalStorage<StudySession[]>('study-sessions', [])
  const [weekOffset, setWeekOffset] = useState(0)
  const [showNewExamModal, setShowNewExamModal] = useState(false)
  const [showEditExamModal, setShowEditExamModal] = useState(false)
  const [editingExam, setEditingExam] = useState<ExtendedExam | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showAddSessionModal, setShowAddSessionModal] = useState(false)
  const [showFlashcardModal, setShowFlashcardModal] = useState(false)
  const [flashcardSubject, setFlashcardSubject] = useState('')
  const [newExam, setNewExam] = useState({
    subject: SUBJECTS[0],
    title: '',
    type: 'Midterm' as ExamTypeDisplay,
    date: '',
    time: '',
    location: '',
    weight: 0,
    priority: 'Medium' as PriorityDisplay,
    notes: '',
  })
  const [editExamForm, setEditExamForm] = useState({
    subject: '',
    title: '',
    type: 'Midterm' as ExamTypeDisplay,
    date: '',
    time: '',
    location: '',
    weight: 0,
    priority: 'Medium' as PriorityDisplay,
    notes: '',
  })
  const [newSession, setNewSession] = useState({
    subject: SUBJECTS[0],
    date: '',
    startTime: '',
    duration: 60,
    type: 'Study' as SessionType,
    notes: '',
  })
  const [newNote, setNewNote] = useState('')

  const syncToStorage = (updatedExams: ExtendedExam[]) => {
    setStoredExams(updatedExams.map(e => ({ ...e, date: e.date.toISOString(), notes: e.notes || [], sessions: e.sessions || [] })))
  }

  const updateExams = (updater: (prev: ExtendedExam[]) => ExtendedExam[]) => {
    setExams(prev => {
      const next = updater(prev)
      syncToStorage(next)
      return next
    })
  }

  const weekDays = useMemo(() => {
    const base = new Date()
    base.setDate(base.getDate() + weekOffset * 7)
    return getWeekDays(base)
  }, [weekOffset])

  const today = getToday()

  const sortedExams = useMemo(
    () => [...exams].sort((a, b) => a.date.getTime() - b.date.getTime()),
    [exams]
  )

  const thisWeekSessions = useMemo(() => {
    const sessions: StudySession[] = []
    exams.forEach((e) => e.sessions.forEach((s) => sessions.push(s)))
    return sessions.filter((s) => {
      const sd = new Date(s.date)
      sd.setHours(0, 0, 0, 0)
      return weekDays.some((wd) => isSameDay(wd, sd))
    })
  }, [exams, weekDays])

  const totalStudyHoursThisWeek = useMemo(() => {
    const now = new Date()
    const weekStart = getWeekDays(now)[0]
    const weekEnd = getWeekDays(now)[6]
    return pastSessions
      .filter((s) => {
        const sd = new Date(s.date)
        return sd >= weekStart && sd <= weekEnd
      })
      .reduce((acc, s) => acc + s.duration, 0)
  }, [pastSessions])

  const totalStudyHoursThisMonth = useMemo(() => {
    const now = new Date()
    return pastSessions
      .filter((s) => {
        const sd = new Date(s.date)
        return sd.getMonth() === now.getMonth() && sd.getFullYear() === now.getFullYear()
      })
      .reduce((acc, s) => acc + s.duration, 0)
  }, [pastSessions])

  const hoursPerSubject = useMemo(() => {
    const map: Record<string, number> = {}
    const all = [...pastSessions]
    exams.forEach((e) => e.sessions.forEach((s) => all.push(s)))
    all.forEach((s) => {
      map[s.subject] = (map[s.subject] || 0) + s.duration / 60
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [pastSessions, exams])

  const studyStreak = useMemo(() => {
    const allDates = [...pastSessions.map((s) => s.date), ...exams.flatMap((e) => e.sessions.map((s) => s.date))]
    const uniqueDays = new Set(allDates.map((d) => d.toDateString()))
    let streak = 0
    const d = new Date()
    while (uniqueDays.has(d.toDateString())) {
      streak++
      d.setDate(d.getDate() - 1)
    }
    return streak
  }, [pastSessions, exams])

  const sessionsCompleted = useMemo(
    () => pastSessions.filter((s) => s.completed).length + exams.flatMap((e) => e.sessions.filter((s) => s.completed)).length,
    [pastSessions, exams]
  )

  const avgSessionDuration = useMemo(() => {
    const all = [...pastSessions, ...exams.flatMap((e) => e.sessions)]
    if (all.length === 0) return 0
    return Math.round(all.reduce((acc, s) => acc + s.duration, 0) / all.length)
  }, [pastSessions, exams])

  const studyVsBreakRatio = useMemo(() => {
    const totalStudy = [...pastSessions, ...exams.flatMap((e) => e.sessions)].reduce((acc, s) => acc + s.duration, 0)
    if (totalStudy === 0) return { study: 60, break: 40 }
    const breakEst = Math.round(totalStudy * 0.25)
    const total = totalStudy + breakEst
    return {
      study: Math.round((totalStudy / total) * 100),
      break: Math.round((breakEst / total) * 100),
    }
  }, [pastSessions, exams])

  const studyHoursPerDay = useMemo(() => {
    const map: Record<string, number> = {}
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      map[d.toDateString()] = 0
    }
    pastSessions.forEach((s) => {
      const key = s.date.toDateString()
      if (key in map) map[key] += s.duration / 60
    })
    return Object.entries(map)
  }, [pastSessions])

  const togglePrepared = (id: string) => {
    updateExams((prev) => prev.map((e) => (e.id === id ? { ...e, prepared: !e.prepared } : e)))
  }

  const toggleExpanded = (id: string) => {
    updateExams((prev) => prev.map((e) => (e.id === id ? { ...e, expanded: !e.expanded } : e)))
  }

  const handleAddExam = () => {
    if (!newExam.title || !newExam.date) return
    const exam: ExtendedExam = {
      id: generateId(),
      subject: newExam.subject,
      subjectColor: SUBJECT_COLORS[newExam.subject] || COLORS[0],
      title: newExam.title,
      type: newExam.type,
      date: new Date(newExam.date),
      time: newExam.time || 'TBD',
      location: newExam.location || 'TBD',
      weight: newExam.weight,
      priority: newExam.priority,
      prepared: false,
      notes: newExam.notes ? [{ id: generateId(), content: newExam.notes, createdAt: new Date() }] : [],
      sessions: [],
      flashcardDeck: `${newExam.subject} Deck`,
      flashcardCount: Math.floor(Math.random() * 50) + 10,
      expanded: false,
    }
    updateExams((prev) => [...prev, exam])
    setNewExam({ subject: SUBJECTS[0], title: '', type: 'Midterm', date: '', time: '', location: '', weight: 0, priority: 'Medium', notes: '' })
    setShowNewExamModal(false)
  }

  const handleEditExam = () => {
    if (!editingExam || !editExamForm.title || !editExamForm.date) return
    updateExams((prev) =>
      prev.map((e) =>
        e.id === editingExam.id
          ? {
              ...e,
              subject: editExamForm.subject,
              title: editExamForm.title,
              type: editExamForm.type,
              date: new Date(editExamForm.date),
              time: editExamForm.time || 'TBD',
              location: editExamForm.location || 'TBD',
              weight: editExamForm.weight,
              priority: editExamForm.priority,
              subjectColor: SUBJECT_COLORS[editExamForm.subject] || COLORS[0],
            }
          : e
      )
    )
    setShowEditExamModal(false)
    setEditingExam(null)
  }

  const openEditExam = (exam: ExtendedExam) => {
    setEditingExam(exam)
    setEditExamForm({
      subject: exam.subject,
      title: exam.title,
      type: exam.type,
      date: exam.date.toISOString().split('T')[0],
      time: exam.time === 'TBD' ? '' : exam.time,
      location: exam.location === 'TBD' ? '' : exam.location,
      weight: exam.weight,
      priority: exam.priority,
      notes: exam.notes.map(n => n.content).join('\n'),
    })
    setShowEditExamModal(true)
  }

  const handleDeleteExam = (id: string) => {
    updateExams((prev) => prev.filter((e) => e.id !== id))
    setDeleteConfirm(null)
  }

  const handleAddSession = () => {
    if (!newSession.date || !newSession.startTime) return
    const session: StudySession = {
      id: generateId(),
      subject: newSession.subject,
      date: new Date(newSession.date),
      startTime: newSession.startTime,
      duration: newSession.duration,
      type: newSession.type,
      notes: newSession.notes,
      completed: false,
    }
    updateExams((prev) =>
      prev.map((e) => {
        if (e.subject === session.subject) {
          return { ...e, sessions: [...e.sessions, session] }
        }
        return e
      })
    )
    setNewSession({ subject: SUBJECTS[0], date: '', startTime: '', duration: 60, type: 'Study', notes: '' })
    setShowAddSessionModal(false)
  }

  const handleAddNote = (examId: string) => {
    if (!newNote.trim()) return
    updateExams((prev) =>
      prev.map((e) =>
        e.id === examId
          ? { ...e, notes: [...e.notes, { id: generateId(), content: newNote, createdAt: new Date() }] }
          : e
      )
    )
    setNewNote('')
  }

  const flashcardExams = exams.filter((e) => e.flashcardCount > 0)

  const handleAddToRevisionPlan = (examId: string) => {
    const exam = exams.find((e) => e.id === examId)
    if (!exam) return
    const daysUntil = getDaysLeft(exam.date)
    const sessionDate = new Date(exam.date)
    sessionDate.setDate(sessionDate.getDate() - Math.min(daysUntil, 7))
    const session: StudySession = {
      id: generateId(),
      subject: exam.subject,
      date: sessionDate,
      startTime: '18:00',
      duration: 90,
      type: 'Exam Prep',
      notes: `Revision for ${exam.title}`,
      completed: false,
    }
    updateExams((prev) =>
      prev.map((e) => (e.id === examId ? { ...e, sessions: [...e.sessions, session] } : e))
    )
  }

  const handleDragReschedule = (sessionId: string, daysDelta: number) => {
    updateExams((prev) =>
      prev.map((e) => ({
        ...e,
        sessions: e.sessions.map((s) => {
          if (s.id === sessionId) {
            const newDate = new Date(s.date)
            newDate.setDate(newDate.getDate() + daysDelta)
            return { ...s, date: newDate }
          }
          return s
        }),
      }))
    )
  }

  const maxHours = Math.max(...studyHoursPerDay.map(([, h]) => h), 1)

  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
            <BookOpen className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Exams & Revision</h1>
            <p className="text-sm text-white/50 mt-1">Plan, track, and ace your exams</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setShowAddSessionModal(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Study Session
          </Button>
          <Button onClick={() => setShowNewExamModal(true)} className="flex items-center gap-2 bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/40">
            <Plus className="w-4 h-4" />
            New Exam
          </Button>
        </div>
      </motion.div>

      {/* Upcoming Exams */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-semibold text-white">Upcoming Exams</h2>
          <span className="text-xs text-white/40 ml-auto">{sortedExams.length} exams</span>
        </div>

        {sortedExams.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-20">
            <GraduationCap size={48} className="text-white/20" />
            <p className="mt-4 text-lg font-medium text-white/40">No exams scheduled</p>
            <p className="mt-1 text-sm text-white/30">Add your first exam to start tracking</p>
            <Button className="mt-4" icon={<Plus size={16} />} onClick={() => setShowNewExamModal(true)}>
              New Exam
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedExams.map((exam, idx) => {
              const daysLeft = getDaysLeft(exam.date)
              const urgent = daysLeft < 7
              return (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <GlassCard
                    className={`relative overflow-hidden cursor-pointer transition-all duration-300 border ${
                      urgent ? getUrgencyBg(daysLeft) : 'border-white/5'
                    }`}
                    onClick={() => toggleExpanded(exam.id)}
                  >
                    {/* Subject color bar */}
                    <div
                      className="absolute top-0 left-0 w-1.5 h-full rounded-l-xl"
                      style={{ backgroundColor: exam.subjectColor }}
                    />

                    {/* Edit & Delete buttons */}
                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditExam(exam); }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <Edit3 size={12} className="text-white/50 hover:text-white" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(exam.id); }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 size={12} className="text-red-400" />
                      </button>
                    </div>

                    <div className="pl-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium text-white"
                            style={{ backgroundColor: exam.subjectColor + '30', color: exam.subjectColor }}
                          >
                            {exam.subject}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/70">
                            {exam.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              exam.priority === 'High'
                                ? 'bg-red-500/20 text-red-400'
                                : exam.priority === 'Medium'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {exam.priority}
                          </span>
                          {exam.expanded ? (
                            <ChevronUp className="w-4 h-4 text-white/40" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-white/40" />
                          )}
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-white mb-2">{exam.title}</h3>

                      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                        <div className="flex items-center gap-2 text-white/50">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(exam.date)}
                        </div>
                        <div className="flex items-center gap-2 text-white/50">
                          <Clock className="w-3.5 h-3.5" />
                          {exam.time}
                        </div>
                        <div className="flex items-center gap-2 text-white/50">
                          <Layers className="w-3.5 h-3.5" />
                          {exam.location}
                        </div>
                        <div className="flex items-center gap-2 text-white/50">
                          <Target className="w-3.5 h-3.5" />
                          {exam.weight}% weight
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-white/40">Preparedness</span>
                          <span className="text-xs text-white/60">{exam.prepared ? 'Prepared' : 'Not Prepared'}</span>
                        </div>
                        <ProgressBar value={exam.prepared ? 100 : 15} />
                      </div>

                      {/* Countdown */}
                      <div className={`flex items-center justify-between ${urgent ? 'mb-4' : 'mb-2'}`}>
                        <div className={`flex items-center gap-2 text-lg font-bold ${daysLeftColor(daysLeft)}`}>
                          {urgent && <AlertTriangle className="w-4 h-4" />}
                          {daysLeft === 0 ? 'Due Today!' : `${daysLeft} days left`}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            togglePrepared(exam.id)
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-all ${
                            exam.prepared
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-white/5 text-white/40 hover:bg-white/10'
                          }`}
                        >
                          {exam.prepared ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <Circle className="w-3.5 h-3.5" />
                          )}
                          {exam.prepared ? 'Prepared' : 'Mark Prepared'}
                        </button>
                      </div>

                      {urgent && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs text-red-400/70 mb-2"
                        >
                          Less than a week away! Time to prioritize.
                        </motion.div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddToRevisionPlan(exam.id)
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all border border-cyan-500/20"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add to Revision Plan
                      </button>

                      {/* Expanded section */}
                      <AnimatePresence>
                        {exam.expanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                              {/* Notes */}
                              <div>
                                <h4 className="text-sm font-medium text-white/70 mb-2">Notes</h4>
                                {exam.notes.length === 0 && (
                                  <p className="text-xs text-white/30 italic">No notes yet</p>
                                )}
                                <div className="space-y-2 mb-2">
                                  {exam.notes.map((note) => (
                                    <div key={note.id} className="p-2 rounded-lg bg-white/5 text-sm text-white/70">
                                      {note.content}
                                    </div>
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                  <input
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="Add a note..."
                                    className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/40"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleAddNote(exam.id)
                                    }}
                                  />
                                  <Button size="sm" onClick={() => handleAddNote(exam.id)}>
                                    Add
                                  </Button>
                                </div>
                              </div>

                              {/* Study Sessions */}
                              <div>
                                <h4 className="text-sm font-medium text-white/70 mb-2">
                                  Study Sessions ({exam.sessions.length})
                                </h4>
                                {exam.sessions.length === 0 && (
                                  <p className="text-xs text-white/30 italic">No sessions planned</p>
                                )}
                                <div className="space-y-2">
                                  {exam.sessions.map((s) => (
                                    <div
                                      key={s.id}
                                      className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span
                                          className={`w-2 h-2 rounded-full ${
                                            s.completed ? 'bg-emerald-400' : 'bg-cyan-400'
                                          }`}
                                        />
                                        <div>
                                          <span className="text-sm text-white/80">{s.subject}</span>
                                          <span className="text-xs text-white/40 ml-2">
                                            {formatDate(s.date)} at {s.startTime}
                                          </span>
                                        </div>
                                      </div>
                                      <span className="text-xs text-white/50">{s.duration}min</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Flashcard Link */}
                              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                <div className="flex items-center gap-3">
                                  <BrainCircuit className="w-4 h-4 text-purple-400" />
                                  <div>
                                    <span className="text-sm text-white/80">{exam.flashcardDeck}</span>
                                    <span className="text-xs text-white/40 ml-2">{exam.flashcardCount} cards</span>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setFlashcardSubject(exam.subject)
                                    setShowFlashcardModal(true)
                                  }}
                                  className="px-3 py-1 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all"
                                >
                                  Review Cards
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </GlassCard>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Revision Planner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-semibold text-white">Revision Planner</h2>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setWeekOffset((p) => p - 1)}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Prev
            </Button>
            <span className="text-sm text-white/60 min-w-[100px] text-center">
              {weekOffset === 0 ? 'This Week' : weekOffset === 1 ? 'Next Week' : `${weekOffset > 0 ? '+' : ''}${weekOffset} weeks`}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setWeekOffset((p) => p + 1)}
              className="flex items-center gap-1"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Weekly Calendar Grid */}
        <GlassCard className="overflow-hidden">
          <div className="grid grid-cols-7 border-b border-white/5">
            {DAYS.map((day, i) => {
              const isToday = isSameDay(weekDays[i], today)
              return (
                <div
                  key={day}
                  className={`px-3 py-3 text-center text-sm font-medium ${
                    isToday
                      ? 'text-cyan-400 bg-cyan-500/10'
                      : 'text-white/50'
                  }`}
                >
                  <div>{day}</div>
                  <div className={`text-lg font-bold ${isToday ? 'text-cyan-400' : 'text-white/30'}`}>
                    {weekDays[i].getDate()}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="grid grid-cols-7 min-h-[280px]">
            {weekDays.map((day, i) => {
              const daySessions = thisWeekSessions.filter((s) => isSameDay(new Date(s.date), day))
              const isToday = isSameDay(day, today)
              return (
                <div
                  key={i}
                  className={`p-2 border-r border-b border-white/5 last:border-r-0 min-h-[120px] ${
                    isToday ? 'bg-cyan-500/5' : ''
                  }`}
                >
                  {daySessions.length === 0 && (
                    <div className="text-xs text-white/20 text-center mt-6">—</div>
                  )}
                  <div className="space-y-1.5">
                    {daySessions.slice(0, 3).map((s) => (
                      <div
                        key={s.id}
                        className="group relative px-2 py-1.5 rounded-lg text-xs cursor-grab active:cursor-grabbing transition-all"
                        style={{
                          backgroundColor: (SUBJECT_COLORS[s.subject] || '#06b6d4') + '20',
                          borderLeft: `3px solid ${SUBJECT_COLORS[s.subject] || '#06b6d4'}`,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white/80 truncate max-w-[80px]">{s.subject}</span>
                          <span className="text-white/40">{s.duration}m</span>
                        </div>
                        <span className="text-[10px] text-white/40">{s.startTime}</span>
                        <span className="ml-1 text-[10px] px-1 rounded bg-white/10 text-white/50">{s.type}</span>
                        <div className="hidden group-hover:flex absolute -top-1 -right-1 gap-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDragReschedule(s.id, -1)
                            }}
                            className="w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[10px] text-white/60"
                            title="Move earlier"
                          >
                            ←
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDragReschedule(s.id, 1)
                            }}
                            className="w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[10px] text-white/60"
                            title="Move later"
                          >
                            →
                          </button>
                        </div>
                      </div>
                    ))}
                    {daySessions.length > 3 && (
                      <div className="text-[10px] text-white/30 text-center">+{daySessions.length - 3} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </GlassCard>
      </motion.div>

      {/* Study Sessions History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6"
      >
        {/* History List */}
        <GlassCard className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ListChecks className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">Study Sessions History</h2>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-white/50">
                <span className="text-white/80 font-medium">{Math.round(totalStudyHoursThisWeek / 60 * 10) / 10}h</span> this week
              </div>
              <div className="text-white/50">
                <span className="text-white/80 font-medium">{Math.round(totalStudyHoursThisMonth / 60 * 10) / 10}h</span> this month
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end gap-2 mb-6 h-24">
            {studyHoursPerDay.map(([dayKey, hours], i) => {
              const dayLabel = new Date(dayKey).toLocaleDateString('en-US', { weekday: 'short' })
              const barHeight = Math.max((hours / maxHours) * 100, hours > 0 ? 8 : 2)
              const isLast3 = i >= studyHoursPerDay.length - 3
              const isTodayAgain = dayKey === today.toDateString()
              return (
                <div key={dayKey} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-white/30">{hours.toFixed(1)}h</span>
                  <div className="w-full flex items-end justify-center" style={{ height: '100px' }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${barHeight}%` }}
                      transition={{ delay: i * 0.03, duration: 0.5 }}
                      className={`w-full max-w-[24px] rounded-t-md transition-colors ${
                        isTodayAgain
                          ? 'bg-cyan-400/60'
                          : isLast3
                          ? 'bg-cyan-500/40'
                          : 'bg-white/10'
                      }`}
                    />
                  </div>
                  <span className={`text-[10px] ${isTodayAgain ? 'text-cyan-400 font-medium' : 'text-white/30'}`}>
                    {dayLabel}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Session List */}
          <div className="space-y-2 max-h-[360px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            {pastSessions.length === 0 ? (
              <p className="text-sm text-white/30 py-8 text-center">No study sessions recorded</p>
            ) : (
              pastSessions.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-all border border-white/5"
                >
                  <div className="flex items-center gap-4">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white/80">{s.subject}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/10 text-white/60">
                          {s.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">
                        <span>{formatDate(s.date)}</span>
                        <span>{s.startTime}</span>
                        <span>{s.duration} min</span>
                      </div>
                      {s.notes && <p className="text-xs text-white/30 mt-0.5">{s.notes}</p>}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {s.duration}min
                  </Badge>
                </motion.div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Stats & Analytics */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Statistics</h2>
          </div>

          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                <Timer className="w-4 h-4" />
                Total Study Hours
              </div>
              <div className="text-3xl font-bold text-white">
                {Math.round(
                  ([...pastSessions, ...exams.flatMap((e) => e.sessions)].reduce((a, s) => a + s.duration, 0) / 60) * 10
                ) / 10}
                <span className="text-lg text-white/30 ml-1">h</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                <Flame className="w-4 h-4 text-orange-400" />
                Study Streak
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-orange-400">{studyStreak}</span>
                <span className="text-sm text-white/40">consecutive days</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                <Award className="w-4 h-4 text-yellow-400" />
                Sessions Completed
              </div>
              <div className="text-3xl font-bold text-yellow-400">{sessionsCompleted}</div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Avg Session Duration
              </div>
              <div className="text-3xl font-bold text-emerald-400">
                {avgSessionDuration}
                <span className="text-lg text-white/30 ml-1">min</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 text-white/50 text-sm mb-3">
                <Layers className="w-4 h-4 text-purple-400" />
                Study vs Break Ratio
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 rounded-full bg-white/10 overflow-hidden flex">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${studyVsBreakRatio.study}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-cyan-400 rounded-l-full"
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${studyVsBreakRatio.break}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full bg-purple-400/50 rounded-r-full"
                  />
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs">
                <span className="text-cyan-400">{studyVsBreakRatio.study}% Study</span>
                <span className="text-purple-400/70">{studyVsBreakRatio.break}% Break</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Hours Per Subject */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Hours Per Subject</h2>
          </div>
          <div className="space-y-4">
            {hoursPerSubject.map(([subject, hours], i) => {
              const maxH = hoursPerSubject[0][1]
              const pct = maxH > 0 ? (hours / maxH) * 100 : 0
              const color = SUBJECT_COLORS[subject] || COLORS[i % COLORS.length]
              return (
                <div key={subject}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-sm text-white/70">{subject}</span>
                    </div>
                    <span className="text-sm text-white/50">{hours.toFixed(1)}h</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color + '60' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </GlassCard>
      </motion.div>

      {/* Flashcards Integration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <GlassCard className="border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                <BrainCircuit className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Flashcards Integration</h2>
                <p className="text-sm text-white/50 mt-1">
                  Review subject-specific flashcards to reinforce your knowledge
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-6">
            {flashcardExams.map((exam) => (
              <button
                key={exam.id}
                onClick={() => {
                  setFlashcardSubject(exam.subject)
                  setShowFlashcardModal(true)
                }}
                className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all text-left group"
              >
                <div
                  className="w-8 h-1 rounded-full mb-3"
                  style={{ backgroundColor: exam.subjectColor }}
                />
                <div className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                  {exam.subject}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-white/40">
                  <BrainCircuit className="w-3 h-3" />
                  {exam.flashcardCount} cards
                </div>
                <div className="mt-2 text-xs text-purple-400/70 group-hover:text-purple-400 transition-colors">
                  Review Cards →
                </div>
              </button>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* New Exam Modal */}
      <AnimatePresence>
        {showNewExamModal && (
          <Modal onClose={() => setShowNewExamModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 space-y-5"
            >
              <h3 className="text-xl font-semibold text-white">Create New Exam</h3>

              <div>
                <label className="block text-sm text-white/50 mb-1.5">Subject</label>
                <select
                  value={newExam.subject}
                  onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/40"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s} className="bg-gray-900">{s}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Exam Title"
                value={newExam.title}
                onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                placeholder="e.g. Networks Midterm"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/50 mb-1.5">Type</label>
                  <select
                    value={newExam.type}
                    onChange={(e) => setNewExam({ ...newExam, type: e.target.value as ExamTypeDisplay })}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/40"
                  >
                    <option value="Midterm" className="bg-gray-900">Midterm</option>
                    <option value="Final" className="bg-gray-900">Final</option>
                    <option value="Quiz" className="bg-gray-900">Quiz</option>
                    <option value="Oral" className="bg-gray-900">Oral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-1.5">Priority</label>
                  <select
                    value={newExam.priority}
                    onChange={(e) => setNewExam({ ...newExam, priority: e.target.value as PriorityDisplay })}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/40"
                  >
                    <option value="High" className="bg-gray-900">High</option>
                    <option value="Medium" className="bg-gray-900">Medium</option>
                    <option value="Low" className="bg-gray-900">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date"
                  type="date"
                  value={newExam.date}
                  onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                />
                <Input
                  label="Time"
                  type="time"
                  value={newExam.time}
                  onChange={(e) => setNewExam({ ...newExam, time: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Location"
                  value={newExam.location}
                  onChange={(e) => setNewExam({ ...newExam, location: e.target.value })}
                  placeholder="Room 301"
                />
                <Input
                  label="Weight (%)"
                  type="number"
                  value={String(newExam.weight)}
                  onChange={(e) => setNewExam({ ...newExam, weight: Number(e.target.value) })}
                  placeholder="30"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/70">Notes</label>
                <textarea
                  value={newExam.notes}
                  onChange={(e) => setNewExam({ ...newExam, notes: e.target.value })}
                  placeholder="Any notes about this exam..."
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/40 resize-none h-20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setShowNewExamModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddExam} disabled={!newExam.title || !newExam.date}>
                  Create Exam
                </Button>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Edit Exam Modal */}
      <AnimatePresence>
        {showEditExamModal && editingExam && (
          <Modal onClose={() => { setShowEditExamModal(false); setEditingExam(null); }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 space-y-5"
            >
              <h3 className="text-xl font-semibold text-white">Edit Exam</h3>

              <div>
                <label className="block text-sm text-white/50 mb-1.5">Subject</label>
                <select
                  value={editExamForm.subject}
                  onChange={(e) => setEditExamForm({ ...editExamForm, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/40"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s} className="bg-gray-900">{s}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Exam Title"
                value={editExamForm.title}
                onChange={(e) => setEditExamForm({ ...editExamForm, title: e.target.value })}
                placeholder="e.g. Networks Midterm"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/50 mb-1.5">Type</label>
                  <select
                    value={editExamForm.type}
                    onChange={(e) => setEditExamForm({ ...editExamForm, type: e.target.value as ExamTypeDisplay })}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/40"
                  >
                    <option value="Midterm" className="bg-gray-900">Midterm</option>
                    <option value="Final" className="bg-gray-900">Final</option>
                    <option value="Quiz" className="bg-gray-900">Quiz</option>
                    <option value="Oral" className="bg-gray-900">Oral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-1.5">Priority</label>
                  <select
                    value={editExamForm.priority}
                    onChange={(e) => setEditExamForm({ ...editExamForm, priority: e.target.value as PriorityDisplay })}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/40"
                  >
                    <option value="High" className="bg-gray-900">High</option>
                    <option value="Medium" className="bg-gray-900">Medium</option>
                    <option value="Low" className="bg-gray-900">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date"
                  type="date"
                  value={editExamForm.date}
                  onChange={(e) => setEditExamForm({ ...editExamForm, date: e.target.value })}
                />
                <Input
                  label="Time"
                  type="time"
                  value={editExamForm.time}
                  onChange={(e) => setEditExamForm({ ...editExamForm, time: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Location"
                  value={editExamForm.location}
                  onChange={(e) => setEditExamForm({ ...editExamForm, location: e.target.value })}
                  placeholder="Room 301"
                />
                <Input
                  label="Weight (%)"
                  type="number"
                  value={String(editExamForm.weight)}
                  onChange={(e) => setEditExamForm({ ...editExamForm, weight: Number(e.target.value) })}
                  placeholder="30"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => { setShowEditExamModal(false); setEditingExam(null); }}>Cancel</Button>
                <Button onClick={handleEditExam} disabled={!editExamForm.title || !editExamForm.date}>
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <Modal onClose={() => setDeleteConfirm(null)}>
          <div className="text-center space-y-4 py-4">
            <Trash2 size={40} className="mx-auto text-red-400" />
            <h3 className="text-lg font-semibold text-white">Delete Exam?</h3>
            <p className="text-sm text-white/50">This action cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => handleDeleteExam(deleteConfirm)}>Delete</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Study Session Modal */}
      <AnimatePresence>
        {showAddSessionModal && (
          <Modal onClose={() => setShowAddSessionModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 space-y-5"
            >
              <h3 className="text-xl font-semibold text-white">Add Study Session</h3>

              <div>
                <label className="block text-sm text-white/50 mb-1.5">Subject</label>
                <select
                  value={newSession.subject}
                  onChange={(e) => setNewSession({ ...newSession, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/40"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s} className="bg-gray-900">{s}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date"
                  type="date"
                  value={newSession.date}
                  onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                />
                <Input
                  label="Start Time"
                  type="time"
                  value={newSession.startTime}
                  onChange={(e) => setNewSession({ ...newSession, startTime: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/50 mb-1.5">Duration (minutes)</label>
                  <input
                    type="number"
                    value={newSession.duration}
                    onChange={(e) => setNewSession({ ...newSession, duration: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/40"
                    min={15}
                    step={15}
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-1.5">Type</label>
                  <select
                    value={newSession.type}
                    onChange={(e) => setNewSession({ ...newSession, type: e.target.value as SessionType })}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500/40"
                  >
                    {SESSION_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-gray-900">{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/50 mb-1.5">Notes (optional)</label>
                <textarea
                  value={newSession.notes}
                  onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                  placeholder="What will you study?"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/40 resize-none h-20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setShowAddSessionModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSession} disabled={!newSession.date || !newSession.startTime}>
                  Add Session
                </Button>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Flashcard Review Modal */}
      <AnimatePresence>
        {showFlashcardModal && (
          <Modal onClose={() => setShowFlashcardModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 space-y-5"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                  <BrainCircuit className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Flashcard Review</h3>
                  <p className="text-sm text-white/50">Subject: {flashcardSubject}</p>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-purple-500/5 border border-purple-500/10 text-center">
                <BrainCircuit className="w-12 h-12 text-purple-400/50 mx-auto mb-3" />
                <p className="text-white/70">
                  Ready to review <strong className="text-purple-400">
                    {exams.find((e) => e.subject === flashcardSubject)?.flashcardCount || 0}
                  </strong> flashcards for {flashcardSubject}?
                </p>
                <p className="text-sm text-white/40 mt-2">
                  Open the dedicated Flashcards module to start your review session.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setShowFlashcardModal(false)}>
                  Close
                </Button>
                <Button className="bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/40 flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4" />
                  Start Review
                </Button>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}
