-- =========================================================================
-- COMPLETE COMBINED SCHEMA: SMART ATTENDANCE, PAYMENTS, CMS, & LMS SYSTEM
-- This script contains all necessary tables, columns, indexes, RLS policies,
-- and Realtime settings. Paste this in the Supabase SQL Editor.
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- I. CORE ATTENDANCE & PAYMENTS TABLES
-- ==========================================

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(255) NOT NULL,
    degree_type VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Students Table
CREATE TABLE IF NOT EXISTS public.students (
    student_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    academic_id VARCHAR(100) NOT NULL UNIQUE,
    national_id VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student',
    department_id INTEGER REFERENCES public.departments(department_id) ON DELETE SET NULL,
    personal_note TEXT,
    subscription_amount DECIMAL(10,2) DEFAULT 0.0,
    due_date DATE,
    subscription_status VARCHAR(50) DEFAULT 'unpaid',
    financial_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    subject_id SERIAL PRIMARY KEY,
    subject_name VARCHAR(255) NOT NULL,
    department_id INTEGER REFERENCES public.departments(department_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Weekdays Table
CREATE TABLE IF NOT EXISTS public.weekdays (
    weekday_id INTEGER PRIMARY KEY,
    weekday_name_ar VARCHAR(50) NOT NULL,
    weekday_name_en VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Time Slots Table
CREATE TABLE IF NOT EXISTS public.time_slots (
    slot_id SERIAL PRIMARY KEY,
    slot_name VARCHAR(255) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Student Schedule Table
CREATE TABLE IF NOT EXISTS public.student_schedule (
    schedule_id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES public.students(student_id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES public.subjects(subject_id) ON DELETE CASCADE,
    weekday_id INTEGER REFERENCES public.weekdays(weekday_id) ON DELETE SET NULL,
    slot_id INTEGER REFERENCES public.time_slots(slot_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, weekday_id, slot_id)
);

-- 7. Attendance Log Table (singular - expected by client code)
CREATE TABLE IF NOT EXISTS public.attendance_log (
    log_id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES public.student_schedule(schedule_id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    check_in_time TIME,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(schedule_id, attendance_date)
);

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    notification_id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES public.students(student_id) ON DELETE CASCADE,
    sender_id INTEGER,
    sender_role VARCHAR(50),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Personal Notes Table
CREATE TABLE IF NOT EXISTS public.personal_notes (
    note_id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES public.students(student_id) ON DELETE CASCADE UNIQUE,
    note TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Payment Settings Table
CREATE TABLE IF NOT EXISTS public.payment_settings (
    id SERIAL PRIMARY KEY,
    subscription_amount NUMERIC DEFAULT 299.0,
    subscription_duration_days INTEGER DEFAULT 30,
    enabled_payment_methods JSONB DEFAULT '["bank_transfer", "ria", "binance_usdt", "urpay"]'::jsonb,
    bank_transfer_details TEXT,
    ria_details TEXT,
    binance_wallet TEXT,
    urpay_number TEXT,
    urpay_account_name TEXT,
    urpay_qr_image TEXT,
    payment_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES public.students(student_id) ON DELETE CASCADE,
    invoice_number VARCHAR(255),
    amount NUMERIC NOT NULL,
    payment_method VARCHAR(100),
    transaction_id VARCHAR(255),
    receipt_image TEXT,
    notes TEXT,
    admin_notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by INTEGER,
    subscription_start DATE,
    subscription_end DATE
);

-- 12. CMS Data Table
CREATE TABLE IF NOT EXISTS public.cms_data (
    id SERIAL PRIMARY KEY,
    general JSONB NOT NULL DEFAULT '{}'::jsonb,
    homepage JSONB NOT NULL DEFAULT '{}'::jsonb,
    about JSONB NOT NULL DEFAULT '{}'::jsonb,
    services JSONB NOT NULL DEFAULT '{}'::jsonb,
    pricing JSONB NOT NULL DEFAULT '{}'::jsonb,
    contact JSONB NOT NULL DEFAULT '{}'::jsonb,
    footer JSONB NOT NULL DEFAULT '{}'::jsonb,
    partners JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by INTEGER REFERENCES public.students(student_id) ON DELETE SET NULL
);

-- 13. New Customers Table
CREATE TABLE IF NOT EXISTS public.new_customers (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    university_name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    receipt_file TEXT NOT NULL,
    plan_type VARCHAR(50) CHECK (plan_type IN ('basic', 'premium')),
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed defaults for Weekdays & Time Slots
INSERT INTO public.weekdays (weekday_id, weekday_name_ar, weekday_name_en) VALUES
(1, 'الأحد', 'Sunday'),
(2, 'الإثنين', 'Monday'),
(3, 'الثلاثاء', 'Tuesday'),
(4, 'الأربعاء', 'Wednesday'),
(5, 'الخميس', 'Thursday'),
(6, 'الجمعة', 'Friday'),
(7, 'السبت', 'Saturday')
ON CONFLICT (weekday_id) DO NOTHING;

INSERT INTO public.time_slots (slot_id, slot_name, start_time, end_time) VALUES
(1, 'الفترة الأولى (4-7 م)', '16:00:00', '19:00:00'),
(2, 'الفترة الثانية (7-10 م)', '19:00:00', '22:00:00')
ON CONFLICT (slot_id) DO NOTHING;


-- ==========================================
-- II. SMART LMS (LEARNING MANAGEMENT SYSTEM) TABLES
-- ==========================================

-- 14. LMS Users Table
CREATE TABLE IF NOT EXISTS public.lms_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) CHECK (role IN ('admin', 'instructor', 'student')) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'rejected')) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 15. LMS Departments Table
CREATE TABLE IF NOT EXISTS public.lms_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. LMS Courses Table
CREATE TABLE IF NOT EXISTS public.lms_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    department_id UUID REFERENCES public.lms_departments(id) ON DELETE SET NULL,
    price FLOAT DEFAULT 0.0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. LMS Sections Table
CREATE TABLE IF NOT EXISTS public.lms_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.lms_courses(id) ON DELETE CASCADE NOT NULL,
    instructor_id UUID REFERENCES public.lms_users(id) ON DELETE SET NULL,
    section_number VARCHAR(50) NOT NULL,
    semester VARCHAR(50) NOT NULL,
    capacity INTEGER DEFAULT 30,
    schedule_days TEXT[] DEFAULT '{}',
    schedule_time VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_course_section_semester UNIQUE (course_id, section_number, semester)
);

-- 18. LMS Enrollments Table
CREATE TABLE IF NOT EXISTS public.lms_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.lms_users(id) ON DELETE CASCADE NOT NULL,
    section_id UUID REFERENCES public.lms_sections(id) ON DELETE CASCADE NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    final_grade FLOAT DEFAULT NULL,
    CONSTRAINT unique_student_section UNIQUE (student_id, section_id)
);

-- 19. LMS Course Materials Table
CREATE TABLE IF NOT EXISTS public.lms_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES public.lms_sections(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) CHECK (type IN ('pdf', 'video', 'audio', 'document', 'link')) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20. LMS Assignments Table
CREATE TABLE IF NOT EXISTS public.lms_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES public.lms_sections(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    instructions TEXT,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    max_points FLOAT DEFAULT 100.0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 21. LMS Submissions Table
CREATE TABLE IF NOT EXISTS public.lms_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES public.lms_assignments(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.lms_users(id) ON DELETE CASCADE NOT NULL,
    file_url TEXT,
    student_notes TEXT,
    grade FLOAT,
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_student_assignment UNIQUE (student_id, assignment_id)
);

-- 22. LMS Question Bank Table
CREATE TABLE IF NOT EXISTS public.lms_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.lms_courses(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(50) CHECK (type IN ('mcq', 'tf', 'essay')) NOT NULL,
    question_text TEXT NOT NULL,
    choices JSONB,
    correct_answer TEXT,
    points FLOAT DEFAULT 1.0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 23. LMS Exams Table
CREATE TABLE IF NOT EXISTS public.lms_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES public.lms_sections(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 24. LMS Exam Questions Junction Table
CREATE TABLE IF NOT EXISTS public.lms_exam_questions (
    exam_id UUID REFERENCES public.lms_exams(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.lms_questions(id) ON DELETE CASCADE,
    PRIMARY KEY (exam_id, question_id)
);

-- 25. LMS Exam Attempts Table
CREATE TABLE IF NOT EXISTS public.lms_exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.lms_exams(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.lms_users(id) ON DELETE CASCADE NOT NULL,
    answers JSONB NOT NULL,
    score FLOAT DEFAULT 0.0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 26. LMS Virtual Meetings Table
CREATE TABLE IF NOT EXISTS public.lms_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES public.lms_sections(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    meeting_url TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60
);

-- 27. LMS Attendance Logs Table
CREATE TABLE IF NOT EXISTS public.lms_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES public.lms_sections(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.lms_users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(50) CHECK (status IN ('present', 'absent', 'late', 'excused')) NOT NULL,
    recorded_by UUID REFERENCES public.lms_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_student_section_date UNIQUE (student_id, section_id, date)
);

-- 28. LMS Announcements Table
CREATE TABLE IF NOT EXISTS public.lms_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES public.lms_sections(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES public.lms_users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 29. LMS Internal Messages Table
CREATE TABLE IF NOT EXISTS public.lms_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.lms_users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.lms_users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 30. LMS Certificates Table
CREATE TABLE IF NOT EXISTS public.lms_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.lms_users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.lms_courses(id) ON DELETE CASCADE NOT NULL,
    certificate_code VARCHAR(100) UNIQUE NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    grade FLOAT
);

-- 31. LMS Special Custom Requests Table
CREATE TABLE IF NOT EXISTS public.lms_special_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.lms_users(id) ON DELETE CASCADE NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    student_phone VARCHAR(50),
    details TEXT NOT NULL,
    price FLOAT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);


-- ==========================================
-- III. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS for all core tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekdays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.new_customers ENABLE ROW LEVEL SECURITY;

-- Enable RLS for all LMS tables
ALTER TABLE public.lms_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_special_requests ENABLE ROW LEVEL SECURITY;

-- Create Open Public Access Policies (Simplifies client-side DB interactions for testing/demo)
CREATE POLICY "Allow public access" ON public.departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.weekdays FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.time_slots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.student_schedule FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.attendance_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.personal_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.payment_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.cms_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.new_customers FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public access" ON public.lms_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.lms_departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.lms_courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.lms_sections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.lms_enrollments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.lms_materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.lms_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.lms_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.lms_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.lms_exams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.lms_exam_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.lms_exam_attempts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.lms_meetings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.lms_attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.lms_announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.lms_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.lms_certificates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access" ON public.lms_special_requests FOR ALL USING (true) WITH CHECK (true);


-- ==========================================
-- IV. ENABLE SUPABASE REALTIME
-- ==========================================

ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.departments;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.students;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.subjects;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.weekdays;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.time_slots;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.student_schedule;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.attendance_log;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.notifications;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.personal_notes;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.payment_settings;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.payments;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.cms_data;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.new_customers;

ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.lms_users;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.lms_departments;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.lms_courses;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.lms_sections;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.lms_enrollments;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.lms_materials;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.lms_assignments;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.lms_submissions;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.lms_questions;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.lms_exams;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.lms_exam_questions;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.lms_exam_attempts;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.lms_meetings;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.lms_attendance;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.lms_announcements;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.lms_messages;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.lms_certificates;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS public.lms_special_requests;
