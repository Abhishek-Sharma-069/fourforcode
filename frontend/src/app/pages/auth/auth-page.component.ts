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
    <div *ngIf="!isLoggedIn(); else loggedInView" class="rounded-3xl bg-cyan-700 py-10 md:py-16">
      <section class="mx-auto w-[92%] max-w-xl rounded-xl bg-slate-100 p-8 shadow-lg md:p-10">
        <div class="mb-6 flex rounded-xl bg-slate-200 p-1">
          <button class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold" [class.bg-white]="mode === 'login'" (click)="mode = 'login'">Login</button>
          <button class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold" [class.bg-white]="mode === 'register'" (click)="mode = 'register'">Register</button>
        </div>

        <h2 class="mb-6 text-center text-5xl font-light text-slate-700">{{ mode === 'login' ? 'Login' : 'Create Account' }}</h2>

        <ng-container *ngIf="mode === 'register'">
          <label class="mb-2 block text-base text-slate-700">Name:</label>
          <input class="mb-5 w-full rounded border border-slate-300 bg-white px-4 py-3 text-lg text-slate-700" placeholder="Enter full name" [(ngModel)]="registerName" />
        </ng-container>

        <ng-container *ngIf="mode === 'login'; else registerFields">
          <label class="mb-2 block text-base text-slate-700">Email:</label>
          <input class="mb-5 w-full rounded border border-slate-300 bg-white px-4 py-3 text-lg text-slate-700" placeholder="Enter email" [(ngModel)]="loginEmail" />

          <label class="mb-2 block text-base text-slate-700">Password:</label>
          <input class="mb-3 w-full rounded border border-slate-300 bg-white px-4 py-3 text-lg text-slate-700" placeholder="Enter password" [type]="showPassword ? 'text' : 'password'" [(ngModel)]="loginPassword" />
        </ng-container>

        <ng-template #registerFields>
          <label class="mb-2 block text-base text-slate-700">Email:</label>
          <input class="mb-5 w-full rounded border border-slate-300 bg-white px-4 py-3 text-lg text-slate-700" placeholder="Enter email" [(ngModel)]="registerEmail" />

          <label class="mb-2 block text-base text-slate-700">Password:</label>
          <input class="mb-3 w-full rounded border border-slate-300 bg-white px-4 py-3 text-lg text-slate-700" placeholder="Enter password" [type]="showPassword ? 'text' : 'password'" [(ngModel)]="registerPassword" />
        </ng-template>

        <label class="mb-5 flex items-center gap-2 text-base text-slate-700">
          <input type="checkbox" [(ngModel)]="showPassword" />
          Show Password
        </label>

        <button class="w-full rounded bg-cyan-700 px-4 py-3 text-lg font-medium text-white hover:bg-cyan-600" (click)="mode === 'login' ? login() : register()">
          {{ mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT' }}
        </button>

        <div class="mt-6 text-center text-lg text-slate-700">
          <p *ngIf="mode === 'login'">Don't have an account? <button class="text-cyan-700" (click)="mode = 'register'">Sign up</button></p>
          <p *ngIf="mode === 'register'">Already have an account? <button class="text-cyan-700" (click)="mode = 'login'">Sign in</button></p>
        </div>

        <p class="mt-3 text-center text-sm text-slate-600">{{ message }}</p>
      </section>
    </div>

    <ng-template #loggedInView>
      <section class="rounded-3xl border border-emerald-700 bg-emerald-950/40 p-6">
        <h3 class="text-xl font-semibold text-emerald-300">Session Active</h3>
        <p class="mt-2 text-emerald-200">You are logged in. Access auth cards is hidden by design.</p>
        <a routerLink="/products" class="mt-4 inline-block rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400">Go to Medicines</a>
      </section>
    </ng-template>
  `
})
export class AuthPageComponent {
  mode: 'login' | 'register' = 'login';
  registerName = '';
  registerEmail = '';
  registerPassword = '';
  loginEmail = '';
  loginPassword = '';
  showPassword = false;
  message = '';
  constructor(private readonly authService: AuthService) {}

  isLoggedIn(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }

  register() {
    if (!this.registerName.trim() || !this.registerEmail.trim() || !this.registerPassword.trim()) {
      this.message = 'Name, email, and password are required.';
      return;
    }

    this.authService.register({ name: this.registerName, email: this.registerEmail, password: this.registerPassword }).subscribe({
      next: (res) => {
        this.message = res.message || 'Registered successfully';
        this.mode = 'login';
        this.loginEmail = this.registerEmail;
        this.loginPassword = '';
      },
      error: err => (this.message = err?.error?.message ?? 'Registration failed')
    });
  }

  login() {
    if (!this.loginEmail.trim() || !this.loginPassword.trim()) {
      this.message = 'Email and password are required.';
      return;
    }

    this.authService.login({ email: this.loginEmail, password: this.loginPassword }).subscribe({
      next: (res) => {
        localStorage.setItem('isLoggedIn', 'true');
        if (res.user?.role) localStorage.setItem('userRole', res.user.role);
        if (res.user?.id) localStorage.setItem('userId', String(res.user.id));
        this.message = res.message || 'Login successful';
      },
      error: err => (this.message = err?.error?.message ?? 'Login failed')
    });
  }
}
