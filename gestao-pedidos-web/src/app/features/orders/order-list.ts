import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ORDER_STATUSES, ORDER_STATUS_LABELS, Order, OrderStatus, PageMeta } from '../../core/models';
import { NotificationService } from '../../core/services/notification.service';
import { OrdersService } from '../../core/services/orders.service';
import { BrlPipe } from '../../core/utils/brl.pipe';
import { Pagination } from '../../shared/pagination';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-order-list',
  imports: [RouterLink, DatePipe, BrlPipe, Pagination, StatusBadge],
  template: `
    <header class="page-header">
      <h1>Pedidos</h1>
      <a routerLink="/orders/new" class="btn btn-primary">Novo pedido</a>
    </header>

    <div class="toolbar">
      <input #q type="search" placeholder="Buscar por nº do pedido ou cliente" [value]="search()" (keyup.enter)="onSearch(q.value)" />
      <select (change)="onFilter($event)" aria-label="Filtrar por status">
        <option value="" [selected]="!status()">Todos os status</option>
        @for (s of statuses; track s) {
          <option [value]="s" [selected]="status() === s">{{ labels[s] }}</option>
        }
      </select>
      <button type="button" class="btn" (click)="onSearch(q.value)">Buscar</button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nº</th>
            <th>Cliente</th>
            <th>Data</th>
            <th class="num">Valor</th>
            <th>Status</th>
            <th class="actions">Ações</th>
          </tr>
        </thead>
        <tbody>
          @for (o of orders(); track o.id) {
            <tr>
              <td><a [routerLink]="['/orders', o.id]">#{{ o.id }}</a></td>
              <td>{{ o.customer?.name }}</td>
              <td>{{ o.createdAt | date: 'dd/MM/yyyy HH:mm' }}</td>
              <td class="num">{{ o.total | brl }}</td>
              <td><app-status-badge [status]="o.status" /></td>
              <td class="actions">
                <a [routerLink]="['/orders', o.id]" class="btn btn-sm">Detalhes</a>
                @if (o.allowedTransitions.length) {
                  <select class="select-sm" (change)="changeStatus(o, $event)" aria-label="Alterar status do pedido {{ o.id }}">
                    <option value="">Alterar status…</option>
                    @for (t of o.allowedTransitions; track t) {
                      <option [value]="t">{{ labels[t] }}</option>
                    }
                  </select>
                }
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="6" class="empty">
                @if (loading()) { Carregando… } @else { Nenhum pedido encontrado. Crie o primeiro em “Novo pedido”. }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    @if (meta(); as m) {
      <app-pagination [meta]="m" (pageChange)="goTo($event)" />
    }
  `,
})
export class OrderList {
  private api = inject(OrdersService);
  private notify = inject(NotificationService);

  readonly statuses = ORDER_STATUSES;
  readonly labels = ORDER_STATUS_LABELS;

  orders = signal<Order[]>([]);
  meta = signal<PageMeta | null>(null);
  loading = signal(false);
  search = signal('');
  status = signal<OrderStatus | ''>('');
  private page = 1;

  constructor() {
    this.load();
  }

  onSearch(value: string) {
    this.search.set(value.trim());
    this.goTo(1);
  }

  onFilter(event: Event) {
    this.status.set((event.target as HTMLSelectElement).value as OrderStatus | '');
    this.goTo(1);
  }

  goTo(page: number) {
    this.page = page;
    this.load();
  }

  changeStatus(order: Order, event: Event) {
    const select = event.target as HTMLSelectElement;
    const next = select.value as OrderStatus;
    select.value = '';
    if (!next) return;

    if (next === 'canceled' && !confirm(`Cancelar o pedido #${order.id}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    this.api.updateStatus(order.id, next).subscribe({
      next: () => {
        this.notify.success(`Pedido #${order.id}: ${ORDER_STATUS_LABELS[next]}`);
        this.load();
      },
      error: () => this.load(), // recarrega para refletir o estado real
    });
  }

  private load() {
    this.loading.set(true);
    this.api.list({ page: this.page, search: this.search(), status: this.status() }).subscribe({
      next: (res) => {
        this.orders.set(res.data);
        this.meta.set(res.meta);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
