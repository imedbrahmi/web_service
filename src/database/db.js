const Database = require('better-sqlite3');
const path = require('path');

let db;

function initDatabase() {
  const dbPath = path.join(__dirname, '../../database/bibliotheque.db');
  db = new Database(dbPath);
  
  // Activer les clés étrangères
  db.pragma('foreign_keys = ON');
  
  // Créer les tables si elles n'existent pas
  db.exec(`
    CREATE TABLE IF NOT EXISTS authors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      biography TEXT,
      birth_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      isbn TEXT UNIQUE,
      author_id INTEGER,
      publication_year INTEGER,
      genre TEXT,
      description TEXT,
      total_copies INTEGER DEFAULT 1,
      available_copies INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES authors (id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      loan_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      return_date DATETIME,
      due_date DATETIME,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (book_id) REFERENCES books (id)
    );
  `);
  
  console.log('✅ Base de données initialisée');
  return db;
}

function getDatabase() {
  if (!db) {
    throw new Error('Base de données non initialisée. Appelez initDatabase() d\'abord.');
  }
  return db;
}

// Fonctions utilitaires pour les requêtes
function run(sql, params = []) {
  const stmt = getDatabase().prepare(sql);
  const result = stmt.run(params);
  return result;
}

function get(sql, params = []) {
  const stmt = getDatabase().prepare(sql);
  return stmt.get(params);
}

function all(sql, params = []) {
  const stmt = getDatabase().prepare(sql);
  return stmt.all(params);
}

module.exports = {
  initDatabase,
  getDatabase,
  run,
  get,
  all
}; 