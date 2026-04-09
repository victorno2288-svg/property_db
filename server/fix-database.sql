-- ============================================================
-- fix-database.sql
-- แก้ปัญหา login 401 — วาง SQL นี้ใน phpMyAdmin แล้วกด Go
-- password ทุกบัญชี = LoanDD2026
-- ============================================================

USE property_db;

-- ============================================================
-- 1) แก้ตาราง admin_users
-- ============================================================

-- ลบแล้วสร้างใหม่ให้ถูกต้อง (ป้องกัน duplicate)
DELETE FROM admin_users WHERE username IN ('superadmin', 'phakchira');

INSERT INTO `admin_users`
  (`id`, `username`, `full_name`, `display_name`, `email`, `password_hash`, `phone`, `department`, `is_active`, `login_count`, `created_at`)
VALUES
  (1, 'superadmin', 'LoanDD Super Admin', 'Super Admin', 'loandd02@gmail.com',
   '$2a$10$/xHvBTmSCIw3l2xKBH7Z1OUevoD48Z9ivG.T6wdU9MHllAARRpI4W',
   '000000000', 'super_admin', 1, 0, '2026-03-30 02:59:54'),
  (4, 'phakchira', 'ภัคจิรา อุดมนา', 'แฟร์', 'loandd0@gmail.com',
   '$2a$10$/xHvBTmSCIw3l2xKBH7Z1OUevoD48Z9ivG.T6wdU9MHllAARRpI4W',
   NULL, 'property_manager', 1, 0, '2026-03-30 04:16:05');

-- ============================================================
-- 2) แก้ตาราง users
-- ============================================================

-- ลบแล้วสร้างใหม่
DELETE FROM users WHERE id IN (1, 3, 4, 5);

INSERT INTO `users`
  (`id`, `username`, `password_hash`, `email`, `phone`, `role`, `status`, `created_at`)
VALUES
  (1, 'ภัคจิรา', '$2a$10$/xHvBTmSCIw3l2xKBH7Z1OUevoD48Z9ivG.T6wdU9MHllAARRpI4W',
   'victorno2288@gmail.com', '0956504157', 'borrower', 'active', '2026-02-13 10:18:56'),
  (3, 'cap0001', '$2a$10$/xHvBTmSCIw3l2xKBH7Z1OUevoD48Z9ivG.T6wdU9MHllAARRpI4W',
   'loandd02@gmail.com', '000000000', 'investor', 'active', '2026-02-18 09:02:03'),
  (4, 'พี่นัท', '$2a$10$/xHvBTmSCIw3l2xKBH7Z1OUevoD48Z9ivG.T6wdU9MHllAARRpI4W',
   'lala@gmail.com', '77777777777', 'investor', 'active', '2026-02-21 04:45:18'),
  (5, 'ไก่ของพี่เป้', '$2a$10$/xHvBTmSCIw3l2xKBH7Z1OUevoD48Z9ivG.T6wdU9MHllAARRpI4W',
   'jjjj@gmail.com', '999999999', 'borrower', 'active', '2026-02-24 04:06:58');

-- ============================================================
-- ตรวจสอบผล
-- ============================================================
SELECT 'admin_users:' AS tbl, username, full_name, is_active FROM admin_users
UNION ALL
SELECT 'users:', username, role, status FROM users;
