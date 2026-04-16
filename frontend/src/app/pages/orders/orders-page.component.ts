import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../core/services/order.service';
import { mapOrderToViewModel, OrderViewModel } from '../../core/models/api.models';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule],
  template: `
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
  `
})
export class OrdersPageComponent implements OnInit {
  orders: OrderViewModel[] = [];
  private readonly userId = Number(localStorage.getItem('userId')) || 1;
  constructor(private readonly orderService: OrderService) {}
  ngOnInit(): void {
    this.orderService.getByUser(this.userId).subscribe((x) => (this.orders = x.map(mapOrderToViewModel)));
  }
}
