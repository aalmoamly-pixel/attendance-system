-- Quick Reset Script
-- Use this to quickly clear data and start fresh
-- WARNING: THIS DELETES ALL YOUR DATA!

-- First, disable triggers temporarily
SET session_replication_role = replica;

-- Delete data in reverse order of dependencies
TRUNCATE TABLE attendance_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE student_schedule RESTART IDENTITY CASCADE;
TRUNCATE TABLE time_slots RESTART IDENTITY CASCADE;
TRUNCATE TABLE weekdays RESTART IDENTITY CASCADE;
TRUNCATE TABLE subjects RESTART IDENTITY CASCADE;
TRUNCATE TABLE students RESTART IDENTITY CASCADE;
TRUNCATE TABLE departments RESTART IDENTITY CASCADE;

-- Re-enable triggers
SET session_replication_role = origin;

-- Re-insert default data

-- Insert Weekdays
INSERT INTO weekdays (weekday_id, weekday_name_ar, weekday_name_en) VALUES
(1, 'الأحد', 'Sunday'),
(2, 'الإثنين', 'Monday'),
(3, 'الثلاثاء', 'Tuesday'),
(4, 'الأربعاء', 'Wednesday'),
(5, 'الخميس', 'Thursday'),
(6, 'الجمعة', 'Friday'),
(7, 'السبت', 'Saturday');

-- Insert Time Slots
INSERT INTO time_slots (slot_id, slot_name, start_time, end_time) VALUES
(1, 'الفترة الأولى (4-7 م)', '16:00:00', '19:00:00'),
(2, 'الفترة الثانية (7-10 م)', '19:00:00', '22:00:00');

-- Insert Default Department
INSERT INTO departments (department_id, department_name) VALUES
(1, 'دبلوم الموارد البشرية (متوسط مهني)');

-- Insert Default Subjects
INSERT INTO subjects (subject_id, subject_name, department_id) VALUES
(1, 'مهارات اللغة الإنجليزية في بيئة العمل', 1),
(2, 'مدخل إلى إدارة الموارد البشرية', 1),
(3, 'السلوك التنظيمي', 1),
(4, 'تقنيات ونظم الموارد البشرية (HR Technology)', 1),
(5, 'تطبيقات الحاسب', 1);

-- Done!
SELECT 'Database reset complete! You can now use the Perfect Schedule button.' AS message;
