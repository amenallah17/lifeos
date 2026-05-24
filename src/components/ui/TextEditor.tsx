'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

type ToolbarAction = 'bold' | 'italic' | 'heading' | 'bullet' | 'code';

const wrappers: Record<ToolbarAction, { before: string; after: string }> = {
  bold: { before: '**', after: '**' },
  italic: { before: '*', after: '*' },
  heading: { before: '### ', after: '' },
  bullet: { before: '- ', after: '' },
  code: { before: '`', after: '`' },
};

export default function TextEditor({ value, onChange, placeholder = '', className = '' }: TextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  const wrapSelection = useCallback(
    (action: ToolbarAction) => {
      const el = textareaRef.current;
      if (!el) return;
      const { before, after } = wrappers[action];
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selected = value.slice(start, end);
      const replacement = `${before}${selected || 'text'}${after}`;
      const newValue = value.slice(0, start) + replacement + value.slice(end);
      onChange(newValue);
      requestAnimationFrame(() => {
        el.focus();
        const cursorPos = start + replacement.length - (selected ? after.length : 0);
        el.setSelectionRange(
          selected ? start + before.length : cursorPos,
          selected ? end + before.length : cursorPos,
        );
      });
    },
    [value, onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const el = e.currentTarget;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const newValue = value.slice(0, start) + '  ' + value.slice(end);
        onChange(newValue);
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = start + 2;
        });
      }
    },
    [value, onChange],
  );

  const toolbarButtons: { action: ToolbarAction; label: string; icon: string }[] = [
    { action: 'bold', label: 'Bold', icon: '𝐁' },
    { action: 'italic', label: 'Italic', icon: '𝑰' },
    { action: 'heading', label: 'Heading', icon: '𝐇' },
    { action: 'bullet', label: 'Bullet', icon: '∙' },
    { action: 'code', label: 'Code', icon: '<>' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`overflow-hidden rounded-2xl backdrop-blur-xl bg-white/5 border transition-all duration-300 ${focused ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/10' : 'border-white/10'} ${className}`}
    >
      <div className="flex items-center gap-1 border-b border-white/10 px-3 py-2">
        {toolbarButtons.map(({ action, label, icon }) => (
          <button
            key={action}
            type="button"
            onClick={() => wrapSelection(action)}
            title={label}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white/90"
          >
            {icon}
          </button>
        ))}
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={6}
        className="w-full resize-none bg-transparent px-4 py-3 text-sm leading-relaxed text-white placeholder-white/30 outline-none"
        spellCheck
      />

      <div className="flex items-center justify-end border-t border-white/10 px-4 py-1.5">
        <span className="text-xs text-white/30">{value.length} characters</span>
      </div>
    </motion.div>
  );
}
