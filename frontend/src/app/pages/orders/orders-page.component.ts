import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { mapOrderToViewModel, OrderViewModel } from '../../core/models/api.models';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <p *ngIf="loading" class="mb-3 text-sm text-slate-400">Loading orders...</p>
    <p *ngIf="message" class="mb-3 rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm" [class.border-rose-800]="hasError" [class.text-rose-300]="hasError">
      {{ message }}
    </p>

    <div *ngIf="!loading && !isLoggedIn()" class="rounded-xl border border-amber-700 bg-amber-950/30 p-4 text-sm text-amber-200">
      Please login first to view your orders.
      <a routerLink="/auth" class="ml-2 font-semibold text-amber-100 underline">Go to login</a>
    </div>

    <ng-container *ngIf="isLoggedIn()">
    <h2 class="mb-4 text-2xl font-bold">Mission Control: Orders</h2>
    <div *ngFor="let o of orders" class="mb-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="font-semibold">Order #{{ o.id }}</h3>
        <span class="rounded-full border border-cyan-700 bg-cyan-950/60 px-3 py-1 text-xs font-medium text-cyan-300">{{ o.status }}</span>
      </div>
      <p class="mt-1 text-sm text-slate-300">Total amount: <span class="font-semibold text-emerald-400">₹ {{ o.totalAmount }}</span></p>
      <div class="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">
        <p class="mb-1 text-xs uppercase tracking-wide text-slate-400">Tracking Timeline</p>
        <span *ngFor="let s of o.statusHistory; let i = index" class="font-medium">
          {{ s.status }}<span *ngIf="i < o.statusHistory.length - 1" class="text-slate-500"> → </span>
        </span>
      </div>
    </div>
    <p *ngIf="orders.length === 0" class="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center text-slate-400">No orders found yet.</p>
    </ng-container>
  `
})
export class OrdersPageComponent implements OnInit {
  orders: OrderViewModel[] = [];
  loading = false;
  message = '';
  hasError = false;
  constructor(private readonly orderService: OrderService) {}
  ngOnInit(): void {
    const userId = this.getCurrentUserId();
    if (!userId) {
      this.message = 'Please login first to view your orders.';
      this.hasError = true;
      return;
    }

    this.loading = true;
    this.orderService.getByUser(userId).subscribe({
      next: (x) => {
        this.orders = x.map(mapOrderToViewModel);
        this.loading = false;
        this.message = '';
        this.hasError = false;
      },
      error: (err) => {
        this.orders = [];
        this.loading = false;
        this.message = err?.error?.message ?? 'Unable to load orders.';
        this.hasError = true;
      }
    });
  }

  isLoggedIn(): boolean {
    return this.getCurrentUserId() !== null;
  }

  private getCurrentUserId(): number | null {
    const rawUserId = localStorage.getItem('userId');
    if (!rawUserId) {
      return null;
    }

    const userId = Number(rawUserId);
    return Number.isFinite(userId) && userId > 0 ? userId : null;
  }
}
