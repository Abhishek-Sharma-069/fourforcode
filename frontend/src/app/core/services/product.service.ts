import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly baseUrl = `${API_BASE_URL}/api/products`;
  constructor(private readonly http: HttpClient) {}

  getProducts() {
    return this.http.get<any[]>(this.baseUrl);
  }

  getProduct(id: number) {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }
}
