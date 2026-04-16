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
      <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
        <h2 class="text-2xl font-bold text-slate-800">Checkout</h2>
        <p class="mt-1 text-sm text-slate-500">Upload approved prescription ID only if medicine requires it.</p>
        <div class="mt-4">
          <label class="mb-1 block text-sm font-medium text-slate-700">Prescription ID (optional)</label>
          <input class="w-full rounded-lg border p-2" placeholder="Enter prescription id" [(ngModel)]="prescriptionId" />
        </div>
        <button class="mt-4 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500" (click)="placeOrder()">
          Place Order
        </button>
        <p class="mt-3 text-sm text-slate-600">{{ message }}</p>
      </section>

      <aside class="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 class="text-lg font-semibold text-slate-800">Secure Checkout</h3>
        <ul class="mt-3 space-y-2 text-sm text-slate-600">
          <li>• 100% genuine medicines</li>
          <li>• Fast delivery support</li>
          <li>• Prescription-safe ordering</li>
        </ul>
      </aside>
    </div>
  `
})
export class CheckoutPageComponent {
  prescriptionId = '';
  message = '';
  private readonly userId = 1;
  constructor(private readonly orderService: OrderService) {}
  placeOrder() {
    const parsed = this.prescriptionId ? Number(this.prescriptionId) : undefined;
    this.orderService.placeOrder(this.userId, parsed).subscribe({
      next: () => (this.message = 'Order placed successfully'),
      error: err => (this.message = err?.error?.message ?? 'Order failed')
    });
  }
}
