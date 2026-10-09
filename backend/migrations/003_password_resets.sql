CREATE TABLE IF NOT EXISTS `ce_password_resets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ce_password_resets_token_hash` (`token_hash`),
  KEY `idx_ce_password_resets_user_id` (`user_id`),
  KEY `idx_ce_password_resets_expires_at` (`expires_at`),
  CONSTRAINT `fk_ce_password_resets_user` FOREIGN KEY (`user_id`) REFERENCES `ce_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;