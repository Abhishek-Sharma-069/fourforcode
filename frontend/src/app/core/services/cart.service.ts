import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';
import { CartDto } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly baseUrl = `${API_BASE_URL}/api/cart`;
  constructor(private readonly http: HttpClient) {}

  add(userId: number, productId: number, quantity: number) {
    return this.http.post<CartDto>(`${this.baseUrl}/add`, { userId, productId, quantity }, { withCredentials: true });
  }

  get(userId: number) {
    return this.http.get<CartDto>(`${this.baseUrl}/${userId}`, { withCredentials: true });
  }

  update(userId: number, productId: number, quantity: number) {
    return this.http.put<CartDto>(`${this.baseUrl}/update`, { userId, productId, quantity }, { withCredentials: true });
  }

  remove(userId: number, productId: number) {
    return this.http.delete<CartDto>(`${this.baseUrl}/remove`, { body: { userId, productId }, withCredentials: true });
  }
}
