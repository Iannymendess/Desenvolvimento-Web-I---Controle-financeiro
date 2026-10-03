/*
 * dashboard.js — cartões de resumo e últimas 5 transações (dashboard.html).
 */

const QUANTIDADE_ULTIMAS = 5;

function mostrarSaudacao() {
    const usuario = usuarioLogado();
    if (usuario) {
        document.getElementById('saudacao').textContent = `Olá, ${usuario.nome}!`;
    }
}

function mostrarResumo(transacoes) {
    const { receitas, despesas, saldo } = calcularResumo(transacoes);
    const elementoSaldo = document.getElementById('valor-saldo');

    elementoSaldo.textContent = formatarMoeda(saldo);
    elementoSaldo.classList.toggle('negativo', saldo < 0);
    document.getElementById('valor-receitas').textContent = formatarMoeda(receitas);
    document.getElementById('valor-despesas').textContent = formatarMoeda(despesas);
}

function criarItemTransacao(transacao) {
    const item = document.createElement('li');
    item.className = `item-transacao item-transacao--${transacao.tipo}`;

    const info = document.createElement('div');
    const descricao = document.createElement('p');
    descricao.className = 'item-transacao__descricao';
    descricao.textContent = transacao.descricao; // textContent evita injeção de HTML

    const detalhes = document.createElement('p');
    detalhes.className = 'item-transacao__detalhes';
    detalhes.textContent = `${formatarData(transacao.data)} · ${transacao.categoria}`;

    info.append(descricao, detalhes);

    const valor = document.createElement('p');
    valor.className = 'item-transacao__valor';
    const sinal = transacao.tipo === 'receita' ? '+' : '−';
    valor.textContent = `${sinal} ${formatarMoeda(transacao.valor)}`;

    item.append(info, valor);
    return item;
}

function mostrarUltimas(transacoes) {
    const lista = document.getElementById('ultimas-transacoes');
    const vazio = document.getElementById('ultimas-vazio');
    const ultimas = ordenarPorData(transacoes).slice(0, QUANTIDADE_ULTIMAS);

    lista.replaceChildren(...ultimas.map(criarItemTransacao));
    vazio.hidden = ultimas.length > 0;
}

const transacoes = carregarTransacoes();
mostrarSaudacao();
mostrarResumo(transacoes);
mostrarUltimas(transacoes);
