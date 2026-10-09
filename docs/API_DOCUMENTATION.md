# API Documentation

## Base URL and authentication

- Local API: `http://localhost:3000`
- Protected endpoints use `Authorization: Bearer <JWT>`.
- Admin routes require an active `admin` or `super_admin`; admin permissions are checked on the server. `super_admin` has full access.
- JSON request and response bodies are used unless a route is a payment webhook.

## Health

- `GET /` returns API status.
- `GET /health` returns the health route response.

## Authentication and account

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout` (authenticated)
- `GET /api/auth/me` (authenticated)
- `PUT /api/auth/me` (authenticated profile update)
- `PUT /api/auth/password` (authenticated password change)
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

## Catalog and cart

- `GET /api/categories`, `GET /api/categories/tree`, `GET /api/categories/:id`
- `GET /api/products`, `GET /api/products/search`, `GET /api/products/featured`
- `GET /api/products/:id`, `GET /api/products/slug/:slug`
- Admin product mutations: `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`
- Authenticated cart: `GET /api/cart`, `POST /api/cart/items`, `PUT /api/cart/items`, `DELETE /api/cart/items/:id`, `DELETE /api/cart/clear`

## Checkout, orders, and addresses

- `GET /api/checkout/payment-methods`
- `POST /api/checkout/totals`, `POST /api/checkout/validate` (authenticated)
- `POST /api/orders` creates a database-backed order and validates that selected saved address IDs belong to the authenticated customer.
- `GET /api/orders`, `GET /api/orders/:id` (authenticated customer’s own orders)
- `GET /api/orders/addresses`, `POST /api/orders/addresses`, `PUT /api/orders/addresses/:id`, `DELETE /api/orders/addresses/:id` (authenticated; owner-scoped)

## Payments

- `POST /api/payments/stripe/create-intent`
- `POST /api/payments/stripe/confirm`
- `POST /api/payments/stripe/webhook`
- `POST /api/payments/paypal/create-order`
- `POST /api/payments/paypal/capture`
- `POST /api/payments/validate-amount`

Stripe and PayPal routes require provider configuration and an enabled gateway. Never send secret credentials from the frontend.

## Admin API

All `/api/admin/*` routes require an authenticated admin role and the relevant permission, except super-admin requests, which are unrestricted.

- Dashboard: `GET /api/admin/dashboard`
- Products: `GET /api/admin/products`; mutations use the `/api/products` routes above.
- Categories: `GET/POST /api/admin/categories`, `PUT/DELETE /api/admin/categories/:id`
- Orders: `GET /api/admin/orders`, `GET /api/admin/orders/:id`, `PATCH /api/admin/orders/:id/status`
- Customers: `GET /api/admin/customers`, `GET /api/admin/customers/:id`, `PATCH /api/admin/customers/:id/status`
- Users/roles: `GET/POST /api/admin/users`, `PUT/DELETE /api/admin/users/:id`
- Store and SMTP settings: `GET/PUT /api/admin/settings`, `GET/PUT /api/admin/smtp`, `POST /api/admin/smtp/test`
- Payment gateways: `GET/PUT /api/admin/payment-gateways`, `GET/PUT /api/admin/payment-gateways/credentials`, `POST /api/admin/payment-gateways/test/:provider`
- CMS: `/api/admin/content/pages`, `/api/admin/content/posts`; page/post CRUD uses GET/POST collection and PUT/DELETE `/:id`.
- CMS taxonomy: `/api/admin/content/taxonomy/categories` and `/api/admin/content/taxonomy/tags` with GET/POST and PUT/DELETE `/:id`.

## Response format

Success:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {}
}
```

See route validators and controllers for exact required fields and permitted values. SMTP and payment secret values are write-only and must never be returned in API responses.
