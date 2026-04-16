import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { PrescriptionService } from '../../core/services/prescription.service';
import { ProductService } from '../../core/services/product.service';
import { CartItemDto, mapPrescriptionToViewModel, PrescriptionViewModel, ProductDto } from '../../core/models/api.models';

type CheckoutCartItem = { product: ProductDto; quantity: number; lineTotal: number };

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="grid gap-4 lg:grid-cols-3">
      <section class="rounded-2xl border border-slate-800 bg-slate-900 p-5 lg:col-span-2">
        <h2 class="text-2xl font-bold">Checkout Command Center</h2>
        <p class="mt-1 text-sm text-slate-400">Review your cart, attach prescription details when needed, and place your order in one flow.</p>

        <p *ngIf="loading" class="mt-4 text-sm text-slate-400">Loading checkout details...</p>
        <p *ngIf="message" class="mt-4 rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm" [class.border-rose-800]="hasError" [class.text-rose-300]="hasError" [class.border-emerald-800]="!hasError" [class.text-emerald-300]="!hasError">
          {{ message }}
        </p>

        <div *ngIf="!loading && !isLoggedIn()" class="mt-4 rounded-xl border border-amber-700 bg-amber-950/30 p-4 text-sm text-amber-200">
          Please login first to continue to checkout.
          <a routerLink="/auth" class="ml-2 font-semibold text-amber-100 underline">Go to login</a>
        </div>

        <ng-container *ngIf="!loading && isLoggedIn()">
          <div *ngIf="cartItems.length > 0; else emptyCart" class="mt-4 space-y-4">
            <div class="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div class="mb-3 flex items-center justify-between">
                <h3 class="text-lg font-semibold">Items Ready to Order</h3>
                <span class="text-sm text-slate-400">{{ cartItems.length }} item(s)</span>
              </div>

              <div *ngFor="let item of cartItems" class="flex items-center justify-between gap-3 border-t border-slate-800 py-3 first:border-t-0 first:pt-0">
                <div>
                  <p class="font-medium">{{ item.product.name }}</p>
                  <p class="text-sm text-slate-400">
                    Qty {{ item.quantity }} x ₹ {{ item.product.price }}
                    <span *ngIf="item.product.requiresPrescription" class="ml-2 rounded-full border border-amber-700 bg-amber-950/50 px-2 py-0.5 text-xs text-amber-300">
                      Prescription required
                    </span>
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <p class="font-semibold text-emerald-400">₹ {{ item.lineTotal }}</p>
                  <button
                    class="rounded-lg border border-cyan-700 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-950/40 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
                    [disabled]="placingOrder || !canCheckoutItem(item)"
                    (click)="placeOrder(item.product.id)"
                  >
                    Checkout this item
                  </button>
                </div>
              </div>
            </div>

            <div *ngIf="requiresPrescription" class="rounded-xl border border-amber-700 bg-amber-950/20 p-4">
              <h3 class="text-lg font-semibold text-amber-200">Prescription Needed</h3>
              <p class="mt-1 text-sm text-amber-100/90">Your cart contains at least one medicine that requires an approved prescription.</p>

              <label class="mt-4 block text-xs uppercase tracking-wide text-slate-400">Approved prescription</label>
              <select class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2" [(ngModel)]="selectedPrescriptionId">
                <option value="">Select approved prescription</option>
                <option *ngFor="let prescription of approvedPrescriptions" [value]="prescription.id">
                  #{{ prescription.id }} • {{ prescription.status }} • {{ prescription.fileUrl }}
                </option>
              </select>

              <div class="mt-4 border-t border-amber-800/40 pt-4">
                <label class="block text-xs uppercase tracking-wide text-slate-400">Upload prescription URL</label>
                <input
                  class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2"
                  placeholder="Paste image or file URL"
                  [(ngModel)]="newPrescriptionUrl"
                />
                <button
                  class="mt-3 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                  [disabled]="uploadingPrescription || !newPrescriptionUrl.trim()"
                  (click)="uploadPrescription()"
                >
                  {{ uploadingPrescription ? 'Uploading...' : 'Upload Prescription' }}
                </button>
                <p class="mt-2 text-xs text-slate-400">After upload, an admin must approve it before the order can be placed.</p>
              </div>
            </div>

            <button
              class="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              [disabled]="placingOrder || cartItems.length === 0"
              (click)="placeOrder()"
            >
              {{ placingOrder ? 'Placing Order...' : 'Place Order' }}
            </button>
          </div>
        </ng-container>

        <ng-template #emptyCart>
          <div class="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-6 text-sm text-slate-300">
            Your cart is empty. Add medicines first, then return to checkout.
            <a routerLink="/products" class="ml-2 font-semibold text-cyan-300 underline">Browse medicines</a>
          </div>
        </ng-template>
      </section>

      <aside class="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h3 class="text-lg font-semibold">Order Summary</h3>
        <div class="mt-3 space-y-2 text-sm text-slate-300">
          <p>Items: <span class="font-semibold">{{ cartItems.length }}</span></p>
          <p>Prescription items: <span class="font-semibold">{{ prescriptionItemCount }}</span></p>
          <p>Prescription status:
            <span class="font-semibold" [class.text-amber-300]="requiresPrescription && !selectedPrescriptionId" [class.text-emerald-400]="!requiresPrescription || !!selectedPrescriptionId">
              {{ requiresPrescription ? (selectedPrescriptionId ? 'Ready' : 'Pending selection') : 'Not required' }}
            </span>
          </p>
          <p>Total amount: <span class="font-semibold text-emerald-400">₹ {{ totalAmount }}</span></p>
        </div>
      </aside>
    </div>
  `
})
export class CheckoutPageComponent implements OnInit {
  cartItems: CheckoutCartItem[] = [];
  approvedPrescriptions: PrescriptionViewModel[] = [];
  selectedPrescriptionId = '';
  newPrescriptionUrl = '';
  loading = false;
  placingOrder = false;
  uploadingPrescription = false;
  message = '';
  hasError = false;

  constructor(
    private readonly cartService: CartService,
    private readonly productService: ProductService,
    private readonly prescriptionService: PrescriptionService,
    private readonly orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.loadCheckoutData();
  }

  placeOrder(productId?: number) {
    const userId = this.getCurrentUserId();
    if (!userId) {
      this.setMessage('Please login first to place an order.', true);
      return;
    }

    const itemsToCheckout = this.getItemsToCheckout(productId);
    if (itemsToCheckout.length === 0) {
      this.setMessage('Your cart is empty. Add medicines before checkout.', true);
      return;
    }

    const prescriptionId = this.selectedPrescriptionId ? Number(this.selectedPrescriptionId) : undefined;
    if (this.requiresPrescriptionForItems(itemsToCheckout) && !prescriptionId) {
      this.setMessage('Select an approved prescription before placing this order.', true);
      return;
    }

    this.placingOrder = true;
    this.setMessage('', false);
    this.orderService.placeOrder(userId, prescriptionId, productId).subscribe({
      next: () => {
        this.placingOrder = false;
        this.setMessage(productId ? 'Selected item ordered successfully.' : 'Order placed successfully. You can track it on the orders page.', false);
        this.loadCheckoutData();
      },
      error: (err) => {
        this.placingOrder = false;
        this.setMessage(err?.error?.message ?? 'Order failed.', true);
      }
    });
  }

  uploadPrescription(): void {
    const userId = this.getCurrentUserId();
    const fileUrl = this.newPrescriptionUrl.trim();
    if (!userId) {
      this.setMessage('Please login first to upload a prescription.', true);
      return;
    }

    if (!fileUrl) {
      this.setMessage('Enter a prescription file URL first.', true);
      return;
    }

    this.uploadingPrescription = true;
    this.prescriptionService.upload(userId, fileUrl).subscribe({
      next: () => {
        this.uploadingPrescription = false;
        this.newPrescriptionUrl = '';
        this.setMessage('Prescription uploaded successfully. Wait for admin approval before placing the order.', false);
        this.loadCheckoutData();
      },
      error: (err) => {
        this.uploadingPrescription = false;
        this.setMessage(err?.error?.message ?? 'Failed to upload prescription.', true);
      }
    });
  }

  get requiresPrescription(): boolean {
    return this.requiresPrescriptionForItems(this.cartItems);
  }

  get prescriptionItemCount(): number {
    return this.cartItems.filter((item) => item.product.requiresPrescription).length;
  }

  get totalAmount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  }

  isLoggedIn(): boolean {
    return this.getCurrentUserId() !== null;
  }

  private loadCheckoutData(): void {
    const userId = this.getCurrentUserId();
    if (!userId) {
      this.cartItems = [];
      this.approvedPrescriptions = [];
      this.selectedPrescriptionId = '';
      return;
    }

    this.loading = true;
    this.setMessage('', false);

    forkJoin({
      cart: this.cartService.get(userId),
      products: this.productService.getProducts(),
      prescriptions: this.prescriptionService.getByUser(userId)
    }).subscribe({
      next: ({ cart, products, prescriptions }) => {
        const productMap = new Map(products.map((product) => [product.id, product]));
        this.cartItems = (cart.items ?? [])
          .map((item: CartItemDto) => {
            const product = productMap.get(item.productId);
            if (!product) {
              return null;
            }

            return {
              product,
              quantity: item.quantity,
              lineTotal: product.price * item.quantity
            };
          })
          .filter((item): item is CheckoutCartItem => item !== null);

        this.approvedPrescriptions = prescriptions
          .map(mapPrescriptionToViewModel)
          .filter((prescription) => prescription.status === 'Approved');

        if (this.selectedPrescriptionId && !this.approvedPrescriptions.some((item) => item.id === Number(this.selectedPrescriptionId))) {
          this.selectedPrescriptionId = '';
        }

        if (!this.selectedPrescriptionId && this.approvedPrescriptions.length === 1) {
          this.selectedPrescriptionId = String(this.approvedPrescriptions[0].id);
        }

        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.cartItems = [];
        this.approvedPrescriptions = [];
        this.setMessage(err?.error?.message ?? 'Unable to load checkout details.', true);
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

  private setMessage(message: string, hasError: boolean): void {
    this.message = message;
    this.hasError = hasError;
  }

  private getItemsToCheckout(productId?: number): CheckoutCartItem[] {
    return productId
      ? this.cartItems.filter((item) => item.product.id === productId)
      : this.cartItems;
  }

  private requiresPrescriptionForItems(items: CheckoutCartItem[]): boolean {
    return items.some((item) => item.product.requiresPrescription);
  }

  canCheckoutItem(item: CheckoutCartItem): boolean {
    return !item.product.requiresPrescription || !!this.selectedPrescriptionId;
  }
}
