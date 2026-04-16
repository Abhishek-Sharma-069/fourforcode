import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="grid gap-4 lg:grid-cols-3">
      <section class="rounded-2xl border border-slate-800 bg-slate-900 p-5 lg:col-span-2">
        <h2 class="text-2xl font-bold">Checkout Command Center</h2>
        <p class="mt-1 text-sm text-slate-400">Use prescription id for restricted medicines only.</p>
        <div class="mt-4">
          <label class="mb-1 block text-xs uppercase tracking-wide text-slate-400">Prescription ID (optional)</label>
          <input class="w-full rounded-lg border border-slate-700 bg-slate-800 p-2" placeholder="Enter prescription id" [(ngModel)]="prescriptionId" />
        </div>
        <button class="mt-4 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400" (click)="placeOrder()">
          Place Order
        </button>
        <p class="mt-3 text-sm text-slate-300">{{ message }}</p>
      </section>

      <aside class="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h3 class="text-lg font-semibold">Checkout Shield</h3>
        <ul class="mt-3 space-y-2 text-sm text-slate-300">
          <li>• 100% genuine medicines</li>
          <li>• cold-chain aware delivery</li>
          <li>• secure prescription handling</li>
        </ul>
      </aside>
    </div>
  `
})
export class CheckoutPageComponent {
  prescriptionId = '';
  message = '';
  private readonly userId = Number(localStorage.getItem('userId')) || 1;
  constructor(private readonly orderService: OrderService) {}
  placeOrder() {
    const parsed = this.prescriptionId ? Number(this.prescriptionId) : undefined;
    this.orderService.placeOrder(this.userId, parsed).subscribe({
      next: () => (this.message = 'Order placed successfully'),
      error: err => (this.message = err?.error?.message ?? 'Order failed')
    });
  }
}
