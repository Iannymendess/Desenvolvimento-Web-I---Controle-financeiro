/*
 * script.js — código compartilhado por todas as páginas.
 * Deve ser carregado antes do script específico de cada página.
 */

/* ---------- Armazenamento (localStorage) ---------- */

const CHAVE_TRANSACOES = 'cf_transacoes';
const CHAVE_USUARIOS = 'cf_usuarios';
const CHAVE_SESSAO = 'cf_usuario_logado'; // fica no sessionStorage

function lerLista(chave) {
    try {
        const dados = JSON.parse(localStorage.getItem(chave));
        return Array.isArray(dados) ? dados : [];
    } catch (erro) {
        return [];
    }
}

function salvarLista(chave, lista) {
    localStorage.setItem(chave, JSON.stringify(lista));
}

function carregarTransacoes() {
    return lerLista(CHAVE_TRANSACOES);
}

function salvarTransacoes(transacoes) {
    salvarLista(CHAVE_TRANSACOES, transacoes);
}

// Gera o próximo id como um auto-incremento de banco de dados (maior id + 1).
function proximoId(transacoes) {
    return transacoes.reduce((maior, t) => Math.max(maior, t.id), 0) + 1;
}

function usuarioLogado() {
    try {
        return JSON.parse(sessionStorage.getItem(CHAVE_SESSAO));
    } catch (erro) {
        return null;
    }
}

/* ---------- Cálculos e formatação ---------- */

function calcularResumo(transacoes) {
    let receitas = 0;
    let despesas = 0;
    transacoes.forEach((t) => {
        if (t.tipo === 'receita') receitas += t.valor;
        else despesas += t.valor;
    });
    return { receitas, despesas, saldo: receitas - despesas };
}

// Mais recentes primeiro; em datas iguais, a adicionada por último vem antes.
function ordenarPorData(transacoes) {
    return [...transacoes].sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id);
}

const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatarMoeda(valor) {
    return formatadorMoeda.format(valor);
}

// "2026-10-05" -> "05/10/2026" (sem usar Date, para evitar erro de fuso horário)
function formatarData(dataISO) {
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

// Data de hoje no fuso local, no formato "AAAA-MM-DD".
function hojeISO() {
    const agora = new Date();
    const local = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
}

/* ---------- Validação de formulários ---------- */

function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Mostra a mensagem no <span id="erro-ID_DO_CAMPO"> e marca o campo como inválido.
function mostrarErro(campo, mensagem) {
    const erro = document.getElementById('erro-' + campo.id);
    campo.classList.add('invalido');
    campo.setAttribute('aria-invalid', 'true');
    if (erro) erro.textContent = mensagem;
}

function limparErro(campo) {
    const erro = document.getElementById('erro-' + campo.id);
    campo.classList.remove('invalido');
    campo.removeAttribute('aria-invalid');
    if (erro) erro.textContent = '';
}

// Ao digitar de novo num campo com erro, a mensagem some.
function limparErrosAoEditar(formulario) {
    formulario.addEventListener('input', (evento) => {
        if (evento.target.classList.contains('invalido')) limparErro(evento.target);
    });
}

function focarPrimeiroErro(formulario) {
    const primeiro = formulario.querySelector('.invalido');
    if (!primeiro) return;
    // Um <fieldset> não recebe foco: foca o primeiro campo dentro dele.
    const alvo = primeiro.tagName === 'FIELDSET' ? primeiro.querySelector('input') : primeiro;
    alvo.focus();
}

/* ---------- Cabeçalho (menu e sair) ---------- */

function iniciarCabecalho() {
    const botaoMenu = document.querySelector('.menu-toggle');
    const menu = document.getElementById('menu-principal');

    if (botaoMenu && menu) {
        botaoMenu.addEventListener('click', () => {
            const aberto = menu.classList.toggle('menu--aberto');
            botaoMenu.setAttribute('aria-expanded', String(aberto));
            botaoMenu.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
        });
    }

    const linkSair = document.getElementById('link-sair');
    if (linkSair) {
        linkSair.addEventListener('click', () => {
            sessionStorage.removeItem(CHAVE_SESSAO);
        });
    }
}

iniciarCabecalho();
