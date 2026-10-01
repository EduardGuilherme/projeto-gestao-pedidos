import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../config';
import { Page, Product } from '../models';
import { buildParams } from '../utils/http-params';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);
  private url = `${API_URL}/products`;

  list(filters: { page?: number; limit?: number; search?: string; active?: boolean } = {}) {
    return this.http.get<Page<Product>>(this.url, { params: buildParams(filters) });
  }
  get(id: number) {
    return this.http.get<Product>(`${this.url}/${id}`);
  }
  create(payload: { name: string; price: number; active?: boolean }) {
    return this.http.post<Product>(this.url, payload);
  }
  update(id: number, payload: Partial<{ name: string; price: number; active: boolean }>) {
    return this.http.put<Product>(`${this.url}/${id}`, payload);
  }
  setActive(id: number, active: boolean) {
    return this.http.patch<Product>(`${this.url}/${id}/active`, { active });
  }
}
