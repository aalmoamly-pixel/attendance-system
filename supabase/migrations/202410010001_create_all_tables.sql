-- ----------------------------------------------------
-- 1. جدول التخصصات (departments)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
  department_id SERIAL PRIMARY KEY,
  department_name TEXT NOT NULL,
  degree_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------
-- 2. جدول الطلاب (students)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
  student_id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  academic_id TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  department_id INTEGER REFERENCES public.departments(department_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------
-- 3. جدول المواد (subjects)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subjects (
  subject_id SERIAL PRIMARY KEY,
  subject_name TEXT NOT NULL,
  department_id INTEGER REFERENCES public.departments(department_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------
-- 4. جدول أيام الأسبوع (weekdays)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.weekdays (
  weekday_id INTEGER PRIMARY KEY,
  weekday_name_ar TEXT NOT NULL,
  weekday_name_en TEXT NOT NULL
);

-- ----------------------------------------------------
-- 5. جدول الفترات (time_slots)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.time_slots (
  slot_id SERIAL PRIMARY KEY,
  slot_name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL
);

-- ----------------------------------------------------
-- 6. جدول جدول الطلاب (student_schedule)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_schedule (
  schedule_id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES public.subjects(subject_id) ON DELETE CASCADE,
  weekday_id INTEGER NOT NULL REFERENCES public.weekdays(weekday_id),
  slot_id INTEGER NOT NULL REFERENCES public.time_slots(slot_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, weekday_id, slot_id)
);

-- ----------------------------------------------------
-- 7. جدول سجل الحضور (attendance_log)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance_log (
  log_id SERIAL PRIMARY KEY,
  schedule_id INTEGER NOT NULL REFERENCES public.student_schedule(schedule_id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('حاضر', 'غائب', 'متأخر', 'مستأذن')),
  check_in_time TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(schedule_id, attendance_date)
);

-- ----------------------------------------------------
-- إضافة بيانات افتراضية لأيام الأسبوع
-- ----------------------------------------------------
INSERT INTO public.weekdays (weekday_id, weekday_name_ar, weekday_name_en)
VALUES
  (1, 'الأحد', 'Sunday'),
  (2, 'الإثنين', 'Monday'),
  (3, 'الثلاثاء', 'Tuesday'),
  (4, 'الأربعاء', 'Wednesday'),
  (5, 'الخميس', 'Thursday'),
  (6, 'الجمعة', 'Friday'),
  (7, 'السبت', 'Saturday')
ON CONFLICT (weekday_id) DO NOTHING;

-- ----------------------------------------------------
-- إضافة بيانات افتراضية للفترات
-- ----------------------------------------------------
INSERT INTO public.time_slots (slot_name, start_time, end_time)
VALUES
  ('الفترة الأولى (4-7 م)', '16:00', '19:00'),
  ('الفترة الثانية (7-10 م)', '19:00', '22:00'),
  ('الفترة الصباحية (8-11 ص)', '08:00', '11:00'),
  ('الفترة الصباحية الثانية (11-2 م)', '11:00', '14:00')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------
-- إضافة بعض التخصصات الافتراضية
-- ----------------------------------------------------
INSERT INTO public.departments (department_name, degree_type)
VALUES
  ('هندسة البرمجيات', 'بكالوريوس'),
  ('علوم الحاسب', 'بكالوريوس'),
  ('نظم المعلومات', 'بكالوريوس'),
  ('عام', 'بكالوريوس')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------
-- 8. جدول بيانات CMS (cms_data)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cms_data (
  id SERIAL PRIMARY KEY,
  general JSONB NOT NULL DEFAULT '{}',
  homepage JSONB NOT NULL DEFAULT '{}',
  about JSONB NOT NULL DEFAULT '{}',
  services JSONB NOT NULL DEFAULT '{}',
  pricing JSONB NOT NULL DEFAULT '{}',
  contact JSONB NOT NULL DEFAULT '{}',
  footer JSONB NOT NULL DEFAULT '{}',
  partners JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by INTEGER REFERENCES public.students(student_id) ON DELETE SET NULL
);
