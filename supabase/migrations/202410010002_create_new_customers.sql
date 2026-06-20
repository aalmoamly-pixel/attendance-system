-- ----------------------------------------------------
-- جدول العملاء الجدد (new_customers)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.new_customers (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  university_name TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  phone TEXT NOT NULL,
  receipt_file TEXT NOT NULL, -- لتخزين صورة الإيصال (Base64 أو رابط الملف)
  plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'premium')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- تمكين سياسات الوصول الأمنية (RLS)
ALTER TABLE public.new_customers ENABLE ROW LEVEL SECURITY;

-- سياسة تسمح بالوصول الكامل لجميع المستخدمين (يتطابق مع بقية جداول النظام المسهلة)
CREATE POLICY "Allow full access to all" ON public.new_customers FOR ALL USING (true) WITH CHECK (true);

-- إضافة الجدول إلى النشر اللحظي (Realtime Publication)
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS new_customers;
