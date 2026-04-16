import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';
import { PrescriptionService } from '../../core/services/prescription.service';
import { ProductService } from '../../core/services/product.service';
import {
  AdminService,
  AdminOrderDto,
  AdminUserDto,
  CategoryDto,
  CreateProductPayload
} from '../../core/services/admin.service';
import {
  mapOrderToViewModel,
  mapPrescriptionToViewModel,
  OrderStatusLabel,
  OrderViewModel,
  PrescriptionViewModel,
  ProductDto
} from '../../core/models/api.models';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- ─── ACCESS GATE ──────────────────────────────────────── -->
    <div *ngIf="!isAdmin()" class="rounded-2xl border border-rose-700 bg-rose-950/30 p-8 text-center">
      <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-rose-600 bg-rose-950 text-2xl">🔒</div>
      <h3 class="text-xl font-semibold text-rose-300">Access Denied</h3>
      <p class="mt-2 text-sm text-rose-200/80">Admin privileges are required. Please log in with an admin account.</p>
    </div>

    <!-- ─── ADMIN DASHBOARD ──────────────────────────────────── -->
    <div *ngIf="isAdmin()" class="space-y-6">

      <!-- Header -->
      <section class="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/30 p-6">
        <p class="text-xs font-medium uppercase tracking-[0.2em] text-cyan-400">Control Panel</p>
        <h2 class="mt-1 text-3xl font-bold">Admin Dashboard</h2>
        <p class="mt-2 text-sm text-slate-400">Manage inventory, review prescriptions, process orders, and administer users.</p>
      </section>

      <!-- Tab Navigation -->
      <nav class="flex flex-wrap gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1.5">
        <button *ngFor="let tab of tabs" (click)="activeTab = tab.key; onTabChange()"
          class="rounded-lg px-4 py-2 text-sm font-medium transition-all"
          [class.bg-cyan-500]="activeTab === tab.key" [class.text-slate-950]="activeTab === tab.key"
          [class.text-slate-400]="activeTab !== tab.key" [class.hover:text-slate-200]="activeTab !== tab.key">
          {{ tab.icon }} {{ tab.label }}
        </button>
      </nav>

      <!-- Toast -->
      <div *ngIf="toast" class="rounded-lg border px-4 py-3 text-sm transition-all"
        [class.border-emerald-700]="!toastError" [class.bg-emerald-950/40]="!toastError" [class.text-emerald-300]="!toastError"
        [class.border-rose-700]="toastError" [class.bg-rose-950/40]="toastError" [class.text-rose-300]="toastError">
        {{ toast }}
      </div>

      <!-- ═══════════════════════════════════════════════════════ -->
      <!-- TAB: INVENTORY                                         -->
      <!-- ═══════════════════════════════════════════════════════ -->
      <div *ngIf="activeTab === 'inventory'" class="space-y-5">

        <!-- Add Product Form -->
        <section class="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h3 class="mb-4 text-lg font-semibold">➕ Add New Product</h3>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label class="mb-1 block text-xs uppercase tracking-wide text-slate-400">Product Name</label>
              <input class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-cyan-500" [(ngModel)]="newProduct.name" placeholder="e.g. Paracetamol 500mg" />
            </div>
            <div>
              <label class="mb-1 block text-xs uppercase tracking-wide text-slate-400">Category</label>
              <select class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-cyan-500" [(ngModel)]="newProduct.categoryId">
                <option value="0" disabled>Select category</option>
                <option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs uppercase tracking-wide text-slate-400">Price (₹)</label>
              <input type="number" class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-cyan-500" [(ngModel)]="newProduct.price" placeholder="0.00" />
            </div>
            <div>
              <label class="mb-1 block text-xs uppercase tracking-wide text-slate-400">Dosage</label>
              <input class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-cyan-500" [(ngModel)]="newProduct.dosage" placeholder="e.g. 500mg" />
            </div>
            <div>
              <label class="mb-1 block text-xs uppercase tracking-wide text-slate-400">Packaging</label>
              <input class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-cyan-500" [(ngModel)]="newProduct.packaging" placeholder="e.g. Strip of 10" />
            </div>
            <div>
              <label class="mb-1 block text-xs uppercase tracking-wide text-slate-400">Initial Stock</label>
              <input type="number" class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-cyan-500" [(ngModel)]="newProduct.initialStock" placeholder="0" />
            </div>
            <div class="flex items-end gap-3">
              <label class="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" [(ngModel)]="newProduct.requiresPrescription" class="accent-cyan-500" />
                Requires Prescription
              </label>
            </div>
          </div>
          <button class="mt-4 rounded-lg bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            [disabled]="!newProduct.name || !newProduct.dosage || !newProduct.packaging || newProduct.categoryId === 0"
            (click)="createProduct()">
            Add Product to Inventory
          </button>
        </section>

        <!-- Add Category -->
        <section class="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h3 class="mb-3 text-lg font-semibold">🏷️ Add Category</h3>
          <div class="flex gap-3">
            <input class="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-cyan-500"
              [(ngModel)]="newCategoryName" placeholder="e.g. Pain Relief, Antibiotics..." />
            <button class="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              [disabled]="!newCategoryName.trim()" (click)="createCategory()">Add</button>
          </div>
          <div *ngIf="categories.length > 0" class="mt-3 flex flex-wrap gap-2">
            <span *ngFor="let c of categories" class="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300">
              {{ c.name }} <span class="ml-1 text-slate-500">({{ c.productCount }} items)</span>
            </span>
          </div>
        </section>

        <!-- Existing Products Table -->
        <section class="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold">📦 Current Inventory</h3>
            <button class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-cyan-500"
              (click)="loadProducts()">↻ Refresh</button>
          </div>
          <p *ngIf="productsLoading" class="text-sm text-slate-400">Loading products...</p>
          <div *ngIf="!productsLoading && products.length === 0" class="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-sm text-slate-400">
            No products found. Add your first product above.
          </div>
          <div *ngIf="products.length > 0" class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                  <th class="px-3 py-2">ID</th>
                  <th class="px-3 py-2">Name</th>
                  <th class="px-3 py-2">Dosage</th>
                  <th class="px-3 py-2">Price</th>
                  <th class="px-3 py-2">Stock</th>
                  <th class="px-3 py-2">Rx</th>
                  <th class="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of products" class="border-b border-slate-800/50 transition hover:bg-slate-800/30">
                  <td class="px-3 py-2.5 text-slate-400">#{{ p.id }}</td>
                  <td class="px-3 py-2.5 font-medium">{{ p.name }}</td>
                  <td class="px-3 py-2.5 text-slate-300">{{ p.dosage }}</td>
                  <td class="px-3 py-2.5 text-emerald-400">₹{{ p.price }}</td>
                  <td class="px-3 py-2.5">
                    <div class="flex items-center gap-2">
                      <input type="number" class="w-20 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs outline-none focus:border-cyan-500"
                        [value]="p.quantity" (change)="onStockInputChange(p.id, $event)" />
                      <button class="rounded bg-cyan-600 px-2 py-1 text-xs font-medium text-white hover:bg-cyan-500" (click)="updateStock(p.id)">Set</button>
                    </div>
                  </td>
                  <td class="px-3 py-2.5">
                    <span class="rounded-full px-2 py-0.5 text-xs" [class.bg-amber-900/50]="p.requiresPrescription" [class.text-amber-300]="p.requiresPrescription"
                      [class.bg-slate-800]="!p.requiresPrescription" [class.text-slate-400]="!p.requiresPrescription">
                      {{ p.requiresPrescription ? 'Yes' : 'No' }}
                    </span>
                  </td>
                  <td class="px-3 py-2.5">
                    <button class="rounded bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-500" (click)="deleteProduct(p.id)">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <!-- ═══════════════════════════════════════════════════════ -->
      <!-- TAB: ORDERS                                            -->
      <!-- ═══════════════════════════════════════════════════════ -->
      <div *ngIf="activeTab === 'orders'" class="space-y-4">
        <section class="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold">📋 All Orders</h3>
            <button class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-cyan-500"
              (click)="loadAllOrders()">↻ Refresh</button>
          </div>
          <p *ngIf="ordersLoading" class="text-sm text-slate-400">Loading orders...</p>
          <p *ngIf="!ordersLoading && allOrders.length === 0" class="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-sm text-slate-400">No orders found.</p>

          <div *ngFor="let o of allOrders" class="mb-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="font-semibold">Order #{{ o.id }}</h4>
                  <span class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    [class.bg-cyan-900/50]="o.status !== 'Delivered'" [class.text-cyan-300]="o.status !== 'Delivered'"
                    [class.bg-emerald-900/50]="o.status === 'Delivered'" [class.text-emerald-300]="o.status === 'Delivered'">
                    {{ o.status }}
                  </span>
                </div>
                <p class="mt-1 text-sm text-slate-400">
                  Customer: <span class="text-slate-200">{{ o.userName }}</span> ({{ o.userEmail }}) • User ID: {{ o.userId }}
                </p>
                <p class="text-sm text-slate-400">Total: <span class="font-semibold text-emerald-400">₹{{ o.totalAmount }}</span></p>
              </div>

              <!-- Status progression buttons -->
              <div class="flex flex-wrap gap-1.5">
                <button *ngFor="let s of orderStatuses"
                  class="rounded border px-2 py-1 text-xs font-medium transition"
                  [class.border-cyan-600]="true" [class.text-cyan-300]="true"
                  [class.hover:bg-cyan-900/40]="true"
                  (click)="updateOrderStatus(o.id, s)">
                  → {{ s }}
                </button>
              </div>
            </div>

            <!-- Order items -->
            <div class="mt-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
              <p class="mb-2 text-xs uppercase tracking-wide text-slate-500">Items</p>
              <div *ngFor="let item of o.items" class="flex justify-between border-b border-slate-800/50 py-1.5 text-sm last:border-0">
                <span>{{ item.productName }} × {{ item.quantity }}</span>
                <span class="text-slate-400">₹{{ item.price * item.quantity }}</span>
              </div>
            </div>

            <!-- Status timeline -->
            <div *ngIf="o.statusHistory.length > 0" class="mt-3">
              <p class="mb-1 text-xs uppercase tracking-wide text-slate-500">Timeline</p>
              <div class="flex flex-wrap gap-1">
                <span *ngFor="let s of o.statusHistory; let i = index" class="text-xs text-slate-300">
                  {{ s.status }}<span *ngIf="i < o.statusHistory.length - 1" class="mx-1 text-slate-600">→</span>
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- ═══════════════════════════════════════════════════════ -->
      <!-- TAB: USERS                                             -->
      <!-- ═══════════════════════════════════════════════════════ -->
      <div *ngIf="activeTab === 'users'" class="space-y-4">
        <section class="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold">👥 User Management</h3>
            <button class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-cyan-500"
              (click)="loadUsers()">↻ Refresh</button>
          </div>
          <p *ngIf="usersLoading" class="text-sm text-slate-400">Loading users...</p>
          <p *ngIf="!usersLoading && users.length === 0" class="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-sm text-slate-400">No users found.</p>

          <div *ngIf="users.length > 0" class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                  <th class="px-3 py-2">ID</th>
                  <th class="px-3 py-2">Name</th>
                  <th class="px-3 py-2">Email</th>
                  <th class="px-3 py-2">Role</th>
                  <th class="px-3 py-2">Orders</th>
                  <th class="px-3 py-2">Joined</th>
                  <th class="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of users" class="border-b border-slate-800/50 transition hover:bg-slate-800/30">
                  <td class="px-3 py-2.5 text-slate-400">#{{ u.id }}</td>
                  <td class="px-3 py-2.5 font-medium">{{ u.name }}</td>
                  <td class="px-3 py-2.5 text-slate-300">{{ u.email }}</td>
                  <td class="px-3 py-2.5">
                    <span class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      [class.bg-cyan-900/50]="u.role === 'Admin'" [class.text-cyan-300]="u.role === 'Admin'"
                      [class.bg-slate-800]="u.role !== 'Admin'" [class.text-slate-300]="u.role !== 'Admin'">
                      {{ u.role }}
                    </span>
                  </td>
                  <td class="px-3 py-2.5 text-slate-400">{{ u.orderCount }}</td>
                  <td class="px-3 py-2.5 text-xs text-slate-500">{{ u.createdAt | date:'mediumDate' }}</td>
                  <td class="whitespace-nowrap px-3 py-2.5">
                    <button *ngIf="u.role !== 'Admin'"
                      class="mr-1 rounded bg-cyan-600 px-2 py-1 text-xs font-medium text-white hover:bg-cyan-500"
                      (click)="promoteUser(u.id)">Make Admin</button>
                    <button *ngIf="u.role === 'Admin'"
                      class="mr-1 rounded bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-500"
                      (click)="demoteUser(u.id)">Demote</button>
                    <button class="rounded bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-500"
                      (click)="deleteUser(u.id)">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <!-- ═══════════════════════════════════════════════════════ -->
      <!-- TAB: PRESCRIPTIONS                                     -->
      <!-- ═══════════════════════════════════════════════════════ -->
      <div *ngIf="activeTab === 'prescriptions'" class="space-y-4">
        <section class="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h3 class="mb-3 text-lg font-semibold">📄 Prescription Review Queue</h3>
          <div class="flex gap-3">
            <input class="w-40 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-cyan-500"
              placeholder="User ID" [(ngModel)]="prescriptionUserId" />
            <button class="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
              (click)="loadPrescriptions()">Load Prescriptions</button>
          </div>

          <div class="mt-4 space-y-3">
            <div *ngFor="let p of prescriptions" class="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p class="text-sm font-medium">Prescription #{{ p.id }}</p>
                  <p class="mt-0.5 text-sm text-slate-400">User: {{ p.userId }} • Status:
                    <span class="font-medium"
                      [class.text-amber-300]="p.status === 'Pending'"
                      [class.text-emerald-400]="p.status === 'Approved'"
                      [class.text-rose-400]="p.status === 'Rejected'">
                      {{ p.status }}
                    </span>
                  </p>
                  <a [href]="p.fileUrl" target="_blank" class="mt-1 inline-block text-xs text-cyan-400 underline hover:text-cyan-300">View File</a>
                </div>
                <div class="flex gap-2">
                  <button class="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                    (click)="reviewPrescription(p.id, 'Approved')">✓ Approve</button>
                  <button class="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-400"
                    (click)="reviewPrescription(p.id, 'Rejected')">✗ Reject</button>
                </div>
              </div>
            </div>
            <p *ngIf="prescriptions.length === 0" class="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-sm text-slate-400">
              No prescriptions loaded. Enter a user ID above and click Load.
            </p>
          </div>
        </section>
      </div>

    </div>
  `
})
export class AdminPageComponent implements OnInit {
  // Tab system
  tabs = [
    { key: 'inventory', label: 'Inventory & Products', icon: '📦' },
    { key: 'orders', label: 'All Orders', icon: '📋' },
    { key: 'users', label: 'User Management', icon: '👥' },
    { key: 'prescriptions', label: 'Prescriptions', icon: '📄' }
  ];
  activeTab = 'inventory';

  // Toast
  toast = '';
  toastError = false;

  // Inventory tab
  categories: CategoryDto[] = [];
  products: ProductDto[] = [];
  productsLoading = false;
  newCategoryName = '';
  newProduct: CreateProductPayload = {
    name: '', categoryId: 0, price: 0, dosage: '', packaging: '', requiresPrescription: false, initialStock: 0
  };
  stockInputValues: Record<number, number> = {};

  // Orders tab
  allOrders: AdminOrderDto[] = [];
  ordersLoading = false;
  orderStatuses: Exclude<OrderStatusLabel, 'Placed'>[] = ['Confirmed', 'Packed', 'Shipped', 'OutForDelivery', 'Delivered'];

  // Users tab
  users: AdminUserDto[] = [];
  usersLoading = false;

  // Prescriptions tab
  prescriptionUserId = '';
  prescriptions: PrescriptionViewModel[] = [];

  constructor(
    private readonly adminService: AdminService,
    private readonly productService: ProductService,
    private readonly prescriptionService: PrescriptionService,
    private readonly orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  onTabChange(): void {
    this.toast = '';
    if (this.activeTab === 'orders' && this.allOrders.length === 0) this.loadAllOrders();
    if (this.activeTab === 'users' && this.users.length === 0) this.loadUsers();
    if (this.activeTab === 'inventory') { this.loadCategories(); this.loadProducts(); }
  }

  isAdmin(): boolean {
    return localStorage.getItem('userRole') === 'Admin';
  }

  // ─── TOAST ────────────────────────────────────────────────────

  private showToast(msg: string, isError = false): void {
    this.toast = msg;
    this.toastError = isError;
    setTimeout(() => { if (this.toast === msg) this.toast = ''; }, 5000);
  }

  // ─── CATEGORIES ───────────────────────────────────────────────

  loadCategories(): void {
    this.adminService.getCategories().subscribe({
      next: (data) => this.categories = data,
      error: (err) => this.showToast(err?.error?.message ?? 'Failed to load categories.', true)
    });
  }

  createCategory(): void {
    const name = this.newCategoryName.trim();
    if (!name) return;
    this.adminService.createCategory(name).subscribe({
      next: () => { this.newCategoryName = ''; this.loadCategories(); this.showToast('Category created successfully.'); },
      error: (err) => this.showToast(err?.error?.message ?? 'Failed to create category.', true)
    });
  }

  // ─── PRODUCTS ─────────────────────────────────────────────────

  loadProducts(): void {
    this.productsLoading = true;
    this.productService.getProducts().subscribe({
      next: (data) => {
        const raw: any[] = Array.isArray(data) ? data : (data as any)?.$values ?? [];
        this.products = raw.map((p: any) => ({
          id: p?.id ?? p?.Id,
          name: p?.name ?? p?.Name,
          categoryId: p?.categoryId ?? p?.CategoryId ?? 0,
          dosage: p?.dosage ?? p?.Dosage ?? '',
          packaging: p?.packaging ?? p?.Packaging ?? '',
          requiresPrescription: p?.requiresPrescription ?? p?.RequiresPrescription ?? false,
          price: p?.price ?? p?.Price ?? 0,
          quantity: p?.quantity ?? p?.Quantity ?? 0
        }));
        this.products.forEach(p => this.stockInputValues[p.id] = p.quantity);
        this.productsLoading = false;
      },
      error: (err) => { this.productsLoading = false; this.showToast(err?.error?.message ?? 'Failed to load products.', true); }
    });
  }

  createProduct(): void {
    this.adminService.createProduct(this.newProduct).subscribe({
      next: () => {
        this.showToast('Product added to inventory successfully.');
        this.newProduct = { name: '', categoryId: 0, price: 0, dosage: '', packaging: '', requiresPrescription: false, initialStock: 0 };
        this.loadProducts();
        this.loadCategories();
      },
      error: (err) => this.showToast(err?.error?.message ?? 'Failed to create product.', true)
    });
  }

  deleteProduct(id: number): void {
    this.adminService.deleteProduct(id).subscribe({
      next: () => { this.loadProducts(); this.showToast('Product deleted.'); },
      error: (err) => this.showToast(err?.error?.message ?? 'Failed to delete product.', true)
    });
  }

  onStockInputChange(productId: number, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.stockInputValues[productId] = value;
  }

  updateStock(productId: number): void {
    const qty = this.stockInputValues[productId] ?? 0;
    this.adminService.updateInventory(productId, qty).subscribe({
      next: () => { this.showToast(`Stock updated to ${qty} for product #${productId}.`); this.loadProducts(); },
      error: (err) => this.showToast(err?.error?.message ?? 'Failed to update stock.', true)
    });
  }

  // ─── ORDERS ───────────────────────────────────────────────────

  loadAllOrders(): void {
    this.ordersLoading = true;
    this.adminService.getAllOrders().subscribe({
      next: (data) => { this.allOrders = data; this.ordersLoading = false; },
      error: (err) => { this.ordersLoading = false; this.showToast(err?.error?.message ?? 'Failed to load orders.', true); }
    });
  }

  updateOrderStatus(orderId: number, status: Exclude<OrderStatusLabel, 'Placed'>): void {
    this.orderService.updateStatus(orderId, status).subscribe({
      next: () => { this.showToast(`Order #${orderId} updated to ${status}.`); this.loadAllOrders(); },
      error: (err) => this.showToast(err?.error?.message ?? 'Failed to update order status.', true)
    });
  }

  // ─── USERS ────────────────────────────────────────────────────

  loadUsers(): void {
    this.usersLoading = true;
    this.adminService.getUsers().subscribe({
      next: (data) => { this.users = data; this.usersLoading = false; },
      error: (err) => { this.usersLoading = false; this.showToast(err?.error?.message ?? 'Failed to load users.', true); }
    });
  }

  promoteUser(userId: number): void {
    this.adminService.updateUserRole(userId, 1).subscribe({
      next: () => { this.showToast(`User #${userId} promoted to Admin.`); this.loadUsers(); },
      error: (err) => this.showToast(err?.error?.message ?? 'Failed to update role.', true)
    });
  }

  demoteUser(userId: number): void {
    this.adminService.updateUserRole(userId, 0).subscribe({
      next: () => { this.showToast(`User #${userId} demoted to User.`); this.loadUsers(); },
      error: (err) => this.showToast(err?.error?.message ?? 'Failed to update role.', true)
    });
  }

  deleteUser(userId: number): void {
    this.adminService.deleteUser(userId).subscribe({
      next: () => { this.showToast(`User #${userId} deleted.`); this.loadUsers(); },
      error: (err) => this.showToast(err?.error?.message ?? 'Failed to delete user.', true)
    });
  }

  // ─── PRESCRIPTIONS ───────────────────────────────────────────

  loadPrescriptions(): void {
    const userId = Number(this.prescriptionUserId);
    if (!userId) return;
    this.prescriptionService.getByUser(userId).subscribe({
      next: (data) => { this.prescriptions = data.map(mapPrescriptionToViewModel); this.showToast('Prescriptions loaded.'); },
      error: (err) => this.showToast(err?.error?.message ?? 'Failed to load prescriptions.', true)
    });
  }

  reviewPrescription(id: number, status: 'Approved' | 'Rejected'): void {
    this.prescriptionService.review(id, status).subscribe({
      next: () => { this.showToast(`Prescription #${id} ${status.toLowerCase()}.`); this.loadPrescriptions(); },
      error: (err) => this.showToast(err?.error?.message ?? 'Failed to review prescription.', true)
    });
  }
}
