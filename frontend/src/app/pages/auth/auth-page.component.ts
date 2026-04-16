import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div *ngIf="!isLoggedIn(); else loggedInView" class="grid gap-4 lg:grid-cols-3">
      <section class="rounded-2xl bg-linear-to-br from-cyan-600 to-teal-600 p-6 text-white">
        <h2 class="text-3xl font-bold">Welcome to MediQuick</h2>
        <p class="mt-2 text-cyan-100">Order medicines online, upload prescriptions, and track delivery in real time.</p>
      </section>
      <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 class="text-xl font-semibold text-slate-800">Register</h3>
        <div class="mt-4 grid gap-3">
          <input class="rounded-lg border p-2" placeholder="Name" [(ngModel)]="registerName" />
          <input class="rounded-lg border p-2" placeholder="Email" [(ngModel)]="registerEmail" />
          <input class="rounded-lg border p-2" placeholder="Password" type="password" [(ngModel)]="registerPassword" />
        </div>
        <div class="mt-4">
          <button class="rounded-lg bg-cyan-600 px-4 py-2 font-medium text-white hover:bg-cyan-500" (click)="register()">Create account</button>
        </div>
        <p class="mt-3 text-sm text-slate-600">{{ message }}</p>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 class="text-xl font-semibold text-slate-800">Login</h3>
        <div class="mt-4 grid gap-3">
          <input class="rounded-lg border p-2" placeholder="Email" [(ngModel)]="loginEmail" />
          <input class="rounded-lg border p-2" placeholder="Password" type="password" [(ngModel)]="loginPassword" />
        </div>
        <div class="mt-4">
          <button class="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500" (click)="login()">Sign in</button>
        </div>
      </section>
    </div>

    <ng-template #loggedInView>
      <section class="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
        <h3 class="text-xl font-semibold text-emerald-700">You are already logged in</h3>
        <p class="mt-2 text-emerald-800">Login and Register options are hidden now for better user experience.</p>
        <a routerLink="/products" class="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500">Go to Medicines</a>
      </section>
    </ng-template>
  `
})
export class AuthPageComponent {
  registerName = '';
  registerEmail = '';
  registerPassword = '';
  loginEmail = '';
  loginPassword = '';
  message = '';
  constructor(private readonly authService: AuthService) {}

  isLoggedIn(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }

  register() {
    this.authService.register({ name: this.registerName, email: this.registerEmail, password: this.registerPassword }).subscribe({
      next: () => (this.message = 'Registered successfully'),
      error: err => (this.message = err?.error?.message ?? 'Registration failed')
    });
  }

  login() {
    this.authService.login({ email: this.loginEmail, password: this.loginPassword }).subscribe({
      next: () => {
        localStorage.setItem('isLoggedIn', 'true');
        this.message = 'Login successful';
      },
      error: err => (this.message = err?.error?.message ?? 'Login failed')
    });
  }
}
