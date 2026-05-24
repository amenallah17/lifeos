'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, FolderTree, ChevronRight, Plus, Trash2, Pencil,
  GripVertical, CheckCircle, Circle, Archive, Search, Layers,
  FileText, Video, File, X, Save, BookMarked, LayoutGrid,
  List, ChevronDown, Undo2, GraduationCap,
} from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useLocalStorage } from '@/lib/usePersistence';
import type { Course as CourseType, Chapter as ChapterType, Lesson as LessonType } from '@/types';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

type LessonTypeEnum = 'text' | 'pdf' | 'video';

interface LessonWithChapter extends LessonType {
  chapter_id: string;
}

interface ChapterWithLessons extends ChapterType {
  lessons: LessonType[];
}

interface CourseWithChapters extends CourseType {
  chapters: ChapterWithLessons[];
}

interface Category {
  id: string;
  name: string;
  color: string;
}

const CATEGORY_COLORS = [
  { name: 'Indigo', value: 'from-indigo-500 to-purple-600' },
  { name: 'Cyan', value: 'from-cyan-500 to-blue-600' },
  { name: 'Emerald', value: 'from-emerald-500 to-teal-600' },
  { name: 'Rose', value: 'from-rose-500 to-pink-600' },
  { name: 'Amber', value: 'from-amber-500 to-orange-600' },
  { name: 'Violet', value: 'from-violet-500 to-purple-600' },
  { name: 'Sky', value: 'from-sky-500 to-indigo-600' },
  { name: 'Lime', value: 'from-lime-500 to-green-600' },
];

const GRADIENTS = [
  'from-indigo-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-emerald-500 to-teal-500',
  'from-rose-500 to-amber-500',
  'from-sky-500 to-indigo-500',
  'from-violet-500 to-fuchsia-500',
  'from-cyan-500 to-blue-500',
  'from-orange-500 to-red-500',
  'from-green-500 to-emerald-500',
  'from-pink-500 to-rose-500',
];

const GRADIENT_BG_MAP: Record<string, string> = {
  'from-indigo-500 to-cyan-500': 'from-indigo-500/20 to-cyan-500/20 border-indigo-500/30',
  'from-purple-500 to-pink-500': 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  'from-emerald-500 to-teal-500': 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
  'from-rose-500 to-amber-500': 'from-rose-500/20 to-amber-500/20 border-rose-500/30',
  'from-sky-500 to-indigo-500': 'from-sky-500/20 to-indigo-500/20 border-sky-500/30',
  'from-violet-500 to-fuchsia-500': 'from-violet-500/20 to-fuchsia-500/20 border-violet-500/30',
  'from-cyan-500 to-blue-500': 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
  'from-orange-500 to-red-500': 'from-orange-500/20 to-red-500/20 border-orange-500/30',
  'from-green-500 to-emerald-500': 'from-green-500/20 to-emerald-500/20 border-green-500/30',
  'from-pink-500 to-rose-500': 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
};

const LESSON_ICONS: Record<LessonTypeEnum, typeof FileText> = {
  text: FileText,
  pdf: File,
  video: Video,
};

const defaultCategories: Category[] = [
  { id: 'cat-1', name: 'Web Development', color: 'from-indigo-500 to-cyan-500' },
  { id: 'cat-2', name: 'Data Science', color: 'from-emerald-500 to-teal-500' },
  { id: 'cat-3', name: 'Design', color: 'from-rose-500 to-amber-500' },
  { id: 'cat-4', name: 'Languages', color: 'from-violet-500 to-fuchsia-500' },
];

function calcLessons(chapters: ChapterWithLessons[]): number {
  return chapters.reduce((s, c) => s + c.lessons.length, 0);
}

function calcCompleted(chapters: ChapterWithLessons[]): number {
  return chapters.reduce((s, c) => s + c.lessons.filter((l) => l.completed).length, 0);
}

const typeVariants: Record<LessonTypeEnum, 'info' | 'warning' | 'success'> = {
  text: 'info',
  pdf: 'warning',
  video: 'success',
};

/* ─────────────────── Sortable Chapter Row ─────────────────── */
function SortableChapterRow({
  chapter,
  courseId,
  editingChapterId,
  chapterEditTitle,
  setChapterEditTitle,
  startEditChapter,
  saveEditChapter,
  cancelEditChapter,
  deleteChapter,
  toggleExpandChapter,
  expandedChapter,
  addLesson,
  updateLesson,
  deleteLesson,
  toggleLessonComplete,
  startEditLesson,
  saveEditLesson,
  editingLesson,
  lessonEdit,
  setLessonEdit,
  cancelEditLesson,
}: {
  chapter: ChapterWithLessons;
  courseId: string;
  editingChapterId: string | null;
  chapterEditTitle: string;
  setChapterEditTitle: (v: string) => void;
  startEditChapter: (id: string, title: string) => void;
  saveEditChapter: () => void;
  cancelEditChapter: () => void;
  deleteChapter: (courseId: string, chapterId: string) => void;
  toggleExpandChapter: (id: string) => void;
  expandedChapter: string | null;
  addLesson: (courseId: string, chapterId: string) => void;
  updateLesson: (courseId: string, chapterId: string, lessonId: string, updates: Partial<LessonType>) => void;
  deleteLesson: (courseId: string, chapterId: string, lessonId: string) => void;
  toggleLessonComplete: (courseId: string, chapterId: string, lessonId: string) => void;
  startEditLesson: (chapterId: string, lesson: LessonType) => void;
  saveEditLesson: () => void;
  editingLesson: { chapterId: string; lesson: LessonType } | null;
  lessonEdit: LessonType;
  setLessonEdit: (v: LessonType) => void;
  cancelEditLesson: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: chapter.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isExpanded = expandedChapter === chapter.id;

  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border border-white/5 bg-white/[0.02]">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button {...attributes} {...listeners} className="cursor-grab text-white/20 hover:text-white/40 transition-colors">
          <GripVertical size={16} />
        </button>
        <ChevronRight
          size={14}
          className={`shrink-0 text-white/30 transition-transform cursor-pointer ${isExpanded ? 'rotate-90' : ''}`}
          onClick={() => toggleExpandChapter(chapter.id)}
        />
        {editingChapterId === chapter.id ? (
          <div className="flex items-center gap-1 flex-1">
            <input
              value={chapterEditTitle}
              onChange={(e) => setChapterEditTitle(e.target.value)}
              className="flex-1 rounded-lg border border-indigo-500/30 bg-white/5 px-2 py-1 text-xs text-white outline-none"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') saveEditChapter(); if (e.key === 'Escape') cancelEditChapter(); }}
            />
            <button onClick={saveEditChapter} className="text-emerald-400 hover:text-emerald-300 p-0.5"><Save size={14} /></button>
            <button onClick={cancelEditChapter} className="text-white/30 hover:text-white p-0.5"><X size={14} /></button>
          </div>
        ) : (
          <>
            <span className="flex-1 text-sm text-white/80 font-medium">{chapter.title}</span>
            <span className="text-xs text-white/30">{chapter.lessons.length} lesson{chapter.lessons.length !== 1 ? 's' : ''}</span>
            <button onClick={() => startEditChapter(chapter.id, chapter.title)} className="text-white/20 hover:text-cyan-400 transition-colors p-0.5">
              <Pencil size={12} />
            </button>
            <button onClick={() => deleteChapter(courseId, chapter.id)} className="text-white/20 hover:text-red-400 transition-colors p-0.5">
              <Trash2 size={12} />
            </button>
          </>
        )}
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 px-3 py-2 space-y-1.5">
              {chapter.lessons.length === 0 && (
                <p className="text-xs text-white/30 py-2 text-center italic">No lessons yet</p>
              )}
              {chapter.lessons.map((lesson) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  chapterId={chapter.id}
                  courseId={courseId}
                  updateLesson={updateLesson}
                  deleteLesson={deleteLesson}
                  toggleLessonComplete={toggleLessonComplete}
                  startEditLesson={startEditLesson}
                  saveEditLesson={saveEditLesson}
                  editingLesson={editingLesson}
                  lessonEdit={lessonEdit}
                  setLessonEdit={setLessonEdit}
                  cancelEditLesson={cancelEditLesson}
                />
              ))}
              <button
                onClick={() => addLesson(courseId, chapter.id)}
                className="flex items-center gap-1.5 text-xs text-white/30 hover:text-cyan-400 transition-colors mt-1.5 py-1"
              >
                <Plus size={12} /> Add Lesson
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────── Lesson Row ─────────────────── */
function LessonRow({
  lesson,
  chapterId,
  courseId,
  updateLesson,
  deleteLesson,
  toggleLessonComplete,
  startEditLesson,
  saveEditLesson,
  editingLesson,
  lessonEdit,
  setLessonEdit,
  cancelEditLesson,
}: {
  lesson: LessonType;
  chapterId: string;
  courseId: string;
  updateLesson: (courseId: string, chapterId: string, lessonId: string, updates: Partial<LessonType>) => void;
  deleteLesson: (courseId: string, chapterId: string, lessonId: string) => void;
  toggleLessonComplete: (courseId: string, chapterId: string, lessonId: string) => void;
  startEditLesson: (chapterId: string, lesson: LessonType) => void;
  saveEditLesson: () => void;
  editingLesson: { chapterId: string; lesson: LessonType } | null;
  lessonEdit: LessonType;
  setLessonEdit: (v: LessonType) => void;
  cancelEditLesson: () => void;
}) {
  const isEditing = editingLesson?.lesson.id === lesson.id && editingLesson?.chapterId === chapterId;
  const LessIcon = LESSON_ICONS[lesson.type as LessonTypeEnum];
  const typeLabel = { text: 'Text', pdf: 'PDF', video: 'Video' }[lesson.type as LessonTypeEnum];

  return (
    <div className={`rounded-lg border ${lesson.completed ? 'border-emerald-500/15 bg-emerald-500/5' : 'border-white/5 bg-white/[0.02]'} transition-colors`}>
      {isEditing ? (
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              value={lessonEdit.title}
              onChange={(e) => setLessonEdit({ ...lessonEdit, title: e.target.value })}
              className="flex-1 rounded-lg border border-indigo-500/30 bg-white/5 px-2 py-1 text-xs text-white outline-none"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') saveEditLesson(); if (e.key === 'Escape') cancelEditLesson(); }}
            />
            <select
              value={lessonEdit.type}
              onChange={(e) => setLessonEdit({ ...lessonEdit, type: e.target.value as LessonTypeEnum })}
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white outline-none"
            >
              <option value="text">Text</option>
              <option value="pdf">PDF</option>
              <option value="video">Video</option>
            </select>
            <button onClick={saveEditLesson} className="text-emerald-400 hover:text-emerald-300 p-0.5"><Save size={14} /></button>
            <button onClick={cancelEditLesson} className="text-white/30 hover:text-white p-0.5"><X size={14} /></button>
          </div>
          <textarea
            value={lessonEdit.content || ''}
            onChange={(e) => setLessonEdit({ ...lessonEdit, content: e.target.value })}
            className="w-full rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2 text-xs text-white/70 outline-none resize-none focus:border-indigo-500/30 transition-colors"
            rows={3}
            placeholder="Notes..."
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2">
          <button onClick={() => toggleLessonComplete(courseId, chapterId, lesson.id)} className="shrink-0 transition-colors">
            {lesson.completed ? (
              <CheckCircle size={14} className="text-emerald-400" />
            ) : (
              <Circle size={14} className="text-white/20 hover:text-white/40" />
            )}
          </button>
          <LessIcon size={12} className="shrink-0 text-white/30" />
          <span className={`flex-1 text-xs ${lesson.completed ? 'text-white/40 line-through' : 'text-white/70'}`}>
            {lesson.title}
          </span>
          <Badge variant={typeVariants[lesson.type as LessonTypeEnum]} className="text-[10px] px-1.5 py-0">{typeLabel}</Badge>
          <button onClick={() => startEditLesson(chapterId, lesson)} className="text-white/20 hover:text-cyan-400 transition-colors p-0.5">
            <Pencil size={10} />
          </button>
          <button onClick={() => deleteLesson(courseId, chapterId, lesson.id)} className="text-white/20 hover:text-red-400 transition-colors p-0.5">
            <X size={10} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────── Course Card ─────────────────── */
function CourseCard({
  course,
  expandedCourse,
  toggleExpandCourse,
  editCourse,
  deleteCourse,
  archiveCourse,
  editingChapterId,
  chapterEditTitle,
  setChapterEditTitle,
  startEditChapter,
  saveEditChapter,
  cancelEditChapter,
  deleteChapter,
  addChapter,
  toggleExpandChapter,
  expandedChapter,
  addLesson,
  updateLesson,
  deleteLesson,
  toggleLessonComplete,
  startEditLesson,
  saveEditLesson,
  editingLesson,
  lessonEdit,
  setLessonEdit,
  cancelEditLesson,
  onDragEnd,
  sensors,
}: {
  course: CourseWithChapters;
  expandedCourse: string | null;
  toggleExpandCourse: (id: string) => void;
  editCourse: (course: CourseType) => void;
  deleteCourse: (id: string) => void;
  archiveCourse: (id: string) => void;
  editingChapterId: string | null;
  chapterEditTitle: string;
  setChapterEditTitle: (v: string) => void;
  startEditChapter: (id: string, title: string) => void;
  saveEditChapter: () => void;
  cancelEditChapter: () => void;
  deleteChapter: (courseId: string, chapterId: string) => void;
  addChapter: (courseId: string) => void;
  toggleExpandChapter: (id: string) => void;
  expandedChapter: string | null;
  addLesson: (courseId: string, chapterId: string) => void;
  updateLesson: (courseId: string, chapterId: string, lessonId: string, updates: Partial<LessonType>) => void;
  deleteLesson: (courseId: string, chapterId: string, lessonId: string) => void;
  toggleLessonComplete: (courseId: string, chapterId: string, lessonId: string) => void;
  startEditLesson: (chapterId: string, lesson: LessonType) => void;
  saveEditLesson: () => void;
  editingLesson: { chapterId: string; lesson: LessonType } | null;
  lessonEdit: LessonType;
  setLessonEdit: (v: LessonType) => void;
  cancelEditLesson: () => void;
  onDragEnd: (event: DragEndEvent, courseId: string) => void;
  sensors: ReturnType<typeof useSensors>;
}) {
  const isExpanded = expandedCourse === course.id;
  const totalLessons = calcLessons(course.chapters);
  const totalChapters = course.chapters.length;
  const bgColors = GRADIENT_BG_MAP[course.color || ''] || 'from-indigo-500/20 to-cyan-500/20 border-indigo-500/30';

  return (
    <motion.div layout className="group">
      <GlassCard
        className={`overflow-hidden border ${bgColors} transition-all duration-300`}
        hover
      >
        <div onClick={() => toggleExpandCourse(course.id)} className="p-5 cursor-pointer">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className={`h-3 w-3 rounded-full bg-gradient-to-br ${course.color || 'from-indigo-500 to-cyan-500'}`} />
                <h3 className="text-base font-semibold text-white truncate">{course.title}</h3>
              </div>
              <p className="text-xs text-white/40 line-clamp-2 mt-0.5">{course.description}</p>
            </div>
            <ChevronRight
              size={18}
              className={`shrink-0 text-white/30 mt-1 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-[11px] text-white/40 bg-white/5 rounded-full px-2 py-0.5">{course.category}</span>
            <span className="text-[11px] text-white/30">{totalChapters} chapter{totalChapters !== 1 ? 's' : ''}</span>
            <span className="text-[11px] text-white/30">{totalLessons} lesson{totalLessons !== 1 ? 's' : ''}</span>
          </div>
          <div className="mt-3">
            <ProgressBar value={course.progress || 0} showPercentage />
          </div>
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="border-t border-white/5 px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={12} /> Chapters
                  </h4>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); editCourse(course); }} className="text-white/20 hover:text-cyan-400 transition-colors p-1" title="Edit Course">
                      <Pencil size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); archiveCourse(course.id); }} className="text-white/20 hover:text-amber-400 transition-colors p-1" title="Archive">
                      <Archive size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteCourse(course.id); }} className="text-white/20 hover:text-red-400 transition-colors p-1" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {course.chapters.length === 0 && (
                  <p className="text-xs text-white/30 text-center py-4 italic">No chapters yet. Add one below.</p>
                )}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => onDragEnd(e, course.id)}
                >
                  <SortableContext items={course.chapters.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1.5">
                      {course.chapters.map((ch) => (
                        <SortableChapterRow
                          key={ch.id}
                          chapter={ch}
                          courseId={course.id}
                          editingChapterId={editingChapterId}
                          chapterEditTitle={chapterEditTitle}
                          setChapterEditTitle={setChapterEditTitle}
                          startEditChapter={startEditChapter}
                          saveEditChapter={saveEditChapter}
                          cancelEditChapter={cancelEditChapter}
                          deleteChapter={deleteChapter}
                          toggleExpandChapter={toggleExpandChapter}
                          expandedChapter={expandedChapter}
                          addLesson={addLesson}
                          updateLesson={updateLesson}
                          deleteLesson={deleteLesson}
                          toggleLessonComplete={toggleLessonComplete}
                          startEditLesson={startEditLesson}
                          saveEditLesson={saveEditLesson}
                          editingLesson={editingLesson}
                          lessonEdit={lessonEdit}
                          setLessonEdit={setLessonEdit}
                          cancelEditLesson={cancelEditLesson}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                <button
                  onClick={(e) => { e.stopPropagation(); addChapter(course.id); }}
                  className="flex items-center gap-1.5 text-xs text-white/30 hover:text-cyan-400 transition-colors py-1"
                >
                  <Plus size={12} /> Add Chapter
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}

/* ─────────────────── Main Page ─────────────────── */
export default function CoursesPage() {
  /* ── State ── */
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [courses, setCourses] = useLocalStorage<CourseType[]>('courses', []);
  const [chapters, setChapters] = useLocalStorage<ChapterType[]>('course-chapters', []);
  const [lessons, setLessons] = useLocalStorage<LessonType[]>('course-lessons', []);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  /* Course Modal */
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseType | null>(null);
  const [courseForm, setCourseForm] = useState({ title: '', description: '', category: '', color: GRADIENTS[0] });

  /* Category Modal */
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ name: '', color: CATEGORY_COLORS[0].value });

  /* Chapter editing */
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapterEditTitle, setChapterEditTitle] = useState('');

  /* Lesson editing */
  const [editingLesson, setEditingLesson] = useState<{ chapterId: string; lesson: LessonType } | null>(null);
  const [lessonEdit, setLessonEdit] = useState<LessonType>({ id: '', title: '', type: 'text', content: '', completed: false, order: 0, chapter_id: '', created_at: '' });

  /* Drag sensors */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  /* ── Build derived tree ── */
  const coursesWithChapters = useMemo((): CourseWithChapters[] => {
    return courses.map((course) => {
      const courseChapters = chapters
        .filter((ch) => ch.course_id === course.id)
        .sort((a, b) => a.order - b.order)
        .map((ch) => ({
          ...ch,
          lessons: lessons
            .filter((l) => l.chapter_id === ch.id)
            .sort((a, b) => a.order - b.order),
        }));
      const total = courseChapters.reduce((s, c) => s + c.lessons.length, 0);
      const done = courseChapters.reduce((s, c) => s + c.lessons.filter((l) => l.completed).length, 0);
      return { ...course, chapters: courseChapters, progress: total > 0 ? Math.round((done / total) * 100) : 0 };
    });
  }, [courses, chapters, lessons]);

  /* ── Derived ── */
  const activeCourses = coursesWithChapters.filter((c) => c.status === 'active');
  const archivedCourses = coursesWithChapters.filter((c) => c.status === 'archived');

  const filteredCourses = useMemo(() => {
    let list = activeCourses;
    if (filterCategory) {
      list = list.filter((c) => c.category === filterCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q) ||
          (c.category || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [activeCourses, filterCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeCourses.forEach((c) => {
      counts[c.category || ''] = (counts[c.category || ''] || 0) + 1;
    });
    return counts;
  }, [activeCourses]);

  /* ── Course CRUD ── */
  function openNewCourse() {
    setEditingCourse(null);
    setCourseForm({ title: '', description: '', category: categories[0]?.name || '', color: GRADIENTS[0] });
    setCourseModalOpen(true);
  }

  function openEditCourse(course: CourseType) {
    setEditingCourse(course);
    setCourseForm({ title: course.title, description: course.description || '', category: course.category || '', color: course.color || GRADIENTS[0] });
    setCourseModalOpen(true);
  }

  function saveCourse() {
    if (!courseForm.title.trim()) return;
    if (editingCourse) {
      setCourses((prev) =>
        prev.map((c) =>
          c.id === editingCourse.id
            ? { ...c, title: courseForm.title, description: courseForm.description, category: courseForm.category, color: courseForm.color }
            : c,
        ),
      );
    } else {
      const course: CourseType = {
        id: generateId(),
        title: courseForm.title,
        description: courseForm.description,
        category: courseForm.category,
        color: courseForm.color,
        icon: 'BookOpen',
        progress: 0,
        status: 'active',
        created_at: new Date().toISOString(),
      };
      setCourses((prev) => [course, ...prev]);
    }
    setCourseModalOpen(false);
  }

  function deleteCourse(id: string) {
    const courseChapters = chapters.filter((ch) => ch.course_id === id);
    const chapterIds = courseChapters.map((ch) => ch.id);
    setChapters((prev) => prev.filter((ch) => ch.course_id !== id));
    setLessons((prev) => prev.filter((l) => !chapterIds.includes(l.chapter_id)));
    setCourses((prev) => prev.filter((c) => c.id !== id));
    if (expandedCourse === id) setExpandedCourse(null);
  }

  function archiveCourse(id: string) {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: c.status === 'active' ? 'archived' as const : 'active' as const } : c)),
    );
  }

  /* ── Category CRUD ── */
  function openNewCategory() {
    setEditingCat(null);
    setCatForm({ name: '', color: CATEGORY_COLORS[0].value });
    setCatModalOpen(true);
  }

  function openEditCategory(cat: Category) {
    setEditingCat(cat);
    setCatForm({ name: cat.name, color: cat.color });
    setCatModalOpen(true);
  }

  function saveCategory() {
    if (!catForm.name.trim()) return;
    if (editingCat) {
      const oldName = editingCat.name;
      setCategories((prev) =>
        prev.map((c) => (c.id === editingCat.id ? { ...c, name: catForm.name, color: catForm.color } : c)),
      );
      setCourses((prev) =>
        prev.map((c) => (c.category === oldName ? { ...c, category: catForm.name } : c)),
      );
    } else {
      setCategories((prev) => [...prev, { id: generateId(), name: catForm.name, color: catForm.color }]);
    }
    setCatModalOpen(false);
  }

  function deleteCategory(id: string) {
    const cat = categories.find((c) => c.id === id);
    if (cat) {
      setCourses((prev) => prev.map((c) => (c.category === cat.name ? { ...c, category: '' } : c)));
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (filterCategory === cat?.name) setFilterCategory(null);
  }

  /* ── Chapter CRUD ── */
  function addChapter(courseId: string) {
    const courseChapters = chapters.filter((ch) => ch.course_id === courseId);
    const newCh: ChapterType = {
      id: generateId(),
      course_id: courseId,
      title: 'New Chapter',
      order: courseChapters.length,
      created_at: new Date().toISOString(),
    };
    setChapters((prev) => [...prev, newCh]);
  }

  function startEditChapter(id: string, title: string) {
    setEditingChapterId(id);
    setChapterEditTitle(title);
  }

  function saveEditChapter() {
    if (!editingChapterId || !chapterEditTitle.trim()) return;
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === editingChapterId ? { ...ch, title: chapterEditTitle } : ch,
      ),
    );
    setEditingChapterId(null);
    setChapterEditTitle('');
  }

  function cancelEditChapter() {
    setEditingChapterId(null);
    setChapterEditTitle('');
  }

  function deleteChapter(courseId: string, chapterId: string) {
    setLessons((prev) => prev.filter((l) => l.chapter_id !== chapterId));
    setChapters((prev) =>
      prev.filter((ch) => ch.id !== chapterId)
        .map((ch, i) => ch.course_id === courseId ? { ...ch, order: i } : ch),
    );
    if (expandedChapter === chapterId) setExpandedChapter(null);
  }

  function toggleExpandChapter(id: string) {
    setExpandedChapter((prev) => (prev === id ? null : id));
  }

  /* ── Lesson CRUD ── */
  const emptyLesson: LessonType = { id: '', title: '', type: 'text', content: '', completed: false, order: 0, chapter_id: '', created_at: '' };

  function addLesson(courseId: string, chapterId: string) {
    const chapterLessons = lessons.filter((l) => l.chapter_id === chapterId);
    const newLesson: LessonType = {
      id: generateId(),
      chapter_id: chapterId,
      title: 'New Lesson',
      type: 'text',
      content: '',
      completed: false,
      order: chapterLessons.length,
      created_at: new Date().toISOString(),
    };
    setLessons((prev) => [...prev, newLesson]);
  }

  function updateLesson(courseId: string, chapterId: string, lessonId: string, updates: Partial<LessonType>) {
    setLessons((prev) =>
      prev.map((l) => (l.id === lessonId ? { ...l, ...updates } : l)),
    );
  }

  function deleteLesson(courseId: string, chapterId: string, lessonId: string) {
    setLessons((prev) => prev.filter((l) => l.id !== lessonId));
  }

  function toggleLessonComplete(courseId: string, chapterId: string, lessonId: string) {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId ? { ...l, completed: !l.completed } : l,
      ),
    );
  }

  function startEditLesson(chapterId: string, lesson: LessonType) {
    setEditingLesson({ chapterId, lesson: { ...lesson } });
    setLessonEdit({ ...lesson });
  }

  function saveEditLesson() {
    if (!editingLesson || !lessonEdit.title.trim()) return;
    updateLesson('', editingLesson.chapterId, editingLesson.lesson.id, {
      title: lessonEdit.title,
      type: lessonEdit.type as LessonTypeEnum,
      content: lessonEdit.content,
    });
    setEditingLesson(null);
    setLessonEdit(emptyLesson);
  }

  function cancelEditLesson() {
    setEditingLesson(null);
    setLessonEdit(emptyLesson);
  }

  /* ── Drag End ── */
  function handleDragEnd(event: DragEndEvent, courseId: string) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const courseChapters = chapters.filter((ch) => ch.course_id === courseId);
    const oldIdx = courseChapters.findIndex((ch) => ch.id === active.id);
    const newIdx = courseChapters.findIndex((ch) => ch.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = [...courseChapters];
    const [removed] = reordered.splice(oldIdx, 1);
    reordered.splice(newIdx, 0, removed);
    const updatedIds = new Set(reordered.map((r) => r.id));
    setChapters((prev) =>
      prev.map((ch) => (updatedIds.has(ch.id) ? { ...ch, order: reordered.findIndex((r) => r.id === ch.id) } : ch)),
    );
  }

  /* ── Toggle expand course ── */
  function toggleExpandCourse(id: string) {
    setExpandedCourse((prev) => (prev === id ? null : id));
  }

  /* ── Container variants ── */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl p-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/30">
              <GraduationCap size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Courses</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              title={viewMode === 'grid' ? 'List view' : 'Grid view'}
            >
              {viewMode === 'grid' ? <List size={16} /> : <LayoutGrid size={16} />}
            </button>
            <Button onClick={openNewCourse} icon={<Plus size={16} />}>New Course</Button>
          </div>
        </motion.div>

        <div className="flex gap-6">
          {/* ── Sidebar ── */}
          <motion.aside variants={itemVariants} className="w-56 shrink-0 hidden lg:block">
            <div className="space-y-1 sticky top-6">
              <button
                onClick={() => setFilterCategory(null)}
                className={`w-full flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm transition-all ${
                  filterCategory === null
                    ? 'bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-white border border-indigo-500/20'
                    : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <BookOpen size={16} />
                <span className="flex-1 text-left">All Courses</span>
                <span className="text-xs text-white/30">{activeCourses.length}</span>
              </button>
              {categories.map((cat) => (
                <div key={cat.id} className="group flex items-center">
                  <button
                    onClick={() => setFilterCategory(filterCategory === cat.name ? null : cat.name)}
                    className={`flex-1 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm transition-all ${
                      filterCategory === cat.name
                        ? 'bg-white/10 text-white border border-white/10'
                        : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${cat.color}`} />
                    <span className="flex-1 text-left truncate">{cat.name}</span>
                    <span className="text-xs text-white/30">{categoryCounts[cat.name] || 0}</span>
                  </button>
                  <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                    <button onClick={() => openEditCategory(cat)} className="text-white/20 hover:text-cyan-400 transition-colors p-0.5">
                      <Pencil size={11} />
                    </button>
                    <button onClick={() => deleteCategory(cat.id)} className="text-white/20 hover:text-red-400 transition-colors p-0.5">
                      <X size={11} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={openNewCategory}
                className="w-full flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs text-white/30 hover:text-cyan-400 hover:bg-white/5 transition-all border border-dashed border-white/5"
              >
                <Plus size={12} /> New Category
              </button>
            </div>
          </motion.aside>

          {/* ── Main Content ── */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Search + Mobile categories */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                />
              </div>
              {/* Mobile category filters */}
              <div className="flex sm:hidden items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setFilterCategory(null)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                    filterCategory === null
                      ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white'
                      : 'bg-white/5 text-white/50 hover:bg-white/10'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCategory(filterCategory === cat.name ? null : cat.name)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                      filterCategory === cat.name
                        ? 'bg-white/10 text-white border border-white/10'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Archived toggle row */}
            {archivedCourses.length > 0 && (
              <motion.div variants={itemVariants}>
                <details className="group">
                  <summary className="flex items-center gap-2 cursor-pointer text-sm text-white/40 hover:text-white/60 transition-colors list-none">
                    <Archive size={14} />
                    <span>Archived ({archivedCourses.length})</span>
                    <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {archivedCourses.map((course) => (
                      <GlassCard key={course.id} className="p-4 opacity-60 hover:opacity-100 transition-opacity">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${course.color || 'from-indigo-500 to-cyan-500'}`} />
                              <h4 className="text-sm font-medium text-white truncate">{course.title}</h4>
                            </div>
                            <p className="text-xs text-white/30 mt-0.5">{course.category}</p>
                          </div>
                          <button
                            onClick={() => archiveCourse(course.id)}
                            className="text-white/20 hover:text-cyan-400 transition-colors p-1"
                            title="Unarchive"
                          >
                            <Undo2 size={14} />
                          </button>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </details>
              </motion.div>
            )}

            {/* Empty State */}
            {filteredCourses.length === 0 && (
              <motion.div variants={itemVariants}>
                <GlassCard className="p-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
                      <BookOpen size={32} className="text-white/20" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">No courses found</h3>
                    <p className="text-sm text-white/40 max-w-md">
                      {searchQuery || filterCategory
                        ? 'Try adjusting your search or filters.'
                        : 'Get started by creating your first course.'}
                    </p>
                    {!searchQuery && !filterCategory && (
                      <Button onClick={openNewCourse} icon={<Plus size={16} />}>Create Course</Button>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Course Grid / List */}
            <motion.div
              variants={itemVariants}
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'
                  : 'space-y-3'
              }
            >
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  expandedCourse={expandedCourse}
                  toggleExpandCourse={toggleExpandCourse}
                  editCourse={openEditCourse}
                  deleteCourse={deleteCourse}
                  archiveCourse={archiveCourse}
                  editingChapterId={editingChapterId}
                  chapterEditTitle={chapterEditTitle}
                  setChapterEditTitle={setChapterEditTitle}
                  startEditChapter={startEditChapter}
                  saveEditChapter={saveEditChapter}
                  cancelEditChapter={cancelEditChapter}
                  deleteChapter={deleteChapter}
                  addChapter={addChapter}
                  toggleExpandChapter={toggleExpandChapter}
                  expandedChapter={expandedChapter}
                  addLesson={addLesson}
                  updateLesson={updateLesson}
                  deleteLesson={deleteLesson}
                  toggleLessonComplete={toggleLessonComplete}
                  startEditLesson={startEditLesson}
                  saveEditLesson={saveEditLesson}
                  editingLesson={editingLesson}
                  lessonEdit={lessonEdit}
                  setLessonEdit={setLessonEdit}
                  cancelEditLesson={cancelEditLesson}
                  onDragEnd={handleDragEnd}
                  sensors={sensors}
                />
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ── Course Modal ── */}
      <Modal open={courseModalOpen} onClose={() => setCourseModalOpen(false)}>
        <h2 className="mb-5 text-xl font-bold text-white">
          {editingCourse ? 'Edit Course' : 'New Course'}
        </h2>
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="Enter course title..."
            value={courseForm.title}
            onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Description</label>
            <textarea
              value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
              placeholder="Describe this course..."
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Category</label>
            <select
              value={courseForm.category}
              onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40 transition-all"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Color / Gradient</label>
            <div className="flex flex-wrap gap-2">
              {GRADIENTS.map((g) => (
                <button
                  key={g}
                  onClick={() => setCourseForm({ ...courseForm, color: g })}
                  className={`h-8 w-8 rounded-lg bg-gradient-to-br ${g} transition-all ${
                    courseForm.color === g
                      ? 'ring-2 ring-white ring-offset-1 ring-offset-white scale-110'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  title={g}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setCourseModalOpen(false)}>Cancel</Button>
            <Button onClick={saveCourse}>{editingCourse ? 'Save' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      {/* ── Category Modal ── */}
      <Modal open={catModalOpen} onClose={() => setCatModalOpen(false)}>
        <h2 className="mb-5 text-xl font-bold text-white">
          {editingCat ? 'Edit Category' : 'New Category'}
        </h2>
        <div className="space-y-4">
          <Input
            label="Category Name"
            placeholder="Enter category name..."
            value={catForm.name}
            onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Color</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCatForm({ ...catForm, color: c.value })}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                    catForm.color === c.value
                      ? 'border-white/30 bg-white/10 text-white'
                      : 'border-white/5 bg-white/[0.02] text-white/40 hover:bg-white/5'
                  }`}
                >
                  <div className={`h-3 w-3 rounded-full bg-gradient-to-br ${c.value}`} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setCatModalOpen(false)}>Cancel</Button>
            <Button onClick={saveCategory}>{editingCat ? 'Save' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
