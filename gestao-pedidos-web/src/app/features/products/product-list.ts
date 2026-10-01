import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageMeta, Product } from '../../core/models';
import { NotificationService } from '../../core/services/notification.service';
import { ProductsService } from '../../core/services/products.service';
import { BrlPipe } from '../../core/utils/brl.pipe';
import { Pagination } from '../../shared/pagination';

type ActiveFilter = 'all' | 'true' | 'false';

@Component({
  selector: 'app-product-list',
  imports: [RouterLink, BrlPipe, Pagination],
  template: `
    <header class="page-header">
      <h1>Produtos</h1>
      <a routerLink="/products/new" class="btn btn-primary">Novo produto</a>
    </header>

    <div class="toolbar">
      <input #q type="search" placeholder="Buscar por nome" [value]="search()" (keyup.enter)="onSearch(q.value)" />
      <select (change)="onFilter($event)" aria-label="Filtrar por situação">
        <option value="all" [selected]="filter() === 'all'">Todos</option>
        <option value="true" [selected]="filter() === 'true'">Ativos</option>
        <option value="false" [selected]="filter() === 'false'">Inativos</option>
      </select>
      <button type="button" class="btn" (click)="onSearch(q.value)">Buscar</button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th class="num">Preço</th>
            <th>Situação</th>
            <th class="actions">Ações</th>
          </tr>
        </thead>
        <tbody>
          @for (p of products(); track p.id) {
            <tr [class.row-muted]="!p.active">
              <td>#{{ p.id }}</td>
              <td>{{ p.name }}</td>
              <td class="num">{{ p.price | brl }}</td>
              <td>
                <span class="badge" [class.status-finished]="p.active" [class.status-canceled]="!p.active">
                  {{ p.active ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="actions">
                <a [routerLink]="['/products', p.id, 'edit']" class="btn btn-sm">Editar</a>
                <button type="button" class="btn btn-sm" (click)="toggle(p)">
                  {{ p.active ? 'Desativar' : 'Ativar' }}
                </button>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="5" class="empty">
                @if (loading()) { Carregando… } @else { Nenhum produto encontrado. Cadastre o primeiro em “Novo produto”. }
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
export class ProductList {
  private api = inject(ProductsService);
  private notify = inject(NotificationService);

  products = signal<Product[]>([]);
  meta = signal<PageMeta | null>(null);
  loading = signal(false);
  search = signal('');
  filter = signal<ActiveFilter>('all');
  private page = 1;

  constructor() {
    this.load();
  }

  onSearch(value: string) {
    this.search.set(value.trim());
    this.goTo(1);
  }

  onFilter(event: Event) {
    this.filter.set((event.target as HTMLSelectElement).value as ActiveFilter);
    this.goTo(1);
  }

  goTo(page: number) {
    this.page = page;
    this.load();
  }

  toggle(product: Product) {
    this.api.setActive(product.id, !product.active).subscribe((updated) => {
      this.products.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
      this.notify.success(updated.active ? 'Produto ativado' : 'Produto desativado');
      if (this.filter() !== 'all') this.load(); // some da lista se não bate mais com o filtro
    });
  }

  private load() {
    this.loading.set(true);
    const filter = this.filter();
    this.api
      .list({
        page: this.page,
        search: this.search(),
        active: filter === 'all' ? undefined : filter === 'true',
      })
      .subscribe({
        next: (res) => {
          this.products.set(res.data);
          this.meta.set(res.meta);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
