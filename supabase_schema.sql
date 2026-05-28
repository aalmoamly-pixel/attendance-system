-- ==========================================
-- Supabase Schema for Smart Attendance & Timetable Management
-- Location: supabase_schema.sql
-- ==========================================

-- 1. Disable Row Level Security temporarily during table creation if needed
-- Enable extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id VARCHAR(50) UNIQUE NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    department VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CREATE SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_name VARCHAR(255) NOT NULL,
    subject_code VARCHAR(50) UNIQUE NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CREATE SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    hall VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    day_of_week VARCHAR(50) NOT NULL,
    week_number INTEGER CHECK (week_number >= 1 AND week_number <= 15) NOT NULL,
    time_start TIME NOT NULL,
    time_end TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. CREATE ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    schedule_id UUID REFERENCES public.schedules(id) ON DELETE CASCADE NOT NULL,
    attendance_status VARCHAR(50) CHECK (attendance_status IN ('حاضر', 'غائب', 'متأخر', 'بعذر')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Prevent duplicate attendance for the same student on the same scheduled lecture
    CONSTRAINT unique_student_schedule UNIQUE (student_id, schedule_id)
);

-- 6. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- 7. DEFINE PUBLIC READ/WRITE POLICIES FOR THE ANON KEY
-- Policy for Students
CREATE POLICY "Enable all access for anonymous users" ON public.students
    FOR ALL USING (true) WITH CHECK (true);

-- Policy for Subjects
CREATE POLICY "Enable all access for anonymous users" ON public.subjects
    FOR ALL USING (true) WITH CHECK (true);

-- Policy for Schedules
CREATE POLICY "Enable all access for anonymous users" ON public.schedules
    FOR ALL USING (true) WITH CHECK (true);

-- Policy for Attendance
CREATE POLICY "Enable all access for anonymous users" ON public.attendance
    FOR ALL USING (true) WITH CHECK (true);

-- 8. INDEXES FOR PERFORMANCE OPTIMIZATION
CREATE INDEX IF NOT EXISTS idx_students_university_id ON public.students(university_id);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON public.subjects(subject_code);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON public.schedules(date);
CREATE INDEX IF NOT EXISTS idx_attendance_schedule ON public.attendance(schedule_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);
