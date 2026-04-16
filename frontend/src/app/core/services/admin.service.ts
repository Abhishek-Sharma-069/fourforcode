import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';

// ─── Admin-specific DTOs ──────────────────────────────────────

export interface CategoryDto {
  id: number;
  name: string;
  productCount: number;
}

export interface AdminUserDto {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  orderCount: number;
}

export interface AdminOrderItemDto {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

export interface AdminOrderStatusHistoryDto {
  status: string;
  changedAt: string;
}

export interface AdminOrderDto {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  prescriptionId?: number;
  prescriptionFileUrl?: string | null;
  prescriptionStatus?: string | null;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: AdminOrderItemDto[];
  statusHistory: AdminOrderStatusHistoryDto[];
}

export interface CreateProductPayload {
  name: string;
  categoryId: number;
  price: number;
  dosage: string;
  packaging: string;
  requiresPrescription: boolean;
  initialStock: number;
}

export interface UpdateProductPayload {
  name?: string;
  categoryId?: number;
  price?: number;
  dosage?: string;
  packaging?: string;
  requiresPrescription?: boolean;
}

// ─── Admin Service ────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly baseUrl = `${API_BASE_URL}/api/admin`;
  constructor(private readonly http: HttpClient) {}

  // Categories
  getCategories() {
    return this.http.get<CategoryDto[]>(`${this.baseUrl}/categories`, { withCredentials: true });
  }

  createCategory(name: string) {
    return this.http.post<CategoryDto>(`${this.baseUrl}/categories`, { name }, { withCredentials: true });
  }

  // Products
  createProduct(payload: CreateProductPayload) {
    return this.http.post<any>(`${this.baseUrl}/products`, payload, { withCredentials: true });
  }

  updateProduct(id: number, payload: UpdateProductPayload) {
    return this.http.put<any>(`${this.baseUrl}/products/${id}`, payload, { withCredentials: true });
  }

  deleteProduct(id: number) {
    return this.http.delete<any>(`${this.baseUrl}/products/${id}`, { withCredentials: true });
  }

  // Inventory
  updateInventory(productId: number, quantity: number) {
    return this.http.put<any>(`${this.baseUrl}/inventory/${productId}`, { quantity }, { withCredentials: true });
  }

  // Users
  getUsers() {
    return this.http.get<AdminUserDto[]>(`${this.baseUrl}/users`, { withCredentials: true });
  }

  updateUserRole(userId: number, role: number) {
    return this.http.put<any>(`${this.baseUrl}/users/${userId}/role`, { role }, { withCredentials: true });
  }

  deleteUser(userId: number) {
    return this.http.delete<any>(`${this.baseUrl}/users/${userId}`, { withCredentials: true });
  }

  // Orders (all)
  getAllOrders() {
    return this.http.get<AdminOrderDto[]>(`${this.baseUrl}/orders`, { withCredentials: true });
  }
}
