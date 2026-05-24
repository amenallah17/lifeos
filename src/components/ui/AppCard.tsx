'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, MoreVertical, Pencil, FolderTree, Trash2 } from 'lucide-react';
import GlassCard from './GlassCard';
import Badge from './Badge';

const GRADIENT_SET = [
  'from-indigo-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-violet-500 to-fuchsia-600',
  'from-sky-500 to-indigo-600',
  'from-lime-500 to-green-600',
];

function hashGradient(name: string): string {
  const idx = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return GRADIENT_SET[idx % GRADIENT_SET.length];
}

interface AppCardProps {
  name: string;
  url?: string;
  category?: string;
  type?: 'app' | 'website';
  color?: string;
  onOpen?: () => void;
  onEdit?: () => void;
  onChangeCategory?: () => void;
  onDeleteApp?: () => void;
}

export default function AppCard({
  name,
  url,
  category,
  type = 'website',
  color,
  onOpen,
  onEdit,
  onChangeCategory,
  onDeleteApp,
}: AppCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();

  const firstLetter = name.charAt(0).toUpperCase();
  const gradient = color || hashGradient(name);
  const displayUrl = url?.replace(/^https?:\/\//, '').replace(/\/$/, '') || '';

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Click outside to close — uses mouseup (fires AFTER click), not mousedown (fires BEFORE click)
  // This ensures the Delete button's onClick runs before the menu closes.
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (buttonRef.current && buttonRef.current.contains(e.target as Node)) return;
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      closeMenu();
    };
    document.addEventListener('mouseup', handler);
    return () => document.removeEventListener('mouseup', handler);
  }, [menuOpen, closeMenu]);

  // Escape key to close
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [menuOpen, closeMenu]);

  function toggleMenu(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (menuOpen) {
      closeMenu();
      return;
    }
    // Position the dropdown using fixed coordinates relative to the button.
    // This avoids ANY clipping from parent overflow / card boundaries.
    const rect = buttonRef.current!.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, left: rect.right - 160 });
    setMenuOpen(true);
  }

  function openOnRightClick(e: React.MouseEvent) {
    e.preventDefault();
    const rect = cardRef.current!.getBoundingClientRect();
    setMenuPos({ top: e.clientY, left: e.clientX - 80 });
    setMenuOpen(true);
  }

  function handleLongPressStart() {
    longPressTimer.current = setTimeout(() => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom - 40, left: rect.right - 200 });
      setMenuOpen(true);
    }, 600);
  }

  function handleLongPressEnd() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }

  return (
    <div
      ref={cardRef}
      onContextMenu={openOnRightClick}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      onTouchMove={handleLongPressEnd}
      className="relative"
    >
      <GlassCard className="p-4 group min-h-[172px] bg-black/15" hover>
        <div className="flex items-start gap-3">
          {/* Icon letter with dark zinc bg + green text */}
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-emerald-400 shadow-lg`}
          >
            {firstLetter}
          </div>

          {/* Title + URL + badges */}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-zinc-950 truncate">
              {name}
              {type === 'app' && (
                <span className="ml-1.5 text-[10px] text-zinc-950/50 font-normal">app</span>
              )}
            </h3>

            {displayUrl && (
              <p className="text-xs text-zinc-950/60 truncate mt-0.5">{displayUrl}</p>
            )}

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {category && (
                <Badge variant={type === 'app' ? 'info' : 'default'}>{category}</Badge>
              )}
              <span className="flex items-center gap-1 text-[10px] text-zinc-950/50">
                {type === 'app' ? 'App' : 'Web'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-white/10">
          <button
            onClick={(e) => { e.stopPropagation(); onOpen?.(); }}
            className="flex items-center gap-1.5 text-xs text-zinc-950/70 hover:text-zinc-950 transition-colors"
          >
            <ExternalLink size={12} />
            Open
          </button>

          <div className="relative ml-auto">
            <button
              ref={buttonRef}
              onClick={toggleMenu}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-950/50 hover:text-zinc-950 hover:bg-white/10 transition-colors"
              aria-label="More actions"
              aria-expanded={menuOpen}
            >
              <MoreVertical size={14} />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Dropdown menu — fixed position, high z-index, never clipped */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
            className="w-40 rounded-xl backdrop-blur-xl bg-zinc-900/95 border border-white/10 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { onOpen?.(); closeMenu(); }}
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs text-white/80 hover:bg-white/10 transition-colors"
            >
              <ExternalLink size={13} /> Open
            </button>
            <button
              onClick={() => { onEdit?.(); closeMenu(); }}
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs text-white/80 hover:bg-white/10 transition-colors"
            >
              <Pencil size={13} /> Edit Card
            </button>
            <button
              onClick={() => { onChangeCategory?.(); closeMenu(); }}
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs text-white/80 hover:bg-white/10 transition-colors"
            >
              <FolderTree size={13} /> Change Category
            </button>
            <div className="h-px bg-white/10 mx-2" />
            <button
              onClick={() => { onDeleteApp?.(); closeMenu(); }}
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 size={13} /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
