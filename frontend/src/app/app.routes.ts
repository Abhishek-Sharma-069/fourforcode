import { Routes } from '@angular/router';
import { AuthPageComponent } from './pages/auth/auth-page.component';
import { ProductsPageComponent } from './pages/products/products-page.component';
import { CartPageComponent } from './pages/cart/cart-page.component';
import { CheckoutPageComponent } from './pages/checkout/checkout-page.component';
import { OrdersPageComponent } from './pages/orders/orders-page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  { path: 'auth', component: AuthPageComponent },
  { path: 'products', component: ProductsPageComponent },
  { path: 'cart', component: CartPageComponent },
  { path: 'checkout', component: CheckoutPageComponent },
  { path: 'orders', component: OrdersPageComponent }
];
