import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import ProductListView from '../views/ProductListView.vue';
import ProductDetailView from '../views/ProductDetailView.vue';
import CartView from '../views/CartView.vue';
import CheckoutView from '../views/CheckoutView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import AccountView from '../views/AccountView.vue';
import AdminView from '../views/AdminView.vue';
import OrderDetailView from '../views/OrderDetailView.vue';
import AdminProductsView from '../views/AdminProductsView.vue';
import PaymentSuccessView from '../views/PaymentSuccessView.vue';
import ForgotPasswordView from '../views/ForgotPasswordView.vue';
import ResetPasswordView from '../views/ResetPasswordView.vue';
import AdminCategoriesView from '../views/AdminCategoriesView.vue';
import AdminOrdersView from '../views/AdminOrdersView.vue';
import AdminCustomersView from '../views/AdminCustomersView.vue';
import AdminSettingsView from '../views/AdminSettingsView.vue';
import AdminPaymentGatewaysView from '../views/AdminPaymentGatewaysView.vue';
import AdminUsersView from '../views/AdminUsersView.vue';
import AdminContentView from '../views/AdminContentView.vue';
import { useAuthStore } from '../stores/authStore';
import { adminPath } from '../config/adminPath';

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/products', name: 'products', component: ProductListView },
  { path: '/products/:slug', name: 'product-detail', component: ProductDetailView, props: true },
  { path: '/cart', name: 'cart', component: CartView },
  { path: '/checkout', name: 'checkout', component: CheckoutView, meta: { requiresAuth: true } },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/forgot-password', name: 'forgot-password', component: ForgotPasswordView },
  { path: '/reset-password', name: 'reset-password', component: ResetPasswordView },
  { path: '/register', name: 'register', component: RegisterView },
  { path: '/account', name: 'account', component: AccountView, meta: { requiresAuth: true } },
  { path: '/orders/:id', name: 'order-detail', component: OrderDetailView, props: true, meta: { requiresAuth: true } },
  { path: adminPath, name: 'admin', component: AdminView, meta: { requiresAdmin: true, permission: 'dashboard.view' } },
  { path: `${adminPath}/products`, name: 'admin-products', component: AdminProductsView, meta: { requiresAdmin: true, permission: 'products.view' } },
  { path: `${adminPath}/categories`, name: 'admin-categories', component: AdminCategoriesView, meta: { requiresAdmin: true, permission: 'categories.view' } },
  { path: `${adminPath}/orders`, name: 'admin-orders', component: AdminOrdersView, meta: { requiresAdmin: true, permission: 'orders.view' } },
  { path: `${adminPath}/customers`, name: 'admin-customers', component: AdminCustomersView, meta: { requiresAdmin: true, permission: 'customers.view' } },
  { path: `${adminPath}/users`, name: 'admin-users', component: AdminUsersView, meta: { requiresAdmin: true, permission: 'users.view' } },
  { path: `${adminPath}/settings`, name: 'admin-settings', component: AdminSettingsView, meta: { requiresAdmin: true, permission: 'settings.view' } },
  { path: `${adminPath}/payment-gateways`, name: 'admin-payment-gateways', component: AdminPaymentGatewaysView, meta: { requiresAdmin: true, permission: 'payment_gateways.view' } },
  { path: `${adminPath}/pages`, name: 'admin-pages', component: AdminContentView, props: { contentType: 'pages' }, meta: { requiresAdmin: true, permission: 'content.view' } },
  { path: `${adminPath}/posts`, name: 'admin-posts', component: AdminContentView, props: { contentType: 'posts' }, meta: { requiresAdmin: true, permission: 'content.view' } },
  { path: '/payment-success', name: 'payment-success', component: PaymentSuccessView },
  ...(adminPath === '/admin' ? [] : [
    { path: '/admin', redirect: adminPath },
    {
      path: '/admin/:pathMatch(.*)*',
      redirect: (to) => ({ path: `${adminPath}${to.path.slice('/admin'.length)}`, query: to.query, hash: to.hash }),
    },
  ]),
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  if ((to.meta.requiresAdmin || to.meta.requiresAuth) && authStore.token) {
    await authStore.hydrateUser();
  }
  if (to.meta.requiresAdmin && authStore.token && !['admin', 'super_admin'].includes(authStore.user?.role)) {
    return { name: 'home' };
  }
  if (to.meta.requiresAdmin && !authStore.token) return { name: 'home' };
  if (to.meta.requiresAdmin && authStore.user?.role !== 'super_admin' && authStore.user?.permissions?.[to.meta.permission] !== true) return { name: 'home' };
  if (to.meta.requiresAuth && !authStore.token) return { name: 'login' };

  return true;
});

export default router;
