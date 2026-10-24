// Os dados ficam no navegador nesta primeira entrega.
const chaveTransacoes = 'controleFinanceiro.transacoes';
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function hoje() {
  const data = new Date();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

function lerTransacoes() {
  const dados = JSON.parse(localStorage.getItem(chaveTransacoes) || '[]');
  if (!Array.isArray(dados)) throw new Error('Dados inválidos');
  return dados;
}

function salvarTransacoes(transacoes) {
  localStorage.setItem(chaveTransacoes, JSON.stringify(transacoes));
}

function mensagem(texto, sucesso = false) {
  const elemento = document.getElementById('mensagem');
  elemento.textContent = texto;
  elemento.classList.toggle('sucesso', sucesso);
}

function emailValido(campo) {
  return campo.value.trim() !== '' && campo.validity.valid;
}

function formatarData(data) {
  return data.split('-').reverse().join('/');
}

function atualizarDashboard() {
  const transacoes = lerTransacoes();
  let receitas = 0;
  let despesas = 0;
  transacoes.forEach(function (transacao) {
    if (transacao.tipo === 'receita') receitas += transacao.valor;
    else despesas += transacao.valor;
  });
  document.getElementById('saldo').textContent = moeda.format(receitas - despesas);
  document.getElementById('receitas').textContent = moeda.format(receitas);
  document.getElementById('despesas').textContent = moeda.format(despesas);
  const lista = document.getElementById('ultimas-transacoes');
  lista.replaceChildren();
  // Mais recentes pela data; em datas iguais, mostra a inclusão mais recente primeiro.
  const ultimas = [...transacoes].sort(function (a, b) {
    return b.data.localeCompare(a.data) || b.id - a.id;
  }).slice(0, 5);
  if (ultimas.length === 0) {
    const item = document.createElement('li');
    item.textContent = 'Nenhuma transação cadastrada.';
    lista.appendChild(item);
  }
  ultimas.forEach(function (transacao) {
    const item = document.createElement('li');
    item.textContent = `${formatarData(transacao.data)} - ${transacao.descricao} - ${transacao.tipo === 'receita' ? 'Receita' : 'Despesa'} - ${moeda.format(transacao.valor)}`;
    lista.appendChild(item);
  });
}

function atualizarTabela() {
  const filtro = document.getElementById('filtro-tipo').value;
  const transacoes = lerTransacoes().filter(function (transacao) {
    return filtro === 'todas' || transacao.tipo === filtro;
  });
  const tabela = document.getElementById('tabela-transacoes');
  tabela.replaceChildren();
  if (transacoes.length === 0) {
    const linha = document.createElement('tr');
    const coluna = document.createElement('td');
    coluna.colSpan = 6;
    coluna.textContent = 'Nenhuma transação encontrada.';
    linha.appendChild(coluna);
    tabela.appendChild(linha);
  }
  transacoes.forEach(function (transacao) {
    const linha = document.createElement('tr');
    const valores = [transacao.descricao, moeda.format(transacao.valor), formatarData(transacao.data), transacao.tipo === 'receita' ? 'Receita' : 'Despesa', transacao.categoria];
    valores.forEach(function (valor) {
      const coluna = document.createElement('td');
      coluna.textContent = valor;
      linha.appendChild(coluna);
    });
    const acoes = document.createElement('td');
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'excluir';
    botao.textContent = 'Excluir';
    botao.setAttribute('aria-label', `Excluir ${transacao.descricao}`);
    botao.addEventListener('click', function () {
      try {
        const restantes = lerTransacoes().filter(function (item) { return item.id !== transacao.id; });
        salvarTransacoes(restantes);
        atualizarTabela();
        mensagem('Transação excluída.', true);
      } catch (erro) {
        mensagem('Não foi possível excluir. Verifique o armazenamento do navegador.');
      }
    });
    acoes.appendChild(botao);
    linha.appendChild(acoes);
    tabela.appendChild(linha);
  });
}

const pagina = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('nav a').forEach(function (link) {
  if (link.getAttribute('href') === pagina) link.setAttribute('aria-current', 'page');
});

const formLogin = document.getElementById('form-login');
if (formLogin) {
  formLogin.addEventListener('submit', function (evento) {
    evento.preventDefault();
    const email = document.getElementById('email');
    const senha = document.getElementById('senha').value;
    if (!emailValido(email)) return mensagem('Informe um e-mail válido.');
    if (!senha.trim()) return mensagem('Preencha a senha.');
    // Login simulado: não consulta servidor e não compara credenciais.
    location.href = 'dashboard.html';
  });
}

const formCadastro = document.getElementById('form-cadastro');
if (formCadastro) {
  formCadastro.addEventListener('submit', function (evento) {
    evento.preventDefault();
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email');
    const senha = document.getElementById('senha').value;
    const confirmacao = document.getElementById('confirmacao').value;
    if (!nome || !email.value.trim() || !senha.trim() || !confirmacao.trim()) return mensagem('Preencha todos os campos.');
    if (!emailValido(email)) return mensagem('Informe um e-mail válido.');
    if (senha.length < 6) return mensagem('A senha deve ter pelo menos 6 caracteres.');
    if (senha !== confirmacao) return mensagem('As senhas devem ser iguais.');
    // A autenticação real será implementada na próxima entrega. Não salvamos senhas.
    formCadastro.reset();
    mensagem('Cadastro validado! Acesse o link de login para entrar (acesso simulado).', true);
  });
}

const formTransacao = document.getElementById('form-transacao');
if (formTransacao) {
  const campoData = document.getElementById('data');
  campoData.max = hoje();
  campoData.value = hoje();
  document.getElementById('filtro-tipo').addEventListener('change', atualizarTabela);
  formTransacao.addEventListener('submit', function (evento) {
    evento.preventDefault();
    const descricao = document.getElementById('descricao').value.trim();
    const campoValor = document.getElementById('valor');
    const valor = Number(campoValor.value);
    const data = campoData.value;
    const tipo = document.getElementById('tipo').value;
    const categoria = document.getElementById('categoria').value;
    if (!descricao) return mensagem('Preencha a descrição.');
    if (!Number.isFinite(valor) || valor <= 0 || !campoValor.validity.valid) return mensagem('Informe um valor maior que zero, com até duas casas decimais.');
    if (!data || !campoData.validity.valid || data > hoje()) return mensagem('Informe uma data válida que não seja futura.');
    try {
      const transacoes = lerTransacoes();
      const id = transacoes.reduce(function (maior, item) { return Math.max(maior, item.id); }, 0) + 1;
      transacoes.push({ id, descricao, valor, data, tipo, categoria });
      salvarTransacoes(transacoes);
      formTransacao.reset();
      campoData.value = hoje();
      campoData.max = hoje();
      atualizarTabela();
      mensagem('Transação adicionada.', true);
    } catch (erro) {
      mensagem('Não foi possível salvar. Verifique o armazenamento do navegador.');
    }
  });
  try { atualizarTabela(); }
  catch (erro) { mensagem('Não foi possível carregar as transações salvas.'); }
}

if (document.getElementById('saldo')) {
  try { atualizarDashboard(); }
  catch (erro) {
    document.getElementById('ultimas-transacoes').textContent = 'Não foi possível carregar as transações salvas.';
  }
}

// Atualiza a tela ao voltar pelo navegador ou alterar os dados em outra aba.
function atualizarTela() {
  try {
    if (document.getElementById('saldo')) atualizarDashboard();
    if (formTransacao) atualizarTabela();
  } catch (erro) { console.error('Não foi possível atualizar os dados.', erro); }
}
window.addEventListener('pageshow', atualizarTela);
window.addEventListener('storage', atualizarTela);
