import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';
import { PrescriptionDto, PrescriptionStatusLabel, toPrescriptionReviewStatus } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class PrescriptionService {
  private readonly baseUrl = `${API_BASE_URL}/api/prescriptions`;
  constructor(private readonly http: HttpClient) {}

  upload(userId: number, fileUrl: string) {
    return this.http.post<PrescriptionDto>(`${this.baseUrl}/upload`, { userId, fileUrl }, { withCredentials: true });
  }

  getByUser(userId: number) {
    return this.http.get<PrescriptionDto[]>(`${this.baseUrl}/${userId}`, { withCredentials: true });
  }

  review(id: number, status: Extract<PrescriptionStatusLabel, 'Approved' | 'Rejected'>) {
    return this.http.put<PrescriptionDto>(`${this.baseUrl}/${id}/review`, { status: toPrescriptionReviewStatus(status) }, { withCredentials: true });
  }
}
