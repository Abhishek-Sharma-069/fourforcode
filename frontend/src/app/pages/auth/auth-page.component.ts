import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2 class="mb-4 text-2xl font-semibold">Login / Register</h2>
    <div class="grid gap-2 md:grid-cols-3">
      <input class="rounded border p-2" placeholder="Name" [(ngModel)]="name" />
      <input class="rounded border p-2" placeholder="Email" [(ngModel)]="email" />
      <input class="rounded border p-2" placeholder="Password" type="password" [(ngModel)]="password" />
    </div>
    <div class="mt-3 flex gap-2">
      <button class="rounded bg-blue-600 px-3 py-2 text-white" (click)="register()">Register</button>
      <button class="rounded bg-green-600 px-3 py-2 text-white" (click)="login()">Login</button>
    </div>
    <p class="mt-3 text-sm">{{ message }}</p>
  `
})
export class AuthPageComponent {
  name = '';
  email = '';
  password = '';
  message = '';
  constructor(private readonly authService: AuthService) {}

  register() {
    this.authService.register({ name: this.name, email: this.email, password: this.password }).subscribe({
      next: () => (this.message = 'Registered successfully'),
      error: err => (this.message = err?.error?.message ?? 'Registration failed')
    });
  }

  login() {
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => (this.message = 'Login successful'),
      error: err => (this.message = err?.error?.message ?? 'Login failed')
    });
  }
}
