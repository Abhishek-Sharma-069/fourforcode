import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="mb-6 rounded-2xl bg-white p-5 shadow-sm">
      <h2 class="text-2xl font-bold text-slate-800">Shop by Category</h2>
      <div class="mt-3 flex flex-wrap gap-2">
        <span class="rounded-full bg-cyan-50 px-3 py-1 text-sm text-cyan-700">Diabetes Care</span>
        <span class="rounded-full bg-cyan-50 px-3 py-1 text-sm text-cyan-700">Cardiac</span>
        <span class="rounded-full bg-cyan-50 px-3 py-1 text-sm text-cyan-700">Pain Relief</span>
        <span class="rounded-full bg-cyan-50 px-3 py-1 text-sm text-cyan-700">Vitamins</span>
      </div>
    </section>

    <h3 class="mb-3 text-xl font-semibold text-slate-800">Popular Medicines</h3>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div *ngFor="let p of products" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <div class="mb-3 rounded-xl bg-slate-100 p-5 text-center text-sm text-slate-500">Medicine Image</div>
        <h4 class="font-semibold text-slate-800">{{ p.name }}</h4>
        <p class="mt-1 text-sm text-slate-500">Dosage: {{ p.dosage || 'Standard' }}</p>
        <div class="mt-3 flex items-center justify-between">
          <p class="text-lg font-bold text-emerald-600">₹ {{ p.price }}</p>
          <span class="text-xs" [class.text-red-500]="p.quantity === 0" [class.text-slate-500]="p.quantity > 0">
            {{ p.quantity > 0 ? ('In stock: ' + p.quantity) : 'Out of stock' }}
          </span>
        </div>
        <button
          class="mt-4 w-full rounded-lg bg-cyan-600 px-3 py-2 font-medium text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          [disabled]="p.quantity === 0"
          (click)="addToCart(p.id)"
        >
          Add to Cart
        </button>
      </div>
    </div>
  `
})
export class ProductsPageComponent implements OnInit {
  products: any[] = [];
  private readonly userId = 1;
  constructor(private readonly productService: ProductService, private readonly cartService: CartService) {}
  ngOnInit(): void {
    this.productService.getProducts().subscribe(x => (this.products = x));
  }
  addToCart(productId: number): void {
    this.cartService.add(this.userId, productId, 1).subscribe();
  }
}
