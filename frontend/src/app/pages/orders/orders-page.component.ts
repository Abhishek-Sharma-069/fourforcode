import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../core/services/order.service';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2 class="mb-4 text-2xl font-bold text-slate-800">My Orders</h2>
    <div *ngFor="let o of orders" class="mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="font-semibold text-slate-800">Order #{{ o.id }}</h3>
        <span class="rounded-full bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-700">{{ o.status }}</span>
      </div>
      <p class="mt-1 text-sm text-slate-600">Total amount: <span class="font-semibold text-emerald-600">₹ {{ o.totalAmount }}</span></p>
      <div class="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
        <p class="mb-1 font-medium text-slate-700">Tracking Timeline</p>
        <span *ngFor="let s of o.statusHistory; let i = index" class="font-medium text-slate-700">
          {{ s.status }}<span *ngIf="i < o.statusHistory.length - 1" class="text-slate-400"> → </span>
        </span>
      </div>
    </div>
    <p *ngIf="orders.length === 0" class="rounded-xl bg-white p-6 text-center text-slate-500">No orders found yet.</p>
  `
})
export class OrdersPageComponent implements OnInit {
  orders: any[] = [];
  private readonly userId = 1;
  constructor(private readonly orderService: OrderService) {}
  ngOnInit(): void {
    this.orderService.getByUser(this.userId).subscribe(x => (this.orders = x));
  }
}
