import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Toasts } from './shared/toasts';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Toasts],
  template: `
    <header class="topbar">
      <a routerLink="/orders" class="brand">Gestão de Pedidos</a>
      <nav aria-label="Principal">
        <a routerLink="/orders" routerLinkActive="active">Pedidos</a>
        <a routerLink="/products" routerLinkActive="active">Produtos</a>
        <a routerLink="/customers" routerLinkActive="active">Clientes</a>
      </nav>
    </header>
    <main class="container">
      <router-outlet />
    </main>
    <app-toasts />
  `,
})
export class App {}
