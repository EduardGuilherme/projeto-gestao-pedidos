import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../config';
import { Customer, Page } from '../models';
import { buildParams } from '../utils/http-params';

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private http = inject(HttpClient);
  private url = `${API_URL}/customers`;

  list(filters: { page?: number; limit?: number; search?: string } = {}) {
    return this.http.get<Page<Customer>>(this.url, { params: buildParams(filters) });
  }
  get(id: number) {
    return this.http.get<Customer>(`${this.url}/${id}`);
  }
  create(payload: { name: string; phone: string }) {
    return this.http.post<Customer>(this.url, payload);
  }
  update(id: number, payload: Partial<{ name: string; phone: string }>) {
    return this.http.put<Customer>(`${this.url}/${id}`, payload);
  }
}
