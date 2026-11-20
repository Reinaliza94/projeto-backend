# Drip Store

Aplicação de e-commerce em React para uma loja virtual de produtos esportivos. O projeto inclui página inicial, catálogo de produtos, detalhes do item, categorias, carrinho e histórico de pedidos. O carrinho fica no navegador; pedidos realizados são salvos no banco de dados e associados ao usuário autenticado. (Incluído mesmo que não tenha sido solicitado no escopo do projeto.)

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

Para desenvolver a interface com atualização automática, execute na pasta `frontend`:

```bash
cd frontend
npm install
npm run dev
```

Após isso, o Vite iniciará a aplicação e geralmente abrirá o projeto em:

```text
http://localhost:5173
```

Se a porta 5173 estiver ocupada, o Vite pode utilizar outra porta disponível e exibir a URL correta no terminal.

## Executando o backend

Para acessar a aplicação e a API pela porta 3000, instale e inicie o backend. O comando compila o frontend automaticamente e o servidor entrega a aplicação nas rotas do React:

```bash
cd backend
npm install
npm run dev
```

Antes do primeiro início, configure `backend/.env` com `JWT_SECRET` (use um valor aleatório longo; não compartilhe nem versione esse arquivo) e carregue o catálogo de demonstração uma vez:

```powershell
Copy-Item .env.example .env
npm run seed
npm run dev
```

O seeder cria produtos e categorias somente quando ainda não há produtos. O frontend servido pelo backend consulta `/v1/product/search` e `/v1/category/search`; cadastro e login usam `/v1/user` e `/v1/user/token`. Para rodar o Vite separado, mantenha o backend ativo na porta 3000: as chamadas `/api`, `/v1` e `/media` são encaminhadas automaticamente pelo proxy de desenvolvimento.

O servidor será iniciado em `http://localhost:3000`. A API disponibiliza `GET /api/health`, `POST /v1/user/token` (recebe e-mail e senha, retorna `{ "token": "<JWT>" }` com `200`, ou `400` para dados/credenciais inválidos), as operações de usuário `GET /v1/user/:id` (retorna `200` com `id`, `firstname`, `surname` e `email`, ou `404` se não existir), `POST /v1/user` (cadastro público; retorna `201` ou `400` para dados inválidos), `PUT /v1/user/:id` (requer `Authorization: Bearer <JWT>` assinado com `JWT_SECRET`; retorna `204`, `400` para dados/token inválidos ou `404`) e `DELETE /v1/user/:id` (requer o mesmo token; retorna `204`, `400` para token inválido/ausente ou `404`). Para categorias, `GET /v1/category/search` permite paginação (`limit=12`, `page=1` por padrão; `limit=-1` busca todas), seleção de campos (`fields=name,slug`) e filtro `use_in_menu=true|false`; retorna `200` ou `400` para parâmetros inválidos. `GET /v1/category/:id` retorna os dados públicos da categoria (`200`) ou `404` se ela não existir. `POST /v1/category` requer JWT e retorna `201`, `400` para dados inválidos ou `400` para token ausente/inválido. `PUT /v1/category/:id` e `DELETE /v1/category/:id` também exigem JWT e retornam `204`, `400` para token/dados inválidos ou `404`. Para produtos, `GET /v1/product/search` suporta paginação, seleção de campos, busca por nome/descrição, categorias, faixa de preço e opções; `GET /v1/product/:id` retorna os dados do produto com categorias, imagens e opções, ou `404` se ele não existir. `POST /v1/product` exige JWT, valida categorias, opções e imagens, grava arquivos em `backend/uploads` (ou no caminho de `MEDIA_PATH`) e retorna `201`; `PUT /v1/product/:id` exige JWT, atualiza os dados e associações; `DELETE /v1/product/:id` exige JWT e remove o produto, seus registros associados e imagens locais. Nas operações de escrita protegidas, token ausente/inválido retorna `400`; produtos inexistentes retornam `404`.

- `GET /api/products` e `GET /api/products/:id`: retornam `200` com o recurso.
- `POST /api/products`: exige JWT e cria um produto; sem token válido retorna `400`.
- `PUT /api/products/:id` e `DELETE /api/products/:id`: exigem JWT e retornam `204` sem corpo ou `400` sem token válido.
- Dados inválidos retornam `400`; produtos inexistentes retornam `404`.

As rotas protegidas exigem um JWT no cabeçalho `Authorization: Bearer <JWT>` e a variável de ambiente `JWT_SECRET` configurada no servidor. O cadastro `POST /v1/user` e a geração `POST /v1/user/token` permanecem públicos para permitir criar contas e obter o primeiro token. Para executar os testes do backend, use `npm test` dentro da pasta `backend`. Rotas como `/produtos` e `/categorias`, inclusive ao atualizar a página, são atendidas pelo frontend.

## Build para produção

Para gerar a versão otimizada do frontend, execute dentro de `frontend`:

```bash
cd frontend
npm run build
```

Os arquivos prontos para deploy serão gerados em `frontend/dist/`.

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
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── data/
│   │   ├── routes/
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── data/
│   │   └── pages/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

No backend, `server.js` inicia o servidor HTTP, `app.js` configura o Express, `routes/` declara os endpoints, `controllers/` trata as requisições e `data/` contém os dados iniciais de produtos.

O backend usa SQLite: o arquivo `backend/database.sqlite` é criado automaticamente ao iniciar o servidor. O modelo Sequelize `Product` cria e acessa a tabela `products`.

As tabelas `users`, `categories` e `products` são definidas pelo Sequelize com timestamps `created_at` e `updated_at`. `product_images` e `product_options` relacionam imagens e opções a produtos; `product_categories` associa produtos e categorias. As relações com produtos usam `product_id` e são removidas em cascata quando o produto é excluído. O modelo `User` armazena a senha como hash bcrypt; `Category` e `Product` definem `false` como valor padrão de `use_in_menu`.

## Observações

- O projeto foi construído com Vite, então todos os comandos acima devem ser executados no terminal, na raiz do projeto.
- Para mudanças futuras no código, o ambiente de desenvolvimento é o mais indicado para testar e ajustar a interface.
- durante os testes, ao cadastrar novo usuário a API retornou code 500 ao ser executado com o banco de dados aberto. 
## Dicas

- Utilize `npm run dev` durante o desenvolvimento para aproveitar o hot reload.
- Use `npm run build` antes de enviar o projeto para produção ou para validar que a aplicação compila corretamente.
- O projeto está hospedado em https://dristore1.netlify.app
