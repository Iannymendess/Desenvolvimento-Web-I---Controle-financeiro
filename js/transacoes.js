/*
 * transacoes.js — adicionar, listar, filtrar e excluir transações (transacoes.html).
 */

const formTransacao = document.getElementById('form-transacao');
const campoDescricao = document.getElementById('descricao');
const campoValor = document.getElementById('valor');
const campoData = document.getElementById('data');
const grupoTipo = document.getElementById('tipo');
const campoCategoria = document.getElementById('categoria');
const avisoTransacao = document.getElementById('aviso-transacao');
const filtroTipo = document.getElementById('filtro-tipo');
const corpoTabela = document.getElementById('corpo-tabela');

let temporizadorAviso;

/* ---------- Renderização ---------- */

function criarCelula(texto, classe) {
    const celula = document.createElement('td');
    celula.textContent = texto; // textContent evita injeção de HTML
    if (classe) celula.className = classe;
    return celula;
}

function criarLinha(transacao) {
    const linha = document.createElement('tr');

    const etiqueta = document.createElement('span');
    etiqueta.className = `etiqueta etiqueta--${transacao.tipo}`;
    etiqueta.textContent = transacao.tipo === 'receita' ? 'Receita' : 'Despesa';
    const celulaTipo = document.createElement('td');
    celulaTipo.append(etiqueta);

    const sinal = transacao.tipo === 'receita' ? '+' : '−';
    const celulaValor = criarCelula(
        `${sinal} ${formatarMoeda(transacao.valor)}`,
        `tabela__numero valor--${transacao.tipo}`
    );

    const botaoExcluir = document.createElement('button');
    botaoExcluir.type = 'button';
    botaoExcluir.className = 'botao botao--perigo botao--pequeno';
    botaoExcluir.textContent = 'Excluir';
    botaoExcluir.dataset.id = transacao.id;
    botaoExcluir.setAttribute('aria-label', `Excluir ${transacao.descricao}`);
    const celulaAcoes = document.createElement('td');
    celulaAcoes.className = 'tabela__acoes';
    celulaAcoes.append(botaoExcluir);

    linha.append(
        criarCelula(formatarData(transacao.data)),
        criarCelula(transacao.descricao),
        criarCelula(transacao.categoria),
        celulaTipo,
        celulaValor,
        celulaAcoes
    );
    return linha;
}

function criarLinhaVazia() {
    const linha = document.createElement('tr');
    const celula = criarCelula('Nenhuma transação encontrada.', 'tabela__vazio');
    celula.colSpan = 6;
    linha.append(celula);
    return linha;
}

function atualizarSaldo(transacoes) {
    const { saldo } = calcularResumo(transacoes);
    const elementoSaldo = document.getElementById('valor-saldo');
    elementoSaldo.textContent = formatarMoeda(saldo);
    elementoSaldo.classList.toggle('negativo', saldo < 0);
}

// Redesenha a tabela e o saldo a partir do que está salvo.
function atualizarTela() {
    const transacoes = carregarTransacoes();
    const filtro = filtroTipo.value;
    const visiveis = ordenarPorData(transacoes).filter(
        (t) => filtro === 'todas' || t.tipo === filtro
    );

    corpoTabela.replaceChildren(
        ...(visiveis.length ? visiveis.map(criarLinha) : [criarLinhaVazia()])
    );
    atualizarSaldo(transacoes);
}

function mostrarAviso(mensagem) {
    avisoTransacao.textContent = mensagem;
    avisoTransacao.hidden = false;
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => { avisoTransacao.hidden = true; }, 3000);
}

/* ---------- Validação ---------- */

function tipoSelecionado() {
    const marcado = formTransacao.querySelector('input[name="tipo"]:checked');
    return marcado ? marcado.value : '';
}

function validarTransacao() {
    let valido = true;

    if (campoDescricao.value.trim() === '') {
        mostrarErro(campoDescricao, 'Informe uma descrição.');
        valido = false;
    }

    const valor = Number(campoValor.value);
    if (campoValor.value === '') {
        mostrarErro(campoValor, 'Informe o valor.');
        valido = false;
    } else if (!(valor > 0)) {
        mostrarErro(campoValor, 'O valor deve ser maior que zero.');
        valido = false;
    }

    if (campoData.value === '') {
        mostrarErro(campoData, 'Informe a data.');
        valido = false;
    } else if (campoData.value > hojeISO()) {
        // Datas "AAAA-MM-DD" podem ser comparadas como texto.
        mostrarErro(campoData, 'A data não pode estar no futuro.');
        valido = false;
    }

    if (tipoSelecionado() === '') {
        mostrarErro(grupoTipo, 'Escolha receita ou despesa.');
        valido = false;
    }

    if (campoCategoria.value === '') {
        mostrarErro(campoCategoria, 'Escolha uma categoria.');
        valido = false;
    }

    return valido;
}

/* ---------- Eventos ---------- */

formTransacao.addEventListener('submit', (evento) => {
    evento.preventDefault();

    if (!validarTransacao()) {
        focarPrimeiroErro(formTransacao);
        return;
    }

    const transacoes = carregarTransacoes();
    const nova = {
        id: proximoId(transacoes),
        descricao: campoDescricao.value.trim(),
        valor: Math.round(Number(campoValor.value) * 100) / 100,
        data: campoData.value,
        tipo: tipoSelecionado(),
        categoria: campoCategoria.value,
    };

    transacoes.push(nova);
    salvarTransacoes(transacoes);

    formTransacao.reset();
    campoData.value = hojeISO();
    campoDescricao.focus();

    atualizarTela();
    mostrarAviso(`"${nova.descricao}" adicionada.`);
});

// Os radios não disparam o limpador genérico, porque o erro fica no <fieldset>.
grupoTipo.addEventListener('change', () => limparErro(grupoTipo));
campoCategoria.addEventListener('change', () => limparErro(campoCategoria));
campoData.addEventListener('change', () => limparErro(campoData));
limparErrosAoEditar(formTransacao);

filtroTipo.addEventListener('change', atualizarTela);

// Delegação de eventos: um único ouvinte na tabela trata todos os botões "Excluir".
corpoTabela.addEventListener('click', (evento) => {
    const botao = evento.target.closest('button[data-id]');
    if (!botao) return;

    const id = Number(botao.dataset.id);
    const transacoes = carregarTransacoes();
    const alvo = transacoes.find((t) => t.id === id);
    if (!alvo || !confirm(`Excluir a transação "${alvo.descricao}"?`)) return;

    salvarTransacoes(transacoes.filter((t) => t.id !== id));
    atualizarTela();
});

/* ---------- Início ---------- */

campoData.max = hojeISO();
campoData.value = hojeISO();
atualizarTela();
