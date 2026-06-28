-- =========================================================================
-- SQL SCRIPT: FIX, UPDATE & INITIALIZE DATABASE (SAFE EXECUTION)
-- Location: supabase/fix_and_update_schema.sql
-- This script safely drops old/broken tables (from old schema) and creates
-- all required tables for Smart Attendance, Payments, CMS, and LMS.
-- It will NOT duplicate or break any existing correct tables.
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. DROP OLD/INCOMPATIBLE TABLES (IF THEY EXIST)
-- ============================================================

-- Drop old attendance and schedules tables if they exist (not used in the new system)
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.schedules CASCADE;

-- Check if 'students' table is using the old schema (has 'university_id' column)
-- If so, drop it so it can be recreated with the correct 'student_id' serial column.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'students' 
          AND column_name = 'university_id'
    ) THEN
        RAISE NOTICE 'Dropping old students table...';
        DROP TABLE IF EXISTS public.students CASCADE;
    END IF;
END $$;

-- Check if 'subjects' table is using the old schema (has 'subject_code' column but no 'department_id')
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'subjects' 
          AND column_name = 'subject_code'
    ) THEN
        RAISE NOTICE 'Dropping old subjects table...';
        DROP TABLE IF EXISTS public.subjects CASCADE;
    END IF;
END $$;


-- ============================================================
-- 2. CREATE CORE ATTENDANCE & PAYMENTS TABLES (IF NOT EXIST)
-- ============================================================

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(255) NOT NULL,
    degree_type VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Students Table (New Schema)
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

-- 3. Subjects Table (New Schema)
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

-- 7. Attendance Log Table
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


-- ============================================================
-- 3. CREATE SMART LMS (LEARNING MANAGEMENT SYSTEM) TABLES (IF NOT EXIST)
-- ============================================================

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
    subscription_plan_id VARCHAR(255),
    subscription_status VARCHAR(50) DEFAULT 'pending_payment',
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


-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS) & PUBLIC ACCESS POLICIES
-- ============================================================

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

-- Recreate Open Public Access Policies (Safe - drops policy if exists before creating)
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'departments', 'students', 'subjects', 'weekdays', 'time_slots', 
        'student_schedule', 'attendance_log', 'notifications', 'personal_notes', 
        'payment_settings', 'payments', 'cms_data', 'new_customers',
        'lms_users', 'lms_departments', 'lms_courses', 'lms_sections', 
        'lms_enrollments', 'lms_materials', 'lms_assignments', 'lms_submissions', 
        'lms_questions', 'lms_exams', 'lms_exam_questions', 'lms_exam_attempts', 
        'lms_meetings', 'lms_attendance', 'lms_announcements', 'lms_messages', 
        'lms_certificates', 'lms_special_requests'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow public access" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Allow public access" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;


-- ============================================================
-- 5. ENABLE SUPABASE REALTIME (RECREATE PUBLICATION SAFELY)
-- ============================================================
DROP PUBLICATION IF EXISTS supabase_realtime;

CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.departments,
    public.students,
    public.subjects,
    public.weekdays,
    public.time_slots,
    public.student_schedule,
    public.attendance_log,
    public.notifications,
    public.personal_notes,
    public.payment_settings,
    public.payments,
    public.cms_data,
    public.new_customers,
    public.lms_users,
    public.lms_departments,
    public.lms_courses,
    public.lms_sections,
    public.lms_enrollments,
    public.lms_materials,
    public.lms_assignments,
    public.lms_submissions,
    public.lms_questions,
    public.lms_exams,
    public.lms_exam_questions,
    public.lms_exam_attempts,
    public.lms_meetings,
    public.lms_attendance,
    public.lms_announcements,
    public.lms_messages,
    public.lms_certificates,
    public.lms_special_requests;


-- ============================================================
-- 6. SEED ESSENTIAL DEFAULT DATA (IF NOT ALREADY PRESENT)
-- ============================================================

-- Seed Weekdays
INSERT INTO public.weekdays (weekday_id, weekday_name_ar, weekday_name_en) VALUES
(1, 'الأحد', 'Sunday'),
(2, 'الإثنين', 'Monday'),
(3, 'الثلاثاء', 'Tuesday'),
(4, 'الأربعاء', 'Wednesday'),
(5, 'الخميس', 'Thursday'),
(6, 'الجمعة', 'Friday'),
(7, 'السبت', 'Saturday')
ON CONFLICT (weekday_id) DO NOTHING;

-- Seed Time Slots
INSERT INTO public.time_slots (slot_id, slot_name, start_time, end_time) VALUES
(1, 'الفترة الأولى (4-7 م)', '16:00:00', '19:00:00'),
(2, 'الفترة الثانية (7-10 م)', '19:00:00', '22:00:00')
ON CONFLICT (slot_id) DO NOTHING;

-- Seed Default Departments (LMS)
INSERT INTO public.lms_departments (id, name, description) VALUES
('6fa85f64-5717-4562-b3fc-2c963f66afa9', 'علوم الحاسب والمعلومات', 'قسم مختص بعلوم الحاسب وهندسة البرمجيات ونظم المعلومات')
ON CONFLICT (id) DO NOTHING;

-- Seed Default LMS Users (Admin, Instructor, Student)
INSERT INTO public.lms_users (id, email, password_hash, full_name, role, status, phone) VALUES
('3fa85f64-5717-4562-b3fc-2c963f66afa6', 'admin@lms.com', 'Abdullah772091', 'مدير النظام (LMS)', 'admin', 'active', '0500000001'),
('4fa85f64-5717-4562-b3fc-2c963f66afa7', 'teacher@lms.com', 'Abdullah772091', 'أ.د. عبد الله محمد', 'instructor', 'active', '0500000002'),
('5fa85f64-5717-4562-b3fc-2c963f66afa8', 'student@lms.com', 'Abdullah772091', 'أحمد خالد العتيبي', 'student', 'active', '0500000003')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 7. UPGRADES FOR SUBSCRIPTIONS & PAYMENTS
-- ============================================================

-- Add custom columns to new_customers
ALTER TABLE public.new_customers ADD COLUMN IF NOT EXISTS selected_plan_id VARCHAR(255);
ALTER TABLE public.new_customers ADD COLUMN IF NOT EXISTS selected_course_id VARCHAR(255);
ALTER TABLE public.new_customers ADD COLUMN IF NOT EXISTS special_details TEXT;

-- Add lms_user_id and plan_id to payments
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS lms_user_id UUID REFERENCES public.lms_users(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS plan_id VARCHAR(255);

-- Create transaction-safe customer approval function
CREATE OR REPLACE FUNCTION public.approve_new_customer(
    p_customer_id INTEGER,
    p_user_id UUID DEFAULT gen_random_uuid()
) RETURNS JSONB AS $$
DECLARE
    v_customer RECORD;
    v_user_exists BOOLEAN;
    v_section_id UUID;
    v_user_id UUID;
    v_dept_id INTEGER;
BEGIN
    -- 1. Get the customer request
    SELECT * INTO v_customer FROM public.new_customers WHERE id = p_customer_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'طلب التسجيل غير موجود');
    END IF;
    
    IF v_customer.status = 'approved' THEN
        RETURN jsonb_build_object('success', true, 'message', 'الطلب مقبول بالفعل');
    END IF;

    -- 2. Check if the user already exists in lms_users
    SELECT EXISTS(SELECT 1 FROM public.lms_users WHERE LOWER(email) = LOWER(v_customer.username)) INTO v_user_exists;
    
    IF NOT v_user_exists THEN
        -- 3. Create the user in lms_users
        v_user_id := p_user_id;
        INSERT INTO public.lms_users (
            id,
            email,
            password_hash,
            full_name,
            phone,
            role,
            status,
            subscription_plan_id,
            subscription_status,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            v_customer.username,
            v_customer.password,
            v_customer.full_name,
            v_customer.phone,
            'student',
            'active',
            v_customer.selected_plan_id,
            'pending_payment',
            NOW(),
            NOW()
        );
    ELSE
        SELECT id INTO v_user_id FROM public.lms_users WHERE LOWER(email) = LOWER(v_customer.username);
    END IF;

    -- 4. Create student user in Attendance System (students table) if not exists
    -- Get or create department for Attendance System using university_name
    SELECT department_id INTO v_dept_id FROM public.departments WHERE LOWER(department_name) = LOWER(v_customer.university_name) LIMIT 1;
    IF v_dept_id IS NULL THEN
        INSERT INTO public.departments (department_name, degree_type) 
        VALUES (v_customer.university_name, 'بكالوريوس') 
        RETURNING department_id INTO v_dept_id;
    END IF;

    -- Create student in students table if not exists
    IF NOT EXISTS(SELECT 1 FROM public.students WHERE academic_id = v_customer.username) THEN
        INSERT INTO public.students (
            full_name,
            phone,
            academic_id,
            national_id,
            password,
            password_hash,
            role,
            department_id,
            subscription_amount,
            due_date,
            subscription_status,
            financial_notes
        ) VALUES (
            v_customer.full_name,
            v_customer.phone,
            v_customer.username,
            'NC-' || p_customer_id || '-' || floor(1000 + random() * 9000)::text,
            v_customer.password,
            v_customer.password,
            'student',
            v_dept_id,
            CASE WHEN v_customer.plan_type = 'premium' THEN 599.00 ELSE 299.00 END,
            (CURRENT_DATE + INTERVAL '30 days')::date,
            'pending_payment',
            'حساب منشأ تلقائياً ومعتمد من طلب الاشتراك الجديد رقم #' || p_customer_id
        );
    END IF;

    -- 5. Create any related records (e.g. enroll in course if selected)
    IF v_customer.selected_course_id IS NOT NULL AND v_customer.selected_course_id <> '' AND v_customer.selected_course_id <> 'special' THEN
        -- Find or create a section for this course
        SELECT id INTO v_section_id 
        FROM public.lms_sections 
        WHERE course_id = CAST(v_customer.selected_course_id AS UUID) 
        LIMIT 1;
        
        IF v_section_id IS NULL THEN
            v_section_id := gen_random_uuid();
            INSERT INTO public.lms_sections (
                id,
                course_id,
                section_number,
                semester,
                capacity,
                created_at
            ) VALUES (
                v_section_id,
                CAST(v_customer.selected_course_id AS UUID),
                '01',
                'Fall 2026',
                30,
                NOW()
            );
        END IF;

        -- Enroll student (ignore if already enrolled)
        INSERT INTO public.lms_enrollments (
            student_id,
            section_id,
            enrolled_at
        ) VALUES (
            v_user_id,
            v_section_id,
            NOW()
        ) ON CONFLICT (student_id, section_id) DO NOTHING;
    ELSIF v_customer.selected_course_id = 'special' THEN
        -- Create special request
        INSERT INTO public.lms_special_requests (
            student_id,
            student_name,
            student_email,
            student_phone,
            details,
            status,
            created_at
        ) VALUES (
            v_user_id,
            v_customer.full_name,
            v_customer.username,
            v_customer.phone,
            v_customer.special_details,
            'pending',
            NOW()
        );
    END IF;

    -- 6. Update the request status in new_customers
    UPDATE public.new_customers 
    SET status = 'approved', updated_at = NOW() 
    WHERE id = p_customer_id;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'تم قبول الطالب وتفعيل حسابه بنجاح',
        'user_id', v_user_id
    );
EXCEPTION WHEN OTHERS THEN
    -- Automatically rolls back
    RETURN jsonb_build_object(
        'success', false, 
        'message', 'فشلت العملية: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
