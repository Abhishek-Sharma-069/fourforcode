import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';
import { AuthResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${API_BASE_URL}/api/users`;
  constructor(private readonly http: HttpClient) {}

  register(payload: { name: string; email: string; password: string }) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, payload, { withCredentials: true });
  }

  login(payload: { email: string; password: string }) {
    return this.http.post<AuthResponse>(
      `${this.baseUrl}/login`,
      payload,
      { withCredentials: true }
    );
  }
}
