USE `claude_ecommerce`;

INSERT INTO `ce_users` (`id`, `first_name`, `last_name`, `email`, `password_hash`, `role`, `status`, `email_verified`)
VALUES
  (1, 'Admin', 'User', 'admin@claude.local', '$2a$10$EivtGGvz4RubXdewFlBfg.5tA4Xkk1mlOWsH3HAPYTgKtxAjtBjgK', 'admin', 'active', 1),
  (2, 'Jane', 'Customer', 'customer@claude.local', '$2a$10$7X8aTiwcU2VMeCMnJsBgjuqo9hWubE0Sjj2URX61B/vDNPssZLVJq', 'customer', 'active', 1)
ON DUPLICATE KEY UPDATE
  `first_name` = VALUES(`first_name`),
  `last_name` = VALUES(`last_name`),
  `password_hash` = VALUES(`password_hash`),
  `role` = VALUES(`role`),
  `status` = VALUES(`status`),
  `email_verified` = VALUES(`email_verified`);

INSERT INTO `ce_categories` (`id`, `parent_id`, `name`, `slug`, `description`, `image`, `status`, `sort_order`)
VALUES
  (1, NULL, 'Furniture', 'furniture', 'Modern, durable furniture for everyday living.', NULL, 'active', 1),
  (2, NULL, 'Lighting', 'lighting', 'Warm and stylish lighting for every room.', NULL, 'active', 2),
  (3, NULL, 'Home Decor', 'home-decor', 'Decor pieces to brighten up your space.', NULL, 'active', 3),
  (4, NULL, 'Storage', 'storage', 'Smart storage for clean and organized living.', NULL, 'active', 4)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `slug` = VALUES(`slug`),
  `description` = VALUES(`description`),
  `status` = VALUES(`status`),
  `sort_order` = VALUES(`sort_order`);

INSERT INTO `ce_products` (`id`, `category_id`, `brand`, `sku`, `name`, `slug`, `short_description`, `description`, `price_cents`, `sale_price_cents`, `cost_price_cents`, `stock_qty`, `stock_status`, `status`, `featured`, `rating_avg`, `review_count`)
VALUES
  (1, 1, 'Northline', 'NL-CHAIR-001', 'Modern Lounge Chair', 'modern-lounge-chair', 'Minimal lounge chair with soft fabric seating.', 'A premium lounge chair designed for compact apartments and modern homes.', 21999, 19999, 12000, 12, 'in_stock', 'active', 1, 4.80, 42),
  (2, 4, 'Oak & Co.', 'OC-SHELF-002', 'Oak Storage Shelf', 'oak-storage-shelf', 'Tall shelf with generous storage for books and decor.', 'Clean-lined oak storage shelf designed to balance function with minimalist style.', 26999, 24999, 15000, 8, 'in_stock', 'active', 1, 4.70, 31),
  (3, 2, 'Luma', 'LM-LAMP-003', 'Minimal Floor Lamp', 'minimal-floor-lamp', 'Soft ambient floor lamp with warm tone illumination.', 'A slim floor lamp with a matte finish and touch dimming for a calming evening glow.', 10999, 9999, 6200, 18, 'in_stock', 'active', 0, 4.60, 24),
  (4, 3, 'Cedar House', 'CH-TABLE-004', 'Cedar Accent Table', 'cedar-accent-table', 'Compact accent table with natural wood texture.', 'A warm wood accent table with a statement profile for reading corners and lounges.', 17999, 16999, 9800, 11, 'in_stock', 'active', 0, 4.50, 19),
  (5, 1, 'Haven', 'HV-BENCH-005', 'Ergo Entry Bench', 'ergo-entry-bench', 'Entry bench with stylish storage underneath.', 'This durable entry bench adds a practical seating area and hidden storage to your foyer.', 15999, 14999, 8600, 15, 'in_stock', 'active', 1, 4.40, 16)
ON DUPLICATE KEY UPDATE
  `category_id` = VALUES(`category_id`),
  `brand` = VALUES(`brand`),
  `name` = VALUES(`name`),
  `slug` = VALUES(`slug`),
  `short_description` = VALUES(`short_description`),
  `description` = VALUES(`description`),
  `price_cents` = VALUES(`price_cents`),
  `sale_price_cents` = VALUES(`sale_price_cents`),
  `cost_price_cents` = VALUES(`cost_price_cents`),
  `stock_qty` = VALUES(`stock_qty`),
  `stock_status` = VALUES(`stock_status`),
  `status` = VALUES(`status`),
  `featured` = VALUES(`featured`),
  `rating_avg` = VALUES(`rating_avg`),
  `review_count` = VALUES(`review_count`);

INSERT INTO `ce_shipping_methods` (`id`, `name`, `code`, `price_cents`, `free_shipping_threshold_cents`, `status`)
VALUES
  (1, 'Standard Shipping', 'standard', 1000, 50000, 'active'),
  (2, 'Express Shipping', 'express', 2500, 80000, 'active')
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `code` = VALUES(`code`),
  `price_cents` = VALUES(`price_cents`),
  `free_shipping_threshold_cents` = VALUES(`free_shipping_threshold_cents`),
  `status` = VALUES(`status`);

INSERT INTO `ce_settings` (`key_name`, `value`, `description`)
VALUES
  ('cod_fee_cents', '1000', 'Cash on delivery fee in cents'),
  ('shipping_default_price_cents', '1000', 'Default shipping price in cents'),
  ('currency', 'USD', 'Store default currency'),
  ('tax_rate', '0.08', 'Default tax rate as decimal')
ON DUPLICATE KEY UPDATE
  `value` = VALUES(`value`),
  `description` = VALUES(`description`);
