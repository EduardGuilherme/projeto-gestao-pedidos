import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ORDER_STATUS_LABELS, Order, OrderStatus } from '../../core/models';
import { NotificationService } from '../../core/services/notification.service';
import { OrdersService } from '../../core/services/orders.service';
import { BrlPipe } from '../../core/utils/brl.pipe';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, DatePipe, BrlPipe, StatusBadge],
  template: `
    <header class="page-header">
      <h1>Pedido #{{ id }}</h1>
      <a routerLink="/orders" class="btn">Voltar para pedidos</a>
    </header>

    @if (order(); as o) {
      <dl class="summary">
        <div><dt>Cliente</dt><dd>{{ o.customer?.name }} <span class="muted">{{ o.customer?.phone }}</span></dd></div>
        <div><dt>Data</dt><dd>{{ o.createdAt | date: 'dd/MM/yyyy HH:mm' }}</dd></div>
        <div><dt>Status</dt><dd><app-status-badge [status]="o.status" /></dd></div>
        <div><dt>Valor total</dt><dd class="total">{{ o.total | brl }}</dd></div>
      </dl>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th class="num">Preço unit.</th>
              <th class="num">Qtd.</th>
              <th class="num">Total do item</th>
            </tr>
          </thead>
          <tbody>
            @for (i of o.items; track i.id) {
              <tr>
                <td>{{ i.product?.name }}</td>
                <td class="num">{{ i.unitPrice | brl }}</td>
                <td class="num">{{ i.quantity }}</td>
                <td class="num">{{ i.total | brl }}</td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr><td colspan="3" class="num">Total</td><td class="num total">{{ o.total | brl }}</td></tr>
          </tfoot>
        </table>
      </div>

      @if (o.allowedTransitions.length) {
        <section class="status-actions">
          <h2>Alterar status</h2>
          <div class="btn-row">
            @for (t of o.allowedTransitions; track t) {
              <button type="button" class="btn" [class.btn-danger]="t === 'canceled'" [class.btn-primary]="t !== 'canceled'"
                      [disabled]="saving()" (click)="change(o, t)">
                {{ t === 'canceled' ? 'Cancelar pedido' : 'Marcar como ' + labels[t].toLowerCase() }}
              </button>
            }
          </div>
        </section>
      } @else {
        <p class="muted">Este pedido está {{ labels[o.status].toLowerCase() }} e não pode mais mudar de status.</p>
      }
    } @else {
      <p class="empty">Carregando…</p>
    }
  `,
})
export class OrderDetail {
  private api = inject(OrdersService);
  private notify = inject(NotificationService);

  readonly labels = ORDER_STATUS_LABELS;
  id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  order = signal<Order | null>(null);
  saving = signal(false);

  constructor() {
    this.api.get(this.id).subscribe((o) => this.order.set(o));
  }

  change(order: Order, next: OrderStatus) {
    if (next === 'canceled' && !confirm(`Cancelar o pedido #${order.id}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    this.saving.set(true);
    this.api.updateStatus(order.id, next).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.saving.set(false);
        this.notify.success(`Status alterado para ${ORDER_STATUS_LABELS[next]}`);
      },
      error: () => {
        this.saving.set(false);
        this.api.get(this.id).subscribe((o) => this.order.set(o));
      },
    });
  }
}
