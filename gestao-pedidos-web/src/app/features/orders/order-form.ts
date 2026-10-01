import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Customer, Product } from '../../core/models';
import { CustomersService } from '../../core/services/customers.service';
import { NotificationService } from '../../core/services/notification.service';
import { OrdersService } from '../../core/services/orders.service';
import { ProductsService } from '../../core/services/products.service';
import { BrlPipe } from '../../core/utils/brl.pipe';

interface Line {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-order-form',
  imports: [RouterLink, BrlPipe],
  template: `
    <header class="page-header">
      <h1>Novo pedido</h1>
    </header>

    <div class="form form-wide">
      <label class="field">
        <span>Cliente</span>
        <select (change)="onCustomer($event)">
          <option value="">Selecione um cliente…</option>
          @for (c of customers(); track c.id) {
            <option [value]="c.id" [selected]="c.id === customerId()">{{ c.name }} — {{ c.phone }}</option>
          }
        </select>
        @if (customersLoaded() && !customers().length) {
          <small class="error">Nenhum cliente cadastrado. <a routerLink="/customers/new">Cadastre um cliente</a> primeiro.</small>
        }
      </label>

      <div class="add-line">
        <label class="field grow">
          <span>Produto</span>
          <select #productSelect>
            <option value="">Selecione um produto…</option>
            @for (p of products(); track p.id) {
              <option [value]="p.id">{{ p.name }} — {{ p.price | brl }}</option>
            }
          </select>
        </label>
        <label class="field qty">
          <span>Quantidade</span>
          <input #qty type="number" min="1" step="1" value="1" />
        </label>
        <button type="button" class="btn" (click)="add(productSelect, qty)">Adicionar produto</button>
      </div>
      <small class="hint">Somente produtos ativos aparecem na lista.</small>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th class="num">Preço unit.</th>
              <th class="qty-col">Qtd.</th>
              <th class="num">Total do item</th>
              <th class="actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            @for (l of lines(); track l.product.id) {
              <tr>
                <td>{{ l.product.name }}</td>
                <td class="num">{{ l.product.price | brl }}</td>
                <td class="qty-col">
                  <input class="qty-input" type="number" min="1" step="1" [value]="l.quantity"
                         (change)="setQuantity(l.product.id, $event)" [attr.aria-label]="'Quantidade de ' + l.product.name" />
                </td>
                <td class="num">{{ l.product.price * l.quantity | brl }}</td>
                <td class="actions">
                  <button type="button" class="btn btn-sm btn-danger" (click)="remove(l.product.id)">Remover</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="empty">Nenhum produto adicionado. Escolha um produto acima.</td></tr>
            }
          </tbody>
          @if (lines().length) {
            <tfoot>
              <tr>
                <td colspan="3" class="num">Total estimado</td>
                <td class="num total">{{ total() | brl }}</td>
                <td></td>
              </tr>
            </tfoot>
          }
        </table>
      </div>
      <small class="hint">O valor final é calculado pelo servidor com o preço dos produtos no momento da criação do pedido.</small>

      <div class="form-actions">
        <a routerLink="/orders" class="btn">Cancelar</a>
        <button type="button" class="btn btn-primary" [disabled]="!canSubmit() || saving()" (click)="submit()">
          {{ saving() ? 'Salvando…' : 'Finalizar pedido' }}
        </button>
      </div>
    </div>
  `,
})
export class OrderForm {
  private customersApi = inject(CustomersService);
  private productsApi = inject(ProductsService);
  private ordersApi = inject(OrdersService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  customers = signal<Customer[]>([]);
  customersLoaded = signal(false);
  products = signal<Product[]>([]);
  customerId = signal<number | null>(null);
  lines = signal<Line[]>([]);
  saving = signal(false);

  total = computed(() => this.lines().reduce((sum, l) => sum + l.product.price * l.quantity, 0));
  canSubmit = computed(() => this.customerId() !== null && this.lines().length > 0);

  constructor() {
    this.customersApi.list({ limit: 100 }).subscribe((res) => {
      this.customers.set(res.data);
      this.customersLoaded.set(true);
    });
    this.productsApi.list({ limit: 100, active: true }).subscribe((res) => this.products.set(res.data));
  }

  onCustomer(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.customerId.set(value ? Number(value) : null);
  }

  add(select: HTMLSelectElement, qtyInput: HTMLInputElement) {
    const productId = Number(select.value);
    const quantity = Math.floor(Number(qtyInput.value));
    const product = this.products().find((p) => p.id === productId);

    if (!product) {
      this.notify.error('Selecione um produto para adicionar.');
      return;
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      this.notify.error('A quantidade mínima é 1.');
      return;
    }

    this.lines.update((list) => {
      const found = list.find((l) => l.product.id === productId);
      return found
        ? list.map((l) => (l === found ? { ...l, quantity: l.quantity + quantity } : l))
        : [...list, { product, quantity }];
    });
    select.value = '';
    qtyInput.value = '1';
  }

  setQuantity(productId: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const quantity = Math.max(1, Math.floor(Number(input.value)) || 1);
    input.value = String(quantity);
    this.lines.update((list) => list.map((l) => (l.product.id === productId ? { ...l, quantity } : l)));
  }

  remove(productId: number) {
    this.lines.update((list) => list.filter((l) => l.product.id !== productId));
  }

  submit() {
    const customerId = this.customerId();
    if (customerId === null || !this.lines().length) return;

    this.saving.set(true);
    this.ordersApi
      .create({
        customerId,
        items: this.lines().map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      })
      .subscribe({
        next: (order) => {
          this.notify.success(`Pedido #${order.id} criado`);
          this.router.navigate(['/orders', order.id]);
        },
        error: () => this.saving.set(false),
      });
  }
}
