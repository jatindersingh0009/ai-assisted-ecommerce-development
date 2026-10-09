-- This file is a direct copy of the main schema for migration-friendly initialization.
-- It mirrors the database design used by the application and is intended for local setup.

CREATE DATABASE IF NOT EXISTS `claude_ecommerce` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `claude_ecommerce`;

CREATE TABLE IF NOT EXISTS `ce_users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin','customer') NOT NULL DEFAULT 'customer',
  `status` ENUM('active','disabled','pending') NOT NULL DEFAULT 'active',
  `email_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `last_login_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ce_users_email` (`email`),
  KEY `idx_ce_users_role` (`role`),
  KEY `idx_ce_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ce_addresses` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `type` ENUM('billing','shipping') NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `company` VARCHAR(150) DEFAULT NULL,
  `address_1` VARCHAR(255) NOT NULL,
  `address_2` VARCHAR(255) DEFAULT NULL,
  `city` VARCHAR(100) NOT NULL,
  `state` VARCHAR(100) DEFAULT NULL,
  `postal_code` VARCHAR(50) NOT NULL,
  `country` VARCHAR(100) NOT NULL DEFAULT 'US',
  `phone` VARCHAR(50) DEFAULT NULL,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ce_addresses_user_id` (`user_id`),
  KEY `idx_ce_addresses_type` (`type`),
  CONSTRAINT `fk_ce_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `ce_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ce_categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `parent_id` BIGINT UNSIGNED DEFAULT NULL,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `image` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ce_categories_slug` (`slug`),
  KEY `idx_ce_categories_parent_id` (`parent_id`),
  KEY `idx_ce_categories_status` (`status`),
  CONSTRAINT `fk_ce_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `ce_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ce_products` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` BIGINT UNSIGNED DEFAULT NULL,
  `brand` VARCHAR(150) DEFAULT NULL,
  `sku` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `short_description` TEXT DEFAULT NULL,
  `description` LONGTEXT DEFAULT NULL,
  `price_cents` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `sale_price_cents` BIGINT UNSIGNED DEFAULT NULL,
  `cost_price_cents` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `stock_qty` INT NOT NULL DEFAULT 0,
  `stock_status` ENUM('in_stock','low_stock','out_of_stock') NOT NULL DEFAULT 'in_stock',
  `weight_grams` INT UNSIGNED DEFAULT NULL,
  `status` ENUM('active','draft','disabled') NOT NULL DEFAULT 'active',
  `featured` TINYINT(1) NOT NULL DEFAULT 0,
  `rating_avg` DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  `review_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ce_products_sku` (`sku`),
  UNIQUE KEY `uq_ce_products_slug` (`slug`),
  KEY `idx_ce_products_category_id` (`category_id`),
  KEY `idx_ce_products_status` (`status`),
  KEY `idx_ce_products_featured` (`featured`),
  CONSTRAINT `fk_ce_products_category` FOREIGN KEY (`category_id`) REFERENCES `ce_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ce_product_images` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `image_url` VARCHAR(255) NOT NULL,
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
  `sort_order` INT NOT NULL DEFAULT 0,
  `alt_text` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ce_product_images_product_id` (`product_id`),
  KEY `idx_ce_product_images_primary` (`is_primary`),
  CONSTRAINT `fk_ce_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `ce_products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ce_carts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED DEFAULT NULL,
  `session_token` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ce_carts_user_id` (`user_id`),
  KEY `idx_ce_carts_session_token` (`session_token`),
  CONSTRAINT `fk_ce_carts_user` FOREIGN KEY (`user_id`) REFERENCES `ce_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ce_cart_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `cart_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `price_snapshot_cents` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ce_cart_items_cart_product` (`cart_id`, `product_id`),
  KEY `idx_ce_cart_items_cart_id` (`cart_id`),
  KEY `idx_ce_cart_items_product_id` (`product_id`),
  CONSTRAINT `fk_ce_cart_items_cart` FOREIGN KEY (`cart_id`) REFERENCES `ce_carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ce_cart_items_product` FOREIGN KEY (`product_id`) REFERENCES `ce_products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ce_orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_number` VARCHAR(50) NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `billing_address_id` BIGINT UNSIGNED DEFAULT NULL,
  `shipping_address_id` BIGINT UNSIGNED DEFAULT NULL,
  `subtotal_cents` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `discount_cents` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `shipping_cost_cents` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `tax_cents` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `cod_fee_cents` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `grand_total_cents` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `payment_method` ENUM('stripe','paypal','cod') NOT NULL,
  `payment_status` ENUM('pending','paid','failed','refunded','partially_refunded') NOT NULL DEFAULT 'pending',
  `order_status` ENUM('pending','processing','confirmed','shipped','delivered','cancelled','refunded') NOT NULL DEFAULT 'pending',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ce_orders_order_number` (`order_number`),
  KEY `idx_ce_orders_user_id` (`user_id`),
  KEY `idx_ce_orders_payment_status` (`payment_status`),
  KEY `idx_ce_orders_order_status` (`order_status`),
  CONSTRAINT `fk_ce_orders_user` FOREIGN KEY (`user_id`) REFERENCES `ce_users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ce_order_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED DEFAULT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `sku` VARCHAR(100) NOT NULL,
  `price_cents` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `quantity` INT NOT NULL DEFAULT 1,
  `subtotal_cents` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ce_order_items_order_id` (`order_id`),
  KEY `idx_ce_order_items_product_id` (`product_id`),
  CONSTRAINT `fk_ce_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `ce_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ce_payments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `gateway` ENUM('stripe','paypal','cod') NOT NULL,
  `gateway_transaction_id` VARCHAR(255) DEFAULT NULL,
  `amount_cents` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `fee_cents` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `status` ENUM('pending','paid','failed','refunded','partially_refunded') NOT NULL DEFAULT 'pending',
  `payment_method` ENUM('stripe','paypal','cod') NOT NULL,
  `raw_payload` JSON DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ce_payments_order_id` (`order_id`),
  KEY `idx_ce_payments_user_id` (`user_id`),
  KEY `idx_ce_payments_gateway_txn` (`gateway_transaction_id`),
  CONSTRAINT `fk_ce_payments_order` FOREIGN KEY (`order_id`) REFERENCES `ce_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ce_payments_user` FOREIGN KEY (`user_id`) REFERENCES `ce_users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ce_coupons` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL,
  `type` ENUM('percentage','fixed') NOT NULL,
  `value` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `minimum_order_amount_cents` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `maximum_discount_cents` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `start_date` TIMESTAMP NULL DEFAULT NULL,
  `expiry_date` TIMESTAMP NULL DEFAULT NULL,
  `usage_limit` INT UNSIGNED DEFAULT NULL,
  `per_user_limit` INT UNSIGNED DEFAULT NULL,
  `status` ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ce_coupons_code` (`code`),
  KEY `idx_ce_coupons_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ce_coupon_usage` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `coupon_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `used_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ce_coupon_usage_order` (`order_id`),
  KEY `idx_ce_coupon_usage_coupon_id` (`coupon_id`),
  KEY `idx_ce_coupon_usage_user_id` (`user_id`),
  CONSTRAINT `fk_ce_coupon_usage_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `ce_coupons` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ce_coupon_usage_user` FOREIGN KEY (`user_id`) REFERENCES `ce_users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ce_coupon_usage_order` FOREIGN KEY (`order_id`) REFERENCES `ce_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ce_shipping_methods` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `price_cents` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `free_shipping_threshold_cents` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `status` ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ce_shipping_methods_code` (`code`),
  KEY `idx_ce_shipping_methods_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ce_settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key_name` VARCHAR(100) NOT NULL,
  `value` TEXT NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ce_settings_key_name` (`key_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `ce_settings` (`key_name`, `value`, `description`)
VALUES
('cod_fee_cents', '1000', 'Cash on delivery fee in cents'),
('shipping_default_price_cents', '1000', 'Default shipping price in cents'),
('currency', 'USD', 'Store default currency'),
('tax_rate', '0.08', 'Default tax rate as decimal')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
