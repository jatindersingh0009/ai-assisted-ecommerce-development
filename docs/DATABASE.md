# Database Guide

The application uses MySQL or compatible MariaDB. The default local database name is `claude_ecommerce` and table prefix is `ce_`; configure the database host/user/password in the private `backend/.env` file. Do not store database passwords in this document or commit them to Git.

## Schema and migrations

- Base commerce schema: [001_init_schema.sql](../backend/migrations/001_init_schema.sql)
- Demo development seed: [002_seed_demo_data.sql](../backend/migrations/002_seed_demo_data.sql)
- Password recovery: [003_password_resets.sql](../backend/migrations/003_password_resets.sql)
- Roles, permissions, and CMS tables: [004_rbac_cms.sql](../backend/migrations/004_rbac_cms.sql)

Initialize or verify a local database from the backend directory:

```bash
npm run db:init
```

The server also attempts initialization at startup. The initializer requires permissions to create the database and schema; see the [new-system guide](MOVE_TO_NEW_SYSTEM.md) for local MySQL setup and production privilege cautions.

## Main data areas

- Users, role permissions, password resets, and saved addresses
- Product categories, products, and product images
- Carts and cart items
- Orders, order item snapshots, and payments
- Coupons, coupon usage, shipping methods, and key/value settings
- CMS pages/posts, content categories/tags, and content-tag relationships

## Backups

Use `mysqldump` with `--single-transaction` for a consistent InnoDB backup. Database exports contain personal/order data and should be encrypted and kept outside the source repository. Preserve `PAYMENT_CREDENTIALS_KEY` securely alongside backups if settings contain encrypted provider or SMTP credentials.
