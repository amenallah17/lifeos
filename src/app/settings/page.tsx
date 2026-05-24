'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Palette, Layout, Database, Info,
  Monitor, Sun, Moon, Check, Download, Upload,
  Trash2, RotateCcw, Globe, Type, Smartphone,
  Maximize2, Keyboard, ChevronRight,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';

type Tab = 'personalization' | 'layout' | 'general' | 'data' | 'about';

type Theme = 'dark' | 'light';

type AccentColor =
  | 'indigo' | 'cyan' | 'emerald' | 'amber'
  | 'rose' | 'violet' | 'blue' | 'teal';

type SidebarStyle = 'default' | 'compact' | 'minimal';

type ContentDensity = 'default' | 'wide' | 'compact';

type FontSize = 'small' | 'medium' | 'large';

type Language = 'en' | 'fr' | 'es';

interface Wallpaper {
  name: string;
  gradient: string;
}

interface WidgetToggle {
  id: string;
  label: string;
  visible: boolean;
}

interface Shortcut {
  keys: string[];
  action: string;
}

const wallpapers: Wallpaper[] = [
  { name: 'Cosmic Purple', gradient: 'from-purple-900 via-indigo-900 to-black' },
  { name: 'Ocean Blue', gradient: 'from-blue-900 via-cyan-900 to-teal-900' },
  { name: 'Sunset Orange', gradient: 'from-orange-500 via-rose-500 to-purple-800' },
  { name: 'Forest Green', gradient: 'from-green-900 via-emerald-800 to-teal-900' },
  { name: 'Midnight Black', gradient: 'from-gray-900 via-slate-900 to-black' },
  { name: 'Aurora', gradient: 'from-indigo-500 via-purple-500 to-pink-500' },
  { name: 'Golden Hour', gradient: 'from-amber-500 via-yellow-500 to-orange-600' },
  { name: 'Nordic', gradient: 'from-sky-800 via-blue-900 to-slate-900' },
];

const accentColors: { name: AccentColor; value: string }[] = [
  { name: 'indigo', value: '#6366f1' },
  { name: 'cyan', value: '#06b6d4' },
  { name: 'emerald', value: '#10b981' },
  { name: 'amber', value: '#f59e0b' },
  { name: 'rose', value: '#f43f5e' },
  { name: 'violet', value: '#8b5cf6' },
  { name: 'blue', value: '#3b82f6' },
  { name: 'teal', value: '#14b8a6' },
];

const widgets: WidgetToggle[] = [
  { id: 'greeting', label: 'Greeting', visible: true },
  { id: 'clock', label: 'Clock', visible: true },
  { id: 'stats', label: 'Stats', visible: true },
  { id: 'quickActions', label: 'Quick Actions', visible: true },
  { id: 'dailyFocus', label: 'Daily Focus', visible: true },
  { id: 'studyTracker', label: 'Study Tracker', visible: true },
  { id: 'recentActivity', label: 'Recent Activity', visible: true },
  { id: 'quote', label: 'Quote of the Day', visible: true },
];

const languages: { value: Language; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
];

const shortcuts: Shortcut[] = [
  { keys: ['⌘', 'K'], action: 'Command Palette' },
  { keys: ['⌘', 'B'], action: 'Toggle Sidebar' },
  { keys: ['⌘', 'Q'], action: 'Quick Capture' },
  { keys: ['⌘', 'D'], action: 'Go to Dashboard' },
  { keys: ['⌘', 'S'], action: 'Go to Settings' },
  { keys: ['⌘', 'T'], action: 'Go to Tasks' },
  { keys: ['⌘', 'N'], action: 'New Note' },
  { keys: ['⌘', 'F'], action: 'Search' },
  { keys: ['⌘', 'E'], action: 'Export Data' },
  { keys: ['Escape'], action: 'Close Panel' },
  { keys: ['⌘', '⇧', 'L'], action: 'Toggle Theme' },
  { keys: ['⌘', '⇧', 'R'], action: 'Reset Layout' },
];

const tabs: { key: Tab; label: string; icon: typeof Palette }[] = [
  { key: 'personalization', label: 'Personalization', icon: Palette },
  { key: 'layout', label: 'Layout', icon: Layout },
  { key: 'general', label: 'General', icon: Settings },
  { key: 'data', label: 'Data', icon: Database },
  { key: 'about', label: 'About', icon: Info },
];

const STORAGE_KEY = 'lifeos-settings';

interface SettingsState {
  theme: Theme;
  accentColor: AccentColor;
  wallpaper: string;
  customWallpaper: string;
  sidebarStyle: SidebarStyle;
  contentDensity: ContentDensity;
  widgetOrder: string[];
  widgetVisibility: Record<string, boolean>;
  language: Language;
  fontSize: FontSize;
  appName: string;
}

const defaultSettings: SettingsState = {
  theme: 'dark',
  accentColor: 'indigo',
  wallpaper: wallpapers[0].name,
  customWallpaper: '',
  sidebarStyle: 'default',
  contentDensity: 'default',
  widgetOrder: widgets.map((w) => w.id),
  widgetVisibility: Object.fromEntries(widgets.map((w) => [w.id, w.visible])),
  language: 'en',
  fontSize: 'medium',
  appName: 'LifeOS',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const tabContentVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2, ease: 'easeIn' } },
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('personalization');

  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings, loaded]);

  useEffect(() => {
    const root = document.documentElement;
    const color = accentColors.find((c) => c.name === settings.accentColor);
    if (color) {
      root.style.setProperty('--accent-color', color.value);
    }
    root.setAttribute('data-theme', settings.theme);
    root.classList.remove('dark', 'light');
    root.classList.add(settings.theme);
    localStorage.setItem('lifeos-theme', settings.theme);
  }, [settings.accentColor, settings.theme]);

  const updateSetting = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleWidget = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      widgetVisibility: {
        ...prev.widgetVisibility,
        [id]: !prev.widgetVisibility[id],
      },
    }));
  };

  const moveWidget = (id: string, direction: 'up' | 'down') => {
    setSettings((prev) => {
      const order = [...prev.widgetOrder];
      const idx = order.indexOf(id);
      if (idx === -1) return prev;
      const swap = direction === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= order.length) return prev;
      [order[idx], order[swap]] = [order[swap], order[idx]];
      return { ...prev, widgetOrder: order };
    });
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    setResetModalOpen(false);
  };

  const deleteAllData = () => {
    try {
      localStorage.clear();
    } catch { /* ignore */ }
    setSettings(defaultSettings);
    setDeleteModalOpen(false);
  };

  const visibleWidgets = widgets.filter((w) => settings.widgetVisibility[w.id]);
  const orderedWidgets = settings.widgetOrder
    .map((id) => widgets.find((w) => w.id === id))
    .filter((w): w is WidgetToggle => w !== undefined);

  const selectedWallpaper = wallpapers.find((w) => w.name === settings.wallpaper);

  const renderTab = () => {
    switch (activeTab) {
      case 'personalization':
        return renderPersonalization();
      case 'layout':
        return renderLayout();
      case 'general':
        return renderGeneral();
      case 'data':
        return renderData();
      case 'about':
        return renderAbout();
    }
  };

  const renderPersonalization = () => (
    <motion.div
      key="personalization"
      variants={tabContentVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="space-y-8"
    >
      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Wallpaper</h3>
        <div className="grid grid-cols-4 gap-3">
          {wallpapers.map((wp) => (
            <motion.button
              key={wp.name}
              onClick={() => updateSetting('wallpaper', wp.name)}
              className={`relative h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                settings.wallpaper === wp.name
                  ? 'border-indigo-400 shadow-lg shadow-indigo-500/30 scale-105'
                  : 'border-white/10 hover:border-white/30'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${wp.gradient}`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-medium text-white/80 drop-shadow-lg">
                  {wp.name}
                </span>
              </div>
              {settings.wallpaper === wp.name && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center"
                >
                  <Check size={12} className="text-white" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
        <div className="mt-3">
          <Input
            label="Custom wallpaper URL"
            placeholder="https://example.com/wallpaper.jpg"
            value={settings.customWallpaper}
            onChange={(e) => updateSetting('customWallpaper', e.target.value)}
            icon={<Monitor size={16} />}
          />
        </div>
      </div>

      {/* Theme toggle component available at src/components/layout/ThemeToggle.tsx */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Theme</h3>
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
          <span className="text-sm text-white/70">Dark Mode</span>
          <button
            onClick={() => updateSetting('theme', settings.theme === 'dark' ? 'light' : 'dark')}
            className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${
              settings.theme === 'dark' ? 'bg-indigo-500' : 'bg-white/20'
            }`}
          >
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`absolute top-0.5 h-6 w-6 rounded-full flex items-center justify-center ${
                settings.theme === 'dark' ? 'left-0.5 bg-slate-800' : 'left-[1.35rem] bg-white'
              }`}
            >
              {settings.theme === 'dark' ? (
                <Moon size={12} className="text-indigo-400" />
              ) : (
                <Sun size={12} className="text-amber-500" />
              )}
            </motion.div>
          </button>
          <span className="text-sm text-white/70">Light Mode</span>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Accent Color</h3>
        <div className="flex gap-3 flex-wrap">
          {accentColors.map((color) => (
            <motion.button
              key={color.name}
              onClick={() => updateSetting('accentColor', color.name)}
              className={`relative h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                settings.accentColor === color.name
                  ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-white scale-110'
                  : 'hover:scale-110'
              }`}
              style={{ backgroundColor: color.value }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
            >
              {settings.accentColor === color.name && (
                <Check size={16} className="text-white drop-shadow-lg" />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Preview</h3>
        <GlassCard className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: `var(--accent-color, #6366f1)` }}
            >
              L
            </div>
            <div className="flex-1">
              <div className="h-3 w-32 rounded-full bg-white/20" />
              <div className="h-2 w-20 rounded-full bg-white/10 mt-2" />
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            <span
              className="px-3 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: `var(--accent-color, #6366f1)` }}
            >
              Primary
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/70">
              Secondary
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-white/40">
              Muted
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="h-12 rounded-lg bg-white/5 border border-white/10" />
            <div
              className="h-12 rounded-lg"
              style={{ backgroundColor: `color-mix(in srgb, var(--accent-color, #6366f1) 20%, transparent)` }}
            />
            <div
              className="h-12 rounded-lg"
              style={{ backgroundColor: `var(--accent-color, #6366f1)` }}
            />
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );

  const renderLayout = () => (
    <motion.div
      key="layout"
      variants={tabContentVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="space-y-8"
    >
      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Sidebar Style</h3>
        <div className="grid grid-cols-3 gap-3">
          {(['default', 'compact', 'minimal'] as SidebarStyle[]).map((style) => (
            <motion.button
              key={style}
              onClick={() => updateSetting('sidebarStyle', style)}
              className={`p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-3 ${
                settings.sidebarStyle === style
                  ? 'border-indigo-400 bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
                  : 'border-white/10 bg-white/5 hover:border-white/30'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="flex gap-1">
                {style === 'default' && (
                  <>
                    <div className="h-8 w-1.5 rounded bg-indigo-400" />
                    <div className="h-8 w-1.5 rounded bg-white/30" />
                    <div className="h-8 w-1.5 rounded bg-white/30" />
                  </>
                )}
                {style === 'compact' && (
                  <>
                    <div className="h-8 w-1 rounded bg-indigo-400" />
                    <div className="h-8 w-1 rounded bg-white/30" />
                  </>
                )}
                {style === 'minimal' && (
                  <div className="h-8 w-1 rounded bg-indigo-400" />
                )}
              </div>
              <span className="text-xs font-medium capitalize text-white/80">{style}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Content Density</h3>
        <div className="grid grid-cols-3 gap-3">
          {(['default', 'wide', 'compact'] as ContentDensity[]).map((density) => (
            <motion.button
              key={density}
              onClick={() => updateSetting('contentDensity', density)}
              className={`p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-3 ${
                settings.contentDensity === density
                  ? 'border-indigo-400 bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
                  : 'border-white/10 bg-white/5 hover:border-white/30'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {density === 'default' && <Maximize2 size={20} className="text-white/60" />}
              {density === 'wide' && <Monitor size={20} className="text-white/60" />}
              {density === 'compact' && <Smartphone size={20} className="text-white/60" />}
              <span className="text-xs font-medium capitalize text-white/80">{density}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Dashboard Widgets</h3>
        <GlassCard className="divide-y divide-white/5">
          {orderedWidgets.map((widget, idx) => {
            const orderIndex = settings.widgetOrder.indexOf(widget.id);
            return (
              <div
                key={widget.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/30 w-5">{orderIndex + 1}</span>
                  <span className="text-sm text-white/80">{widget.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveWidget(widget.id, 'up')}
                      disabled={orderIndex === 0}
                      className="h-4 w-4 flex items-center justify-center text-white/30 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                        <path d="M4 0L8 5H0L4 0Z" fill="currentColor" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveWidget(widget.id, 'down')}
                      disabled={orderIndex === orderedWidgets.length - 1}
                      className="h-4 w-4 flex items-center justify-center text-white/30 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                        <path d="M4 5L0 0H8L4 5Z" fill="currentColor" />
                      </svg>
                    </button>
                  </div>
                  <button
                    onClick={() => toggleWidget(widget.id)}
                    className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${
                      settings.widgetVisibility[widget.id] ? 'bg-indigo-500' : 'bg-white/10'
                    }`}
                  >
                    <motion.div
                      layout
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow ${
                        settings.widgetVisibility[widget.id] ? 'left-[1.1rem]' : 'left-[0.15rem]'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </GlassCard>
      </div>
    </motion.div>
  );

  const renderGeneral = () => (
    <motion.div
      key="general"
      variants={tabContentVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="space-y-8"
    >
      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">App Name</h3>
        <Input
          value={settings.appName}
          onChange={(e) => updateSetting('appName', e.target.value)}
          placeholder="LifeOS"
        />
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Language</h3>
        <div className="grid grid-cols-3 gap-3">
          {languages.map((lang) => (
            <motion.button
              key={lang.value}
              onClick={() => updateSetting('language', lang.value)}
              className={`p-4 rounded-2xl border-2 transition-all duration-200 flex items-center gap-3 ${
                settings.language === lang.value
                  ? 'border-indigo-400 bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
                  : 'border-white/10 bg-white/5 hover:border-white/30'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="text-sm font-medium text-white/80">{lang.label}</span>
              {settings.language === lang.value && (
                <Check size={14} className="ml-auto text-indigo-400" />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Font Size</h3>
        <div className="grid grid-cols-3 gap-3">
          {(['small', 'medium', 'large'] as FontSize[]).map((size) => (
            <motion.button
              key={size}
              onClick={() => updateSetting('fontSize', size)}
              className={`p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                settings.fontSize === size
                  ? 'border-indigo-400 bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
                  : 'border-white/10 bg-white/5 hover:border-white/30'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Type size={size === 'small' ? 16 : size === 'medium' ? 20 : 24} className="text-white/60" />
              <span className="text-xs font-medium capitalize text-white/80">{size}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <Button
          variant="danger"
          icon={<RotateCcw size={16} />}
          onClick={() => setResetModalOpen(true)}
        >
          Reset to Defaults
        </Button>
      </div>
    </motion.div>
  );

  const renderData = () => {
    const total = 1024;
    const used = 342;
    const free = total - used;
    const usagePct = Math.round((used / total) * 100);

    return (
      <motion.div
        key="data"
        variants={tabContentVariants}
        initial="enter"
        animate="center"
        exit="exit"
        className="space-y-8"
      >
        <div>
          <h3 className="mb-4 text-lg font-semibold text-white">Storage</h3>
          <GlassCard className="p-6">
            <div className="flex justify-between text-sm mb-3">
              <span className="text-white/60">Total</span>
              <span className="text-white font-medium">{total} MB</span>
            </div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-white/60">Used</span>
              <span className="text-white font-medium">{used} MB</span>
            </div>
            <div className="flex justify-between text-sm mb-4">
              <span className="text-white/60">Free</span>
              <span className="text-white font-medium">{free} MB</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${usagePct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500"
              />
            </div>
            <p className="text-xs text-white/40 mt-2">{usagePct}% of storage used</p>
          </GlassCard>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="secondary"
            icon={<Download size={16} />}
            onClick={() => {}}
          >
            Export Data
          </Button>
          <Button
            variant="secondary"
            icon={<Upload size={16} />}
            onClick={() => {}}
          >
            Import Data
          </Button>
        </div>

        <div className="space-y-3">
          <Button
            variant="secondary"
            icon={<Trash2 size={16} />}
            onClick={() => {
              try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
            }}
          >
            Clear Cache
          </Button>
          <Button
            variant="danger"
            icon={<Trash2 size={16} />}
            onClick={() => setDeleteModalOpen(true)}
          >
            Delete All Data
          </Button>
        </div>

        <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
              <Trash2 size={24} className="text-red-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">Delete All Data?</h3>
            <p className="mb-6 text-sm text-white/60">
              This action cannot be undone. All your settings, preferences, and local data will be permanently removed.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={deleteAllData}>
                Delete Everything
              </Button>
            </div>
          </div>
        </Modal>

        <Modal open={resetModalOpen} onClose={() => setResetModalOpen(false)}>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
              <RotateCcw size={24} className="text-amber-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">Reset to Defaults?</h3>
            <p className="mb-6 text-sm text-white/60">
              This will restore all settings to their original values.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => setResetModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={resetToDefaults}>
                Reset
              </Button>
            </div>
          </div>
        </Modal>
      </motion.div>
    );
  };

  const renderAbout = () => (
    <motion.div
      key="about"
      variants={tabContentVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="space-y-8"
    >
      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">App Info</h3>
        <GlassCard className="divide-y divide-white/5">
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-white/60">Version</span>
            <Badge>1.0.0</Badge>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-white/60">Build</span>
            <span className="text-sm text-white/80">2026.05.19.001</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-white/60">Framework</span>
            <span className="text-sm text-white/80">Next.js + Tailwind CSS</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-white/60">Runtime</span>
            <span className="text-sm text-white/80">Node.js 20+</span>
          </div>
        </GlassCard>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Developer</h3>
        <GlassCard className="p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center text-white font-bold text-lg">
            L
          </div>
          <div>
            <p className="text-sm font-medium text-white">LifeOS Team</p>
            <p className="text-xs text-white/40">hello@lifeos.app</p>
          </div>
        </GlassCard>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
          <Keyboard size={18} className="text-indigo-400" /> Keyboard Shortcuts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.action}
              className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 border border-white/10"
            >
              <span className="text-sm text-white/70">{shortcut.action}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, i) => (
                  <kbd
                    key={i}
                    className="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1.5 rounded-md bg-white/10 text-xs font-mono text-white/80 border border-white/10"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Links</h3>
        <GlassCard className="divide-y divide-white/5">
          {[
            { label: 'Documentation', href: '#' },
            { label: 'GitHub Repository', href: '#' },
            { label: 'Report a Bug', href: '#' },
            { label: 'Feature Requests', href: '#' },
            { label: 'Privacy Policy', href: '#' },
            { label: 'Terms of Service', href: '#' },
          ].map((link) => (
            <button
              key={link.label}
              onClick={() => {}}
              className="flex w-full items-center justify-between px-5 py-3 text-sm text-white/70 hover:text-white transition-colors"
            >
              {link.label}
              <ChevronRight size={14} className="text-white/30" />
            </button>
          ))}
        </GlassCard>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-6xl space-y-6"
      >
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 shadow-lg shadow-indigo-500/30" />
          <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
          <Settings size={18} className="text-indigo-400/60" />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex gap-6"
          style={{ minHeight: 'calc(100vh - 12rem)' }}
        >
          <GlassCard className="w-56 shrink-0 p-2 flex flex-col gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <motion.button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-500/15 text-indigo-400 shadow-sm'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }`}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400"
                    />
                  )}
                </motion.button>
              );
            })}
          </GlassCard>

          <GlassCard className="flex-1 p-6 overflow-y-auto">
            <AnimatePresence mode="wait">
              {renderTab()}
            </AnimatePresence>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
