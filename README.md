# Controle Financeiro

Sistema web para registrar receitas e despesas e acompanhar o saldo.
Trabalho de Desenvolvimento Web I — **1ª entrega: desenvolvimento no lado cliente** (HTML, CSS e JavaScript puros).

## Como executar

Abra o `index.html` no navegador (ou use a extensão *Live Server* do VS Code).
Não precisa instalar nada. Os dados ficam salvos no `localStorage` do navegador.

## Telas

| Página | O que faz |
| --- | --- |
| `index.html` | Login simulado: com e-mail válido e senha preenchida, vai para o dashboard |
| `cadastro.html` | Cadastro com nome, e-mail, senha (mín. 6) e confirmação |
| `dashboard.html` | Cartões de saldo, receitas e despesas + 5 últimas transações |
| `transacoes.html` | Adicionar, listar, filtrar por tipo e excluir transações |

## Estrutura

```
├── index.html, cadastro.html, dashboard.html, transacoes.html
├── css/styles.css     estilos de todas as páginas (variáveis, componentes, media queries)
└── js/
    ├── script.js      código comum: localStorage, formatação, validação, menu
    ├── login.js       validação do login
    ├── cadastro.js    validação do cadastro
    ├── dashboard.js   cálculo e exibição do resumo
    └── transacoes.js  formulário, tabela, filtro e exclusão
```

## Estrutura de dados (vira a tabela do banco na 3ª entrega)

```json
{ "id": 1, "descricao": "Mercado", "valor": 150.00, "data": "2026-10-05", "tipo": "despesa", "categoria": "Alimentação" }
```

Categorias: Alimentação, Transporte, Moradia, Lazer, Saúde, Salário, Outros.

## Critérios da 1ª entrega

| Critério | Onde aparece |
| --- | --- |
| HTML e semântica | `header`, `nav`, `main`, `section`, `article`, `footer`, `fieldset`/`legend`, tabela com `thead`/`th scope` |
| CSS e organização visual | Variáveis de cor/espaço em `:root`, mesmo estilo de cartões, formulários e tabela |
| Responsividade | Media queries em 1024px, 900px e 600px: cartões empilham, menu vira hambúrguer, tabela rola na horizontal |
| JavaScript e DOM | Adicionar, excluir (delegação de eventos) e filtrar; saldo atualizado na hora |
| Formulários e validação | Login, cadastro e nova transação, com mensagem de erro abaixo de cada campo |
