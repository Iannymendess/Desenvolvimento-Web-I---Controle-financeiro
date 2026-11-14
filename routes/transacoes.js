const express = require('express');
const db = require('../database/db');

const router = express.Router();

const tiposValidos = ['receita', 'despesa'];
const categoriasValidas = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Lazer',
  'Saúde',
  'Salário',
  'Outros'
];

function hoje() {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

function dataValida(texto) {
  if (typeof texto !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return false;
  }
  const partes = texto.split('-').map(Number);
  const data = new Date(partes[0], partes[1] - 1, partes[2]);
  return (
    data.getFullYear() === partes[0] &&
    data.getMonth() === partes[1] - 1 &&
    data.getDate() === partes[2]
  );
}

function validarTransacao(corpo) {
  const descricao = typeof corpo.descricao === 'string' ? corpo.descricao.trim() : '';
  const valor = Number(corpo.valor);
  const data = typeof corpo.data === 'string' ? corpo.data.trim() : '';
  const tipo = typeof corpo.tipo === 'string' ? corpo.tipo.trim() : '';
  const categoria = typeof corpo.categoria === 'string' ? corpo.categoria.trim() : '';
  const usuarioId = Number(corpo.usuario_id);

  if (!descricao) {
    return { erro: 'Preencha a descrição.' };
  }
  if (
    !Number.isFinite(valor) ||
    valor <= 0 ||
    Math.abs(valor * 100 - Math.round(valor * 100)) > 1e-6
  ) {
    return { erro: 'Informe um valor maior que zero, com até duas casas decimais.' };
  }
  if (!dataValida(data) || data > hoje()) {
    return { erro: 'Informe uma data válida que não seja futura.' };
  }
  if (!tiposValidos.includes(tipo)) {
    return { erro: 'Selecione um tipo válido (receita ou despesa).' };
  }
  if (!categoriasValidas.includes(categoria)) {
    return { erro: 'Selecione uma categoria válida.' };
  }
  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    return { erro: 'Usuário inválido.' };
  }

  return {
    dados: {
      descricao,
      valor: Number(valor.toFixed(2)),
      data,
      tipo,
      categoria,
      usuario_id: usuarioId
    }
  };
}

// GET /api/transacoes - Lista transações do usuário (com filtro opcional por tipo e limite)
router.get('/transacoes', (req, res) => {
  const usuarioId = Number(req.query.usuarioId);
  const tipo = req.query.tipo;
  const limite = req.query.limite !== undefined ? Number(req.query.limite) : null;

  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    return res.status(400).json({ error: 'Informe um usuarioId válido.' });
  }
  if (tipo && tipo !== 'todas' && !tiposValidos.includes(tipo)) {
    return res.status(400).json({ error: 'Filtro de tipo inválido.' });
  }
  if (limite !== null && (!Number.isInteger(limite) || limite <= 0)) {
    return res.status(400).json({ error: 'Limite inválido.' });
  }

  let sql = `
    SELECT transacoes.id, transacoes.descricao, transacoes.valor, transacoes.data,
           transacoes.tipo, transacoes.categoria, transacoes.usuario_id,
           usuarios.nome AS usuario_nome
    FROM transacoes
    INNER JOIN usuarios ON transacoes.usuario_id = usuarios.id
    WHERE transacoes.usuario_id = ?
  `;
  const parametros = [usuarioId];

  if (tipo && tipo !== 'todas') {
    sql += ' AND transacoes.tipo = ?';
    parametros.push(tipo);
  }

  sql += ' ORDER BY transacoes.data DESC, transacoes.id DESC';

  if (limite !== null) {
    sql += ' LIMIT ?';
    parametros.push(limite);
  }

  db.all(sql, parametros, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar transações.' });
    }
    return res.status(200).json(rows);
  });
});

// GET /api/transacoes/:id - Busca uma transação específica pelo ID
router.get('/transacoes/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de transação inválido.' });
  }

  const sql = `
    SELECT transacoes.id, transacoes.descricao, transacoes.valor, transacoes.data,
           transacoes.tipo, transacoes.categoria, transacoes.usuario_id,
           usuarios.nome AS usuario_nome
    FROM transacoes
    INNER JOIN usuarios ON transacoes.usuario_id = usuarios.id
    WHERE transacoes.id = ?
  `;

  db.all(sql, [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar transação.' });
    }
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Transação não encontrada.' });
    }
    return res.status(200).json(rows[0]);
  });
});

// POST /api/transacoes - Cria uma nova transação
router.post('/transacoes', (req, res) => {
  const resultado = validarTransacao(req.body);
  if (resultado.erro) {
    return res.status(400).json({ error: resultado.erro });
  }

  const { descricao, valor, data, tipo, categoria, usuario_id } = resultado.dados;

  db.all('SELECT id FROM usuarios WHERE id = ?', [usuario_id], (userErr, userRows) => {
    if (userErr) {
      return res.status(500).json({ error: 'Erro ao verificar usuário.' });
    }
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const sql = `
      INSERT INTO transacoes (descricao, valor, data, tipo, categoria, usuario_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.run(sql, [descricao, valor, data, tipo, categoria, usuario_id], function (err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao salvar transação.' });
      }
      return res.status(201).json({
        id: this.lastID,
        descricao,
        valor,
        data,
        tipo,
        categoria,
        usuario_id
      });
    });
  });
});

// PUT /api/transacoes/:id - Atualiza uma transação existente
router.put('/transacoes/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de transação inválido.' });
  }

  const resultado = validarTransacao(req.body);
  if (resultado.erro) {
    return res.status(400).json({ error: resultado.erro });
  }

  const { descricao, valor, data, tipo, categoria, usuario_id } = resultado.dados;
  const sql = `
    UPDATE transacoes
    SET descricao = ?, valor = ?, data = ?, tipo = ?, categoria = ?
    WHERE id = ? AND usuario_id = ?
  `;

  db.run(sql, [descricao, valor, data, tipo, categoria, id, usuario_id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao atualizar transação.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Transação não encontrada.' });
    }
    return res.status(200).json({
      id,
      descricao,
      valor,
      data,
      tipo,
      categoria,
      usuario_id
    });
  });
});

// DELETE /api/transacoes/:id - Remove uma transação pelo ID
router.delete('/transacoes/:id', (req, res) => {
  const id = Number(req.params.id);
  const usuarioId = Number(req.query.usuarioId);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de transação inválido.' });
  }
  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    return res.status(400).json({ error: 'Informe um usuarioId válido.' });
  }

  const sql = 'DELETE FROM transacoes WHERE id = ? AND usuario_id = ?';
  db.run(sql, [id, usuarioId], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao excluir transação.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Transação não encontrada.' });
    }
    return res.status(204).send();
  });
});

module.exports = router;
