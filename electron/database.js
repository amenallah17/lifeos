const path = require('path');
const { app } = require('electron');

let db = null;
let dbReady = false;
let dbPath = null;

function saveDatabase() {
  if (db && dbPath) {
    const fs = require('fs');
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    } catch (e) {
      console.error('Failed to save database:', e);
    }
  }
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'todo',
      category TEXT,
      due_date TEXT,
      recurring TEXT,
      project_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      color TEXT,
      deadline TEXT,
      github_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS flashcards (
      id TEXT PRIMARY KEY,
      deck_id TEXT,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      ease REAL DEFAULT 2.5,
      interval INTEGER DEFAULT 0,
      repetitions INTEGER DEFAULT 0,
      next_review TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS decks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      frequency TEXT DEFAULT 'daily',
      streak INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id TEXT PRIMARY KEY,
      habit_id TEXT,
      date TEXT,
      completed INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT DEFAULT 'annual',
      target_date TEXT,
      progress REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT,
      type TEXT DEFAULT 'link',
      category TEXT,
      content TEXT,
      tags TEXT,
      favorite INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      category TEXT,
      tags TEXT,
      pinned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT,
      status TEXT DEFAULT 'to-read',
      progress INTEGER DEFAULT 0,
      rating INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT,
      category TEXT,
      notes TEXT,
      watched INTEGER DEFAULT 0,
      favorite INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pomodoro_sessions (
      id TEXT PRIMARY KEY,
      duration INTEGER,
      type TEXT DEFAULT 'focus',
      completed INTEGER DEFAULT 1,
      date TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS websites (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      category TEXT,
      icon TEXT,
      favorite INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      color TEXT,
      icon TEXT,
      progress REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      course_id TEXT,
      title TEXT NOT NULL,
      order_num INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      chapter_id TEXT,
      title TEXT NOT NULL,
      content TEXT,
      type TEXT DEFAULT 'text',
      file_url TEXT,
      duration INTEGER,
      completed INTEGER DEFAULT 0,
      order_num INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'file',
      mime_type TEXT,
      size INTEGER,
      parent_id TEXT,
      file_path TEXT,
      favorite INTEGER DEFAULT 0,
      tags TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS app_shortcuts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT,
      app_path TEXT,
      icon TEXT,
      category TEXT,
      color TEXT,
      favorite INTEGER DEFAULT 0,
      shortcut_type TEXT DEFAULT 'website',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      section TEXT NOT NULL,
      color TEXT,
      icon TEXT,
      parent_id TEXT,
      order_num INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS dashboard_widgets (
      id TEXT PRIMARY KEY,
      widget_type TEXT NOT NULL,
      position INTEGER DEFAULT 0,
      size TEXT DEFAULT 'medium',
      visible INTEGER DEFAULT 1,
      config TEXT
    );

    CREATE TABLE IF NOT EXISTS theme_config (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS university_years (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      start_year INTEGER,
      end_year INTEGER,
      active INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS semesters (
      id TEXT PRIMARY KEY,
      year_id TEXT,
      name TEXT NOT NULL,
      number INTEGER,
      active INTEGER DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS uni_subjects (
      id TEXT PRIMARY KEY,
      semester_id TEXT,
      name TEXT NOT NULL,
      code TEXT,
      color TEXT DEFAULT '#6366f1',
      icon TEXT,
      category TEXT,
      pinned INTEGER DEFAULT 0,
      archived INTEGER DEFAULT 0,
      professor TEXT,
      description TEXT,
      progress REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subject_resources (
      id TEXT PRIMARY KEY,
      subject_id TEXT,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'file',
      url TEXT,
      size INTEGER,
      folder_id TEXT,
      favorite INTEGER DEFAULT 0,
      tags TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subject_folders (
      id TEXT PRIMARY KEY,
      subject_id TEXT,
      name TEXT NOT NULL,
      parent_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS uni_notes (
      id TEXT PRIMARY KEY,
      subject_id TEXT,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      folder_id TEXT,
      parent_id TEXT,
      tags TEXT,
      pinned INTEGER DEFAULT 0,
      note_type TEXT DEFAULT 'text',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      subject_id TEXT,
      title TEXT NOT NULL,
      exam_type TEXT DEFAULT 'other',
      date TEXT,
      time TEXT,
      location TEXT,
      weight REAL,
      priority TEXT DEFAULT 'medium',
      completed INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lectures (
      id TEXT PRIMARY KEY,
      subject_id TEXT,
      title TEXT NOT NULL,
      lecture_type TEXT DEFAULT 'lecture',
      date TEXT,
      duration INTEGER,
      chapter TEXT,
      content TEXT,
      completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      subject_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      status TEXT DEFAULT 'pending',
      grade REAL,
      max_grade REAL,
      attachments TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY,
      subject_id TEXT,
      duration INTEGER,
      session_type TEXT DEFAULT 'study',
      notes TEXT,
      date TEXT DEFAULT (datetime('now'))
    );
  `);
}

// Returns a promise that resolves to the database wrapper
function initDatabase() {
  const initSqlJs = require('sql.js');
  const fs = require('fs');

  const userDataPath = app.getPath('userData');
  dbPath = path.join(userDataPath, 'lifeos.db');

  let buffer;
  try {
    buffer = fs.readFileSync(dbPath);
  } catch {
    buffer = null;
  }

  return initSqlJs().then((SQL) => {
    if (buffer) {
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }

    createTables();
    saveDatabase();
    dbReady = true;
    console.log('Database initialized successfully at', dbPath);

    return getDatabase();
  });
}

function getDatabase() {
  return {
    prepare: (sql) => ({
      run: (...params) => {
        if (!db) throw new Error('Database not initialized');
        db.run(sql, params);
        saveDatabase();
        return { changes: db.getRowsModified(), lastInsertRowid: 0 };
      },
      get: (...params) => {
        if (!db) throw new Error('Database not initialized');
        const stmt = db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          stmt.free();
          const obj = {};
          cols.forEach((c, i) => obj[c] = vals[i]);
          return obj;
        }
        stmt.free();
        return undefined;
      },
      all: (...params) => {
        if (!db) throw new Error('Database not initialized');
        const stmt = db.prepare(sql);
        stmt.bind(params);
        const results = [];
        while (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          const obj = {};
          cols.forEach((c, i) => obj[c] = vals[i]);
          results.push(obj);
        }
        stmt.free();
        return results;
      },
    }),
    close: () => {
      if (db) {
        saveDatabase();
        db.close();
        db = null;
        dbReady = false;
      }
    },
    isReady: () => dbReady,
  };
}

module.exports = { initDatabase, getDatabase };
