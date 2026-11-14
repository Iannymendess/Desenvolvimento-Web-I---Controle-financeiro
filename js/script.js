const API_BASE = location.port === '3000' ? '' : 'http://localhost:3000';
const chaveUsuario = 'controleFinanceiro.usuario';
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

let idEmEdicao = null;

function hoje() {
  const data = new Date();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

function obterUsuarioLogado() {
  try {
    const salvo = localStorage.getItem(chaveUsuario);
    if (!salvo) return null;
    const usuario = JSON.parse(salvo);
    if (!usuario || !usuario.id) return null;
    return usuario;
  } catch (erro) {
    return null;
  }
}

function salvarUsuarioLogado(usuario) {
  localStorage.setItem(chaveUsuario, JSON.stringify(usuario));
}

function sair() {
  localStorage.removeItem(chaveUsuario);
  location.href = 'index.html';
}

function mensagem(texto, sucesso = false) {
  const elemento = document.getElementById('mensagem');
  if (!elemento) return;
  elemento.textContent = texto;
  elemento.classList.toggle('sucesso', sucesso);
}

function emailValido(campo) {
  return campo.value.trim() !== '' && campo.validity.valid;
}

function formatarData(data) {
  return data.split('-').reverse().join('/');
}

async function lerRespostaJson(resposta) {
  const texto = await resposta.text();
  if (!texto) return {};
  return JSON.parse(texto);
}

async function atualizarDashboard() {
  const usuario = obterUsuarioLogado();
  if (!usuario) return;

  const resposta = await fetch(`${API_BASE}/api/transacoes?usuarioId=${usuario.id}`);
  const dados = await lerRespostaJson(resposta);
  if (!resposta.ok) {
    throw new Error(dados.error || 'Erro ao buscar transações.');
  }

  let receitas = 0;
  let despesas = 0;
  dados.forEach(function (transacao) {
    if (transacao.tipo === 'receita') receitas += transacao.valor;
    else despesas += transacao.valor;
  });

  document.getElementById('saldo').textContent = moeda.format(receitas - despesas);
  document.getElementById('receitas').textContent = moeda.format(receitas);
  document.getElementById('despesas').textContent = moeda.format(despesas);

  const lista = document.getElementById('ultimas-transacoes');
  lista.replaceChildren();
  const ultimas = dados.slice(0, 5);

  if (ultimas.length === 0) {
    const item = document.createElement('li');
    item.textContent = 'Nenhuma transação cadastrada.';
    lista.appendChild(item);
    return;
  }

  ultimas.forEach(function (transacao) {
    const item = document.createElement('li');
    const tipoTexto = transacao.tipo === 'receita' ? 'Receita' : 'Despesa';
    item.textContent = `${formatarData(transacao.data)} - ${transacao.descricao} - ${tipoTexto} - ${moeda.format(transacao.valor)}`;
    lista.appendChild(item);
  });
}

function iniciarEdicao(transacao) {
  idEmEdicao = transacao.id;
  document.getElementById('descricao').value = transacao.descricao;
  document.getElementById('valor').value = transacao.valor;
  document.getElementById('data').value = transacao.data;
  document.getElementById('tipo').value = transacao.tipo;
  document.getElementById('categoria').value = transacao.categoria;
  document.getElementById('titulo-form').textContent = 'Editar transação';
  document.getElementById('btn-salvar').textContent = 'Salvar alterações';
  document.getElementById('btn-cancelar-edicao').hidden = false;
  mensagem('');
}

function cancelarEdicao() {
  idEmEdicao = null;
  const formTransacao = document.getElementById('form-transacao');
  const campoData = document.getElementById('data');
  formTransacao.reset();
  campoData.value = hoje();
  campoData.max = hoje();
  document.getElementById('titulo-form').textContent = 'Nova transação';
  document.getElementById('btn-salvar').textContent = 'Adicionar transação';
  document.getElementById('btn-cancelar-edicao').hidden = true;
}

async function atualizarTabela() {
  const usuario = obterUsuarioLogado();
  if (!usuario) return;

  const filtro = document.getElementById('filtro-tipo').value;
  const url = `${API_BASE}/api/transacoes?usuarioId=${usuario.id}&tipo=${encodeURIComponent(filtro)}`;
  const resposta = await fetch(url);
  const transacoes = await lerRespostaJson(resposta);

  if (!resposta.ok) {
    throw new Error(transacoes.error || 'Erro ao carregar transações.');
  }

  const tabela = document.getElementById('tabela-transacoes');
  tabela.replaceChildren();

  if (transacoes.length === 0) {
    const linha = document.createElement('tr');
    const coluna = document.createElement('td');
    coluna.colSpan = 6;
    coluna.textContent = 'Nenhuma transação encontrada.';
    linha.appendChild(coluna);
    tabela.appendChild(linha);
    return;
  }

  transacoes.forEach(function (transacao) {
    const linha = document.createElement('tr');
    const valores = [
      transacao.descricao,
      moeda.format(transacao.valor),
      formatarData(transacao.data),
      transacao.tipo === 'receita' ? 'Receita' : 'Despesa',
      transacao.categoria
    ];

    valores.forEach(function (valor) {
      const coluna = document.createElement('td');
      coluna.textContent = valor;
      linha.appendChild(coluna);
    });

    const acoes = document.createElement('td');
    const grupoAcoes = document.createElement('div');
    grupoAcoes.className = 'acoes-tabela';

    const botaoEditar = document.createElement('button');
    botaoEditar.type = 'button';
    botaoEditar.className = 'editar';
    botaoEditar.textContent = 'Editar';
    botaoEditar.setAttribute('aria-label', `Editar ${transacao.descricao}`);
    botaoEditar.addEventListener('click', function () {
      iniciarEdicao(transacao);
    });

    const botaoExcluir = document.createElement('button');
    botaoExcluir.type = 'button';
    botaoExcluir.className = 'excluir';
    botaoExcluir.textContent = 'Excluir';
    botaoExcluir.setAttribute('aria-label', `Excluir ${transacao.descricao}`);
    botaoExcluir.addEventListener('click', async function () {
      try {
        const respDelete = await fetch(
          `${API_BASE}/api/transacoes/${transacao.id}?usuarioId=${usuario.id}`,
          { method: 'DELETE' }
        );
        if (!respDelete.ok) {
          const erro = await lerRespostaJson(respDelete);
          return mensagem(erro.error || 'Não foi possível excluir a transação.');
        }
        if (idEmEdicao === transacao.id) {
          cancelarEdicao();
        }
        await atualizarTabela();
        mensagem('Transação excluída.', true);
      } catch (erro) {
        mensagem('Erro ao conectar com o servidor.');
      }
    });

    grupoAcoes.appendChild(botaoEditar);
    grupoAcoes.appendChild(botaoExcluir);
    acoes.appendChild(grupoAcoes);
    linha.appendChild(acoes);
    tabela.appendChild(linha);
  });
}

// Marca link ativo no menu
const pagina = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('nav a').forEach(function (link) {
  if (link.getAttribute('href') === pagina) {
    link.setAttribute('aria-current', 'page');
  }
});

// Configura botão de sair e exibe usuário logado nas páginas internas
const usuarioAtual = obterUsuarioLogado();
if (usuarioAtual && (pagina === 'index.html' || pagina === 'cadastro.html')) {
  location.href = 'dashboard.html';
}

const btnSair = document.getElementById('btn-sair');
const textoUsuario = document.getElementById('usuario-logado');

if (btnSair) {
  btnSair.addEventListener('click', sair);
}
if (textoUsuario && usuarioAtual) {
  textoUsuario.textContent = `Usuário conectado: ${usuarioAtual.nome} (${usuarioAtual.email})`;
}

// Login
const formLogin = document.getElementById('form-login');
if (formLogin) {
  formLogin.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    const email = document.getElementById('email');
    const senha = document.getElementById('senha').value;

    if (!emailValido(email)) return mensagem('Informe um e-mail válido.');
    if (!senha.trim()) return mensagem('Preencha a senha.');

    try {
      const resposta = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.value.trim(), senha })
      });
      const dados = await lerRespostaJson(resposta);
      if (!resposta.ok) {
        return mensagem(dados.error || 'Não foi possível realizar o login.');
      }
      salvarUsuarioLogado(dados);
      location.href = 'dashboard.html';
    } catch (erro) {
      mensagem('Erro ao conectar com o servidor.');
    }
  });
}

// Cadastro de usuário
const formCadastro = document.getElementById('form-cadastro');
if (formCadastro) {
  formCadastro.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email');
    const senha = document.getElementById('senha').value;
    const confirmacao = document.getElementById('confirmacao').value;

    if (!nome || !email.value.trim() || !senha.trim() || !confirmacao.trim()) {
      return mensagem('Preencha todos os campos.');
    }
    if (!emailValido(email)) return mensagem('Informe um e-mail válido.');
    if (senha.length < 6) return mensagem('A senha deve ter pelo menos 6 caracteres.');
    if (senha !== confirmacao) return mensagem('As senhas devem ser iguais.');

    try {
      const resposta = await fetch(`${API_BASE}/api/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          email: email.value.trim(),
          senha,
          confirmacao
        })
      });
      const dados = await lerRespostaJson(resposta);
      if (!resposta.ok) {
        return mensagem(dados.error || 'Não foi possível realizar o cadastro.');
      }
      formCadastro.reset();
      mensagem('Cadastro realizado com sucesso! Acesse o link de login para entrar.', true);
    } catch (erro) {
      mensagem('Erro ao conectar com o servidor.');
    }
  });
}

// Página de Transações (exige login)
const formTransacao = document.getElementById('form-transacao');
if (formTransacao) {
  if (!usuarioAtual) {
    location.href = 'index.html';
  } else {
    const campoData = document.getElementById('data');
    campoData.max = hoje();
    campoData.value = hoje();

    document.getElementById('filtro-tipo').addEventListener('change', function () {
      atualizarTabela().catch(function () {
        mensagem('Não foi possível filtrar as transações.');
      });
    });

    document.getElementById('btn-cancelar-edicao').addEventListener('click', function () {
      cancelarEdicao();
      mensagem('');
    });

    formTransacao.addEventListener('submit', async function (evento) {
      evento.preventDefault();
      const descricao = document.getElementById('descricao').value.trim();
      const campoValor = document.getElementById('valor');
      const valor = Number(campoValor.value);
      const data = campoData.value;
      const tipo = document.getElementById('tipo').value;
      const categoria = document.getElementById('categoria').value;

      if (!descricao) return mensagem('Preencha a descrição.');
      if (!Number.isFinite(valor) || valor <= 0 || !campoValor.validity.valid) {
        return mensagem('Informe um valor maior que zero, com até duas casas decimais.');
      }
      if (!data || !campoData.validity.valid || data > hoje()) {
        return mensagem('Informe uma data válida que não seja futura.');
      }

      const corpo = {
        descricao,
        valor,
        data,
        tipo,
        categoria,
        usuario_id: usuarioAtual.id
      };

      const editando = idEmEdicao !== null;
      const url = editando
        ? `${API_BASE}/api/transacoes/${idEmEdicao}`
        : `${API_BASE}/api/transacoes`;
      const metodo = editando ? 'PUT' : 'POST';

      try {
        const resposta = await fetch(url, {
          method: metodo,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(corpo)
        });
        const dados = await lerRespostaJson(resposta);
        if (!resposta.ok) {
          return mensagem(dados.error || 'Não foi possível salvar a transação.');
        }
        cancelarEdicao();
        await atualizarTabela();
        mensagem(editando ? 'Transação atualizada.' : 'Transação adicionada.', true);
      } catch (erro) {
        mensagem('Erro ao conectar com o servidor.');
      }
    });

    atualizarTabela().catch(function () {
      mensagem('Não foi possível carregar as transações.');
    });
  }
}

// Página de Dashboard (exige login)
if (document.getElementById('saldo')) {
  if (!usuarioAtual) {
    location.href = 'index.html';
  } else {
    atualizarDashboard().catch(function () {
      document.getElementById('ultimas-transacoes').textContent =
        'Não foi possível carregar as transações do servidor.';
    });
  }
}
