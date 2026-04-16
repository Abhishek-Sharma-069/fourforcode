import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2 class="mb-4 text-2xl font-semibold">Cart</h2>
    <div *ngFor="let item of items" class="mb-2 flex items-center gap-2 rounded border bg-white p-3">
      <span>Product #{{ item.productId }}</span>
      <input type="number" class="w-20 rounded border p-1" [(ngModel)]="item.quantity" />
      <button class="rounded bg-blue-600 px-2 py-1 text-white" (click)="update(item.productId, item.quantity)">Update</button>
      <button class="rounded bg-red-600 px-2 py-1 text-white" (click)="remove(item.productId)">Remove</button>
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
