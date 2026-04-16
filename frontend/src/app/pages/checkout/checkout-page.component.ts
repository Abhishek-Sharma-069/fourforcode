import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2 class="mb-4 text-2xl font-semibold">Checkout</h2>
    <input class="rounded border p-2" placeholder="Prescription ID (optional)" [(ngModel)]="prescriptionId" />
    <button class="ml-2 rounded bg-green-700 px-3 py-2 text-white" (click)="placeOrder()">Place order</button>
    <p class="mt-2">{{ message }}</p>
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
