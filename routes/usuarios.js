const express = require('express');
const db = require('../database/db');

const router = express.Router();

function emailValido(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// POST /api/usuarios - Cadastro de novo usuário
router.post('/usuarios', (req, res) => {
  const nome = typeof req.body.nome === 'string' ? req.body.nome.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const senha = typeof req.body.senha === 'string' ? req.body.senha : '';
  const confirmacao = req.body.confirmacao;

  if (!nome || !email || !senha.trim()) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
  }
  if (!emailValido(email)) {
    return res.status(400).json({ error: 'Informe um e-mail válido.' });
  }
  if (senha.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
  }
  if (confirmacao !== undefined && senha !== confirmacao) {
    return res.status(400).json({ error: 'As senhas devem ser iguais.' });
  }

  db.all('SELECT id FROM usuarios WHERE email = ?', [email], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao verificar e-mail no banco de dados.' });
    }
    if (rows.length > 0) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }

    const sql = 'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)';
    db.run(sql, [nome, email, senha], function (insertErr) {
      if (insertErr) {
        return res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
      }
      return res.status(201).json({
        id: this.lastID,
        nome,
        email
      });
    });
  });
});

// POST /api/login - Autenticação de usuário
router.post('/login', (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const senha = typeof req.body.senha === 'string' ? req.body.senha : '';

  if (!emailValido(email)) {
    return res.status(400).json({ error: 'Informe um e-mail válido.' });
  }
  if (!senha.trim()) {
    return res.status(400).json({ error: 'Preencha a senha.' });
  }

  const sql = 'SELECT id, nome, email, senha FROM usuarios WHERE email = ?';
  db.all(sql, [email], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao consultar usuário no banco de dados.' });
    }
    if (rows.length === 0 || rows[0].senha !== senha) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    const usuario = rows[0];
    return res.status(200).json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email
    });
  });
});

module.exports = router;
