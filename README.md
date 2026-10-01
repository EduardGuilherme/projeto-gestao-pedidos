# Gestão de Pedidos — API (AdonisJS 6 + Lucid + SQLite)

## Rodando

```bash
npm install
cp .env.example .env
node ace migration:run
node ace db:seed          # opcional: clientes, produtos e pedidos de exemplo
npm run dev               # http://localhost:3333
npm test                  # 28 testes (unitários + funcionais)
```

Para PostgreSQL/MySQL, basta trocar a conexão em `config/database.ts`

## Endpoints (prefixo `/api`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/customers?search=&page=&limit=` | Lista paginada |
| POST | `/customers` | Cadastra `{ name, phone }` |
| GET / PUT | `/customers/:id` | Consulta / edita |
| GET | `/products?search=&active=&page=&limit=` | Lista paginada |
| POST | `/products` | Cadastra `{ name, price, active? }` (price em **centavos**) |
| GET / PUT | `/products/:id` | Consulta / edita |
| PATCH | `/products/:id/active` | Ativa/desativa `{ active: boolean }` |
| GET | `/orders?status=&customerId=&search=&page=&limit=` | Lista paginada (busca por ID ou nome do cliente) |
| GET | `/orders/:id` | Pedido com cliente e itens (+ produto) |
| POST | `/orders` | Cria `{ customerId, items: [{ productId, quantity }] }` |
| PATCH | `/orders/:id/status` | Altera status `{ status }` |

Resposta paginada: `{ data: [...], meta: { total, perPage, currentPage, lastPage } }`.
Erros: `{ code, message, errors? }` — 422 (validação/regra de negócio), 404 (não encontrado).

Códigos de regra de negócio: `E_CUSTOMER_NOT_FOUND`, `E_PRODUCT_NOT_FOUND`, `E_INACTIVE_PRODUCT`, `E_INVALID_STATUS_TRANSITION`.

# Gestão de Pedidos — Frontend (Angular 21)

Interface para a API AdonisJS (`gestao-pedidos-api`). Standalone components, signals, reactive forms e lazy loading por rota.

## Rodando

```bash
# 1) suba a API primeiro (http://localhost:3333)
# 2) depois, neste projeto:
npm install
npm start          # http://localhost:4200
npm test           # testes unitários (Vitest)
npm run build
```

A URL da API fica em `src/app/core/config.ts` (`API_URL`).

## Telas

| Rota | Tela |
|---|---|
| `/orders` | Lista: Nº, cliente, data, valor, status. Busca, filtro por status, paginação e troca de status (só as transições válidas) |
| `/orders/new` | Novo pedido: selecionar cliente, adicionar/remover produtos, quantidade, totais, finalizar |
| `/orders/:id` | Detalhe do pedido e botões de mudança de status |
| `/products` | Lista com busca, filtro ativo/inativo, ativar/desativar |
| `/products/new`, `/products/:id/edit` | Cadastro e edição |
| `/customers`, `/customers/new`, `/customers/:id/edit` | Clientes (necessários para criar pedidos) |
