/*
 * cadastro.js — validação do formulário de cadastro (cadastro.html).
 */

const formCadastro = document.getElementById('form-cadastro');
const campoNome = document.getElementById('nome');
const campoEmail = document.getElementById('email');
const campoSenha = document.getElementById('senha');
const campoConfirmar = document.getElementById('confirmar-senha');

const TAMANHO_MINIMO_SENHA = 6;

limparErrosAoEditar(formCadastro);

formCadastro.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const nome = campoNome.value.trim();
    const email = campoEmail.value.trim().toLowerCase();
    const senha = campoSenha.value;
    const confirmacao = campoConfirmar.value;
    const usuarios = lerLista(CHAVE_USUARIOS);
    let valido = true;

    if (nome === '') {
        mostrarErro(campoNome, 'Informe seu nome.');
        valido = false;
    }

    if (email === '') {
        mostrarErro(campoEmail, 'Informe seu e-mail.');
        valido = false;
    } else if (!emailValido(email)) {
        mostrarErro(campoEmail, 'Digite um e-mail válido, como nome@exemplo.com.');
        valido = false;
    } else if (usuarios.some((u) => u.email === email)) {
        mostrarErro(campoEmail, 'Este e-mail já está cadastrado.');
        valido = false;
    }

    if (senha === '') {
        mostrarErro(campoSenha, 'Crie uma senha.');
        valido = false;
    } else if (senha.length < TAMANHO_MINIMO_SENHA) {
        mostrarErro(campoSenha, `A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`);
        valido = false;
    }

    if (confirmacao === '') {
        mostrarErro(campoConfirmar, 'Repita a senha.');
        valido = false;
    } else if (confirmacao !== senha) {
        mostrarErro(campoConfirmar, 'As senhas não coincidem.');
        valido = false;
    }

    if (!valido) {
        focarPrimeiroErro(formCadastro);
        return;
    }

    // A senha NÃO é guardada: localStorage não é lugar seguro para isso.
    // Na 2ª entrega o servidor vai receber a senha e armazenar só o hash.
    usuarios.push({ nome, email });
    salvarLista(CHAVE_USUARIOS, usuarios);

    window.location.href = 'index.html?cadastro=ok';
});
