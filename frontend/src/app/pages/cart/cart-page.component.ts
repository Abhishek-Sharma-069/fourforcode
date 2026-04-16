import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2 class="mb-4 text-2xl font-bold text-slate-800">My Cart</h2>
    <div class="grid gap-4 lg:grid-cols-3">
      <section class="space-y-3 lg:col-span-2">
        <article *ngFor="let item of items" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-sm text-slate-500">Product ID</p>
              <h3 class="font-semibold text-slate-800">#{{ item.productId }}</h3>
            </div>
            <div class="flex items-center gap-2">
              <input type="number" class="w-20 rounded-lg border p-2" [(ngModel)]="item.quantity" />
              <button class="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-500" (click)="update(item.productId, item.quantity)">Update</button>
              <button class="rounded-lg bg-rose-500 px-3 py-2 text-sm font-medium text-white hover:bg-rose-400" (click)="remove(item.productId)">Remove</button>
            </div>
          </div>
        </article>
        <p *ngIf="items.length === 0" class="rounded-xl bg-white p-6 text-center text-slate-500">Your cart is empty.</p>
      </section>

      <aside class="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 class="text-lg font-semibold text-slate-800">Cart Summary</h3>
        <div class="mt-3 space-y-2 text-sm text-slate-600">
          <p>Items: <span class="font-semibold text-slate-800">{{ items.length }}</span></p>
          <p>Delivery: <span class="font-semibold text-emerald-600">Free</span></p>
          <p>Discount: <span class="font-semibold text-emerald-600">Applied</span></p>
        </div>
        <a href="/checkout" class="mt-4 inline-block w-full rounded-lg bg-emerald-600 px-3 py-2 text-center font-medium text-white hover:bg-emerald-500">Proceed to Checkout</a>
      </aside>
    </div>
  `
})
export class CartPageComponent implements OnInit {
  items: any[] = [];
  private readonly userId = 1;
  constructor(private readonly cartService: CartService) {}
  ngOnInit(): void { this.refresh(); }
  private refresh() { this.cartService.get(this.userId).subscribe((x: any) => (this.items = x.items ?? [])); }
  update(productId: number, quantity: number) { this.cartService.update(this.userId, productId, quantity).subscribe(() => this.refresh()); }
  remove(productId: number) { this.cartService.remove(this.userId, productId).subscribe(() => this.refresh()); }
}
