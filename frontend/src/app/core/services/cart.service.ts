import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly baseUrl = `${API_BASE_URL}/api/cart`;
  constructor(private readonly http: HttpClient) {}

  add(userId: number, productId: number, quantity: number) {
    return this.http.post(`${this.baseUrl}/add`, { userId, productId, quantity });
  }

  get(userId: number) {
    return this.http.get(`${this.baseUrl}/${userId}`);
  }

  update(userId: number, productId: number, quantity: number) {
    return this.http.put(`${this.baseUrl}/update`, { userId, productId, quantity });
  }

  remove(userId: number, productId: number) {
    return this.http.delete(`${this.baseUrl}/remove`, { body: { userId, productId } });
  }
}
