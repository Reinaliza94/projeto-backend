# Drip Store

Aplicação de e-commerce em React para uma loja virtual de produtos esportivos e streetwear. O projeto inclui página inicial, catálogo de produtos, detalhes do item, categorias, carrinho e histórico de pedidos.

## Tecnologias

- React 19
- Vite
- React Router DOM
- PrimeReact / PrimeIcons
- Styled Components

## Requisitos

Antes de rodar o projeto, certifique-se de ter instalado:

- Node.js 18 ou superior
- npm 9 ou superior

## Clonando o projeto

```bash
git clone <url-do-repositorio>
cd drip-store
```

## Instalação das dependências

No diretório do projeto, execute:

```bash
npm install
```

## Executando em modo de desenvolvimento

```bash
npm run dev
```

Após isso, o Vite iniciará a aplicação e geralmente abrirá o projeto em:

```text
http://localhost:5173
```

Se a porta 5173 estiver ocupada, o Vite pode utilizar outra porta disponível e exibir a URL correta no terminal.

## Build para produção

Para gerar a versão otimizada do projeto:

```bash
npm run build
```

Os arquivos prontos para deploy serão gerados na pasta `dist/`.

## Preview da build

Para visualizar a versão final localmente:

```bash
npm run preview
```

A aplicação será servida em uma porta como:

```text
http://localhost:4173
```

## Verificação de lint

```bash
npm run lint
```

## Estrutura principal do projeto

```text
drip-store/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── context/
│   ├── data/
│   ├── pages/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Observações

- O projeto foi construído com Vite, então todos os comandos acima devem ser executados no terminal, na raiz do projeto.
- Para mudanças futuras no código, o ambiente de desenvolvimento é o mais indicado para testar e ajustar a interface.

## Dicas

- Utilize `npm run dev` durante o desenvolvimento para aproveitar o hot reload.
- Use `npm run build` antes de enviar o projeto para produção ou para validar que a aplicação compila corretamente.
- O projeto está hospedado em https://dristore1.netlify.app
