import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../core/services/order.service';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2 class="mb-4 text-2xl font-semibold">Order History</h2>
    <div *ngFor="let o of orders" class="mb-2 rounded border bg-white p-3">
      <p>Order #{{ o.id }} | Status: {{ o.status }} | Total: {{ o.totalAmount }}</p>
      <div class="mt-2 text-sm text-slate-600">
        Timeline:
        <span *ngFor="let s of o.statusHistory; let i = index">
          {{ s.status }}<span *ngIf="i < o.statusHistory.length - 1"> → </span>
        </span>
      </div>
    </div>
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
