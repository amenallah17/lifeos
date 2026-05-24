'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban,
  Plus,
  Search,
  Github,
  Briefcase,
  Code2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  ListTodo,
  FileText,
  Link2,
  Pencil,
  Trash2,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useLocalStorage } from '@/lib/usePersistence';
import { Project } from '@/types';

type ProjectStatus = 'active' | 'paused' | 'completed';

interface ProjectTask {
  id: string;
  title: string;
  done: boolean;
}

interface ProjectNote {
  id: string;
  content: string;
}

interface ProjectResource {
  id: string;
  name: string;
  url: string;
}

interface ProjectItem extends Project {
  taskCount: number;
  tasks: ProjectTask[];
  notes: ProjectNote[];
  resources: ProjectResource[];
  githubRepo?: string;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

const statusColors: Record<ProjectStatus, 'success' | 'warning' | 'info'> = {
  active: 'success',
  paused: 'warning',
  completed: 'info',
};

const PRESET_COLORS = [
  '#6366f1', '#06b6d4', '#f59e0b', '#8b5cf6', '#10b981',
  '#ec4899', '#ef4444', '#f97316', '#14b8a6', '#3b82f6',
  '#84cc16', '#d946ef',
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

interface Repo {
  id: string; name: string; description: string; language: string;
  stars: number; forks: number; url: string;
}

const sampleRepos: Repo[] = [];

const defaultFormState = { name: '', description: '', status: 'active' as ProjectStatus, color: '#6366f1', deadline: '' };

export default function ProjectsPage() {
  const [projects, setProjects] = useLocalStorage<ProjectItem[]>('lifeos-projects', [] as ProjectItem[]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(defaultFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredProjects = projects.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !(p.description || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  function openAddModal() {
    setEditingId(null);
    setFormData({ ...defaultFormState });
    setModalOpen(true);
  }

  function openEditModal(project: ProjectItem) {
    setEditingId(project.id);
    setFormData({
      name: project.name,
      description: project.description || '',
      status: project.status,
      color: project.color || '#6366f1',
      deadline: project.deadline || '',
    });
    setModalOpen(true);
  }

  function saveProject() {
    if (!formData.name.trim()) return;
    if (editingId) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? { ...p, name: formData.name, description: formData.description, status: formData.status, color: formData.color, deadline: formData.deadline }
            : p
        )
      );
    } else {
      const project: ProjectItem = {
        id: generateId(),
        name: formData.name,
        description: formData.description,
        status: formData.status,
        color: formData.color,
        deadline: formData.deadline,
        created_at: new Date().toISOString(),
        taskCount: 0,
        tasks: [],
        notes: [],
        resources: [],
      };
      setProjects((prev) => [project, ...prev]);
    }
    setFormData({ ...defaultFormState });
    setEditingId(null);
    setModalOpen(false);
  }

  function confirmDelete(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDeleteConfirm(null);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setFormData({ ...defaultFormState });
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
              <FolderKanban size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Projects</h1>
          </div>
          <Button onClick={openAddModal} icon={<Plus size={16} />}>
            New Project
          </Button>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-white/30 backdrop-blur-xl transition-colors focus:border-indigo-500/40 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'paused', 'completed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                  statusFilter === s
                    ? 'bg-white/10 text-white'
                    : 'bg-white/5 text-white/40 hover:text-white/70'
                }`}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {filteredProjects.length === 0 ? (
          <motion.div variants={itemVariants}>
            <GlassCard className="p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <FolderKanban size={48} className="text-white/20" />
                <h3 className="text-lg font-semibold text-white">No projects yet</h3>
                <p className="text-sm text-white/50 max-w-xs">Create your first project to start tracking your work.</p>
                <Button onClick={openAddModal} icon={<Plus size={16} />}>
                  New Project
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants} className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project) => (
              <div key={project.id}>
                <GlassCard hover={false} className="overflow-hidden">
                  <div className="h-1.5 w-full" style={{ background: project.color || '#6366f1' }} />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-white">{project.name}</h3>
                          <Badge variant={statusColors[project.status]}>
                            {project.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-white/50 line-clamp-2">{project.description}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => openEditModal(project)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70 transition-all"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(project.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-400 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={12} />
                        {project.deadline || 'No deadline'}
                      </span>
                      <span className="flex items-center gap-1">
                        <ListTodo size={12} />
                        {project.taskCount} tasks
                      </span>
                    </div>

                    {deleteConfirm === project.id ? (
                      <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3">
                        <span className="text-xs text-red-300 flex-1">Delete this project?</span>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white/60 hover:text-white/80 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => confirmDelete(project.id)}
                          className="rounded-lg bg-red-500/20 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/30 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 flex items-center gap-2">
                        <button
                          onClick={() => setExpandedId(expandedId === project.id ? null : project.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/50 hover:text-white/70 transition-colors"
                        >
                          {expandedId === project.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {expandedId === project.id ? 'Less' : 'Details'}
                        </button>
                        {project.githubRepo && (
                          <a
                            href={`https://github.com/user/${project.githubRepo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/50 hover:text-white/70 transition-colors"
                          >
                            <Github size={14} />
                            Repo
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {expandedId === project.id && deleteConfirm !== project.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden border-t border-white/5"
                      >
                        <div className="p-5 space-y-5">
                          <div>
                            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/40">
                              <ListTodo size={13} />
                              Tasks
                            </h4>
                            <div className="space-y-1.5">
                              {project.tasks.map((t) => (
                                <div key={t.id} className="flex items-center gap-2 text-sm">
                                  <div className={`h-1.5 w-1.5 rounded-full ${t.done ? 'bg-emerald-400' : 'bg-white/20'}`} />
                                  <span className={t.done ? 'text-white/40 line-through' : 'text-white/70'}>{t.title}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/40">
                              <FileText size={13} />
                              Notes
                            </h4>
                            <div className="space-y-1.5">
                              {project.notes.map((n) => (
                                <p key={n.id} className="text-sm text-white/60">&bull; {n.content}</p>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/40">
                              <Link2 size={13} />
                              Resources
                            </h4>
                            <div className="space-y-1.5">
                              {project.resources.map((r) => (
                                <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300">
                                  <ExternalLink size={12} />
                                  {r.name}
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </div>
            ))}
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <GlassCard className="p-5">
            <h2 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
              <Github size={20} className="text-white/70" />
              GitHub Repositories
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {sampleRepos.map((repo) => (
                <a
                  key={repo.id}
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl bg-white/[0.03] p-4 border border-white/5 hover:bg-white/[0.06] transition-colors group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Github size={16} className="text-white/40 group-hover:text-white/70 transition-colors" />
                      <span className="text-sm font-medium text-white">{repo.name}</span>
                    </div>
                    <p className="mt-1 text-xs text-white/40 line-clamp-1">{repo.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-white/30">
                      <span className="flex items-center gap-1">
                        <Code2 size={11} />
                        {repo.language}
                      </span>
                      <span>&#9733; {repo.stars}</span>
                      <span>⑂ {repo.forks}</span>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
                </a>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard className="p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
                <Briefcase size={18} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Freelance Workspace</h2>
                <p className="text-sm text-white/50">Manage your freelance projects and clients</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                <p className="text-2xl font-bold text-white">0</p>
                <p className="text-xs text-white/40 mt-1">Active Projects</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                <p className="text-2xl font-bold text-white">$0</p>
                <p className="text-xs text-white/40 mt-1">This Month</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                <p className="text-2xl font-bold text-white">0</p>
                <p className="text-xs text-white/40 mt-1">Active Clients</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>

      <Modal open={modalOpen} onClose={closeModal}>
        <h2 className="mb-5 text-xl font-bold text-white">{editingId ? 'Edit Project' : 'New Project'}</h2>
        <div className="space-y-4">
          <Input label="Project Name *" placeholder="Enter project name..." value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Description</label>
            <textarea
              placeholder="Describe the project..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 backdrop-blur-xl transition-colors focus:border-indigo-500/40 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 resize-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white backdrop-blur-xl focus:border-indigo-500/40 focus:outline-none"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Accent Color</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={`h-7 w-7 rounded-full transition-all ${formData.color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-transparent scale-110' : 'hover:scale-110'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="h-10 w-full rounded-xl border border-white/10 bg-white/5 cursor-pointer"
            />
          </div>
          <Input label="Deadline" type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button onClick={saveProject}>{editingId ? 'Save Changes' : 'Create Project'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
