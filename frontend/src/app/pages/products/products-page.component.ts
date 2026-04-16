import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2 class="mb-4 text-2xl font-semibold">Products</h2>
    <div class="grid gap-3 md:grid-cols-2">
      <div *ngFor="let p of products" class="rounded border bg-white p-3">
        <h3 class="font-semibold">{{ p.name }}</h3>
        <p>Price: {{ p.price }}</p>
        <p>Stock: {{ p.quantity }}</p>
        <button class="mt-2 rounded bg-slate-900 px-3 py-1 text-white" (click)="addToCart(p.id)">Add to cart</button>
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
