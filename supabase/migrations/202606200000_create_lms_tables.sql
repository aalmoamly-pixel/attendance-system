-- ============================================================
-- SQL Migration: Smart LMS (Learning Management System)
-- Creates tables for Users, Courses, Sections, Enrollments,
-- Materials, Assignments, Submissions, Question Bank, Exams,
-- Exam Attempts, Virtual Meetings, and Attendance.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
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

-- 2. Departments Table
CREATE TABLE IF NOT EXISTS public.lms_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Courses Table
CREATE TABLE IF NOT EXISTS public.lms_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    department_id UUID REFERENCES public.lms_departments(id) ON DELETE SET NULL,
    price FLOAT DEFAULT 0.0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Sections (الشعب الدراسية) Table
CREATE TABLE IF NOT EXISTS public.lms_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.lms_courses(id) ON DELETE CASCADE NOT NULL,
    instructor_id UUID REFERENCES public.lms_users(id) ON DELETE SET NULL,
    section_number VARCHAR(50) NOT NULL,
    semester VARCHAR(50) NOT NULL, -- e.g., "Fall 2026"
    capacity INTEGER DEFAULT 30,
    schedule_days TEXT[] DEFAULT '{}',
    schedule_time VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_course_section_semester UNIQUE (course_id, section_number, semester)
);

-- 5. Enrollments Table
CREATE TABLE IF NOT EXISTS public.lms_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.lms_users(id) ON DELETE CASCADE NOT NULL,
    section_id UUID REFERENCES public.lms_sections(id) ON DELETE CASCADE NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    final_grade FLOAT DEFAULT NULL,
    CONSTRAINT unique_student_section UNIQUE (student_id, section_id)
);

-- 6. Course Materials (المحاضرات والملفات)
CREATE TABLE IF NOT EXISTS public.lms_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES public.lms_sections(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) CHECK (type IN ('pdf', 'video', 'audio', 'document', 'link')) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Assignments Table
CREATE TABLE IF NOT EXISTS public.lms_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES public.lms_sections(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    instructions TEXT,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    max_points FLOAT DEFAULT 100.0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Submissions Table
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

-- 9. Question Bank Table
CREATE TABLE IF NOT EXISTS public.lms_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.lms_courses(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(50) CHECK (type IN ('mcq', 'tf', 'essay')) NOT NULL,
    question_text TEXT NOT NULL,
    choices JSONB, -- MCQ options like ["A", "B", "C"]
    correct_answer TEXT, -- Index or exact text for matching
    points FLOAT DEFAULT 1.0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Exams Table
CREATE TABLE IF NOT EXISTS public.lms_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES public.lms_sections(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Exam Questions Junction Table
CREATE TABLE IF NOT EXISTS public.lms_exam_questions (
    exam_id UUID REFERENCES public.lms_exams(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.lms_questions(id) ON DELETE CASCADE,
    PRIMARY KEY (exam_id, question_id)
);

-- 12. Exam Attempts Table
CREATE TABLE IF NOT EXISTS public.lms_exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.lms_exams(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.lms_users(id) ON DELETE CASCADE NOT NULL,
    answers JSONB NOT NULL, -- Student's responses mapped to question_ids
    score FLOAT DEFAULT 0.0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 13. Virtual Meetings Table
CREATE TABLE IF NOT EXISTS public.lms_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES public.lms_sections(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    meeting_url TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60
);

-- 14. Attendance Logs Table
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

-- 15. Announcements Table
CREATE TABLE IF NOT EXISTS public.lms_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES public.lms_sections(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES public.lms_users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Internal Messages Table
CREATE TABLE IF NOT EXISTS public.lms_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.lms_users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.lms_users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. Certificates Table
CREATE TABLE IF NOT EXISTS public.lms_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.lms_users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.lms_courses(id) ON DELETE CASCADE NOT NULL,
    certificate_code VARCHAR(100) UNIQUE NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    grade FLOAT
);

-- Enable RLS for all tables
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

-- Disable RLS filters for ease of demonstration (or enable public read/write)
CREATE POLICY "Allow public full access" ON public.lms_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.lms_departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.lms_courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.lms_sections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.lms_enrollments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.lms_materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.lms_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.lms_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.lms_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.lms_exams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.lms_exam_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.lms_exam_attempts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.lms_meetings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.lms_attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.lms_announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.lms_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.lms_certificates FOR ALL USING (true) WITH CHECK (true);

-- Add tables to realtime publication
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS lms_users;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS lms_departments;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS lms_courses;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS lms_sections;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS lms_enrollments;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS lms_materials;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS lms_assignments;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS lms_submissions;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS lms_questions;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS lms_exams;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS lms_exam_questions;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS lms_exam_attempts;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS lms_meetings;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS lms_attendance;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS lms_announcements;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS lms_messages;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS lms_certificates;

-- Indexing optimizations
CREATE INDEX IF NOT EXISTS idx_lms_users_role ON public.lms_users(role);
CREATE INDEX IF NOT EXISTS idx_lms_sections_course ON public.lms_sections(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_enrollments_student ON public.lms_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_lms_materials_section ON public.lms_materials(section_id);
CREATE INDEX IF NOT EXISTS idx_lms_submissions_student ON public.lms_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_lms_exam_attempts_student ON public.lms_exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_lms_attendance_student ON public.lms_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_lms_messages_sender ON public.lms_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_lms_messages_receiver ON public.lms_messages(receiver_id);

-- 18. Special Custom Lesson Requests Table
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

ALTER TABLE public.lms_special_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access" ON public.lms_special_requests FOR ALL USING (true) WITH CHECK (true);
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS lms_special_requests;
CREATE INDEX IF NOT EXISTS idx_lms_special_requests_student ON public.lms_special_requests(student_id);
