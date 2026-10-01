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

## Decisões

- **Dinheiro em centavos** em todo o front. O usuário digita em reais (`25,00`); `core/utils/money.ts` converte sem erro de ponto flutuante, e o pipe `brl` formata.
- **O total da tela de novo pedido é só uma estimativa.** O valor oficial e o preço unitário congelado vêm do backend.
- **Só produtos ativos** aparecem ao montar um pedido (`active=true`), espelhando a regra do backend, que também valida.
- **Transições de status** vêm do campo `allowedTransitions` da API: o front não duplica a máquina de estados.
- **Interceptor global de erros** (`core/interceptors/error.interceptor.ts`) lê o formato `{ code, message, errors }` da API e mostra um toast. Os componentes só tratam o estado de loading.
- **Cancelar pede confirmação**, porque a ação é irreversível.

## Estrutura

```
src/app/
  core/
    config.ts  models.ts
    interceptors/error.interceptor.ts
    services/{customers,products,orders,notification}.service.ts
    utils/{money,brl.pipe,http-params}.ts
  features/{orders,products,customers}/
  shared/{pagination,status-badge,toasts}.ts
```
