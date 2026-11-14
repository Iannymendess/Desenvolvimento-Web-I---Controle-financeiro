const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const caminhoBanco = path.join(__dirname, '..', 'financeiro.db');

// Conecta ou cria o arquivo do banco de dados SQLite local
const db = new sqlite3.Database(caminhoBanco, (err) => {
  if (err) {
    console.error('Erro ao conectar ao SQLite:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
  }
});

// Cria as tabelas relacionadas caso ainda não existam
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao TEXT NOT NULL,
      valor REAL NOT NULL,
      data TEXT NOT NULL,
      tipo TEXT NOT NULL,
      categoria TEXT NOT NULL,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id)
    )
  `);
});

module.exports = db;
