import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../config';
import { CreateOrderPayload, Order, OrderStatus, Page } from '../models';
import { buildParams } from '../utils/http-params';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private http = inject(HttpClient);
  private url = `${API_URL}/orders`;

  list(filters: { page?: number; limit?: number; status?: OrderStatus | ''; customerId?: number; search?: string } = {}) {
    return this.http.get<Page<Order>>(this.url, { params: buildParams(filters) });
  }
  get(id: number) {
    return this.http.get<Order>(`${this.url}/${id}`);
  }
  create(payload: CreateOrderPayload) {
    return this.http.post<Order>(this.url, payload);
  }
  updateStatus(id: number, status: OrderStatus) {
    return this.http.patch<Order>(`${this.url}/${id}/status`, { status });
  }
}
