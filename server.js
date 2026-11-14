const express = require('express');
const cors = require('cors');
const path = require('path');

require('./database/db');
const rotasUsuarios = require('./routes/usuarios');
const rotasTransacoes = require('./routes/transacoes');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Rotas da API REST
app.use('/api', rotasUsuarios);
app.use('/api', rotasTransacoes);

// Serve apenas os arquivos do lado cliente (sem expor database/ ou routes/)
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

const paginas = ['index.html', 'cadastro.html', 'dashboard.html', 'transacoes.html'];
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
paginas.forEach((pagina) => {
  app.get(`/${pagina}`, (req, res) => {
    res.sendFile(path.join(__dirname, pagina));
  });
});

// Tratamento simples para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

app.listen(port, () => {
  console.log(`Servidor Express rodando em http://localhost:${port}`);
});
