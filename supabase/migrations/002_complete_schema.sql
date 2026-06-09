-- Complete database schema initialization
-- This file contains everything needed for the attendance system

-- ============================================
-- 1. DROP EXISTING TABLES (SAFE REMOVAL)
-- ============================================
DROP TABLE IF EXISTS attendance_logs CASCADE;
DROP TABLE IF EXISTS student_schedule CASCADE;
DROP TABLE IF EXISTS time_slots CASCADE;
DROP TABLE IF EXISTS weekdays CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- ============================================
-- 2. CREATE TABLES IN CORRECT ORDER
-- ============================================

-- Departments Table
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students Table
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    academic_id VARCHAR(100) NOT NULL UNIQUE,
    national_id VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student',
    department_id INTEGER REFERENCES departments(department_id),
    personal_note TEXT,
    subscription_amount DECIMAL(10,2),
    due_date DATE,
    subscription_status VARCHAR(50) DEFAULT 'unpaid',
    financial_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subjects Table
CREATE TABLE subjects (
    subject_id SERIAL PRIMARY KEY,
    subject_name VARCHAR(255) NOT NULL,
    department_id INTEGER REFERENCES departments(department_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekdays Table
CREATE TABLE weekdays (
    weekday_id SERIAL PRIMARY KEY,
    weekday_name_ar VARCHAR(50) NOT NULL,
    weekday_name_en VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time Slots Table
CREATE TABLE time_slots (
    slot_id SERIAL PRIMARY KEY,
    slot_name VARCHAR(255) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Schedule Table
CREATE TABLE student_schedule (
    schedule_id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(student_id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(subject_id) ON DELETE CASCADE,
    weekday_id INTEGER REFERENCES weekdays(weekday_id),
    slot_id INTEGER REFERENCES time_slots(slot_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, weekday_id, slot_id)
);

-- Attendance Logs Table
CREATE TABLE attendance_logs (
    log_id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES student_schedule(schedule_id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    check_in_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_students_academic_id ON students(academic_id);
CREATE INDEX idx_students_national_id ON students(national_id);
CREATE INDEX idx_students_department_id ON students(department_id);

CREATE INDEX idx_subjects_department_id ON subjects(department_id);
CREATE INDEX idx_subjects_name ON subjects(subject_name);

CREATE INDEX idx_student_schedule_student_id ON student_schedule(student_id);
CREATE INDEX idx_student_schedule_subject_id ON student_schedule(subject_id);
CREATE INDEX idx_student_schedule_weekday_id ON student_schedule(weekday_id);
CREATE INDEX idx_student_schedule_slot_id ON student_schedule(slot_id);

CREATE INDEX idx_attendance_logs_schedule_id ON attendance_logs(schedule_id);
CREATE INDEX idx_attendance_logs_date ON attendance_logs(attendance_date);

-- ============================================
-- 4. INSERT DEFAULT DATA
-- ============================================

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

-- ============================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekdays ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. CREATE RLS POLICIES
-- ============================================
-- Allow authenticated users to read all data
CREATE POLICY "Enable read access for authenticated users" ON departments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON students
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON subjects
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON weekdays
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON time_slots
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON student_schedule
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON attendance_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert/update/delete data
CREATE POLICY "Enable write access for authenticated users" ON departments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable write access for authenticated users" ON students
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable write access for authenticated users" ON subjects
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable write access for authenticated users" ON weekdays
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable write access for authenticated users" ON time_slots
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable write access for authenticated users" ON student_schedule
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable write access for authenticated users" ON attendance_logs
    FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- 7. ADD TO REALTIME PUBLICATION
-- ============================================
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS departments;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS students;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS subjects;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS weekdays;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS time_slots;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS student_schedule;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS attendance_logs;

-- ============================================
-- 8. DONE!
-- ============================================
COMMENT ON SCHEMA public IS 'Attendance Management System Database';
