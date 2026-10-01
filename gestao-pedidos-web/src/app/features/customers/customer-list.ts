import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Customer, PageMeta } from '../../core/models';
import { CustomersService } from '../../core/services/customers.service';
import { Pagination } from '../../shared/pagination';

@Component({
  selector: 'app-customer-list',
  imports: [RouterLink, Pagination],
  template: `
    <header class="page-header">
      <h1>Clientes</h1>
      <a routerLink="/customers/new" class="btn btn-primary">Novo cliente</a>
    </header>

    <div class="toolbar">
      <input #q type="search" placeholder="Buscar por nome ou telefone" [value]="search()" (keyup.enter)="onSearch(q.value)" />
      <button type="button" class="btn" (click)="onSearch(q.value)">Buscar</button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>ID</th><th>Nome</th><th>Telefone</th><th class="actions">Ações</th></tr>
        </thead>
        <tbody>
          @for (c of customers(); track c.id) {
            <tr>
              <td>#{{ c.id }}</td>
              <td>{{ c.name }}</td>
              <td>{{ c.phone }}</td>
              <td class="actions"><a [routerLink]="['/customers', c.id, 'edit']" class="btn btn-sm">Editar</a></td>
            </tr>
          } @empty {
            <tr>
              <td colspan="4" class="empty">
                @if (loading()) { Carregando… } @else { Nenhum cliente encontrado. Cadastre o primeiro em “Novo cliente”. }
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
export class CustomerList {
  private api = inject(CustomersService);

  customers = signal<Customer[]>([]);
  meta = signal<PageMeta | null>(null);
  loading = signal(false);
  search = signal('');
  private page = 1;

  constructor() {
    this.load();
  }

  onSearch(value: string) {
    this.search.set(value.trim());
    this.goTo(1);
  }

  goTo(page: number) {
    this.page = page;
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.api.list({ page: this.page, search: this.search() }).subscribe({
      next: (res) => {
        this.customers.set(res.data);
        this.meta.set(res.meta);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
