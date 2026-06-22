-- Plagiarism Checker Database Backup
SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','customer','checker') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('active','suspended') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `per_file_charge` decimal(10,2) DEFAULT '10.00',
  `file_limit` int DEFAULT '10',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `uid` (`uid`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `uid`, `name`, `email`, `password`, `role`, `status`, `phone`, `company`, `created_at`, `updated_at`, `per_file_charge`, `file_limit`) VALUES ('1', 'USR-B6200D', 'prasad thilakarathna', 'prasad.thilak0302@gmail.com', '$2y$10$ZtW9hyOpBFd45fqT8lcSTuhTLvIfPzVFPIgak8nS5TRuRdHluQD9G', 'customer', 'active', '0711602970', '', '2026-06-19 23:33:35', '2026-06-21 11:33:33', '400.00', '10');
INSERT INTO `users` (`id`, `uid`, `name`, `email`, `password`, `role`, `status`, `phone`, `company`, `created_at`, `updated_at`, `per_file_charge`, `file_limit`) VALUES ('2', 'USR-D8FDDF', 'prasad thilakarathna', 'checker123@gmail.com', '$2y$10$42oeB2XuuU/nLq9x67CzqOJicCCHbK3zQtuIeraGoTdhJHWbYwrjq', 'checker', 'active', '0711602970', '', '2026-06-19 23:37:26', '2026-06-21 22:48:40', '10.00', '10');
INSERT INTO `users` (`id`, `uid`, `name`, `email`, `password`, `role`, `status`, `phone`, `company`, `created_at`, `updated_at`, `per_file_charge`, `file_limit`) VALUES ('3', 'USR-20740B', 'John Customer', 'john@example.com', '$2y$10$hF7fVOaOwth5BUca//Chauijf33.CWIWPzbfJ0TYBhV1pBmZEdbb2', 'customer', 'active', '', '', '2026-06-20 14:46:34', '2026-06-21 22:48:38', '15.00', '0');
INSERT INTO `users` (`id`, `uid`, `name`, `email`, `password`, `role`, `status`, `phone`, `company`, `created_at`, `updated_at`, `per_file_charge`, `file_limit`) VALUES ('4', 'USR-C8C660', 'Test Checker', 'testchecker@gmail.com', '$2y$10$hF7fVOaOwth5BUca//Chauijf33.CWIWPzbfJ0TYBhV1pBmZEdbb2', 'checker', 'active', '', '', '2026-06-20 15:01:39', '2026-06-21 22:48:37', '10.00', '10');
INSERT INTO `users` (`id`, `uid`, `name`, `email`, `password`, `role`, `status`, `phone`, `company`, `created_at`, `updated_at`, `per_file_charge`, `file_limit`) VALUES ('5', 'USR-E99A4E', 'Test Customer', 'testcustomer@gmail.com', '$2y$10$hF7fVOaOwth5BUca//Chauijf33.CWIWPzbfJ0TYBhV1pBmZEdbb2', 'customer', 'active', '', '', '2026-06-20 15:04:00', '2026-06-21 11:33:33', '10.00', '10');
INSERT INTO `users` (`id`, `uid`, `name`, `email`, `password`, `role`, `status`, `phone`, `company`, `created_at`, `updated_at`, `per_file_charge`, `file_limit`) VALUES ('6', 'USR-8BC8E9', 'Admin User', 'admin@example.com', '$2y$10$SMhbnQuL52.5gbMZdrT86OcfDIpacjN3wyVZR7qJnjMDy0A2uLkRO', 'admin', 'active', NULL, NULL, '2026-06-20 23:03:11', '2026-06-21 11:44:30', '10.00', '10');
INSERT INTO `users` (`id`, `uid`, `name`, `email`, `password`, `role`, `status`, `phone`, `company`, `created_at`, `updated_at`, `per_file_charge`, `file_limit`) VALUES ('8', 'USR-AB6564', 'eshan', 'eshan@gmail.com', '$2y$10$f5KM.O7N6k3eAjZPM8W6suBekgyymmmcxa0UB4pRV4tpJdaCOpeRW', 'customer', 'active', '0712254777', 'enex', '2026-06-21 22:32:34', '2026-06-21 22:34:17', '450.00', '20');
INSERT INTO `users` (`id`, `uid`, `name`, `email`, `password`, `role`, `status`, `phone`, `company`, `created_at`, `updated_at`, `per_file_charge`, `file_limit`) VALUES ('9', 'USR-RETAIL', 'Retail Customer', 'retail@system.com', '$2y$10$rV7nXboAb41M1dwH2sGSCupohBgbVORKnhAl3GnM8L0A0xEbEn49y', 'customer', 'active', NULL, NULL, '2026-06-21 23:15:24', '2026-06-21 23:15:24', '10.00', '10');
INSERT INTO `users` (`id`, `uid`, `name`, `email`, `password`, `role`, `status`, `phone`, `company`, `created_at`, `updated_at`, `per_file_charge`, `file_limit`) VALUES ('10', 'USR-TESTCHECKER', 'Test Checker', 'tempchecker@system.com', '$2y$10$Q3FnaFxCbz99JvFv0mYqd.18vlDHarLmc7a5Vwn6wSycBiJ5Obsza', 'checker', 'active', NULL, NULL, '2026-06-21 23:23:50', '2026-06-21 23:23:50', '10.00', '10');
INSERT INTO `users` (`id`, `uid`, `name`, `email`, `password`, `role`, `status`, `phone`, `company`, `created_at`, `updated_at`, `per_file_charge`, `file_limit`) VALUES ('11', 'USR-5CDC82', 'Test New Checker', 'newchecker@example.com', '$2y$10$7fkLfJcpO/6xJjd31d8d6ee82R/sSNhvprsl8mE8/8JddYZcOvtVS', 'checker', 'active', NULL, NULL, '2026-06-22 00:45:50', '2026-06-22 00:45:50', '0.00', '0');

DROP TABLE IF EXISTS `temporary_links`;
CREATE TABLE `temporary_links` (
  `id` int NOT NULL AUTO_INCREMENT,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_limit` int NOT NULL DEFAULT '5',
  `uploaded_count` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `files`;
CREATE TABLE `files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` int NOT NULL,
  `checker_id` int DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `service_type` enum('ai_detection','plagiarism_check','both') COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_file` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` bigint DEFAULT NULL,
  `file_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dispute_status` enum('none','reported','resolved') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'none',
  `status` enum('pending','accepted','in_progress','completed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `upload_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `accepted_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `checker_paid` tinyint(1) DEFAULT '0',
  `customer_paid` tinyint(1) DEFAULT '0',
  `temporary_link_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uid` (`uid`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_checker_id` (`checker_id`),
  KEY `idx_status` (`status`),
  KEY `fk_temporary_link` (`temporary_link_id`),
  CONSTRAINT `files_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `files_ibfk_2` FOREIGN KEY (`checker_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_temporary_link` FOREIGN KEY (`temporary_link_id`) REFERENCES `temporary_links` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `files` (`id`, `uid`, `customer_id`, `checker_id`, `title`, `description`, `service_type`, `original_file`, `original_filename`, `file_size`, `file_type`, `dispute_status`, `status`, `upload_date`, `accepted_at`, `completed_at`, `created_at`, `updated_at`, `checker_paid`, `customer_paid`, `temporary_link_id`) VALUES ('27', 'DOC-DF0E95', '9', '2', 'Research Methods in Health and Social Care - Kanchanamala - 251218026 (1) (1)', NULL, 'both', '1782066085-137611973.docx', 'Research Methods in Health and Social Care - Kanchanamala - 251218026 (1) (1).docx', '59758', 'DOCX', 'none', 'completed', '2026-06-21 23:51:25', '2026-06-21 23:52:15', '2026-06-21 23:52:35', '2026-06-21 23:51:25', '2026-06-22 01:01:36', '1', '0', NULL);
INSERT INTO `files` (`id`, `uid`, `customer_id`, `checker_id`, `title`, `description`, `service_type`, `original_file`, `original_filename`, `file_size`, `file_type`, `dispute_status`, `status`, `upload_date`, `accepted_at`, `completed_at`, `created_at`, `updated_at`, `checker_paid`, `customer_paid`, `temporary_link_id`) VALUES ('28', 'DOC-B92F06', '9', '2', 'Research Methods in Health and Social Care - Kanchanamala - 251218026 (1) (1) (1)', NULL, 'both', '1782066216-143021049.docx', 'Research Methods in Health and Social Care - Kanchanamala - 251218026 (1) (1) (1).docx', '59758', 'DOCX', 'none', 'completed', '2026-06-21 23:53:36', '2026-06-21 23:54:05', '2026-06-21 23:54:21', '2026-06-21 23:53:36', '2026-06-22 01:01:36', '1', '0', NULL);
INSERT INTO `files` (`id`, `uid`, `customer_id`, `checker_id`, `title`, `description`, `service_type`, `original_file`, `original_filename`, `file_size`, `file_type`, `dispute_status`, `status`, `upload_date`, `accepted_at`, `completed_at`, `created_at`, `updated_at`, `checker_paid`, `customer_paid`, `temporary_link_id`) VALUES ('29', 'DOC-E585BE', '9', '2', 'Research Methods in Health and Social Care - Kanchanamala - 251218026 (1) (1) (1) (1)', NULL, 'both', '1782069021-428522564.docx', 'Research Methods in Health and Social Care - Kanchanamala - 251218026 (1) (1) (1) (1).docx', '59758', 'DOCX', 'none', 'completed', '2026-06-22 00:40:21', '2026-06-22 01:00:01', '2026-06-22 01:00:18', '2026-06-22 00:40:21', '2026-06-22 01:01:36', '1', '1', NULL);

DROP TABLE IF EXISTS `reports`;
CREATE TABLE `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `file_id` int NOT NULL,
  `ai_report` longtext COLLATE utf8mb4_unicode_ci,
  `ai_report_file` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ai_report_original_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ai_percentage` float DEFAULT NULL,
  `plagiarism_report` longtext COLLATE utf8mb4_unicode_ci,
  `plagiarism_report_file` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plagiarism_report_original_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plagiarism_percentage` float DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `file_id` (`file_id`),
  KEY `idx_file_id` (`file_id`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`file_id`) REFERENCES `files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `reports` (`id`, `file_id`, `ai_report`, `ai_report_file`, `ai_report_original_name`, `ai_percentage`, `plagiarism_report`, `plagiarism_report_file`, `plagiarism_report_original_name`, `plagiarism_percentage`, `remarks`, `uploaded_at`, `created_at`, `updated_at`) VALUES ('3', '2', NULL, 'ai-1781972261-257461.pdf', 'plagiarism-report-1 (1).pdf', '0', NULL, 'plag-1781972261-305358.pdf', 'ai-report-1 (1).pdf', '0', NULL, '2026-06-20 21:02:11', '2026-06-20 21:02:11', '2026-06-20 21:47:41');
INSERT INTO `reports` (`id`, `file_id`, `ai_report`, `ai_report_file`, `ai_report_original_name`, `ai_percentage`, `plagiarism_report`, `plagiarism_report_file`, `plagiarism_report_original_name`, `plagiarism_percentage`, `remarks`, `uploaded_at`, `created_at`, `updated_at`) VALUES ('4', '4', NULL, 'ai-1781980577-893680.docx', 'Distinction_Level_Assignment.docx', '0', NULL, 'plag-1781980577-860403.pdf', 'A610 - Research Proposal. - 1 docx (1).pdf', '0', NULL, '2026-06-20 22:24:28', '2026-06-20 22:24:28', '2026-06-21 00:06:17');
INSERT INTO `reports` (`id`, `file_id`, `ai_report`, `ai_report_file`, `ai_report_original_name`, `ai_percentage`, `plagiarism_report`, `plagiarism_report_file`, `plagiarism_report_original_name`, `plagiarism_percentage`, `remarks`, `uploaded_at`, `created_at`, `updated_at`) VALUES ('5', '20', NULL, 'ai-1782041720-711425.pdf', 'ai-report-1 (1).pdf', '0', NULL, 'plag-1782041720-110468.pdf', 'plagiarism-report-1 (1).pdf', '0', NULL, '2026-06-21 17:05:21', '2026-06-21 17:05:21', '2026-06-21 17:05:21');
INSERT INTO `reports` (`id`, `file_id`, `ai_report`, `ai_report_file`, `ai_report_original_name`, `ai_percentage`, `plagiarism_report`, `plagiarism_report_file`, `plagiarism_report_original_name`, `plagiarism_percentage`, `remarks`, `uploaded_at`, `created_at`, `updated_at`) VALUES ('6', '23', NULL, 'ai-1782064434-539251.pdf', 'ai_report.pdf', '15', NULL, 'plag-1782064434-141729.pdf', 'plag_report.pdf', '5', 'Looks clean', '2026-06-21 23:23:54', '2026-06-21 23:23:54', '2026-06-21 23:23:54');
INSERT INTO `reports` (`id`, `file_id`, `ai_report`, `ai_report_file`, `ai_report_original_name`, `ai_percentage`, `plagiarism_report`, `plagiarism_report_file`, `plagiarism_report_original_name`, `plagiarism_percentage`, `remarks`, `uploaded_at`, `created_at`, `updated_at`) VALUES ('7', '26', NULL, 'ai-1782064823-375342.pdf', 'ai-report-1 (1).pdf', '0', NULL, 'plag-1782064823-638497.pdf', 'plagiarism-report-1 (1).pdf', '0', NULL, '2026-06-21 23:30:23', '2026-06-21 23:30:23', '2026-06-21 23:30:23');
INSERT INTO `reports` (`id`, `file_id`, `ai_report`, `ai_report_file`, `ai_report_original_name`, `ai_percentage`, `plagiarism_report`, `plagiarism_report_file`, `plagiarism_report_original_name`, `plagiarism_percentage`, `remarks`, `uploaded_at`, `created_at`, `updated_at`) VALUES ('8', '27', NULL, 'ai-1782066155-971161.pdf', 'ai-report-1 (1) (1).pdf', '0', NULL, 'plag-1782066155-265506.pdf', 'plagiarism-report-1 (1) (1).pdf', '0', NULL, '2026-06-21 23:52:35', '2026-06-21 23:52:35', '2026-06-21 23:52:35');
INSERT INTO `reports` (`id`, `file_id`, `ai_report`, `ai_report_file`, `ai_report_original_name`, `ai_percentage`, `plagiarism_report`, `plagiarism_report_file`, `plagiarism_report_original_name`, `plagiarism_percentage`, `remarks`, `uploaded_at`, `created_at`, `updated_at`) VALUES ('9', '28', NULL, 'ai-1782066261-805657.pdf', 'ai-report-1 (1) (1).pdf', '0', NULL, 'plag-1782066261-584451.pdf', 'plagiarism-report-1 (1) (1).pdf', '0', NULL, '2026-06-21 23:54:21', '2026-06-21 23:54:21', '2026-06-21 23:54:21');
INSERT INTO `reports` (`id`, `file_id`, `ai_report`, `ai_report_file`, `ai_report_original_name`, `ai_percentage`, `plagiarism_report`, `plagiarism_report_file`, `plagiarism_report_original_name`, `plagiarism_percentage`, `remarks`, `uploaded_at`, `created_at`, `updated_at`) VALUES ('10', '29', NULL, 'ai-1782070218-108527.pdf', 'ai-report-1 (1) (1).pdf', '0', NULL, 'plag-1782070218-677162.pdf', 'plagiarism-report-1 (1) (1).pdf', '0', NULL, '2026-06-22 01:00:18', '2026-06-22 01:00:18', '2026-06-22 01:00:18');

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `file_id` int DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('info','warning','success','error') COLLATE utf8mb4_unicode_ci DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `file_id` (`file_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_read` (`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`file_id`) REFERENCES `files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `notifications` (`id`, `user_id`, `file_id`, `title`, `message`, `type`, `is_read`, `created_at`, `updated_at`) VALUES ('50', '2', '27', 'New Retail File Available', 'New document \"Research Methods in Health and Social Care - Kanchanamala - 251218026 (1) (1)\" (Retail Customer) is available for checking', 'info', '0', '2026-06-21 23:51:25', '2026-06-21 23:51:25');
INSERT INTO `notifications` (`id`, `user_id`, `file_id`, `title`, `message`, `type`, `is_read`, `created_at`, `updated_at`) VALUES ('51', '4', '27', 'New Retail File Available', 'New document \"Research Methods in Health and Social Care - Kanchanamala - 251218026 (1) (1)\" (Retail Customer) is available for checking', 'info', '0', '2026-06-21 23:51:25', '2026-06-21 23:51:25');
INSERT INTO `notifications` (`id`, `user_id`, `file_id`, `title`, `message`, `type`, `is_read`, `created_at`, `updated_at`) VALUES ('52', '10', '27', 'New Retail File Available', 'New document \"Research Methods in Health and Social Care - Kanchanamala - 251218026 (1) (1)\" (Retail Customer) is available for checking', 'info', '0', '2026-06-21 23:51:25', '2026-06-21 23:51:25');
INSERT INTO `notifications` (`id`, `user_id`, `file_id`, `title`, `message`, `type`, `is_read`, `created_at`, `updated_at`) VALUES ('53', '9', '27', 'File Accepted', 'Your file \"Research Methods in Health and Social Care - Kanchanamala - 251218026 (1) (1)\" has been accepted for processing', 'success', '0', '2026-06-21 23:52:15', '2026-06-21 23:52:15');
INSERT INTO `notifications` (`id`, `user_id`, `file_id`, `title`, `message`, `type`, `is_read`, `created_at`, `updated_at`) VALUES ('54', '9', '27', 'Reports Ready', 'Your document \"Research Methods in Health and Social Care - Kanchanamala - 251218026 (1) (1)\" has been checked. Your reports are ready to download.', 'success', '0', '2026-06-21 23:52:35', '2026-06-21 23:52:35');
INSERT INTO `notifications` (`id`, `user_id`, `file_id`, `title`, `message`, `type`, `is_read`, `created_at`, `updated_at`) VALUES ('55', '2', '28', 'New Retail File Available', 'New document \"Research Methods in Health and Social Care - Kanchanamala - 251218026 (1) (1) (1)\" (Retail Customer) is available for checking', 'info', '0', '2026-06-21 23:53:36', '2026-06-21 23:53:36');
INSERT INTO `notifications` (`id`, `user_id`, `file_id`, `title`, `message`, `type`, `is_read`, `created_at`, `updated_at`) VALUES ('56', '4', '28', 'New Retail File Available', 'New document \"Research Methods in Health and Social Care - Kanchanamala - 251218026 (1) (1) (1)\" (Retail Customer) is available for checking', 'info', '0', '2026-06-21 23:53:36', '2026-06-21 23:53:36');
INSERT INTO `notifications` (`id`, `user_id`, `file_id`, `title`, `message`, `type`, `is_read`, `created_at`, `updated_at`) VALUES ('57', '10', '28', 'New Retail File Available', 'New document \"Research Methods in Health and Social Care - Kanchanamala - 251218026 (1) (1) (1)\" (Retail Customer) is available for checking', 'info', '0', '2026-06-21 23:53:36', '2026-06-21 23:53:36');
INSERT INTO `notifications` (`id`, `user_id`, `file_id`, `title`, `message`, `type`, `is_read`, `created_at`, `updated_at`) VALUES ('58', '9', '28', 'File Accepted', 'Your file \"Research Methods in Health and Social Care - Kanchanamala - 251218026 (1) (1) (1)\" has been accepted for processing', 'success', '0', '2026-06-21 23:54:05', '2026-06-21 23:54:05');
INSERT INTO `notifications` (`id`, `user_id`, `file_id`, `title`, `message`, `type`, `is_read`, `created_at`, `updated_at`) VALUES ('59', '9', '28', 'Reports Ready', 'Your document \"Research Methods in Health and Social Care - Kanchanamala - 251218026 (1) (1) (1)\" has been checked. Your reports are ready to download.', 'success', '0', '2026-06-21 23:54:21', '2026-06-21 23:54:21');
INSERT INTO `notifications` (`id`, `user_id`, `file_id`, `title`, `message`, `type`, `is_read`, `created_at`, `updated_at`) VALUES ('60', '2', '29', 'New Retail File Available', 'New document \"Research Methods in Health and Social Care - Kanchanamala - 251218026 (1) (1) (1) (1)\" (Retail Customer) is available for checking', 'info', '0', '2026-06-22 00:40:21', '2026-06-22 00:40:21');
INSERT INTO `notifications` (`id`, `user_id`, `file_id`, `title`, `message`, `type`, `is_read`, `created_at`, `updated_at`) VALUES ('61', '4', '29', 'New Retail File Available', 'New document \"Research Methods in Health and Social Care - Kanchanamala - 251218026 (1) (1) (1) (1)\" (Retail Customer) is available for checking', 'info', '0', '2026-06-22 00:40:21', '2026-06-22 00:40:21');
INSERT INTO `notifications` (`id`, `user_id`, `file_id`, `title`, `message`, `type`, `is_read`, `created_at`, `updated_at`) VALUES ('62', '10', '29', 'New Retail File Available', 'New document \"Research Methods in Health and Social Care - Kanchanamala - 251218026 (1) (1) (1) (1)\" (Retail Customer) is available for checking', 'info', '0', '2026-06-22 00:40:21', '2026-06-22 00:40:21');
INSERT INTO `notifications` (`id`, `user_id`, `file_id`, `title`, `message`, `type`, `is_read`, `created_at`, `updated_at`) VALUES ('63', '9', '29', 'File Accepted', 'Your file \"Research Methods in Health and Social Care - Kanchanamala - 251218026 (1) (1) (1) (1)\" has been accepted for processing', 'success', '0', '2026-06-22 01:00:01', '2026-06-22 01:00:01');
INSERT INTO `notifications` (`id`, `user_id`, `file_id`, `title`, `message`, `type`, `is_read`, `created_at`, `updated_at`) VALUES ('64', '9', '29', 'Reports Ready', 'Your document \"Research Methods in Health and Social Care - Kanchanamala - 251218026 (1) (1) (1) (1)\" has been checked. Your reports are ready to download.', 'success', '0', '2026-06-22 01:00:18', '2026-06-22 01:00:18');

DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `file_id` int NOT NULL,
  `user_id` int NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_file_id` (`file_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`file_id`) REFERENCES `files` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE `activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` int DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `key_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `key_value` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`key_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `settings` (`key_name`, `key_value`) VALUES ('maintenance_mode', '0');

SET FOREIGN_KEY_CHECKS=1;
