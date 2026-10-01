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

Para PostgreSQL/MySQL, basta trocar a conexão em `config/database.ts` (o código não usa nada específico de SQLite).

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

## Regras de negócio → onde estão

| # | Regra | Implementação |
|---|---|---|
| 1 | Pedido exige cliente | `createOrderValidator` + checagem no `OrderService.create` |
| 2 | Ao menos um item | `.minLength(1)` no validator |
| 3 | Quantidade mínima 1 | `vine.number().withoutDecimals().min(1)` |
| 4 | Produto inativo bloqueado | `OrderService.create` → `E_INACTIVE_PRODUCT` |
| 5 | Total calculado no backend | `OrderService.create` (campo `total` enviado é ignorado) |
| 6 | Preço congelado no item | `order_items.unit_price` / `total` gravados na criação |
| 7 | Fluxo de status + cancelamento | `ORDER_TRANSITIONS` em `app/enums/order_status.ts` |
| 8 | Cancelado não volta | `canceled` não tem transições de saída |

## Decisões

- **Valores em centavos (inteiros)**: sem erro de ponto flutuante; o frontend formata para R$.
- **Transaction** na criação do pedido (pedido + itens são atômicos).
- **Máquina de estados** em um único lugar; o pedido expõe `allowedTransitions` para o frontend.
- **Produto repetido** no mesmo pedido tem as quantidades somadas (unique `order_id + product_id`).
- **Cancelamento**: permitido de Pendente, Em preparação e Pronto. Pedido **Finalizado não pode ser cancelado** (o enunciado não define; suposição documentada).
- **JSON em camelCase**, colunas em snake_case (`AppBaseModel`).
- **Busca** usa `LOWER(col) LIKE ?` (portável; `ILIKE` não existe no SQLite).
- **Testes** rodam em `tmp/db.test.sqlite3` com transaction global revertida a cada teste.

## Estrutura

```
app/
  enums/order_status.ts          estados e transições
  exceptions/                    BusinessRuleException + handler global
  models/                        Customer, Product, Order, OrderItem (+ AppBaseModel)
  services/order_service.ts      regras de negócio de pedidos
  services/{pagination,search}.ts
  validators/                    VineJS
  controllers/                   finos: validam e delegam
database/{migrations,seeders}
tests/{unit,functional}
```
