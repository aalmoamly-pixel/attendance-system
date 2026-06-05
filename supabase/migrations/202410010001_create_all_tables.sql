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
-- 8. جدول الإشعارات (notifications)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  notification_id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES public.students(student_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------
-- 9. جدول الملاحظات الشخصية (personal_notes)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.personal_notes (
  note_id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
  note TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id)
);

-- ----------------------------------------------------
-- 10. جدول إعدادات الدفع (payment_settings)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id SERIAL PRIMARY KEY,
  bank_transfer_enabled BOOLEAN DEFAULT TRUE,
  ria_enabled BOOLEAN DEFAULT TRUE,
  binance_enabled BOOLEAN DEFAULT TRUE,
  urpay_enabled BOOLEAN DEFAULT TRUE,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_iban TEXT,
  binance_wallet TEXT,
  urpay_number TEXT,
  ria_details TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------
-- 11. جدول المدفوعات (payments)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  payment_id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('التحويل البنكي', 'UrPay', 'Binance USDT', 'RIA')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  receipt_url TEXT,
  receipt_text TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------
-- 12. جدول بيانات CMS (cms_data)
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

-- ----------------------------------------------------
-- Row Level Security (RLS) Policies - Allow full access for all (simple setup)
-- ----------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.cms_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekdays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Create policies allowing full access to all tables
CREATE POLICY "Allow full access to all" ON public.cms_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to all" ON public.departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to all" ON public.subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to all" ON public.weekdays FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to all" ON public.time_slots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to all" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to all" ON public.student_schedule FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to all" ON public.attendance_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to all" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to all" ON public.personal_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to all" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to all" ON public.payment_settings FOR ALL USING (true) WITH CHECK (true);
