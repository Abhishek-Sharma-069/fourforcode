import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { PrescriptionService } from '../../core/services/prescription.service';
import { CartItemDto, mapPrescriptionToViewModel, PrescriptionDto, PrescriptionViewModel } from '../../core/models/api.models';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2 class="mb-4 text-2xl font-bold">Cart Workspace</h2>
    <p *ngIf="loading" class="mb-3 text-sm text-slate-400">Loading cart...</p>
    <p *ngIf="successMessage" class="mb-3 rounded-lg border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-300">{{ successMessage }}</p>
    <p *ngIf="errorMessage" class="mb-3 rounded-lg border border-rose-800 bg-rose-950/40 p-3 text-sm text-rose-300">{{ errorMessage }}</p>
    <div class="grid gap-4 lg:grid-cols-3">
      <section class="space-y-3 lg:col-span-2">
        <article *ngFor="let item of items" class="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-400">{{ item.category || 'Medicine' }}</p>
              <h3 class="font-semibold">{{ item.productName || ('#' + item.productId) }}</h3>
              <p class="text-xs text-slate-500">
                Product ID: {{ item.productId }}
                <span *ngIf="item.requiresPrescription" class="ml-2 rounded-full border border-amber-700 bg-amber-950/50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-300">
                  Prescription required
                </span>
              </p>
            </div>
            <div class="flex items-center gap-2">
              <input type="number" class="w-20 rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm" [(ngModel)]="item.quantity" />
              <button class="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400" (click)="update(item.productId, item.quantity)">Update</button>
              <button class="rounded-lg border border-emerald-700 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-950/40 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500" [disabled]="placingOrder || !canCheckoutItem(item)" (click)="checkout(item.productId)">Checkout</button>
              <button class="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-400" (click)="remove(item.productId)">Remove</button>
            </div>
          </div>
        </article>
        <p *ngIf="items.length === 0" class="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center text-slate-400">Your cart is empty.</p>
      </section>

      <aside class="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h3 class="text-lg font-semibold">Order Summary</h3>
        <div class="mt-3 space-y-2 text-sm text-slate-300">
          <p>Items: <span class="font-semibold">{{ items.length }}</span></p>
          <p>Prescription items: <span class="font-semibold">{{ prescriptionItemCount }}</span></p>
          <p>Shipping: <span class="font-semibold text-emerald-400">Free</span></p>
          <p>Protection: <span class="font-semibold text-cyan-300">Enabled</span></p>
        </div>
        <p *ngIf="requiresPrescriptionOrder" class="mt-4 rounded-lg border border-amber-700 bg-amber-950/30 p-3 text-xs text-amber-200">
          This cart contains prescription medicines. Select or upload a prescription before checkout.
        </p>
        <div *ngIf="requiresPrescriptionOrder" class="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-3">
          <label class="mb-1 block text-xs uppercase tracking-wide text-slate-400">Upload prescription image or PDF</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            class="block w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-cyan-500 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-950"
            (change)="onPrescriptionFileSelected($event)"
          />
          <p *ngIf="selectedPrescriptionFile" class="mt-2 text-xs text-slate-400">Selected: {{ selectedPrescriptionFile.name }}</p>
          <button
            class="mt-3 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            [disabled]="uploadingPrescription || !selectedPrescriptionFile"
            (click)="uploadPrescriptionImage()"
          >
            {{ uploadingPrescription ? 'Uploading...' : 'Upload Prescription' }}
          </button>
          <p class="mt-2 text-xs text-slate-500">After upload, the prescription is selected automatically so checkout can continue.</p>
        </div>
        <div *ngIf="hasApprovedPrescriptions" class="mt-4">
          <label class="mb-1 block text-xs uppercase tracking-wide text-slate-400">Uploaded prescription</label>
          <select class="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm" [(ngModel)]="selectedPrescriptionId">
            <option value="">Select a prescription</option>
            <option *ngFor="let prescription of approvedPrescriptions" [value]="prescription.id">
              #{{ prescription.id }} • {{ prescription.status }} • {{ prescription.fileUrl }}
            </option>
          </select>
        </div>
        <button class="mt-4 w-full rounded-lg bg-emerald-500 px-3 py-2 text-center text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400" [disabled]="placingOrder || items.length === 0 || !canCheckoutOrder()" (click)="checkout()">
          {{ placingOrder ? 'Placing Order...' : 'Checkout All Items' }}
        </button>
      </aside>
    </div>
  `
})
export class CartPageComponent implements OnInit {
  items: CartItemDto[] = [];
  approvedPrescriptions: PrescriptionViewModel[] = [];
  selectedPrescriptionId = '';
  selectedPrescriptionFile: File | null = null;
  loading = false;
  placingOrder = false;
  uploadingPrescription = false;
  errorMessage = '';
  successMessage = '';
  constructor(
    private readonly cartService: CartService,
    private readonly orderService: OrderService,
    private readonly prescriptionService: PrescriptionService
  ) {}
  ngOnInit(): void { this.refresh(); }
  private refresh() {
    const userId = this.getCurrentUserId();
    if (!userId) {
      this.loading = false;
      this.items = [];
      this.approvedPrescriptions = [];
      this.selectedPrescriptionId = '';
      this.errorMessage = 'Please login first to view your cart.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cartService.get(userId).subscribe({
      next: (x) => {
        this.items = x.items ?? [];
        this.loadApprovedPrescriptions(userId);
      },
      error: (err) => {
        this.loading = false;
        this.items = [];
        this.approvedPrescriptions = [];
        this.errorMessage = err?.error?.message ?? 'Unable to fetch cart. Please login first.';
      }
    });
  }
  update(productId: number, quantity: number) {
    const userId = this.getCurrentUserId();
    if (!userId) {
      this.errorMessage = 'Please login first to update your cart.';
      return;
    }

    this.cartService.update(userId, productId, quantity).subscribe({
      next: () => this.refresh(),
      error: (err) => (this.errorMessage = err?.error?.message ?? 'Failed to update cart item.')
    });
  }
  remove(productId: number) {
    const userId = this.getCurrentUserId();
    if (!userId) {
      this.errorMessage = 'Please login first to manage your cart.';
      return;
    }

    this.cartService.remove(userId, productId).subscribe({
      next: () => this.refresh(),
      error: (err) => (this.errorMessage = err?.error?.message ?? 'Failed to remove cart item.')
    });
  }

  checkout(productId?: number) {
    const userId = this.getCurrentUserId();
    if (!userId) {
      this.errorMessage = 'Please login first to place an order.';
      return;
    }

    if (this.items.length === 0) {
      this.errorMessage = 'Your cart is empty.';
      return;
    }

    const itemsToCheckout = productId
      ? this.items.filter((item) => item.productId === productId)
      : this.items;

    if (itemsToCheckout.some((item) => item.requiresPrescription) && !this.selectedPrescriptionId) {
      this.errorMessage = 'Select or upload a prescription before checking out prescription medicines.';
      return;
    }

    const prescriptionId = this.selectedPrescriptionId ? Number(this.selectedPrescriptionId) : undefined;
    this.placingOrder = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.orderService.placeOrder(userId, prescriptionId, productId).subscribe({
      next: () => {
        this.placingOrder = false;
        this.successMessage = 'Order placed successfully.';
        this.refresh();
      },
      error: (err) => {
        this.placingOrder = false;
        this.errorMessage = err?.error?.message ?? 'Failed to place order.';
      }
    });
  }

  get hasApprovedPrescriptions(): boolean {
    return this.approvedPrescriptions.length > 0;
  }

  get prescriptionItemCount(): number {
    return this.items.filter((item) => item.requiresPrescription).length;
  }

  get requiresPrescriptionOrder(): boolean {
    return this.prescriptionItemCount > 0;
  }

  canCheckoutItem(item: CartItemDto): boolean {
    return !item.requiresPrescription || !!this.selectedPrescriptionId;
  }

  canCheckoutOrder(): boolean {
    return !this.requiresPrescriptionOrder || !!this.selectedPrescriptionId;
  }

  onPrescriptionFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedPrescriptionFile = input.files?.[0] ?? null;
    this.errorMessage = '';
    this.successMessage = '';
  }

  uploadPrescriptionImage(): void {
    if (!this.selectedPrescriptionFile) {
      this.errorMessage = 'Select a prescription image or PDF first.';
      return;
    }

    this.uploadingPrescription = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.prescriptionService.uploadImage(this.selectedPrescriptionFile).subscribe({
      next: (prescription: PrescriptionDto) => {
        this.uploadingPrescription = false;
        const uploadedPrescription = mapPrescriptionToViewModel(prescription);
        this.approvedPrescriptions = [
          uploadedPrescription,
          ...this.approvedPrescriptions.filter((item) => item.id !== uploadedPrescription.id)
        ];
        this.selectedPrescriptionId = String(prescription.id);
        this.successMessage = 'Prescription uploaded successfully. Checkout is now enabled.';
        this.selectedPrescriptionFile = null;
      },
      error: (err) => {
        this.uploadingPrescription = false;
        this.errorMessage = err?.error?.message ?? 'Failed to upload prescription.';
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

  private loadApprovedPrescriptions(userId: number): void {
    this.prescriptionService.getByUser(userId).subscribe({
      next: (items) => {
        this.approvedPrescriptions = items
          .map(mapPrescriptionToViewModel)
          .filter((prescription) => prescription.status !== 'Rejected');

        if (this.selectedPrescriptionId && !this.approvedPrescriptions.some((item) => item.id === Number(this.selectedPrescriptionId))) {
          this.selectedPrescriptionId = '';
        }

        if (!this.selectedPrescriptionId && this.approvedPrescriptions.length === 1) {
          this.selectedPrescriptionId = String(this.approvedPrescriptions[0].id);
        }

        this.loading = false;
      },
      error: () => {
        this.approvedPrescriptions = [];
        this.selectedPrescriptionId = '';
        this.loading = false;
      }
    });
  }
}
