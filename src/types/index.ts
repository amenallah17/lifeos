export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in-progress' | 'done';
  category?: string;
  due_date?: string;
  recurring?: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed';
  color?: string;
  deadline?: string;
  github_url?: string;
  created_at: string;
}

export interface FlashCard {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  ease: number;
  interval: number;
  repetitions: number;
  next_review?: string;
  created_at: string;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface StudySession {
  id: string;
  subject?: string;
  duration: number;
  notes?: string;
  date: string;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string;
  completed: number;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  type: 'annual' | 'monthly' | 'weekly';
  target_date?: string;
  progress: number;
  created_at: string;
}

export interface Bookmark {
  id: string;
  title: string;
  url?: string;
  type: 'link' | 'note' | 'snippet' | 'idea' | 'image';
  category?: string;
  content?: string;
  tags?: string;
  favorite: number;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  content?: string;
  category?: string;
  tags?: string;
  pinned: number;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  title: string;
  author?: string;
  status: 'to-read' | 'reading' | 'finished';
  progress: number;
  rating?: number;
  notes?: string;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  url?: string;
  category?: string;
  notes?: string;
  watched: number;
  favorite: number;
  created_at: string;
}

export interface Website {
  id: string;
  title: string;
  url: string;
  category?: string;
  icon?: string;
  favorite: number;
  created_at: string;
}

export interface PomodoroSession {
  id: string;
  duration: number;
  type: 'focus' | 'short-break' | 'long-break';
  completed: number;
  date: string;
}

export interface UniversityYear {
  id: string;
  name: string;
  start_year: number;
  end_year: number;
  active: boolean;
  created_at: string;
}

export interface Semester {
  id: string;
  year_id: string;
  name: string;
  number: number;
  active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export interface UniSubject {
  id: string;
  semester_id: string;
  name: string;
  code?: string;
  color: string;
  icon?: string;
  category?: string;
  pinned: boolean;
  archived: boolean;
  professor?: string;
  description?: string;
  progress: number;
  created_at: string;
}

export interface SubjectResource {
  id: string;
  subject_id: string;
  name: string;
  type: 'pdf' | 'docx' | 'image' | 'video' | 'link' | 'file';
  url?: string;
  size?: number;
  folder_id?: string;
  favorite: boolean;
  tags?: string;
  created_at: string;
}

export interface SubjectFolder {
  id: string;
  subject_id: string;
  name: string;
  parent_id?: string;
  created_at: string;
}

export interface UniNote {
  id: string;
  subject_id?: string;
  title: string;
  content: string;
  folder_id?: string;
  parent_id?: string;
  tags?: string;
  pinned: boolean;
  type: 'text' | 'markdown' | 'checklist';
  created_at: string;
  updated_at: string;
}

export interface Exam {
  id: string;
  subject_id: string;
  title: string;
  type: 'midterm' | 'final' | 'quiz' | 'oral' | 'other';
  date: string;
  time?: string;
  location?: string;
  weight?: number;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  notes?: string;
  created_at: string;
}

export interface Lecture {
  id: string;
  subject_id: string;
  title: string;
  type: 'lecture' | 'td' | 'tp' | 'tutorial' | 'practice';
  date: string;
  duration?: number;
  chapter?: string;
  content?: string;
  completed: boolean;
  created_at: string;
}

export interface Assignment {
  id: string;
  subject_id: string;
  title: string;
  description?: string;
  due_date: string;
  status: 'pending' | 'submitted' | 'graded';
  grade?: number;
  max_grade?: number;
  attachments?: string;
  created_at: string;
}

export interface StudySession {
  id: string;
  subject_id?: string;
  duration: number;
  type: 'study' | 'revision' | 'exam-prep';
  notes?: string;
  date: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  category?: string;
  color?: string;
  icon?: string;
  progress: number;
  status: 'active' | 'archived';
  created_at: string;
}

export interface Chapter {
  id: string;
  course_id: string;
  title: string;
  order: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  chapter_id: string;
  title: string;
  content?: string;
  type: 'text' | 'pdf' | 'video';
  file_url?: string;
  duration?: number;
  completed: boolean;
  order: number;
  created_at: string;
}

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  mime_type?: string;
  size?: number;
  content?: string;
  parent_id?: string;
  path: string;
  favorite: boolean;
  tags?: string;
  created_at: string;
  updated_at: string;
}

export interface AppShortcut {
  id: string;
  name: string;
  url?: string;
  path?: string;
  icon?: string;
  category?: string;
  color?: string;
  favorite: boolean;
  type: 'app' | 'website';
  folderId?: string;
  created_at: string;
}

export interface AppFolder {
  id: string;
  name: string;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
  section: string;
  color?: string;
  icon?: string;
  parent_id?: string;
  order: number;
  created_at: string;
}

export interface DashboardWidget {
  id: string;
  type: string;
  position: number;
  size: 'small' | 'medium' | 'large';
  visible: boolean;
  config?: string;
}

export interface ThemeConfig {
  wallpaper?: string;
  accent_color: string;
  theme_mode: 'dark' | 'light';
  sidebar_style: 'default' | 'compact' | 'minimal';
  layout: 'default' | 'wide' | 'compact';
}

export type PageSection =
  | 'dashboard'
  | 'study'
  | 'flashcards'
  | 'productivity'
  | 'tasks'
  | 'goals'
  | 'projects'
  | 'videos'
  | 'pocket'
  | 'books'
  | 'websites'
  | 'apps'
  | 'courses'
  | 'files'
  | 'settings'
  | 'admin';
