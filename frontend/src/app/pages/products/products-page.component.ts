import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { ProductDto } from '../../core/models/api.models';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <p class="text-xs uppercase tracking-[0.2em] text-cyan-300">Discover</p>
      <h2 class="mt-2 text-3xl font-bold">Find Care That Fits Your Routine</h2>
      <div class="mt-4 flex flex-wrap gap-2 text-xs">
        <span class="rounded-full border border-cyan-700 bg-cyan-950/50 px-3 py-1 text-cyan-300">Diabetes Care</span>
        <span class="rounded-full border border-cyan-700 bg-cyan-950/50 px-3 py-1 text-cyan-300">Heart Health</span>
        <span class="rounded-full border border-cyan-700 bg-cyan-950/50 px-3 py-1 text-cyan-300">Pain Relief</span>
        <span class="rounded-full border border-cyan-700 bg-cyan-950/50 px-3 py-1 text-cyan-300">Supplements</span>
      </div>
    </section>

    <h3 class="mb-1 text-xl font-semibold">All Medicines</h3>
    <p class="mb-3 text-sm text-slate-400">Showing every medicine returned by the backend API. Loaded: {{ products.length }}</p>
    <p *ngIf="loading" class="mb-3 text-sm text-slate-400">Loading medicines...</p>
    <p *ngIf="errorMessage" class="mb-3 rounded-lg border border-rose-800 bg-rose-950/40 p-3 text-sm text-rose-300">{{ errorMessage }}</p>
    <p *ngIf="!loading && !errorMessage && products.length === 0" class="mb-3 rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm text-slate-400">
      No medicines available right now. Add products from backend/admin DB and refresh.
    </p>
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div *ngFor="let p of products" class="rounded-2xl border border-slate-800 bg-slate-900 p-4 transition hover:border-cyan-500">
        <div class="mb-3 rounded-xl bg-slate-800 p-6 text-center text-xs text-slate-400">No image available</div>
        <h4 class="font-semibold">{{ p.name }}</h4>
        <p class="mt-1 text-xs text-slate-400">Dosage: {{ p.dosage || 'Standard' }}</p>
        <div class="mt-3 flex items-center justify-between">
          <p class="text-lg font-bold text-emerald-400">₹ {{ p.price }}</p>
          <span class="text-xs" [class.text-rose-400]="p.quantity === 0" [class.text-slate-400]="p.quantity > 0">
            {{ p.quantity > 0 ? ('In stock: ' + p.quantity) : 'Out of stock' }}
          </span>
        </div>
        <button
          class="mt-4 w-full rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
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
  products: ProductDto[] = [];
  loading = false;
  errorMessage = '';
  constructor(private readonly productService: ProductService, private readonly cartService: CartService) {}
  ngOnInit(): void {
    this.loading = true;
    this.errorMessage = '';
    this.productService.getProducts().subscribe({
      next: (x) => {
        const rawProducts: any[] = Array.isArray(x)
          ? x
          : (x as any)?.products ?? (x as any)?.Products ?? (x as any)?.$values ?? [];

        this.products = rawProducts.map((p: any) => ({
          id: p?.id ?? p?.Id,
          name: p?.name ?? p?.Name,
          categoryId: p?.categoryId ?? p?.CategoryId ?? 0,
          dosage: p?.dosage ?? p?.Dosage,
          packaging: p?.packaging ?? p?.Packaging ?? '',
          requiresPrescription: p?.requiresPrescription ?? p?.RequiresPrescription ?? false,
          price: p?.price ?? p?.Price ?? 0,
          quantity: p?.quantity ?? p?.Quantity ?? 0
        }));
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message ?? 'Unable to load medicines. Check backend URL/API status.';
      }
    });
  }
  addToCart(productId: number): void {
    const userId = this.getCurrentUserId();
    if (!userId) {
      this.errorMessage = 'Please login first to add medicines to your cart.';
      return;
    }

    this.errorMessage = '';
    this.cartService.add(userId, productId, 1).subscribe({
      next: () => {
        this.errorMessage = '';
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Unable to add to cart. Please login and try again.';
      }
    });
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
