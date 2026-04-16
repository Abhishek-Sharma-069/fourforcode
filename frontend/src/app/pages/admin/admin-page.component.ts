import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';
import { PrescriptionService } from '../../core/services/prescription.service';
import {
  mapOrderToViewModel,
  mapPrescriptionToViewModel,
  OrderStatusLabel,
  OrderViewModel,
  PrescriptionViewModel
} from '../../core/models/api.models';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="isAdmin(); else noAccess" class="space-y-4">
      <section class="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 class="text-2xl font-bold">Admin Management</h2>
        <p class="mt-1 text-sm text-slate-400">Review prescriptions and manage delivery statuses.</p>
      </section>

      <section class="grid gap-4 lg:grid-cols-2">
        <article class="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <h3 class="text-lg font-semibold">Prescription Review</h3>
          <div class="mt-3 flex gap-2">
            <input class="w-32 rounded border border-slate-700 bg-slate-800 p-2 text-sm" placeholder="User ID" [(ngModel)]="prescriptionUserId" />
            <button class="rounded bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400" (click)="loadPrescriptions()">Load</button>
          </div>

          <div class="mt-3 space-y-2">
            <div *ngFor="let p of prescriptions" class="rounded border border-slate-700 bg-slate-950 p-3 text-sm">
              <p><span class="text-slate-400">ID:</span> {{ p.id }} | <span class="text-slate-400">Status:</span> {{ p.status }}</p>
              <p class="truncate"><span class="text-slate-400">File:</span> {{ p.fileUrl }}</p>
              <div class="mt-2 flex gap-2">
                <button class="rounded bg-emerald-500 px-2 py-1 text-xs font-semibold text-slate-950" (click)="reviewPrescription(p.id, 'Approved')">Approve</button>
                <button class="rounded bg-rose-500 px-2 py-1 text-xs font-semibold text-white" (click)="reviewPrescription(p.id, 'Rejected')">Reject</button>
              </div>
            </div>
            <p *ngIf="prescriptions.length === 0" class="text-sm text-slate-500">No prescriptions loaded.</p>
          </div>
        </article>

        <article class="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <h3 class="text-lg font-semibold">Order Status Management</h3>
          <div class="mt-3 flex gap-2">
            <input class="w-32 rounded border border-slate-700 bg-slate-800 p-2 text-sm" placeholder="User ID" [(ngModel)]="orderUserId" />
            <button class="rounded bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400" (click)="loadOrders()">Load</button>
          </div>

          <div class="mt-3 space-y-2">
            <div *ngFor="let o of orders" class="rounded border border-slate-700 bg-slate-950 p-3 text-sm">
              <p><span class="text-slate-400">Order:</span> {{ o.id }} | <span class="text-slate-400">Current:</span> {{ o.status }}</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <button *ngFor="let s of statuses" class="rounded border border-slate-600 px-2 py-1 text-xs hover:border-cyan-400" (click)="updateOrderStatus(o.id, s)">
                  {{ s }}
                </button>
              </div>
            </div>
            <p *ngIf="orders.length === 0" class="text-sm text-slate-500">No orders loaded.</p>
          </div>
        </article>
      </section>

      <p class="text-sm text-cyan-300">{{ message }}</p>
    </div>

    <ng-template #noAccess>
      <section class="rounded-2xl border border-rose-700 bg-rose-950/30 p-6">
        <h3 class="text-xl font-semibold text-rose-300">Access denied</h3>
        <p class="mt-2 text-rose-200">Admin privileges are required to open management tools.</p>
      </section>
    </ng-template>
  `
})
export class AdminPageComponent {
  prescriptionUserId = '';
  orderUserId = '';
  prescriptions: PrescriptionViewModel[] = [];
  orders: OrderViewModel[] = [];
  message = '';
  statuses: Exclude<OrderStatusLabel, 'Placed'>[] = ['Confirmed', 'Packed', 'Shipped', 'OutForDelivery', 'Delivered'];

  constructor(
    private readonly prescriptionService: PrescriptionService,
    private readonly orderService: OrderService
  ) {}

  isAdmin(): boolean {
    return localStorage.getItem('userRole') === 'Admin';
  }

  loadPrescriptions(): void {
    const userId = Number(this.prescriptionUserId);
    if (!userId) return;
    this.prescriptionService.getByUser(userId).subscribe({
      next: (data) => {
        this.prescriptions = data.map(mapPrescriptionToViewModel);
        this.message = 'Prescriptions loaded.';
      },
      error: (err) => (this.message = err?.error?.message ?? 'Failed to load prescriptions.')
    });
  }

  reviewPrescription(id: number, status: 'Approved' | 'Rejected'): void {
    this.prescriptionService.review(id, status).subscribe({
      next: () => {
        this.message = `Prescription ${id} marked as ${status}.`;
        this.loadPrescriptions();
      },
      error: (err) => (this.message = err?.error?.message ?? 'Failed to review prescription.')
    });
  }

  loadOrders(): void {
    const userId = Number(this.orderUserId);
    if (!userId) return;
    this.orderService.getByUser(userId).subscribe({
      next: (data) => {
        this.orders = data.map(mapOrderToViewModel);
        this.message = 'Orders loaded.';
      },
      error: (err) => (this.message = err?.error?.message ?? 'Failed to load orders.')
    });
  }

  updateOrderStatus(orderId: number, status: Exclude<OrderStatusLabel, 'Placed'>): void {
    this.orderService.updateStatus(orderId, status).subscribe({
      next: () => {
        this.message = `Order ${orderId} moved to ${status}.`;
        this.loadOrders();
      },
      error: (err) => (this.message = err?.error?.message ?? 'Failed to update order status.')
    });
  }
}
