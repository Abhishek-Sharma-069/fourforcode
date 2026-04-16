import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly baseUrl = `${API_BASE_URL}/api/orders`;
  constructor(private readonly http: HttpClient) {}

  placeOrder(userId: number, prescriptionId?: number) {
    return this.http.post(this.baseUrl, { userId, prescriptionId });
  }

  getByUser(userId: number) {
    return this.http.get<any[]>(`${this.baseUrl}/user/${userId}`);
  }

  updateStatus(orderId: number, status: string) {
    return this.http.put(`${this.baseUrl}/${orderId}/status`, { status });
  }
}
