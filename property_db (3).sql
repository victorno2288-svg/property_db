-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 01, 2026 at 08:21 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `property_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_settings`
--

CREATE TABLE `admin_settings` (
  `key_name` varchar(100) NOT NULL,
  `value` text DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin_settings`
--

INSERT INTO `admin_settings` (`key_name`, `value`, `updated_at`) VALUES
('auto_approve_password', '1', '2026-04-01 11:48:12');

-- --------------------------------------------------------

--
-- Table structure for table `admin_users`
--

CREATE TABLE `admin_users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL COMMENT 'ชื่อผู้ใช้ (ไม่ซ้ำกัน)',
  `full_name` varchar(150) NOT NULL COMMENT 'ชื่อ-นามสกุลจริง',
  `display_name` varchar(100) DEFAULT NULL COMMENT 'ชื่อที่แสดงใน Admin Panel',
  `email` varchar(100) NOT NULL COMMENT 'อีเมล (ไม่ซ้ำกัน)',
  `password_hash` varchar(255) NOT NULL COMMENT 'bcrypt hash',
  `phone` varchar(20) DEFAULT NULL,
  `line_id` varchar(50) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `department` enum('super_admin','property_manager','sales','content','viewer') NOT NULL DEFAULT 'property_manager',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1=ใช้งานได้, 0=ระงับ',
  `last_login` timestamp NULL DEFAULT NULL,
  `login_count` int(11) NOT NULL DEFAULT 0,
  `created_by` int(11) DEFAULT NULL COMMENT 'FK admin_users.id ที่สร้าง account นี้',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='เจ้าหน้าที่ LoanDD ที่จัดการเว็บขายบ้าน (แยกจาก users)';

--
-- Dumping data for table `admin_users`
--

INSERT INTO `admin_users` (`id`, `username`, `full_name`, `display_name`, `email`, `password_hash`, `phone`, `line_id`, `avatar_url`, `department`, `is_active`, `last_login`, `login_count`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'superadmin', 'LoanDD Super Admin', 'Super Admin', 'loandd02@gmail.com', '$2a$10$/xHvBTmSCIw3l2xKBH7Z1OUevoD48Z9ivG.T6wdU9MHllAARRpI4W', '000000000', NULL, NULL, 'super_admin', 1, NULL, 0, NULL, '2026-03-30 02:59:54', '2026-04-01 06:17:22'),
(4, 'phakchira', 'ภัคจิรา อุดมนา', 'แฟร์', 'loandd0@gmail.com', '$2a$10$/xHvBTmSCIw3l2xKBH7Z1OUevoD48Z9ivG.T6wdU9MHllAARRpI4W', NULL, NULL, NULL, 'property_manager', 1, '2026-04-01 01:36:52', 18, NULL, '2026-03-30 04:16:05', '2026-04-01 06:17:22');

-- --------------------------------------------------------

--
-- Table structure for table `nearby_places`
--

CREATE TABLE `nearby_places` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `place_type` enum('bts','mrt','school','hospital','mall','restaurant','airport') NOT NULL,
  `place_name` varchar(255) NOT NULL,
  `distance_km` decimal(5,2) DEFAULT NULL,
  `travel_time_min` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_change_requests`
--

CREATE TABLE `password_change_requests` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `note` varchar(500) DEFAULT NULL,
  `requested_at` datetime DEFAULT current_timestamp(),
  `resolved_at` datetime DEFAULT NULL,
  `new_password_hash` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `password_change_requests`
--

INSERT INTO `password_change_requests` (`id`, `user_id`, `status`, `note`, `requested_at`, `resolved_at`, `new_password_hash`) VALUES
(1, 5, 'rejected', 'ไม่ผ่านการอนุมัติ', '2026-03-31 16:37:02', '2026-03-31 16:37:35', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `properties`
--

CREATE TABLE `properties` (
  `id` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `agent_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `property_type` enum('house','condo','land','townhouse','apartment','commercial','home_office','warehouse') NOT NULL DEFAULT 'house',
  `listing_type` enum('sale','rent','sale_rent') NOT NULL DEFAULT 'sale',
  `description` text DEFAULT NULL,
  `address` text DEFAULT NULL,
  `bedrooms` int(11) DEFAULT 0,
  `bathrooms` int(11) DEFAULT 0,
  `floors` int(11) DEFAULT 1,
  `floor_number` int(11) DEFAULT NULL,
  `usable_area` decimal(10,2) DEFAULT NULL,
  `land_area_rai` decimal(10,2) DEFAULT NULL,
  `land_area_ngan` decimal(10,2) DEFAULT NULL,
  `land_area_wah` decimal(10,2) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `sub_district` varchar(100) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `thumbnail_url` varchar(500) DEFAULT NULL,
  `view_count` int(11) DEFAULT 0,
  `is_featured` tinyint(1) DEFAULT 0,
  `sale_status` enum('available','reserved','sold') NOT NULL DEFAULT 'available',
  `is_active` tinyint(1) DEFAULT 1,
  `price_requested` decimal(15,2) DEFAULT NULL,
  `price_per_sqm` decimal(15,2) DEFAULT NULL,
  `monthly_rent` decimal(15,2) DEFAULT NULL,
  `common_fee` decimal(10,2) DEFAULT NULL,
  `condition_status` enum('furnished','semi_furnished','unfurnished') DEFAULT 'unfurnished',
  `year_built` year(4) DEFAULT NULL,
  `project_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `original_price` decimal(15,2) DEFAULT NULL COMMENT 'ราคาก่อนลด (ถ้ามี)',
  `is_discounted` tinyint(1) DEFAULT 0 COMMENT 'มีการลดราคา',
  `discount_percent` decimal(5,2) DEFAULT NULL COMMENT '% ส่วนลด (คำนวณอัตโนมัติ)',
  `property_condition` enum('excellent','good','fair','needs_renovation') DEFAULT 'good' COMMENT 'สภาพทรัพย์',
  `title_deed_type` varchar(50) DEFAULT NULL COMMENT 'ประเภทโฉนด: น.ส.4/น.ส.3ก/น.ส.3/สทก./อื่นๆ',
  `bts_station` varchar(150) DEFAULT NULL COMMENT 'สถานีรถไฟฟ้าใกล้สุด',
  `bts_distance_km` decimal(5,2) DEFAULT NULL COMMENT 'ระยะถึงสถานี (กม.)',
  `mrt_station` varchar(100) DEFAULT NULL,
  `mrt_distance_km` decimal(5,2) DEFAULT NULL,
  `video_url` varchar(500) DEFAULT NULL COMMENT 'YouTube/VDO tour URL',
  `pet_friendly` tinyint(1) DEFAULT 0 COMMENT 'เลี้ยงสัตว์ได้',
  `internal_notes` text DEFAULT NULL COMMENT 'หมายเหตุภายใน (Admin only)',
  `deed_image_url` varchar(500) DEFAULT NULL COMMENT 'รูปโฉนดที่ดิน (Admin only — ไม่แสดงในหน้า public)',
  `created_by_admin` varchar(100) DEFAULT NULL COMMENT 'username admin ที่สร้างทรัพย์',
  `updated_by_admin` varchar(100) DEFAULT NULL COMMENT 'username admin ที่แก้ไขล่าสุด',
  `parking` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `properties`
--

INSERT INTO `properties` (`id`, `owner_id`, `agent_id`, `title`, `property_type`, `listing_type`, `description`, `address`, `bedrooms`, `bathrooms`, `floors`, `floor_number`, `usable_area`, `land_area_rai`, `land_area_ngan`, `land_area_wah`, `province`, `district`, `sub_district`, `postal_code`, `latitude`, `longitude`, `thumbnail_url`, `view_count`, `is_featured`, `sale_status`, `is_active`, `price_requested`, `price_per_sqm`, `monthly_rent`, `common_fee`, `condition_status`, `year_built`, `project_name`, `created_at`, `updated_at`, `original_price`, `is_discounted`, `discount_percent`, `property_condition`, `title_deed_type`, `bts_station`, `bts_distance_km`, `mrt_station`, `mrt_distance_km`, `video_url`, `pet_friendly`, `internal_notes`, `deed_image_url`, `created_by_admin`, `updated_by_admin`, `parking`) VALUES
(7, 3, NULL, 'ชลบุรี', 'townhouse', 'sale', '', '88/1 หมู่ 1 ถ.ทะทะ', 1, 1, 2, NULL, 0.00, 1.00, 0.00, 58.00, 'ชลบุรี', 'บางละมุง', 'หนองปรือ', '20150', 12.92359250, 100.88241920, '/uploads/properties/prop_1774857028037_710899.jpg', 88, 1, 'available', 1, 20000.00, 0.00, 0.00, NULL, 'unfurnished', '0000', '', '2026-03-30 07:46:08', '2026-04-01 05:39:21', 0.00, 0, NULL, 'good', 'นส.4', '', 0.00, '', 0.00, '', 0, '[OCR โฉนด]\nเลขที่โฉนด: 53033\nเลขที่ดิน: 440\nระวาง: 4836 1088\nหน้าสำรวจ: 1223\nชื่อผู้ถือ: บริษัท เอ แอนด์ ที พร็อพเพอร์ตี้ จำกัด\nวันออกโฉนด: 22 ส.ค. 2532\nบ้านเลขที่: 88/1 หมู่ 1 ถ.ทะทะ', '/uploads/deeds/deed_1774856776992_595288.jpg', 'phakchira', 'phakchira', 1);

-- --------------------------------------------------------

--
-- Table structure for table `property_amenities`
--

CREATE TABLE `property_amenities` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `amenity_name` varchar(100) NOT NULL,
  `amenity_icon` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `property_amenities`
--

INSERT INTO `property_amenities` (`id`, `property_id`, `amenity_name`, `amenity_icon`) VALUES
(1, 7, 'แอร์', 'fa-snowflake'),
(2, 7, 'สระว่ายน้ำ', 'fa-swimming-pool'),
(3, 7, 'ฟิตเนส', 'fa-dumbbell'),
(4, 7, 'รปภ. 24 ชม.', 'fa-shield-alt'),
(5, 7, 'กล้องวงจรปิด', 'fa-video'),
(6, 7, 'ใกล้ BTS/MRT', 'fa-train'),
(7, 7, 'อินเทอร์เน็ต', 'fa-wifi');

-- --------------------------------------------------------

--
-- Table structure for table `property_deeds`
--

CREATE TABLE `property_deeds` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `deed_image_url` varchar(500) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `property_deeds`
--

INSERT INTO `property_deeds` (`id`, `property_id`, `deed_image_url`, `sort_order`, `created_at`) VALUES
(1, 7, '/uploads/deeds/deed_1775009631252_818226.jpg', 0, '2026-04-01 09:13:51'),
(2, 7, '/uploads/deeds/deed_1775009640716_922456.jpg', 1, '2026-04-01 09:14:00');

-- --------------------------------------------------------

--
-- Table structure for table `property_favorites`
--

CREATE TABLE `property_favorites` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `property_favorites`
--

INSERT INTO `property_favorites` (`id`, `user_id`, `property_id`, `created_at`) VALUES
(6, 5, 7, '2026-04-01 04:48:49');

-- --------------------------------------------------------

--
-- Table structure for table `property_images`
--

CREATE TABLE `property_images` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `property_images`
--

INSERT INTO `property_images` (`id`, `property_id`, `image_url`, `caption`, `sort_order`, `created_at`) VALUES
(1, 7, '/uploads/properties/prop_1774857028072_191919.jpg', '', 1, '2026-03-30 07:50:28'),
(2, 7, '/uploads/properties/prop_1774857028106_990449.jpg', '', 2, '2026-03-30 07:50:28'),
(3, 7, '/uploads/properties/prop_1774857028125_525313.jpg', '', 3, '2026-03-30 07:50:28'),
(4, 7, '/uploads/properties/prop_1774857028143_133885.jpg', '', 4, '2026-03-30 07:50:28');

-- --------------------------------------------------------

--
-- Table structure for table `property_inquiries`
--

CREATE TABLE `property_inquiries` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `status` enum('new','contacted','closed') DEFAULT 'new',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `property_inquiries`
--

INSERT INTO `property_inquiries` (`id`, `property_id`, `name`, `phone`, `email`, `message`, `status`, `created_at`) VALUES
(1, 7, 'แฟ', '0956504157', NULL, 'สนใจทรัพย์: ชลบุรี', 'closed', '2026-03-31 06:43:12');

-- --------------------------------------------------------

--
-- Table structure for table `property_loans`
--

CREATE TABLE `property_loans` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `borrower_id` int(11) NOT NULL,
  `price_appraised` decimal(15,2) DEFAULT NULL,
  `loan_amount_approved` decimal(15,2) DEFAULT NULL,
  `interest_rate` decimal(5,2) DEFAULT NULL,
  `loan_status` enum('appraisal','approval','auction','transaction','completed','rejected') DEFAULT 'appraisal',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `provinces`
--

CREATE TABLE `provinces` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `region` varchar(50) NOT NULL,
  `is_popular` tinyint(1) DEFAULT 0,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `provinces`
--

INSERT INTO `provinces` (`id`, `name`, `slug`, `region`, `is_popular`, `sort_order`, `is_active`, `created_at`) VALUES
(1, 'กรุงเทพฯ', 'bangkok', 'กรุงเทพฯ & ปริมณฑล', 1, 1, 1, '2026-02-16 03:33:06'),
(2, 'นนทบุรี', 'nonthaburi', 'กรุงเทพฯ & ปริมณฑล', 1, 2, 1, '2026-02-16 03:33:06'),
(3, 'ปทุมธานี', 'pathumthani', 'กรุงเทพฯ & ปริมณฑล', 1, 3, 1, '2026-02-16 03:33:06'),
(4, 'สมุทรปราการ', 'samutprakan', 'กรุงเทพฯ & ปริมณฑล', 1, 4, 1, '2026-02-16 03:33:06'),
(5, 'ชลบุรี', 'chonburi', 'ภาคตะวันออก', 1, 5, 1, '2026-02-16 03:33:06'),
(6, 'ระยอง', 'rayong', 'ภาคตะวันออก', 1, 6, 1, '2026-02-16 03:33:06'),
(7, 'เชียงใหม่', 'chiangmai', 'ภาคเหนือ', 1, 7, 1, '2026-02-16 03:33:06'),
(8, 'เชียงราย', 'chiangrai', 'ภาคเหนือ', 1, 8, 1, '2026-02-16 03:33:06'),
(9, 'นครราชสีมา', 'nakhonratchasima', 'ภาคอีสาน', 1, 9, 1, '2026-02-16 03:33:06'),
(10, 'ขอนแก่น', 'khonkaen', 'ภาคอีสาน', 1, 10, 1, '2026-02-16 03:33:06'),
(11, 'อุดรธานี', 'udonthani', 'ภาคอีสาน', 1, 11, 1, '2026-02-16 03:33:06'),
(12, 'ภูเก็ต', 'phuket', 'ภาคใต้', 1, 12, 1, '2026-02-16 03:33:06'),
(13, 'กระบี่', 'krabi', 'ภาคใต้', 1, 13, 1, '2026-02-16 03:33:06'),
(14, 'สุราษฎร์ธานี', 'suratthani', 'ภาคใต้', 1, 14, 1, '2026-02-16 03:33:06'),
(15, 'พังงา', 'phangnga', 'ภาคใต้', 1, 15, 1, '2026-02-16 03:33:06'),
(16, 'สงขลา', 'songkhla', 'ภาคใต้', 1, 16, 1, '2026-02-16 03:33:06'),
(17, 'ประจวบคีรีขันธ์', 'prachuapkhirikhan', 'ภาคตะวันตก', 1, 17, 1, '2026-02-16 03:33:06'),
(18, 'เพชรบุรี', 'phetchaburi', 'ภาคตะวันตก', 1, 18, 1, '2026-02-16 03:33:06'),
(19, 'อื่นๆ', 'others', 'อื่นๆ', 1, 99, 1, '2026-02-16 03:33:06'),
(20, 'กรุงเทพมหานคร', 'bangkok', 'ภาคกลาง', 1, 1, 1, '2026-03-30 06:44:26'),
(21, 'นนทบุรี', 'nonthaburi', 'ภาคกลาง', 1, 2, 1, '2026-03-30 06:44:26'),
(22, 'ปทุมธานี', 'pathum-thani', 'ภาคกลาง', 1, 3, 1, '2026-03-30 06:44:26'),
(23, 'สมุทรปราการ', 'samut-prakan', 'ภาคกลาง', 1, 4, 1, '2026-03-30 06:44:26'),
(24, 'นครปฐม', 'nakhon-pathom', 'ภาคกลาง', 0, 5, 1, '2026-03-30 06:44:26'),
(25, 'สมุทรสาคร', 'samut-sakhon', 'ภาคกลาง', 0, 6, 1, '2026-03-30 06:44:26'),
(26, 'สมุทรสงคราม', 'samut-songkhram', 'ภาคกลาง', 0, 7, 1, '2026-03-30 06:44:26'),
(27, 'อ่างทอง', 'ang-thong', 'ภาคกลาง', 0, 8, 1, '2026-03-30 06:44:26'),
(28, 'พระนครศรีอยุธยา', 'phra-nakhon-si-ayutthaya', 'ภาคกลาง', 0, 9, 1, '2026-03-30 06:44:26'),
(29, 'ลพบุรี', 'lop-buri', 'ภาคกลาง', 0, 10, 1, '2026-03-30 06:44:26'),
(30, 'สิงห์บุรี', 'sing-buri', 'ภาคกลาง', 0, 11, 1, '2026-03-30 06:44:26'),
(31, 'ชัยนาท', 'chai-nat', 'ภาคกลาง', 0, 12, 1, '2026-03-30 06:44:26'),
(32, 'สระบุรี', 'saraburi', 'ภาคกลาง', 0, 13, 1, '2026-03-30 06:44:26'),
(33, 'นครนายก', 'nakhon-nayok', 'ภาคกลาง', 0, 14, 1, '2026-03-30 06:44:26'),
(34, 'ฉะเชิงเทรา', 'chachoengsao', 'ภาคกลาง', 0, 15, 1, '2026-03-30 06:44:26'),
(35, 'สุพรรณบุรี', 'suphan-buri', 'ภาคกลาง', 0, 16, 1, '2026-03-30 06:44:26'),
(36, 'ชลบุรี', 'chon-buri', 'ภาคตะวันออก', 1, 17, 1, '2026-03-30 06:44:26'),
(37, 'ระยอง', 'rayong', 'ภาคตะวันออก', 1, 18, 1, '2026-03-30 06:44:26'),
(38, 'จันทบุรี', 'chanthaburi', 'ภาคตะวันออก', 0, 19, 1, '2026-03-30 06:44:26'),
(39, 'ตราด', 'trat', 'ภาคตะวันออก', 0, 20, 1, '2026-03-30 06:44:26'),
(40, 'ปราจีนบุรี', 'prachin-buri', 'ภาคตะวันออก', 0, 21, 1, '2026-03-30 06:44:26'),
(41, 'สระแก้ว', 'sa-kaeo', 'ภาคตะวันออก', 0, 22, 1, '2026-03-30 06:44:26'),
(42, 'กาญจนบุรี', 'kanchanaburi', 'ภาคตะวันตก', 0, 23, 1, '2026-03-30 06:44:26'),
(43, 'ราชบุรี', 'ratchaburi', 'ภาคตะวันตก', 0, 24, 1, '2026-03-30 06:44:26'),
(44, 'เพชรบุรี', 'phetchaburi', 'ภาคตะวันตก', 0, 25, 1, '2026-03-30 06:44:26'),
(45, 'ประจวบคีรีขันธ์', 'prachuap-khiri-khan', 'ภาคตะวันตก', 0, 26, 1, '2026-03-30 06:44:26'),
(46, 'ตาก', 'tak', 'ภาคตะวันตก', 0, 27, 1, '2026-03-30 06:44:26'),
(47, 'เชียงใหม่', 'chiang-mai', 'ภาคเหนือ', 1, 28, 1, '2026-03-30 06:44:26'),
(48, 'เชียงราย', 'chiang-rai', 'ภาคเหนือ', 1, 29, 1, '2026-03-30 06:44:26'),
(49, 'ลำพูน', 'lamphun', 'ภาคเหนือ', 0, 30, 1, '2026-03-30 06:44:26'),
(50, 'ลำปาง', 'lampang', 'ภาคเหนือ', 0, 31, 1, '2026-03-30 06:44:26'),
(51, 'อุตรดิตถ์', 'uttaradit', 'ภาคเหนือ', 0, 32, 1, '2026-03-30 06:44:26'),
(52, 'แพร่', 'phrae', 'ภาคเหนือ', 0, 33, 1, '2026-03-30 06:44:26'),
(53, 'น่าน', 'nan', 'ภาคเหนือ', 0, 34, 1, '2026-03-30 06:44:26'),
(54, 'พะเยา', 'phayao', 'ภาคเหนือ', 0, 35, 1, '2026-03-30 06:44:26'),
(55, 'แม่ฮ่องสอน', 'mae-hong-son', 'ภาคเหนือ', 0, 36, 1, '2026-03-30 06:44:26'),
(56, 'สุโขทัย', 'sukhothai', 'ภาคเหนือ', 0, 37, 1, '2026-03-30 06:44:26'),
(57, 'พิษณุโลก', 'phitsanulok', 'ภาคเหนือ', 0, 38, 1, '2026-03-30 06:44:26'),
(58, 'พิจิตร', 'phichit', 'ภาคเหนือ', 0, 39, 1, '2026-03-30 06:44:26'),
(59, 'กำแพงเพชร', 'kamphaeng-phet', 'ภาคเหนือ', 0, 40, 1, '2026-03-30 06:44:26'),
(60, 'นครสวรรค์', 'nakhon-sawan', 'ภาคเหนือ', 0, 41, 1, '2026-03-30 06:44:26'),
(61, 'อุทัยธานี', 'uthai-thani', 'ภาคเหนือ', 0, 42, 1, '2026-03-30 06:44:26'),
(62, 'เพชรบูรณ์', 'phetchabun', 'ภาคเหนือ', 0, 43, 1, '2026-03-30 06:44:26'),
(63, 'นครราชสีมา', 'nakhon-ratchasima', 'ภาคตะวันออกเฉียงเหนือ', 1, 44, 1, '2026-03-30 06:44:26'),
(64, 'ขอนแก่น', 'khon-kaen', 'ภาคตะวันออกเฉียงเหนือ', 1, 45, 1, '2026-03-30 06:44:26'),
(65, 'อุดรธานี', 'udon-thani', 'ภาคตะวันออกเฉียงเหนือ', 1, 46, 1, '2026-03-30 06:44:26'),
(66, 'อุบลราชธานี', 'ubon-ratchathani', 'ภาคตะวันออกเฉียงเหนือ', 0, 47, 1, '2026-03-30 06:44:26'),
(67, 'บึงกาฬ', 'bueng-kan', 'ภาคตะวันออกเฉียงเหนือ', 0, 48, 1, '2026-03-30 06:44:26'),
(68, 'หนองบัวลำภู', 'nong-bua-lam-phu', 'ภาคตะวันออกเฉียงเหนือ', 0, 49, 1, '2026-03-30 06:44:26'),
(69, 'เลย', 'loei', 'ภาคตะวันออกเฉียงเหนือ', 0, 50, 1, '2026-03-30 06:44:26'),
(70, 'หนองคาย', 'nong-khai', 'ภาคตะวันออกเฉียงเหนือ', 0, 51, 1, '2026-03-30 06:44:26'),
(71, 'สกลนคร', 'sakon-nakhon', 'ภาคตะวันออกเฉียงเหนือ', 0, 52, 1, '2026-03-30 06:44:26'),
(72, 'นครพนม', 'nakhon-phanom', 'ภาคตะวันออกเฉียงเหนือ', 0, 53, 1, '2026-03-30 06:44:26'),
(73, 'มุกดาหาร', 'mukdahan', 'ภาคตะวันออกเฉียงเหนือ', 0, 54, 1, '2026-03-30 06:44:26'),
(74, 'กาฬสินธุ์', 'kalasin', 'ภาคตะวันออกเฉียงเหนือ', 0, 55, 1, '2026-03-30 06:44:26'),
(75, 'มหาสารคาม', 'maha-sarakham', 'ภาคตะวันออกเฉียงเหนือ', 0, 56, 1, '2026-03-30 06:44:26'),
(76, 'ร้อยเอ็ด', 'roi-et', 'ภาคตะวันออกเฉียงเหนือ', 0, 57, 1, '2026-03-30 06:44:26'),
(77, 'ยโสธร', 'yasothon', 'ภาคตะวันออกเฉียงเหนือ', 0, 58, 1, '2026-03-30 06:44:26'),
(78, 'อำนาจเจริญ', 'amnat-charoen', 'ภาคตะวันออกเฉียงเหนือ', 0, 59, 1, '2026-03-30 06:44:26'),
(79, 'ศรีสะเกษ', 'si-sa-ket', 'ภาคตะวันออกเฉียงเหนือ', 0, 60, 1, '2026-03-30 06:44:26'),
(80, 'สุรินทร์', 'surin', 'ภาคตะวันออกเฉียงเหนือ', 0, 61, 1, '2026-03-30 06:44:26'),
(81, 'บุรีรัมย์', 'buri-ram', 'ภาคตะวันออกเฉียงเหนือ', 0, 62, 1, '2026-03-30 06:44:26'),
(82, 'ชัยภูมิ', 'chaiyaphum', 'ภาคตะวันออกเฉียงเหนือ', 0, 63, 1, '2026-03-30 06:44:26'),
(83, 'ภูเก็ต', 'phuket', 'ภาคใต้', 1, 64, 1, '2026-03-30 06:44:26'),
(84, 'สุราษฎร์ธานี', 'surat-thani', 'ภาคใต้', 1, 65, 1, '2026-03-30 06:44:26'),
(85, 'กระบี่', 'krabi', 'ภาคใต้', 1, 66, 1, '2026-03-30 06:44:26'),
(86, 'พังงา', 'phang-nga', 'ภาคใต้', 0, 67, 1, '2026-03-30 06:44:26'),
(87, 'ระนอง', 'ranong', 'ภาคใต้', 0, 68, 1, '2026-03-30 06:44:26'),
(88, 'ชุมพร', 'chumphon', 'ภาคใต้', 0, 69, 1, '2026-03-30 06:44:26'),
(89, 'นครศรีธรรมราช', 'nakhon-si-thammarat', 'ภาคใต้', 0, 70, 1, '2026-03-30 06:44:26'),
(90, 'พัทลุง', 'phatthalung', 'ภาคใต้', 0, 71, 1, '2026-03-30 06:44:26'),
(91, 'ตรัง', 'trang', 'ภาคใต้', 0, 72, 1, '2026-03-30 06:44:26'),
(92, 'สตูล', 'satun', 'ภาคใต้', 0, 73, 1, '2026-03-30 06:44:26'),
(93, 'สงขลา', 'songkhla', 'ภาคใต้', 0, 74, 1, '2026-03-30 06:44:26'),
(94, 'ปัตตานี', 'pattani', 'ภาคใต้', 0, 75, 1, '2026-03-30 06:44:26'),
(95, 'ยะลา', 'yala', 'ภาคใต้', 0, 76, 1, '2026-03-30 06:44:26'),
(96, 'นราธิวาส', 'narathiwat', 'ภาคใต้', 0, 77, 1, '2026-03-30 06:44:26');

-- --------------------------------------------------------

--
-- Table structure for table `saved_properties`
--

CREATE TABLE `saved_properties` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `investor_code` varchar(20) DEFAULT NULL,
  `display_name` varchar(100) DEFAULT NULL,
  `full_name` varchar(150) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `phone` varchar(20) DEFAULT NULL,
  `phone_verified` tinyint(1) DEFAULT 0,
  `line_id` varchar(50) DEFAULT NULL,
  `company_name` varchar(200) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `role` enum('borrower','investor') DEFAULT 'borrower',
  `department` enum('sales','accounting','appraisal','credit','auction','legal','contract','super_admin') DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `status` enum('active','suspended','banned') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `investor_level` int(11) DEFAULT NULL,
  `sort_order` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `investor_code`, `display_name`, `full_name`, `avatar_url`, `password_hash`, `email`, `email_verified`, `phone`, `phone_verified`, `line_id`, `company_name`, `province`, `bio`, `role`, `department`, `is_verified`, `status`, `created_at`, `updated_at`, `investor_level`, `sort_order`) VALUES
(1, 'ภัคจิรา ', NULL, NULL, NULL, NULL, '$2a$10$/xHvBTmSCIw3l2xKBH7Z1OUevoD48Z9ivG.T6wdU9MHllAARRpI4W', 'victorno2288@gmail.com', 0, '0956504157', 0, NULL, NULL, NULL, NULL, 'borrower', NULL, 0, 'active', '2026-02-13 10:18:56', '2026-04-01 06:17:22', NULL, NULL),
(3, 'cap0001', 'CAP0001', NULL, 'พี่ต่วย', NULL, '$2a$10$/xHvBTmSCIw3l2xKBH7Z1OUevoD48Z9ivG.T6wdU9MHllAARRpI4W', 'loandd02@gmail.com', 0, '000000000', 0, '@rrrr', NULL, NULL, NULL, 'investor', NULL, 0, 'active', '2026-02-18 09:02:03', '2026-04-01 06:17:22', 1, 3),
(4, 'พี่นัท', NULL, NULL, NULL, NULL, '$2a$10$/xHvBTmSCIw3l2xKBH7Z1OUevoD48Z9ivG.T6wdU9MHllAARRpI4W', 'lala@gmail.com', 0, '77777777777', 0, NULL, NULL, NULL, NULL, 'investor', NULL, 0, 'active', '2026-02-21 04:45:18', '2026-04-01 06:17:22', NULL, NULL),
(5, 'ไก่ของพี่เป้', NULL, NULL, NULL, NULL, '$2a$10$/xHvBTmSCIw3l2xKBH7Z1OUevoD48Z9ivG.T6wdU9MHllAARRpI4W', 'jjjj@gmail.com', 0, '999999999', 0, NULL, NULL, NULL, NULL, 'borrower', NULL, 0, 'active', '2026-02-24 04:06:58', '2026-04-01 06:17:22', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_notifications`
--

CREATE TABLE `user_notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('password_approved','property_sold','property_rented') NOT NULL,
  `message` varchar(500) NOT NULL,
  `property_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_notifications`
--

INSERT INTO `user_notifications` (`id`, `user_id`, `type`, `message`, `property_id`, `is_read`, `created_at`) VALUES
(1, 5, 'property_rented', 'ทรัพย์สินที่คุณบันทึกไว้ \"ชลบุรี\" ถูกจอง/เช่าแล้ว', 7, 1, '2026-04-01 11:49:00');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_settings`
--
ALTER TABLE `admin_settings`
  ADD PRIMARY KEY (`key_name`);

--
-- Indexes for table `admin_users`
--
ALTER TABLE `admin_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_admin_department` (`department`),
  ADD KEY `idx_admin_active` (`is_active`);

--
-- Indexes for table `nearby_places`
--
ALTER TABLE `nearby_places`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`);

--
-- Indexes for table `password_change_requests`
--
ALTER TABLE `password_change_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `properties`
--
ALTER TABLE `properties`
  ADD PRIMARY KEY (`id`),
  ADD KEY `owner_id` (`owner_id`),
  ADD KEY `agent_id` (`agent_id`);

--
-- Indexes for table `property_amenities`
--
ALTER TABLE `property_amenities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`);

--
-- Indexes for table `property_deeds`
--
ALTER TABLE `property_deeds`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_property` (`property_id`);

--
-- Indexes for table `property_favorites`
--
ALTER TABLE `property_favorites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_fav` (`user_id`,`property_id`),
  ADD KEY `property_id` (`property_id`);

--
-- Indexes for table `property_images`
--
ALTER TABLE `property_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`);

--
-- Indexes for table `property_inquiries`
--
ALTER TABLE `property_inquiries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_inquiry_property` (`property_id`);

--
-- Indexes for table `property_loans`
--
ALTER TABLE `property_loans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`),
  ADD KEY `borrower_id` (`borrower_id`);

--
-- Indexes for table `provinces`
--
ALTER TABLE `provinces`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `saved_properties`
--
ALTER TABLE `saved_properties`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_property` (`user_id`,`property_id`),
  ADD KEY `property_id` (`property_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `uq_users_phone` (`phone`);

--
-- Indexes for table `user_notifications`
--
ALTER TABLE `user_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_users`
--
ALTER TABLE `admin_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `nearby_places`
--
ALTER TABLE `nearby_places`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `password_change_requests`
--
ALTER TABLE `password_change_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `properties`
--
ALTER TABLE `properties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `property_amenities`
--
ALTER TABLE `property_amenities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `property_deeds`
--
ALTER TABLE `property_deeds`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `property_favorites`
--
ALTER TABLE `property_favorites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `property_images`
--
ALTER TABLE `property_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `property_inquiries`
--
ALTER TABLE `property_inquiries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `property_loans`
--
ALTER TABLE `property_loans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `provinces`
--
ALTER TABLE `provinces`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=97;

--
-- AUTO_INCREMENT for table `saved_properties`
--
ALTER TABLE `saved_properties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `user_notifications`
--
ALTER TABLE `user_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `password_change_requests`
--
ALTER TABLE `password_change_requests`
  ADD CONSTRAINT `password_change_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `property_deeds`
--
ALTER TABLE `property_deeds`
  ADD CONSTRAINT `property_deeds_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `property_inquiries`
--
ALTER TABLE `property_inquiries`
  ADD CONSTRAINT `fk_inquiry_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `saved_properties`
--
ALTER TABLE `saved_properties`
  ADD CONSTRAINT `saved_properties_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `saved_properties_ibfk_2` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_notifications`
--
ALTER TABLE `user_notifications`
  ADD CONSTRAINT `user_notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
