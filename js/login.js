/*
 * login.js — validação do formulário de login (index.html).
 * Login simulado: com campos válidos, vai para o dashboard.
 * A autenticação de verdade entra na 2ª entrega (servidor).
 */

const formLogin = document.getElementById('form-login');
const campoEmail = document.getElementById('email');
const campoSenha = document.getElementById('senha');

// Se veio do cadastro (index.html?cadastro=ok), mostra a confirmação.
if (new URLSearchParams(window.location.search).get('cadastro') === 'ok') {
    const aviso = document.getElementById('aviso-cadastro');
    aviso.textContent = 'Conta criada com sucesso! Agora é só entrar.';
    aviso.hidden = false;
}

limparErrosAoEditar(formLogin);

formLogin.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const email = campoEmail.value.trim();
    const senha = campoSenha.value;
    let valido = true;

    if (email === '') {
        mostrarErro(campoEmail, 'Informe seu e-mail.');
        valido = false;
    } else if (!emailValido(email)) {
        mostrarErro(campoEmail, 'Digite um e-mail válido, como nome@exemplo.com.');
        valido = false;
    }

    if (senha === '') {
        mostrarErro(campoSenha, 'Informe sua senha.');
        valido = false;
    }

    if (!valido) {
        focarPrimeiroErro(formLogin);
        return;
    }

    // Usa o nome do cadastro, se existir; senão, a parte do e-mail antes do @.
    const cadastrado = lerLista(CHAVE_USUARIOS).find((u) => u.email === email.toLowerCase());
    const nome = cadastrado ? cadastrado.nome : email.split('@')[0];

    sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify({ nome, email }));
    window.location.href = 'dashboard.html';
});
