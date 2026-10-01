import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'orders' },
  {
    path: 'orders',
    children: [
      { path: '', loadComponent: () => import('./features/orders/order-list').then((m) => m.OrderList), title: 'Pedidos' },
      { path: 'new', loadComponent: () => import('./features/orders/order-form').then((m) => m.OrderForm), title: 'Novo pedido' },
      { path: ':id', loadComponent: () => import('./features/orders/order-detail').then((m) => m.OrderDetail), title: 'Pedido' },
    ],
  },
  {
    path: 'products',
    children: [
      { path: '', loadComponent: () => import('./features/products/product-list').then((m) => m.ProductList), title: 'Produtos' },
      { path: 'new', loadComponent: () => import('./features/products/product-form').then((m) => m.ProductForm), title: 'Novo produto' },
      { path: ':id/edit', loadComponent: () => import('./features/products/product-form').then((m) => m.ProductForm), title: 'Editar produto' },
    ],
  },
  {
    path: 'customers',
    children: [
      { path: '', loadComponent: () => import('./features/customers/customer-list').then((m) => m.CustomerList), title: 'Clientes' },
      { path: 'new', loadComponent: () => import('./features/customers/customer-form').then((m) => m.CustomerForm), title: 'Novo cliente' },
      { path: ':id/edit', loadComponent: () => import('./features/customers/customer-form').then((m) => m.CustomerForm), title: 'Editar cliente' },
    ],
  },
  { path: '**', redirectTo: 'orders' },
];
