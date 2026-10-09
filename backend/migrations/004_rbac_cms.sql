ALTER TABLE `ce_users`
  MODIFY `role` VARCHAR(30) NOT NULL DEFAULT 'customer',
  ADD COLUMN `permissions` JSON DEFAULT NULL;

UPDATE `ce_users` SET `role` = 'super_admin' WHERE `email` = 'admin@claude.local' AND `role` = 'admin';

CREATE TABLE IF NOT EXISTS `ce_content_categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(180) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ce_content_categories_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ce_content_tags` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(120) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ce_content_tags_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ce_content_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `type` ENUM('page','post') NOT NULL,
  `category_id` BIGINT UNSIGNED DEFAULT NULL,
  `author_id` BIGINT UNSIGNED DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `excerpt` TEXT DEFAULT NULL,
  `body` LONGTEXT NOT NULL,
  `status` ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  `published_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ce_content_items_type_slug` (`type`,`slug`),
  KEY `idx_ce_content_items_type_status` (`type`,`status`),
  CONSTRAINT `fk_ce_content_items_category` FOREIGN KEY (`category_id`) REFERENCES `ce_content_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ce_content_items_author` FOREIGN KEY (`author_id`) REFERENCES `ce_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ce_content_item_tags` (
  `content_item_id` BIGINT UNSIGNED NOT NULL,
  `tag_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`content_item_id`,`tag_id`),
  CONSTRAINT `fk_ce_content_item_tags_item` FOREIGN KEY (`content_item_id`) REFERENCES `ce_content_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ce_content_item_tags_tag` FOREIGN KEY (`tag_id`) REFERENCES `ce_content_tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;