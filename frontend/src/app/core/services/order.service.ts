import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';
import { OrderDto, OrderStatusLabel, toOrderStatusValue } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly baseUrl = `${API_BASE_URL}/api/orders`;
  constructor(private readonly http: HttpClient) {}

  placeOrder(userId: number, prescriptionId?: number, productId?: number) {
    return this.http.post<OrderDto>(this.baseUrl, { userId, prescriptionId, productId }, { withCredentials: true });
  }

  getByUser(userId: number) {
    return this.http.get<OrderDto[]>(`${this.baseUrl}/user/${userId}`, { withCredentials: true });
  }

  updateStatus(orderId: number, status: Exclude<OrderStatusLabel, 'Placed'>) {
    return this.http.put<OrderDto>(`${this.baseUrl}/${orderId}/status`, { status: toOrderStatusValue(status) }, { withCredentials: true });
  }
}
