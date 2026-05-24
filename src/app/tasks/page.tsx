'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList, Plus, Search, ArrowUpDown, GripVertical, Trash2, Pencil, CalendarDays, Inbox
} from 'lucide-react';
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useLocalStorage } from '@/lib/usePersistence';
import { Task } from '@/types';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

type Priority = 'low' | 'medium' | 'high' | 'urgent';
type TaskStatus = 'todo' | 'in-progress' | 'done';

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Todo',
  'in-progress': 'In Progress',
  done: 'Done',
};

const STATUS_ORDER: TaskStatus[] = ['todo', 'in-progress', 'done'];

const columns: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'from-sky-500/20 to-blue-500/10' },
  { id: 'in-progress', label: 'In Progress', color: 'from-amber-500/20 to-orange-500/10' },
  { id: 'done', label: 'Done', color: 'from-emerald-500/20 to-teal-500/10' },
];

const priorityColors: Record<Priority, 'danger' | 'warning' | 'info' | 'default'> = {
  urgent: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'default',
};

function SortableTaskCard({ task, onDelete, onEdit, onChangeStatus }: { task: Task; onDelete: (id: string) => void; onEdit: (task: Task) => void; onChangeStatus: (id: string, status: TaskStatus) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const currentIdx = STATUS_ORDER.indexOf(task.status);

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <GlassCard className="p-3.5">
        <div className="flex items-start gap-2">
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 cursor-grab touch-none text-white/20 hover:text-white/50 transition-colors"
          >
            <GripVertical size={14} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant={priorityColors[task.priority]}>
                {task.priority}
              </Badge>
              {task.category && (
                <Badge variant="default">{task.category}</Badge>
              )}
            </div>
            <p className="text-sm font-medium text-white leading-snug">{task.title}</p>
            {task.description && (
              <p className="mt-1 text-xs text-white/40 line-clamp-2">{task.description}</p>
            )}
            <div className="mt-2 flex items-center gap-1.5 text-xs text-white/40">
              <CalendarDays size={11} />
              {task.due_date || 'No date'}
            </div>
            <div className="mt-2 flex items-center gap-1">
              {STATUS_ORDER.map((s, i) => (
                <button
                  key={s}
                  onClick={(e) => { e.stopPropagation(); onChangeStatus(task.id, s); }}
                  className={`text-[10px] px-1.5 py-0.5 rounded-full transition-colors ${
                    task.status === s
                      ? 'bg-white/20 text-white font-medium'
                      : 'text-white/30 hover:text-white/60'
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-0.5">
            <button
              onClick={() => onEdit(task)}
              className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-indigo-400 transition-all"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function Column({ id, label, color, tasks, onDelete, onEdit, onChangeStatus }: { id: TaskStatus; label: string; color: string; tasks: Task[]; onDelete: (id: string) => void; onEdit: (task: Task) => void; onChangeStatus: (id: string, status: TaskStatus) => void }) {
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <div className="flex flex-col">
      <div className={`mb-3 flex items-center justify-between rounded-xl bg-gradient-to-r ${color} px-4 py-2.5 border border-white/5`}>
        <h3 className="text-sm font-semibold text-white">{label}</h3>
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/10 px-1.5 text-xs font-medium text-white/70">
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 space-y-3 min-h-[300px]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onDelete={onDelete} onEdit={onEdit} onChangeStatus={onChangeStatus} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function TasksPage() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('kanban-tasks', []);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'none' | 'priority' | 'date'>('none');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'medium' as Priority, category: '', due_date: '' });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const categories = useMemo(() => [...new Set(tasks.map((t) => t.category).filter(Boolean) as string[])], [tasks]);

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (searchQuery) {
      result = result.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (filterPriority !== 'all') {
      result = result.filter((t) => t.priority === filterPriority);
    }
    if (filterCategory !== 'all') {
      result = result.filter((t) => t.category === filterCategory);
    }
    if (sortBy === 'priority') {
      const order: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      result.sort((a, b) => order[a.priority] - order[b.priority]);
    } else if (sortBy === 'date') {
      result.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      });
    }
    return result;
  }, [tasks, searchQuery, filterPriority, filterCategory, sortBy]);

  const columnTasks = useMemo(() => ({
    todo: filteredTasks.filter((t) => t.status === 'todo'),
    'in-progress': filteredTasks.filter((t) => t.status === 'in-progress'),
    done: filteredTasks.filter((t) => t.status === 'done'),
  }), [filteredTasks]);

  const hasTasks = tasks.length > 0;

  function findColumn(id: string): TaskStatus | null {
    const task = tasks.find((t) => t.id === id);
    return task ? task.status : null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeCol = findColumn(active.id as string);
    const overCol = findColumn(over.id as string);
    if (!activeCol || !overCol) return;
    if (activeCol === overCol) {
      const colItems = tasks.filter((t) => t.status === activeCol);
      const oldIdx = colItems.findIndex((t) => t.id === active.id);
      const newIdx = colItems.findIndex((t) => t.id === over.id);
      if (oldIdx !== newIdx) {
        const reordered = arrayMove(colItems, oldIdx, newIdx);
        setTasks((prev) => prev.map((t) => (t.status === activeCol ? reordered.shift() || t : t)));
      }
    } else {
      setTasks((prev) =>
        prev.map((t) => (t.id === active.id ? { ...t, status: overCol, updated_at: new Date().toISOString() } : t))
      );
    }
    setActiveId(null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeCol = findColumn(active.id as string);
    const overCol = findColumn(over.id as string);
    if (activeCol && overCol && activeCol !== overCol) {
      setTasks((prev) =>
        prev.map((t) => (t.id === active.id ? { ...t, status: overCol, updated_at: new Date().toISOString() } : t))
      );
    }
  }

  function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function openAddModal() {
    setEditingTaskId(null);
    setFormData({ title: '', description: '', priority: 'medium', category: '', due_date: '' });
    setModalOpen(true);
  }

  function openEditModal(task: Task) {
    setEditingTaskId(task.id);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      category: task.category || '',
      due_date: task.due_date || '',
    });
    setModalOpen(true);
  }

  function handleSave() {
    if (!formData.title.trim()) return;
    const now = new Date().toISOString();
    if (editingTaskId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTaskId
            ? {
                ...t,
                title: formData.title,
                description: formData.description || undefined,
                priority: formData.priority,
                category: formData.category || undefined,
                due_date: formData.due_date || undefined,
                updated_at: now,
              }
            : t
        )
      );
    } else {
      const newTask: Task = {
        id: generateId(),
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority,
        status: 'todo',
        category: formData.category || undefined,
        due_date: formData.due_date || undefined,
        created_at: now,
        updated_at: now,
      };
      setTasks((prev) => [newTask, ...prev]);
    }
    setModalOpen(false);
  }

  function handleChangeStatus(id: string, status: TaskStatus) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, updated_at: new Date().toISOString() } : t))
    );
  }

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

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
              <ClipboardList size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Tasks</h1>
          </div>
          <Button onClick={openAddModal} icon={<Plus size={16} />}>
            Add Task
          </Button>
        </motion.div>

        {hasTasks && (
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-white/30 backdrop-blur-xl transition-colors focus:border-indigo-500/40 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 backdrop-blur-xl focus:border-indigo-500/40 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 backdrop-blur-xl focus:border-indigo-500/40 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              onClick={() => setSortBy(sortBy === 'priority' ? 'date' : sortBy === 'date' ? 'none' : 'priority')}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/50 hover:text-white/70 transition-colors"
            >
              <ArrowUpDown size={14} />
              {sortBy === 'priority' ? 'Priority' : sortBy === 'date' ? 'Date' : 'Sort'}
            </button>
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          {!hasTasks ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5">
                <Inbox size={32} className="text-white/20" />
              </div>
              <h3 className="text-lg font-medium text-white/50">No tasks yet</h3>
              <p className="mt-1 text-sm text-white/30">Create your first task to get started</p>
              <div className="mt-4">
                <Button onClick={openAddModal} icon={<Plus size={13} />}>
                  Create Task
                </Button>
              </div>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {columns.map((col) => (
                  <Column
                    key={col.id}
                    id={col.id}
                    label={col.label}
                    color={col.color}
                    tasks={columnTasks[col.id]}
                    onDelete={handleDelete}
                    onEdit={openEditModal}
                    onChangeStatus={handleChangeStatus}
                  />
                ))}
              </div>
              <DragOverlay>
                {activeTask ? (
                  <GlassCard className="p-3.5 opacity-90">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant={priorityColors[activeTask.priority]}>{activeTask.priority}</Badge>
                      {activeTask.category && (
                        <Badge variant="default">{activeTask.category}</Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium text-white">{activeTask.title}</p>
                  </GlassCard>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </motion.div>
      </motion.div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 className="mb-5 text-xl font-bold text-white">{editingTaskId ? 'Edit Task' : 'New Task'}</h2>
        <div className="space-y-4">
          <Input
            label="Task Title"
            placeholder="Enter task title..."
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Description</label>
            <textarea
              placeholder="Enter description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 backdrop-blur-xl transition-colors focus:border-indigo-500/40 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 resize-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white backdrop-blur-xl focus:border-indigo-500/40 focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <Input
            label="Category"
            placeholder="e.g. Design, Dev, Docs..."
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />
          <Input
            label="Due Date"
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingTaskId ? 'Save' : 'Add Task'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
