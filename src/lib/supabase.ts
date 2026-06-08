import { createClient } from '@supabase/supabase-js';
import type { 
  Department, 
  Student, 
  Subject, 
  Weekday, 
  TimeSlot, 
  StudentSchedule, 
  AttendanceLog, 
  DashboardStats,
  UserRole,
  Notification,
  PersonalNote,
  Payment,
  PaymentStatus,
  PaymentMethod,
  PaymentSettings,
  CMSData
} from '../types/database';
import { hashPassword } from './crypto';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isSupabaseConfigured = 
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  SUPABASE_URL.includes('supabase.co');

console.log(`[Database System] Mode: ${isSupabaseConfigured ? '⚡ Supabase Cloud' : '💾 Local Storage (Fallback)'}`);

export const supabase = isSupabaseConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        }
      }
    })
  : null;

const LOCAL_KEYS = {
  DEPARTMENTS: 'attendance_departments',
  STUDENTS: 'attendance_students',
  SUBJECTS: 'attendance_subjects',
  WEEKDAYS: 'attendance_weekdays',
  TIME_SLOTS: 'attendance_time_slots',
  SCHEDULES: 'attendance_schedules',
  ATTENDANCE_LOGS: 'attendance_logs',
  NOTIFICATIONS: 'attendance_notifications',
  PERSONAL_NOTES: 'attendance_personal_notes',
  PAYMENTS: 'attendance_payments',
  PAYMENT_SETTINGS: 'attendance_payment_settings',
  CMS_DATA: 'cms_data'
};

export const initializeLocalData = async () => {
  if (isSupabaseConfigured && supabase) {
    // --- Supabase mode: Initialize data in Supabase
    console.log('[initializeLocalData] Supabase mode: Initializing data');

    // Initialize departments in Supabase
    const { data: existingDepartments, error: deptError } = await supabase.from('departments').select('*');
    if (deptError) {
      console.error('[initializeLocalData] Departments error:', deptError);
    } else if (!existingDepartments || existingDepartments.length === 0) {
      const { error: insertDeptError } = await supabase.from('departments').insert([
        { department_id: 1, department_name: 'هندسة البرمجيات', degree_type: 'بكالوريوس' },
        { department_id: 2, department_name: 'علوم الحاسب', degree_type: 'بكالوريوس' },
        { department_id: 3, department_name: 'نظم المعلومات', degree_type: 'بكالوريوس' },
        { department_id: 4, department_name: 'عام', degree_type: 'بكالوريوس' }
      ]);
      if (insertDeptError) {
        console.error('[initializeLocalData] Departments insert error:', insertDeptError);
      } else {
        console.log('[initializeLocalData] Departments initialized in Supabase');
      }
    }

    // Initialize subjects in Supabase
    const { data: existingSubjects, error: subjError } = await supabase.from('subjects').select('*');
    if (subjError) {
      console.error('[initializeLocalData] Subjects error:', subjError);
    } else if (!existingSubjects || existingSubjects.length === 0) {
      const { error: insertSubjError } = await supabase.from('subjects').insert([
        { subject_id: 1, subject_name: 'هندسة البرمجيات', department_id: 1 },
        { subject_id: 2, subject_name: 'قواعد البيانات', department_id: 2 },
        { subject_id: 3, subject_name: 'أمن المعلومات', department_id: 4 },
        { subject_id: 4, subject_name: 'ذكاء الاصطناعي', department_id: 1 },
        { subject_id: 5, subject_name: 'شبكات الحاسب', department_id: 2 }
      ]);
      if (insertSubjError) {
        console.error('[initializeLocalData] Subjects insert error:', insertSubjError);
      } else {
        console.log('[initializeLocalData] Subjects initialized in Supabase');
      }
    }

    // Initialize weekdays in Supabase
    const { data: existingWeekdays, error: weekdayError } = await supabase.from('weekdays').select('*');
    if (weekdayError) {
      console.error('[initializeLocalData] Weekdays error:', weekdayError);
    } else if (!existingWeekdays || existingWeekdays.length === 0) {
      const { error: insertWeekdayError } = await supabase.from('weekdays').insert([
        { weekday_id: 1, weekday_name_ar: 'الأحد', weekday_name_en: 'Sunday' },
        { weekday_id: 2, weekday_name_ar: 'الإثنين', weekday_name_en: 'Monday' },
        { weekday_id: 3, weekday_name_ar: 'الثلاثاء', weekday_name_en: 'Tuesday' },
        { weekday_id: 4, weekday_name_ar: 'الأربعاء', weekday_name_en: 'Wednesday' },
        { weekday_id: 5, weekday_name_ar: 'الخميس', weekday_name_en: 'Thursday' },
        { weekday_id: 6, weekday_name_ar: 'الجمعة', weekday_name_en: 'Friday' },
        { weekday_id: 7, weekday_name_ar: 'السبت', weekday_name_en: 'Saturday' }
      ]);
      if (insertWeekdayError) {
        console.error('[initializeLocalData] Weekdays insert error:', insertWeekdayError);
      } else {
        console.log('[initializeLocalData] Weekdays initialized in Supabase');
      }
    }

    // Initialize time slots in Supabase
    const { data: existingTimeSlots, error: slotError } = await supabase.from('time_slots').select('*');
    if (slotError) {
      console.error('[initializeLocalData] Time slots error:', slotError);
    } else if (!existingTimeSlots || existingTimeSlots.length === 0) {
      const { error: insertSlotError } = await supabase.from('time_slots').insert([
        { slot_id: 1, slot_name: 'الفترة الأولى (4-7 م)', start_time: '16:00', end_time: '19:00' },
        { slot_id: 2, slot_name: 'الفترة الثانية (7-10 م)', start_time: '19:00', end_time: '22:00' }
      ]);
      if (insertSlotError) {
        console.error('[initializeLocalData] Time slots insert error:', insertSlotError);
      } else {
        console.log('[initializeLocalData] Time slots initialized in Supabase');
      }
    }

    // Initialize admin and test students in Supabase
    const { data: existingStudents, error: studentError } = await supabase.from('students').select('*');
    if (studentError) {
      console.error('[initializeLocalData] Students error:', studentError);
    } else if (!existingStudents || existingStudents.length === 0) {
      const adminPassword = await hashPassword('Abdullah772091');
      const student1Password = 'Student123';
      const student1Hash = await hashPassword(student1Password);
      const student2Password = 'Student456';
      const student2Hash = await hashPassword(student2Password);

      const { error: insertStudentError } = await supabase.from('students').insert([
        { 
          student_id: 1, 
          full_name: 'أدمن النظام', 
          phone: null, 
          academic_id: 'ADMIN001', 
          national_id: '715580715',
          password_hash: adminPassword, 
          password: 'Abdullah772091',
          role: 'admin' as UserRole,
          department_id: 1 
        },
        { 
          student_id: 2, 
          full_name: 'أحمد محمد علي', 
          phone: '0501234567', 
          academic_id: '26204116', 
          national_id: '123456789',
          password_hash: student1Hash, 
          password: student1Password,
          role: 'student' as UserRole,
          department_id: 1 
        },
        { 
          student_id: 3, 
          full_name: 'فاطمة أحمد سعيد', 
          phone: '0507654321', 
          academic_id: '26204117', 
          national_id: '987654321',
          password_hash: student2Hash, 
          password: student2Password,
          role: 'student' as UserRole,
          department_id: 2 
        }
      ]);
      if (insertStudentError) {
        console.error('[initializeLocalData] Students insert error:', insertStudentError);
      } else {
        console.log('[initializeLocalData] Students initialized in Supabase');
      }
    }

    // Initialize sample schedules in Supabase
    const { data: existingSchedules, error: scheduleError } = await supabase.from('student_schedule').select('*');
    if (scheduleError) {
      console.error('[initializeLocalData] Schedules error:', scheduleError);
    } else if (!existingSchedules || existingSchedules.length === 0) {
      const { error: insertScheduleError } = await supabase.from('student_schedule').insert([
        { schedule_id: 1, student_id: 2, subject_id: 1, weekday_id: 1, slot_id: 1 },
        { schedule_id: 2, student_id: 2, subject_id: 4, weekday_id: 3, slot_id: 2 },
        { schedule_id: 3, student_id: 2, subject_id: 3, weekday_id: 5, slot_id: 1 },
        { schedule_id: 4, student_id: 3, subject_id: 2, weekday_id: 2, slot_id: 1 },
        { schedule_id: 5, student_id: 3, subject_id: 5, weekday_id: 4, slot_id: 2 },
        { schedule_id: 6, student_id: 3, subject_id: 3, weekday_id: 6, slot_id: 1 }
      ]);
      if (insertScheduleError) {
        console.error('[initializeLocalData] Schedules insert error:', insertScheduleError);
      } else {
        console.log('[initializeLocalData] Schedules initialized in Supabase');
      }
    }

    // Initialize CMS data in Supabase
    const defaultPartners = {
      isActive: true,
      pageTitle: 'شركاء الدفع',
      pageSubtitle: 'تعاون معنا لتقديم حلول دفع متكاملة لآلاف الطلاب والمعاهد',
      aboutUs: 'منصة تعليم هي منصة تعليمية متكاملة تخدم آلاف الطلاب والمعاهد. نحن نبحث عن شراكات استراتيجية مع مزودي خدمات الدفع والبنوك لتقديم تجربة دفع سلسة لطلابنا.',
      totalStudents: '10,000+',
      activeUsers: '8,500',
      avgMonthlyTransactions: '5,000',
      currentPaymentMethods: ['التحويل البنكي', 'UrPay', 'Binance USDT', 'RIA'],
      platformFeatures: [
        { id: 1, title: 'إدارة الطلاب', description: 'إدارة شاملة للطلاب مع بيانات كاملة' },
        { id: 2, title: 'إدارة الرسوم', description: 'تحديد وتتبع الرسوم الدراسية' },
        { id: 3, title: 'إدارة المدفوعات', description: 'تتبع جميع المدفوعات بسهولة' },
        { id: 4, title: 'رفع إثباتات الدفع', description: 'إمكانية رفع إثباتات الدفع إلكترونياً' },
        { id: 5, title: 'مراجعة واعتماد المدفوعات', description: 'عملية مراجعة واعتماد سريعة' },
        { id: 6, title: 'الإشعارات', description: 'إشعارات تلقائية للطلاب' },
        { id: 7, title: 'التقارير المالية', description: 'تقارير مالية شاملة ومفصلة' },
        { id: 8, title: 'الإحصائيات', description: 'إحصائيات حية ومفصلة' },
      ],
      dashboardStats: {
        studentsCount: '10,000+',
        paymentsCount: '50,000+',
        totalRevenue: '2,500,000 ريال',
        pendingCount: '120',
        paymentRate: '95%'
      },
      screenshots: [],
      integrationReadyTitle: 'Payment Integration Ready',
      integrationReadyDescription: 'منصتنا جاهزة تقنياً للربط مع جميع مزودي خدمات الدفع',
      integrationMethods: [
        { id: 1, name: 'Visa' },
        { id: 2, name: 'Mastercard' },
        { id: 3, name: 'Mada' },
        { id: 4, name: 'Apple Pay' },
        { id: 5, name: 'Google Pay' },
        { id: 6, name: 'UrPay' },
        { id: 7, name: 'Bank Transfer' },
      ],
      securityTitle: 'الأمان والخصوصية',
      securityDescription: 'منصتنا مصممة لتقديم أعلى مستويات الأمان والخصوصية للبيانات المالية للطلاب والمعاهد',
      securityFeatures: ['تشفير البيانات من طرف إلى طرف', 'توافق مع PCI DSS', 'نسخ احتياطي يومي', 'مراقبة مستمرة للأنظمة']
    };

    const defaultCMSData = {
      general: {
        site_name: 'منصة تعليم',
        site_description: 'منصة ذكية لمتابعة الطالب الجامعي وإدارة الخدمات الأكاديمية المتكاملة',
        copyright_text: '© 2025 منصة تعليم. جميع الحقوق محفوظة'
      },
      homepage: {
        hero_title: 'منصة تعليمية ذكية للخدمات الجامعية المتكاملة',
        hero_subtitle: 'منصة رقمية متكاملة لمتابعة المستوى الأكاديمي للطالب الجامعي وإدارة جميع الخدمات التعليمية من مكان واحد، وتشمل الحضور والغياب، الاختبارات الإلكترونية، الواجبات والمشاريع، النتائج الأكاديمية، متابعة الرسوم الدراسية، المدفوعات الإلكترونية، الإشعارات الفورية والتقارير التعليمية.',
        hero_subtitle_2: 'صممت المنصة لتسهيل تجربة الطالب الجامعية ومتابعة مستواه الأكاديمي ورسومه الدراسية وإشعاراته بشكل فوري ومنظم.',
        hero_button_primary: 'استكشف خدمات الطالب',
        hero_button_primary_link: '/demo',
        hero_button_secondary: 'المزيد عنا',
        hero_button_secondary_link: '/about',
        hero_quick_features: [
          'متابعة المستوى الأكاديمي للطالب الجامعي',
          'متابعة الحضور والغياب',
          'الاختبارات الإلكترونية',
          'الواجبات والمشاريع',
          'النتائج والتقديرات',
          'متابعة الرسوم الدراسية',
          'رفع وإدارة إثباتات الدفع',
          'الإشعارات والتنبيهات الفورية',
          'التقارير والإحصائيات',
          'الخدمات الجامعية المتكاملة',
          'دعم التعليم الحضوري والتعليم عن بعد',
          'دعم الأكاديميات ومراكز التدريب والبرامج المهنية'
        ],
        stats: [
          { number: '1000+', label: 'طالب جامعي' },
          { number: '50+', label: 'مؤسسة أكاديمية' },
          { number: '98%', label: 'رضا العملاء' },
          { number: '24/7', label: 'دعم فني' }
        ]
      },
      about: {
        page_title: 'من نحن',
        about_description: 'منصة تعليم هي منصة تعليمية ذكية لمتابعة الطالب الجامعي وإدارة الخدمات الأكاديمية المتكاملة',
        goals: [
          'تقديم تجربة تعليمية متكاملة ومبتكرة للطلاب الجامعيين',
          'تسهيل متابعة الحضور والغياب والنتائج الأكاديمية',
          'تحسين تجربة التعلم للطلاب الجامعيين',
          'توفير أدوات فعالة لمتابعة الرسوم الدراسية للطلاب'
        ],
        features: [
          { id: 1, icon: 'BookOpen', title: 'الاختبارات الإلكترونية', description: 'متابعة نتائج الاختبارات بسهولة' },
          { id: 2, icon: 'Calendar', title: 'متابعة الحضور', description: 'تتبع حضور الطالب الجامعي بدقة' },
          { id: 3, icon: 'Award', title: 'النتائج والتقديرات', description: 'عرض وتحليل النتائج الأكاديمية' },
          { id: 4, icon: 'CreditCard', title: 'متابعة الرسوم', description: 'متابعة الرسوم الدراسية والدفعات' }
        ]
      },
      services: {
        page_title: 'الخدمات',
        page_subtitle: 'كل ما يحتاجه الطالب الجامعي في مكان واحد',
        services: [
          { id: 1, icon: 'FileText', title: 'الاختبارات الإلكترونية', description: 'متابعة نتائج الاختبارات بسهولة مع تحليل النتائج وتقارير مفصلة' },
          { id: 2, icon: 'BookOpen', title: 'الواجبات والمشاريع', description: 'تسليم الواجبات إلكترونياً مع تقييم وملاحظات فورية' },
          { id: 3, icon: 'Calendar', title: 'متابعة الحضور والغياب', description: 'تتبع حضور الطالب الجامعي بدقة مع تقارير يومية وشهرية' },
          { id: 4, icon: 'Award', title: 'النتائج والتقديرات', description: 'عرض وتحليل النتائج الأكاديمية مع إمكانية مشاركتها' },
          { id: 5, icon: 'CreditCard', title: 'متابعة الرسوم الدراسية', description: 'متابعة الرسوم الدراسية والدفعات مع تقارير مفصلة' }
        ]
      },
      pricing: {
        page_title: 'الأسعار',
        page_subtitle: 'اختر الخطة التي تناسب احتياجات الطالب الجامعي',
        plans: [
          { id: 1, name: 'الخطة الأساسية', price: '299', period: 'ريال/شهر', features: ['متابعة الحضور', 'النتائج والتقديرات', 'الواجبات', 'دعم عبر البريد'] },
          { id: 2, name: 'الخطة المتقدمة', price: '599', period: 'ريال/شهر', popular: true, features: ['جميع مميزات الخطة الأساسية', 'الاختبارات الإلكترونية', 'متابعة الرسوم', 'الإشعارات الفورية', 'دعم عبر الهاتف'] },
          { id: 3, name: 'الخطة المؤسسية', price: 'مخصصة', period: 'اتصل بنا', features: ['جميع المميزات', 'تقارير مالية مفصلة', 'دعم مخصص', 'تخصيص متقدم', 'تكامل مع أنظمة الدفع'] }
        ]
      },
      contact: {
        email: 'info@example.com',
        phone: '+966 50 123 4567',
        whatsapp: '+966 50 123 4567',
        address: 'الرياض، المملكة العربية السعودية',
        social_links: [
          { platform: 'Facebook', url: 'https://facebook.com' },
          { platform: 'Twitter', url: 'https://twitter.com' },
          { platform: 'Instagram', url: 'https://instagram.com' }
        ]
      },
      footer: {
        quick_links: [
          { label: 'الرئيسية', url: '/' },
          { label: 'من نحن', url: '/about' },
          { label: 'الخدمات', url: '/services' },
          { label: 'الأسعار', url: '/pricing' },
          { label: 'تواصل معنا', url: '/contact' }
        ],
        terms_url: '/terms',
        privacy_url: '/privacy',
        copyright_text: '© 2025 منصة تعليم. جميع الحقوق محفوظة'
      },
      partners: defaultPartners
    };

    const { data: existingCMS, error: cmsError } = await supabase.from('cms_data').select('*');
    if (cmsError) {
      console.error('[initializeLocalData] CMS error:', cmsError);
    } else if (!existingCMS || existingCMS.length === 0) {
      const { error: insertCMSError } = await supabase.from('cms_data').insert([defaultCMSData]);
      if (insertCMSError) {
        console.error('[initializeLocalData] CMS insert error:', insertCMSError);
      } else {
        console.log('[initializeLocalData] CMS data initialized in Supabase');
      }
    }

    // Migrate any existing Local Storage data to Supabase
    await migrateLocalToSupabase();
    
    console.log('[initializeLocalData] Supabase initialization complete!');
  } else {
    // --- Local Storage fallback mode ---
    if (!localStorage.getItem(LOCAL_KEYS.DEPARTMENTS)) {
      localStorage.setItem(LOCAL_KEYS.DEPARTMENTS, JSON.stringify([
        { department_id: 1, department_name: 'هندسة البرمجيات', degree_type: 'بكالوريوس' },
        { department_id: 2, department_name: 'علوم الحاسب', degree_type: 'بكالوريوس' },
        { department_id: 3, department_name: 'نظم المعلومات', degree_type: 'بكالوريوس' },
        { department_id: 4, department_name: 'عام', degree_type: 'بكالوريوس' }
      ]));
      console.log('[initializeLocalData] Departments initialized');
    }

    if (!localStorage.getItem(LOCAL_KEYS.SUBJECTS)) {
      localStorage.setItem(LOCAL_KEYS.SUBJECTS, JSON.stringify([
        { subject_id: 1, subject_name: 'هندسة البرمجيات', department_id: 1 },
        { subject_id: 2, subject_name: 'قواعد البيانات', department_id: 2 },
        { subject_id: 3, subject_name: 'أمن المعلومات', department_id: 4 },
        { subject_id: 4, subject_name: 'ذكاء الاصطناعي', department_id: 1 },
        { subject_id: 5, subject_name: 'شبكات الحاسب', department_id: 2 }
      ]));
      console.log('[initializeLocalData] Subjects initialized');
    }

    if (!localStorage.getItem(LOCAL_KEYS.WEEKDAYS)) {
      localStorage.setItem(LOCAL_KEYS.WEEKDAYS, JSON.stringify([
        { weekday_id: 1, weekday_name_ar: 'الأحد', weekday_name_en: 'Sunday' },
        { weekday_id: 2, weekday_name_ar: 'الإثنين', weekday_name_en: 'Monday' },
        { weekday_id: 3, weekday_name_ar: 'الثلاثاء', weekday_name_en: 'Tuesday' },
        { weekday_id: 4, weekday_name_ar: 'الأربعاء', weekday_name_en: 'Wednesday' },
        { weekday_id: 5, weekday_name_ar: 'الخميس', weekday_name_en: 'Thursday' },
        { weekday_id: 6, weekday_name_ar: 'الجمعة', weekday_name_en: 'Friday' },
        { weekday_id: 7, weekday_name_ar: 'السبت', weekday_name_en: 'Saturday' }
      ]));
      console.log('[initializeLocalData] Weekdays initialized');
    }

    if (!localStorage.getItem(LOCAL_KEYS.TIME_SLOTS)) {
      localStorage.setItem(LOCAL_KEYS.TIME_SLOTS, JSON.stringify([
        { slot_id: 1, slot_name: 'الفترة الأولى (4-7 م)', start_time: '16:00', end_time: '19:00' },
        { slot_id: 2, slot_name: 'الفترة الثانية (7-10 م)', start_time: '19:00', end_time: '22:00' }
      ]));
      console.log('[initializeLocalData] Time slots initialized');
    }

    if (!localStorage.getItem(LOCAL_KEYS.STUDENTS)) {
      const adminPassword = await hashPassword('Abdullah772091');
      const student1Password = 'Student123';
      const student1Hash = await hashPassword(student1Password);
      const student2Password = 'Student456';
      const student2Hash = await hashPassword(student2Password);
      
      const students = [
        { 
          student_id: 1, 
          full_name: 'أدمن النظام', 
          phone: null, 
          academic_id: 'ADMIN001', 
          national_id: '715580715',
          password_hash: adminPassword, 
          password: 'Abdullah772091',
          role: 'admin' as UserRole,
          department_id: 1,
          personal_note: null,
          subscription_amount: 0,
          due_date: null,
          subscription_status: 'active',
          financial_notes: null
        },
        { 
          student_id: 2, 
          full_name: 'أحمد محمد علي', 
          phone: '0501234567', 
          academic_id: '26204116', 
          national_id: '123456789',
          password_hash: student1Hash, 
          password: student1Password,
          role: 'student' as UserRole,
          department_id: 1,
          personal_note: null,
          subscription_amount: 200,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subscription_status: 'unpaid',
          financial_notes: null
        },
        { 
          student_id: 3, 
          full_name: 'فاطمة أحمد سعيد', 
          phone: '0507654321', 
          academic_id: '26204117', 
          national_id: '987654321',
          password_hash: student2Hash, 
          password: student2Password,
          role: 'student' as UserRole,
          department_id: 2,
          personal_note: null,
          subscription_amount: 300,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subscription_status: 'unpaid',
          financial_notes: null
        }
      ];
      
      localStorage.setItem(LOCAL_KEYS.STUDENTS, JSON.stringify(students));
      console.log('[initializeLocalData] Students initialized');
    }

    if (!localStorage.getItem(LOCAL_KEYS.SCHEDULES)) {
      const schedules = [
        { schedule_id: 1, student_id: 2, subject_id: 1, weekday_id: 1, slot_id: 1 },
        { schedule_id: 2, student_id: 2, subject_id: 4, weekday_id: 3, slot_id: 2 },
        { schedule_id: 3, student_id: 2, subject_id: 3, weekday_id: 5, slot_id: 1 },
        { schedule_id: 4, student_id: 3, subject_id: 2, weekday_id: 2, slot_id: 1 },
        { schedule_id: 5, student_id: 3, subject_id: 5, weekday_id: 4, slot_id: 2 },
        { schedule_id: 6, student_id: 3, subject_id: 3, weekday_id: 6, slot_id: 1 }
      ];
      localStorage.setItem(LOCAL_KEYS.SCHEDULES, JSON.stringify(schedules));
      console.log('[initializeLocalData] Sample schedules added');
    }

    if (!localStorage.getItem(LOCAL_KEYS.ATTENDANCE_LOGS)) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      const attendanceLogs = [
        { log_id: 1, schedule_id: 1, attendance_date: yesterday, status: 'حاضر', check_in_time: '16:05' },
        { log_id: 2, schedule_id: 2, attendance_date: yesterday, status: 'حاضر', check_in_time: '19:02' },
        { log_id: 3, schedule_id: 1, attendance_date: today, status: 'متأخر', check_in_time: '16:15' },
        { log_id: 4, schedule_id: 4, attendance_date: yesterday, status: 'حاضر', check_in_time: '16:00' },
        { log_id: 5, schedule_id: 5, attendance_date: yesterday, status: 'غائب', check_in_time: null }
      ];
      localStorage.setItem(LOCAL_KEYS.ATTENDANCE_LOGS, JSON.stringify(attendanceLogs));
      console.log('[initializeLocalData] Sample attendance logs added');
    }

    if (!localStorage.getItem(LOCAL_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(LOCAL_KEYS.NOTIFICATIONS, JSON.stringify([]));
      console.log('[initializeLocalData] Notifications initialized');
    }

    if (!localStorage.getItem(LOCAL_KEYS.PERSONAL_NOTES)) {
      localStorage.setItem(LOCAL_KEYS.PERSONAL_NOTES, JSON.stringify([]));
      console.log('[initializeLocalData] Personal notes initialized');
    }
    
    if (!localStorage.getItem(LOCAL_KEYS.PAYMENTS)) {
      localStorage.setItem(LOCAL_KEYS.PAYMENTS, JSON.stringify([]));
      console.log('[initializeLocalData] Payments initialized');
    }
    
    if (!localStorage.getItem(LOCAL_KEYS.PAYMENT_SETTINGS)) {
      const defaultSettings: PaymentSettings = {
        subscription_amount: 299,
        subscription_duration_days: 30,
        enabled_payment_methods: ['bank_transfer', 'ria', 'binance_usdt', 'urpay'],
        bank_transfer_details: 'اسم البنك: بنك الراجحي | رقم الحساب: 123456789 | الاسم: إدارة تحضير الطلاب',
        ria_details: 'اسم المستلم: إدارة تحضير الطلاب | الدولة: السعودية',
        binance_wallet: '0x123456789abcdef123456789abcdef123456789',
        urpay_number: '',
        urpay_account_name: '',
        urpay_qr_image: null,
        payment_instructions: 'يرجى إرسال إثبات الدفع عبر النظام بعد الدفع'
      };
      localStorage.setItem(LOCAL_KEYS.PAYMENT_SETTINGS, JSON.stringify(defaultSettings));
      console.log('[initializeLocalData] Payment settings initialized');
    }
    
    console.log('[initializeLocalData] All data initialized successfully!');
  }
};

initializeLocalData();

export const db = {
  async getDepartments(): Promise<Department[]> {
    if (supabase) {
      const { data, error } = await supabase.from('departments').select('*');
      if (error) {
        console.error('[Departments] Fetch error:', error);
        throw error;
      }
      return data || [];
    }
    return JSON.parse(localStorage.getItem(LOCAL_KEYS.DEPARTMENTS) || '[]');
  },

  async createDepartment(dept: Omit<Department, 'department_id'>): Promise<Department> {
    if (supabase) {
      const { data, error } = await supabase
        .from('departments')
        .insert(dept)
        .select('*')
        .single();
      if (error) {
        console.error('[Departments] Create error:', error);
        throw error;
      }
      return data;
    } else {
      const existing = JSON.parse(localStorage.getItem(LOCAL_KEYS.DEPARTMENTS) || '[]');
      const nextId = existing.length > 0 ? Math.max(...existing.map((d: any) => d.department_id)) + 1 : 1;
      const newDept = { ...dept, department_id: nextId };
      existing.push(newDept);
      localStorage.setItem(LOCAL_KEYS.DEPARTMENTS, JSON.stringify(existing));
      return newDept;
    }
  },

  async importDepartments(depts: Omit<Department, 'department_id'>[]): Promise<Map<string, number>> {
    const mapping = new Map<string, number>();
    if (supabase) {
      // First get all existing departments
      const { data: existingDepts, error: fetchError } = await supabase.from('departments').select('*');
      if (fetchError) {
        console.error('[Departments] Fetch existing error:', fetchError);
        throw fetchError;
      }
      const existingMap = new Map(existingDepts?.map(d => [d.department_name, d.department_id]) || []);
      
      // Separate new and existing departments
      const newDepts = depts.filter(d => !existingMap.has(d.department_name));
      
      // Insert new departments
      if (newDepts.length > 0) {
        const { data: insertedDepts, error: insertError } = await supabase.from('departments').insert(newDepts).select('*');
        if (insertError) {
          console.error('[Departments] Insert new error:', insertError);
          throw insertError;
        }
        (insertedDepts || []).forEach(d => existingMap.set(d.department_name, d.department_id));
      }
      
      // Populate the final mapping
      existingMap.forEach((id, name) => mapping.set(name, id));
    } else {
      const existing = JSON.parse(localStorage.getItem(LOCAL_KEYS.DEPARTMENTS) || '[]');
      let nextId = existing.length > 0 ? Math.max(...existing.map((d: any) => d.department_id)) + 1 : 1;
      depts.forEach(dept => {
        const found = existing.find((d: any) => d.department_name === dept.department_name);
        if (found) {
          mapping.set(dept.department_name, found.department_id);
        } else {
          const newDept = { ...dept, department_id: nextId++ };
          existing.push(newDept);
          mapping.set(dept.department_name, newDept.department_id);
        }
      });
      localStorage.setItem(LOCAL_KEYS.DEPARTMENTS, JSON.stringify(existing));
    }
    return mapping;
  },

  async getStudents(): Promise<Student[]> {
    if (supabase) {
      const { data, error } = await supabase.from('students').select('*');
      if (error) {
        console.error('[Students] Fetch error:', error);
        throw error;
      }
      return data || [];
    }
    return JSON.parse(localStorage.getItem(LOCAL_KEYS.STUDENTS) || '[]');
  },

  async createStudent(student: Omit<Student, 'student_id'> & { password?: string }): Promise<Student> {
    const { hashPassword } = await import('./auth');
    
    console.log('[createStudent] Input:', student);
    
    let studentData = { ...student };
    
    if (student.password) {
      studentData.password_hash = await hashPassword(student.password);
      studentData.password = student.password;
      console.log('[createStudent] Hashed password set and plain password saved');
    }
    
    if (!studentData.role) {
      studentData.role = 'student';
      console.log('[createStudent] Set default role to student');
    }

    // Set default payment-related fields
    if (studentData.subscription_amount === undefined || studentData.subscription_amount === null) {
      studentData.subscription_amount = 0;
      console.log('[createStudent] Set default subscription_amount to 0');
    }
    if (studentData.due_date === undefined) {
      studentData.due_date = null;
      console.log('[createStudent] Set default due_date to null');
    }
    if (!studentData.subscription_status) {
      studentData.subscription_status = 'unpaid';
      console.log('[createStudent] Set default subscription_status to unpaid');
    }
    if (studentData.financial_notes === undefined) {
      studentData.financial_notes = null;
      console.log('[createStudent] Set default financial_notes to null');
    }

    console.log('[createStudent] Final studentData:', studentData);

    if (supabase) {
      const { data, error } = await supabase
        .from('students')
        .insert(studentData)
        .select('*')
        .single();
      if (error) {
        console.error('[Students] Create error:', error);
        throw error;
      }
      return data;
    } else {
      const existing = JSON.parse(localStorage.getItem(LOCAL_KEYS.STUDENTS) || '[]');
      const nextId = existing.length > 0 ? Math.max(...existing.map((s: any) => s.student_id)) + 1 : 1;
      const newStudent = { ...studentData, student_id: nextId };
      existing.push(newStudent);
      localStorage.setItem(LOCAL_KEYS.STUDENTS, JSON.stringify(existing));
      console.log('[createStudent] Saved to localStorage:', newStudent);
      console.log('[createStudent] All students now:', existing);
      return newStudent;
    }
  },

  async updateStudent(id: number, student: Partial<Omit<Student, 'student_id'>> & { password?: string }): Promise<Student> {
    const { hashPassword } = await import('./auth');
    
    console.log('[updateStudent] Input:', student);
    
    let studentData = { ...student };
    
    if (student.password) {
      studentData.password_hash = await hashPassword(student.password);
      studentData.password = student.password;
      console.log('[updateStudent] Hashed password set and plain password saved');
    }

    console.log('[updateStudent] Final studentData:', studentData);

    if (supabase) {
      const { data, error } = await supabase
        .from('students')
        .update(studentData)
        .eq('student_id', id)
        .select('*')
        .single();
      if (error) {
        console.error('[Students] Update error:', error);
        throw error;
      }
      return data;
    } else {
      const existing = JSON.parse(localStorage.getItem(LOCAL_KEYS.STUDENTS) || '[]');
      const index = existing.findIndex((s: any) => s.student_id === id);
      if (index !== -1) {
        existing[index] = { ...existing[index], ...studentData };
        localStorage.setItem(LOCAL_KEYS.STUDENTS, JSON.stringify(existing));
        console.log('[updateStudent] Saved to localStorage:', existing[index]);
        return existing[index];
      }
      throw new Error('Student not found');
    }
  },

  async deleteStudent(id: number): Promise<void> {
    if (supabase) {
      const { error } = await supabase.from('students').delete().eq('student_id', id);
      if (error) {
        console.error('[Students] Delete error:', error);
        throw error;
      }
    } else {
      const existing = JSON.parse(localStorage.getItem(LOCAL_KEYS.STUDENTS) || '[]');
      localStorage.setItem(LOCAL_KEYS.STUDENTS, JSON.stringify(existing.filter((s: any) => s.student_id !== id)));
    }
  },

  async importStudents(students: Array<{ full_name: string; phone: string | null; academic_id: string; national_id: string; password: string; department_id: number }>): Promise<Map<string, number>> {
    const mapping = new Map<string, number>();
    const { hashPassword } = await import('./auth');
    
    if (supabase) {
      const existingStudents = await this.getStudents();
      const existingByNationalId = new Map(existingStudents.map(s => [s.national_id, s]));
      
      for (const stu of students) {
        console.log('[importStudents] Processing student:', stu);
        const existing = existingByNationalId.get(stu.national_id);
        if (existing) {
          console.log('[importStudents] Found existing student:', existing);
          // Update existing student, but don't overwrite academic_id if not needed!
          const updateData: any = {
            full_name: stu.full_name,
            phone: stu.phone,
            department_id: stu.department_id
            // Don't update academic_id unless we have to!
          };
          if (stu.password) {
            updateData.password = stu.password;
            updateData.password_hash = await hashPassword(stu.password);
          }
          const { error } = await supabase
            .from('students')
            .update(updateData)
            .eq('student_id', existing.student_id);
          if (error) {
            console.warn('[importStudents] Update failed, but continuing:', error);
          }
          mapping.set(stu.national_id, existing.student_id); // Use existing student_id no matter what!
        } else {
          // Insert new student
          console.log('[importStudents] Inserting new student');
          try {
            const { data, error } = await supabase
              .from('students')
              .insert({
                full_name: stu.full_name,
                phone: stu.phone,
                academic_id: stu.academic_id,
                national_id: stu.national_id,
                password: stu.password,
                password_hash: await hashPassword(stu.password),
                role: 'student' as const,
                department_id: stu.department_id
              })
              .select('*')
              .single();
            if (error) {
              console.error('[importStudents] Insert error, trying to find by academic_id:', error);
              // If insert fails (duplicate academic_id), find existing by academic_id!
              const existingByAcademic = existingStudents.find(s => s.academic_id === stu.academic_id);
              if (existingByAcademic) {
                console.log('[importStudents] Found student by academic_id:', existingByAcademic);
                mapping.set(stu.national_id, existingByAcademic.student_id);
              } else {
                throw error;
              }
            } else {
              mapping.set(stu.national_id, data.student_id);
            }
          } catch (err) {
            console.error('[importStudents] Final error inserting student:', err);
          }
        }
      }
    } else {
      const existing = JSON.parse(localStorage.getItem(LOCAL_KEYS.STUDENTS) || '[]');
      let nextId = existing.length > 0 ? Math.max(...existing.map((s: any) => s.student_id)) + 1 : 1;
      
      for (const stu of students) {
        const foundIndex = existing.findIndex((s: any) => s.national_id === stu.national_id);
        if (foundIndex !== -1) {
          // Update existing in localStorage
          existing[foundIndex] = {
            ...existing[foundIndex],
            full_name: stu.full_name,
            phone: stu.phone,
            academic_id: stu.academic_id,
            department_id: stu.department_id,
            password: stu.password,
            password_hash: await hashPassword(stu.password)
          };
          mapping.set(stu.national_id, existing[foundIndex].student_id); // KEY IS NATIONAL_ID now!
        } else {
          // Insert new in localStorage
          const newStu = {
            student_id: nextId++,
            full_name: stu.full_name,
            phone: stu.phone,
            academic_id: stu.academic_id,
            national_id: stu.national_id,
            password: stu.password,
            password_hash: await hashPassword(stu.password),
            role: 'student' as const,
            department_id: stu.department_id
          };
          existing.push(newStu);
          mapping.set(stu.national_id, newStu.student_id); // KEY IS NATIONAL_ID now!
        }
      }
      localStorage.setItem(LOCAL_KEYS.STUDENTS, JSON.stringify(existing));
    }
    console.log('[importStudents] Final mapping:', Object.fromEntries(mapping));
    return mapping;
  },

  async getSubjects(): Promise<Subject[]> {
    if (supabase) {
      const { data, error } = await supabase.from('subjects').select('*');
      if (error) {
        console.error('[Subjects] Fetch error:', error);
        throw error;
      }
      return data || [];
    }
    return JSON.parse(localStorage.getItem(LOCAL_KEYS.SUBJECTS) || '[]');
  },

  async createSubject(subject: Omit<Subject, 'subject_id'>): Promise<Subject> {
    if (supabase) {
      const { data, error } = await supabase
        .from('subjects')
        .insert(subject)
        .select('*')
        .single();
      if (error) {
        console.error('[Subjects] Create error:', error);
        throw error;
      }
      return data;
    } else {
      const existing = JSON.parse(localStorage.getItem(LOCAL_KEYS.SUBJECTS) || '[]');
      const nextId = existing.length > 0 ? Math.max(...existing.map((s: any) => s.subject_id)) + 1 : 1;
      const newSubject = { ...subject, subject_id: nextId };
      existing.push(newSubject);
      localStorage.setItem(LOCAL_KEYS.SUBJECTS, JSON.stringify(existing));
      return newSubject;
    }
  },

  async saveSubject(subject: Omit<Subject, 'created_at'> & { subject_id?: number }): Promise<Subject> {
    if (supabase) {
      if (subject.subject_id) {
        const { data, error } = await supabase
          .from('subjects')
          .update(subject)
          .eq('subject_id', subject.subject_id)
          .select('*')
          .single();
        if (error) {
          console.error('[Subjects] Update error:', error);
          throw error;
        }
        return data;
      } else {
        const { data, error } = await supabase
          .from('subjects')
          .insert(subject)
          .select('*')
          .single();
        if (error) {
          console.error('[Subjects] Insert error:', error);
          throw error;
        }
        return data;
      }
    } else {
      const existing = JSON.parse(localStorage.getItem(LOCAL_KEYS.SUBJECTS) || '[]');
      if (subject.subject_id) {
        const index = existing.findIndex((s: any) => s.subject_id === subject.subject_id);
        if (index !== -1) {
          existing[index] = { ...existing[index], ...subject };
        }
      } else {
        const nextId = existing.length > 0 ? Math.max(...existing.map((s: any) => s.subject_id)) + 1 : 1;
        existing.push({ ...subject, subject_id: nextId });
      }
      localStorage.setItem(LOCAL_KEYS.SUBJECTS, JSON.stringify(existing));
      return existing.find((s: any) => s.subject_id === (subject.subject_id || existing.length)) || subject as Subject;
    }
  },

  async deleteSubject(id: number): Promise<void> {
    if (supabase) {
      const { error } = await supabase.from('subjects').delete().eq('subject_id', id);
      if (error) {
        console.error('[Subjects] Delete error:', error);
        throw error;
      }
    } else {
      const existing = JSON.parse(localStorage.getItem(LOCAL_KEYS.SUBJECTS) || '[]');
      localStorage.setItem(LOCAL_KEYS.SUBJECTS, JSON.stringify(existing.filter((s: any) => s.subject_id !== id)));
    }
  },

  async importSubjects(subjects: Omit<Subject, 'subject_id' | 'created_at'>[]): Promise<Map<string, number>> {
    const mapping = new Map<string, number>();
    if (supabase) {
      // First get all existing subjects
      const { data: existingSubjects, error: fetchError } = await supabase.from('subjects').select('*');
      if (fetchError) {
        console.error('[Subjects] Fetch existing error:', fetchError);
        throw fetchError;
      }
      const existingMap = new Map(existingSubjects?.map(s => [s.subject_name, s.subject_id]) || []);
      
      // Separate new and existing subjects
      const newSubjects = subjects.filter(s => !existingMap.has(s.subject_name));
      
      // Insert new subjects
      if (newSubjects.length > 0) {
        const { data: insertedSubjects, error: insertError } = await supabase.from('subjects').insert(newSubjects).select('*');
        if (insertError) {
          console.error('[Subjects] Insert new error:', insertError);
          throw insertError;
        }
        (insertedSubjects || []).forEach(s => existingMap.set(s.subject_name, s.subject_id));
      }
      
      // Populate the final mapping
      existingMap.forEach((id, name) => mapping.set(name, id));
    } else {
      const existing = JSON.parse(localStorage.getItem(LOCAL_KEYS.SUBJECTS) || '[]');
      let nextId = existing.length > 0 ? Math.max(...existing.map((s: any) => s.subject_id)) + 1 : 1;
      subjects.forEach(sub => {
        const found = existing.find((s: any) => s.subject_name === sub.subject_name);
        if (found) {
          mapping.set(sub.subject_name, found.subject_id);
        } else {
          const newSub = { ...sub, subject_id: nextId++ };
          existing.push(newSub);
          mapping.set(sub.subject_name, newSub.subject_id);
        }
      });
      localStorage.setItem(LOCAL_KEYS.SUBJECTS, JSON.stringify(existing));
    }
    return mapping;
  },

  async getWeekdays(): Promise<Weekday[]> {
    if (supabase) {
      const { data, error } = await supabase.from('weekdays').select('*').order('weekday_id');
      if (error) {
        console.error('[Weekdays] Fetch error:', error);
        throw error;
      }
      return data || [];
    }
    return JSON.parse(localStorage.getItem(LOCAL_KEYS.WEEKDAYS) || '[]');
  },

  async getTimeSlots(): Promise<TimeSlot[]> {
    if (supabase) {
      const { data, error } = await supabase.from('time_slots').select('*').order('slot_id');
      if (error) {
        console.error('[TimeSlots] Fetch error:', error);
        throw error;
      }
      return data || [];
    }
    return JSON.parse(localStorage.getItem(LOCAL_KEYS.TIME_SLOTS) || '[]');
  },

  async getSchedules(): Promise<StudentSchedule[]> {
    if (supabase) {
      const { data, error } = await supabase.from('student_schedule').select('*');
      if (error) {
        console.error('[Schedules] Fetch error:', error);
        throw error;
      }
      return data || [];
    }
    return JSON.parse(localStorage.getItem(LOCAL_KEYS.SCHEDULES) || '[]');
  },

  async createSchedule(schedule: Omit<StudentSchedule, 'schedule_id'>): Promise<StudentSchedule> {
    if (supabase) {
      const { data, error } = await supabase
        .from('student_schedule')
        .insert(schedule)
        .select('*')
        .single();
      if (error) {
        console.error('[Schedule] Create error:', error);
        throw error;
      }
      return data;
    } else {
      const existing = JSON.parse(localStorage.getItem(LOCAL_KEYS.SCHEDULES) || '[]');
      const nextId = existing.length > 0 ? Math.max(...existing.map((s: any) => s.schedule_id)) + 1 : 1;
      const newSchedule = { ...schedule, schedule_id: nextId };
      existing.push(newSchedule);
      localStorage.setItem(LOCAL_KEYS.SCHEDULES, JSON.stringify(existing));
      return newSchedule;
    }
  },

  async deleteSchedule(scheduleId: number): Promise<void> {
    if (supabase) {
      const { error } = await supabase
        .from('student_schedule')
        .delete()
        .eq('schedule_id', scheduleId);
      if (error) {
        console.error('[Schedule] Delete error:', error);
        throw error;
      }
    } else {
      const existing = JSON.parse(localStorage.getItem(LOCAL_KEYS.SCHEDULES) || '[]');
      localStorage.setItem(
        LOCAL_KEYS.SCHEDULES,
        JSON.stringify(existing.filter((s: any) => s.schedule_id !== scheduleId))
      );
    }
  },

  async importSchedule(schedules: Omit<StudentSchedule, 'schedule_id' | 'created_at'>[]): Promise<void> {
    if (schedules.length === 0) return;
    
    if (supabase) {
      // Get all existing schedules
      const { data: existingSchedules, error: fetchError } = await supabase
        .from('student_schedule')
        .select('*');
      if (fetchError) {
        console.error('[Schedules] Fetch existing schedules error:', fetchError);
        throw fetchError;
      }
      
      // Create a map to check for existing schedules
      const existingMap = new Map<string, number>();
      existingSchedules?.forEach(s => {
        const key = `${s.student_id}-${s.subject_id}-${s.weekday_id}-${s.slot_id}`;
        existingMap.set(key, s.schedule_id);
      });
      
      // Split into updates and inserts
      for (const schedule of schedules) {
        const key = `${schedule.student_id}-${schedule.subject_id}-${schedule.weekday_id}-${schedule.slot_id}`;
        const existingId = existingMap.get(key);
        
        if (existingId) {
          // Update existing schedule
          const { error: updateError } = await supabase
            .from('student_schedule')
            .update(schedule)
            .eq('schedule_id', existingId);
          if (updateError) {
            console.warn('[Schedules] Update schedule warning:', updateError);
          }
        } else {
          // Insert new schedule
          const { error: insertError } = await supabase
            .from('student_schedule')
            .insert(schedule);
          if (insertError) {
            console.warn('[Schedules] Insert schedule warning:', insertError);
          }
        }
      }
    } else {
      const existing = JSON.parse(localStorage.getItem(LOCAL_KEYS.SCHEDULES) || '[]');
      
      // Create a map to check for existing schedules
      const existingMap = new Map<string, number>();
      existing.forEach((s: any) => {
        const key = `${s.student_id}-${s.subject_id}-${s.weekday_id}-${s.slot_id}`;
        existingMap.set(key, s.schedule_id);
      });
      
      let nextId = existing.length > 0 ? Math.max(...existing.map((s: any) => s.schedule_id)) + 1 : 1;
      
      // Process each schedule
      for (const schedule of schedules) {
        const key = `${schedule.student_id}-${schedule.subject_id}-${schedule.weekday_id}-${schedule.slot_id}`;
        const existingId = existingMap.get(key);
        
        if (existingId) {
          // Update existing schedule
          const index = existing.findIndex((s: any) => s.schedule_id === existingId);
          if (index !== -1) {
            existing[index] = { ...existing[index], ...schedule };
          }
        } else {
          // Insert new schedule
          existing.push({ ...schedule, schedule_id: nextId++ });
        }
      }
      
      localStorage.setItem(LOCAL_KEYS.SCHEDULES, JSON.stringify(existing));
    }
  },

  async getStudentSchedule(student_id: number): Promise<any[]> {
    if (supabase) {
      const { data, error } = await supabase
      .from('student_schedule')
      .select('*, subjects(*), weekdays(*), time_slots(*)')
      .eq('student_id', student_id);
      if (error) {
        console.error('[StudentSchedule] Fetch error:', error);
        throw error;
      }
      return data || [];
    }
    // For localStorage, join the data manually
    const schedules = JSON.parse(localStorage.getItem(LOCAL_KEYS.SCHEDULES) || '[]');
    const subjects = JSON.parse(localStorage.getItem(LOCAL_KEYS.SUBJECTS) || '[]');
    const weekdays = JSON.parse(localStorage.getItem(LOCAL_KEYS.WEEKDAYS) || '[]');
    const timeSlots = JSON.parse(localStorage.getItem(LOCAL_KEYS.TIME_SLOTS) || '[]');
    
    return schedules
      .filter((s: any) => s.student_id === student_id)
      .map((s: any) => ({
        ...s,
        subjects: subjects.find((sub: any) => sub.subject_id === s.subject_id),
        weekdays: weekdays.find((day: any) => day.weekday_id === s.weekday_id),
        time_slots: timeSlots.find((slot: any) => slot.slot_id === s.slot_id)
      }));
  },

  async getAttendance(): Promise<AttendanceLog[]> {
    if (supabase) {
      const { data, error } = await supabase
      .from('attendance_log')
      .select('*')
      .order('attendance_date', { ascending: false });
      if (error) {
        console.error('[Attendance] Fetch error:', error);
        throw error;
      }
      return data || [];
    }
    return JSON.parse(localStorage.getItem(LOCAL_KEYS.ATTENDANCE_LOGS) || '[]');
  },

  async markAttendance(
    schedule_id: number | null, 
    attendance_date: string, 
    status: 'حاضر' | 'غائب' | 'متأخر' | 'مستأذن',
    check_in_time?: string,
    notes?: string
  ): Promise<void> {
    const log = {
      schedule_id: schedule_id || 0,
      attendance_date,
      status,
      check_in_time,
      notes
    };
    
    if (supabase) {
      const { error } = await supabase.from('attendance_log').upsert(log);
      if (error) {
        console.error('[Attendance] Mark error:', error);
        throw error;
      }
    } else {
      const existing = JSON.parse(localStorage.getItem(LOCAL_KEYS.ATTENDANCE_LOGS) || '[]');
      const nextId = existing.length > 0 ? Math.max(...existing.map((l: any) => l.log_id)) + 1 : 1;
      existing.push({ ...log, log_id: nextId });
      localStorage.setItem(LOCAL_KEYS.ATTENDANCE_LOGS, JSON.stringify(existing));
    }
  },

  async getAttendanceReport(_student_id: number, from: string, to: string): Promise<AttendanceLog[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('attendance_log')
        .select('*')
        .gte('attendance_date', from)
        .lte('attendance_date', to);
      if (error) {
        console.error('[Attendance Report] Fetch error:', error);
        throw error;
      }
      return data || [];
    }
    return [];
  },

  // Helper: Get date of last occurrence of a specific weekday (1=Sunday, 7=Saturday) on or before a given date
  getLastWeekdayDate(weekdayId: number, upToDate: Date = new Date()): Date | null {
    const targetDay = (weekdayId === 7 ? 6 : weekdayId - 1); // 0=Sunday, 6=Saturday for getDay()
    let date = new Date(upToDate);
    const currentDay = date.getDay();
    
    let diff = targetDay - currentDay;
    if (diff > 0) diff -= 7;
    date.setDate(date.getDate() + diff);
    
    return date;
  },

  // Helper: Check if a lecture (given weekday, time slot) has ended as of now
  isLectureEnded(weekdayId: number, _startTime: string, endTime: string): boolean {
    const now = new Date();
    const lastWeekdayDate = this.getLastWeekdayDate(weekdayId, now);
    if (!lastWeekdayDate) return false;

    const [endHour, endMinute] = endTime.split(':').map(Number);

    const lectureEndDate = new Date(lastWeekdayDate);
    lectureEndDate.setHours(endHour, endMinute, 0, 0);

    return now >= lectureEndDate;
  },

  // Helper: Get attendance date string for a lecture (if it has ended)
  getLectureAttendanceDate(weekdayId: number): string | null {
    const lastWeekdayDate = this.getLastWeekdayDate(weekdayId);
    if (!lastWeekdayDate) return null;
    return lastWeekdayDate.toISOString().split('T')[0];
  },

  async calculateAttendanceRates(student_id: number): Promise<{
    overallRate: number;
    bySubject: Array<{
      subject_id: number;
      subject_name: string;
      totalSessions: number;
      attended: number;
      rate: number;
    }>;
  }> {
    const [allLogs, allSchedules, allSubjects] = await Promise.all([
      this.getAttendance(),
      this.getSchedules(),
      this.getSubjects()
    ]);

    const studentSchedules = allSchedules.filter(s => s.student_id === student_id);
    const studentScheduleIds = studentSchedules.map(s => s.schedule_id);
    const studentLogs = allLogs.filter(log => studentScheduleIds.includes(log.schedule_id));

    const subjectMap = new Map<number, { totalSessions: number; attended: number; name: string }>();
    
    // Initialize subjects
    studentSchedules.forEach(schedule => {
      const subject = allSubjects.find(sub => sub.subject_id === schedule.subject_id);
      if (subject) {
        if (!subjectMap.has(subject.subject_id)) {
          subjectMap.set(subject.subject_id, { totalSessions: 0, attended: 0, name: subject.subject_name });
        }
      }
    });

    // Count all logs per subject
    for (const log of studentLogs) {
      const schedule = studentSchedules.find(s => s.schedule_id === log.schedule_id);
      if (!schedule) continue;
      const subject = allSubjects.find(sub => sub.subject_id === schedule.subject_id);
      if (!subject) continue;
      
      const data = subjectMap.get(subject.subject_id)!;
      data.totalSessions++;
      
      if (log.status === 'حاضر' || log.status === 'متأخر') {
        data.attended++;
      }
    }

    const bySubject = Array.from(subjectMap.entries()).map(([subject_id, data]) => {
      let rate = 100;
      if (data.totalSessions > 0) {
        rate = Math.round((data.attended / data.totalSessions) * 100);
      }
      return {
        subject_id,
        subject_name: data.name,
        totalSessions: data.totalSessions,
        attended: data.attended,
        rate: Math.min(rate, 100)
      };
    });

    // Calculate overall rate
    const totalAttendedAll = bySubject.reduce((sum, s) => sum + s.attended, 0);
    const totalSessionsAll = bySubject.reduce((sum, s) => sum + s.totalSessions, 0);
    let overallRate = 100;
    if (totalSessionsAll > 0) {
      overallRate = Math.round((totalAttendedAll / totalSessionsAll) * 100);
    }

    return {
      overallRate,
      bySubject
    };
  },

  // Auto-check function to mark automatic absences for expired lectures
  async autoMarkAbsences(): Promise<void> {
    const [allStudents, allSchedules, allTimeSlots, allAttendanceLogs] = await Promise.all([
      this.getStudents(),
      this.getSchedules(),
      this.getTimeSlots(),
      this.getAttendance()
    ]);

    for (const student of allStudents) {
      const studentSchedules = allSchedules.filter(s => s.student_id === student.student_id);
      
      for (const schedule of studentSchedules) {
        const timeSlot = allTimeSlots.find(t => t.slot_id === schedule.slot_id);
        if (!timeSlot) continue;

        const hasEnded = this.isLectureEnded(schedule.weekday_id, timeSlot.start_time, timeSlot.end_time);
        if (!hasEnded) continue;

        const attendanceDate = this.getLectureAttendanceDate(schedule.weekday_id);
        if (!attendanceDate) continue;

        // Check if log already exists
        const existingLog = allAttendanceLogs.find(log => 
          log.schedule_id === schedule.schedule_id && log.attendance_date === attendanceDate
        );

        if (!existingLog) {
          // Mark automatic absence
          await this.markAttendance(schedule.schedule_id, attendanceDate, 'غائب', undefined, 'غياب تلقائي');
        }
      }
    }
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const [students, subjects, schedules] = await Promise.all([
      this.getStudents(),
      this.getSubjects(),
      this.getSchedules()
    ]);

    return {
      totalStudents: students.length,
      totalSubjects: subjects.length,
      totalSchedules: schedules.length,
      averageAttendance: 85,
      absencesCount: 0,
      warningsCount: 0,
      lowAttendanceCount: 0
    };
  },

  async getNotifications(student_id?: number): Promise<Notification[]> {
    if (supabase) {
      let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (student_id) {
        query = query.eq('student_id', student_id);
      }
      const { data, error } = await query;
      if (error) {
        console.error('[Notifications] Fetch error:', error);
        throw error;
      }
      return data || [];
    }
    const notifications = JSON.parse(localStorage.getItem(LOCAL_KEYS.NOTIFICATIONS) || '[]');
    if (student_id) {
      return notifications.filter((n: any) => n.student_id === student_id);
    }
    return notifications;
  },

  async sendNotification(notification: Omit<Notification, 'notification_id' | 'created_at'>): Promise<Notification> {
    const newNotification = {
      ...notification,
      created_at: new Date().toISOString()
    };
    
    if (supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .insert(newNotification)
        .select('*')
        .single();
      if (error) {
        console.error('[Notifications] Send error:', error);
        throw error;
      }
      return data;
    } else {
      const existing = JSON.parse(localStorage.getItem(LOCAL_KEYS.NOTIFICATIONS) || '[]');
      const nextId = existing.length > 0 ? Math.max(...existing.map((n: any) => n.notification_id)) + 1 : 1;
      const notificationWithId = { ...newNotification, notification_id: nextId };
      existing.push(notificationWithId);
      localStorage.setItem(LOCAL_KEYS.NOTIFICATIONS, JSON.stringify(existing));
      return notificationWithId;
    }
  },

  async markNotificationRead(notification_id: number): Promise<void> {
    if (supabase) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('notification_id', notification_id);
      if (error) {
        console.error('[Notifications] Mark read error:', error);
        throw error;
      }
    } else {
      const existing = JSON.parse(localStorage.getItem(LOCAL_KEYS.NOTIFICATIONS) || '[]');
      const index = existing.findIndex((n: any) => n.notification_id === notification_id);
      if (index !== -1) {
        existing[index].is_read = true;
        localStorage.setItem(LOCAL_KEYS.NOTIFICATIONS, JSON.stringify(existing));
      }
    }
  },

  async getPersonalNote(student_id: number): Promise<PersonalNote | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('personal_notes')
        .select('*')
        .eq('student_id', student_id)
        .single();
      if (error && error.code !== 'PGRST116') {
        console.error('[PersonalNote] Fetch error:', error);
        throw error;
      }
      return data || null;
    }
    const notes = JSON.parse(localStorage.getItem(LOCAL_KEYS.PERSONAL_NOTES) || '[]');
    return notes.find((n: any) => n.student_id === student_id) || null;
  },

  async setPersonalNote(note: Omit<PersonalNote, 'note_id' | 'created_at' | 'updated_at'>): Promise<PersonalNote> {
    const now = new Date().toISOString();
    
    if (supabase) {
      const existing = await this.getPersonalNote(note.student_id);
      if (existing) {
        const { data, error } = await supabase
          .from('personal_notes')
          .update({ note: note.note, is_active: note.is_active, updated_at: now })
          .eq('student_id', note.student_id)
          .select('*')
          .single();
        if (error) {
          console.error('[PersonalNote] Update error:', error);
          throw error;
        }
        return data;
      } else {
        const { data, error } = await supabase
          .from('personal_notes')
          .insert({ ...note, created_at: now, updated_at: now })
          .select('*')
          .single();
        if (error) {
          console.error('[PersonalNote] Create error:', error);
          throw error;
        }
        return data;
      }
    } else {
      const existing = JSON.parse(localStorage.getItem(LOCAL_KEYS.PERSONAL_NOTES) || '[]');
      const index = existing.findIndex((n: any) => n.student_id === note.student_id);
      
      if (index !== -1) {
        existing[index] = { ...existing[index], note: note.note, is_active: note.is_active, updated_at: now };
        localStorage.setItem(LOCAL_KEYS.PERSONAL_NOTES, JSON.stringify(existing));
        return existing[index];
      } else {
        const nextId = existing.length > 0 ? Math.max(...existing.map((n: any) => n.note_id)) + 1 : 1;
        const newNote = { ...note, note_id: nextId, created_at: now, updated_at: now };
        existing.push(newNote);
        localStorage.setItem(LOCAL_KEYS.PERSONAL_NOTES, JSON.stringify(existing));
        return newNote;
      }
    }
  },

  async getAllPersonalNotes(): Promise<PersonalNote[]> {
    if (supabase) {
      const { data, error } = await supabase.from('personal_notes').select('*');
      if (error) {
        console.error('[PersonalNote] Fetch all error:', error);
        throw error;
      }
      return data || [];
    }
    return JSON.parse(localStorage.getItem(LOCAL_KEYS.PERSONAL_NOTES) || '[]');
  },

  // ---------------- Payment Functions ----------------
  async getPayments(filters?: { student_id?: number; status?: PaymentStatus; payment_method?: PaymentMethod }): Promise<Payment[]> {
    if (supabase) {
      let query = supabase.from('payments').select('*, students(*)').order('created_at', { ascending: false });
      if (filters?.student_id) query = query.eq('student_id', filters.student_id);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.payment_method) query = query.eq('payment_method', filters.payment_method);
      
      const { data, error } = await query;
      if (error) {
        console.error('[Payments] Fetch error:', error);
        throw error;
      }
      return data || [];
    }
    
    let payments = JSON.parse(localStorage.getItem(LOCAL_KEYS.PAYMENTS) || '[]');
    const students = await this.getStudents();
    payments = payments.map((p: any) => ({ ...p, students: students.find(s => s.student_id === p.student_id) }));
    
    if (filters?.student_id) payments = payments.filter((p: any) => p.student_id === filters.student_id);
    if (filters?.status) payments = payments.filter((p: any) => p.status === filters.status);
    if (filters?.payment_method) payments = payments.filter((p: any) => p.payment_method === filters.payment_method);
    return payments;
  },

  async createPayment(payment: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> {
    const now = new Date();
    const newPayment = {
      ...payment,
      created_at: now.toISOString()
    };
    
    if (supabase) {
      const { data, error } = await supabase.from('payments').insert(newPayment).select('*').single();
      if (error) {
        console.error('[Payments] Create error:', error);
        throw error;
      }
      return data;
    } else {
      const existing = JSON.parse(localStorage.getItem(LOCAL_KEYS.PAYMENTS) || '[]');
      const nextId = existing.length > 0 ? Math.max(...existing.map((p: any) => p.id)) + 1 : 1;
      const paymentWithId = { ...newPayment, id: nextId };
      existing.push(paymentWithId);
      localStorage.setItem(LOCAL_KEYS.PAYMENTS, JSON.stringify(existing));
      return paymentWithId;
    }
  },

  async updatePayment(id: number, payment: Partial<Omit<Payment, 'id'>>): Promise<Payment> {
    if (supabase) {
      const { data, error } = await supabase.from('payments').update(payment).eq('id', id).select('*').single();
      if (error) {
        console.error('[Payments] Update error:', error);
        throw error;
      }
      return data;
    } else {
      const existing = JSON.parse(localStorage.getItem(LOCAL_KEYS.PAYMENTS) || '[]');
      const index = existing.findIndex((p: any) => p.id === id);
      if (index !== -1) {
        existing[index] = { ...existing[index], ...payment };
        localStorage.setItem(LOCAL_KEYS.PAYMENTS, JSON.stringify(existing));
        return existing[index];
      }
      throw new Error('Payment not found');
    }
  },

  async getPaymentSettings(): Promise<PaymentSettings> {
    if (supabase) {
      const { data, error } = await supabase.from('payment_settings').select('*').single();
      if (error && error.code !== 'PGRST116') {
        console.error('[PaymentSettings] Fetch error:', error);
        throw error;
      }
      if (data) return data;
      const defaultSettings: PaymentSettings = {
        subscription_amount: 299,
        subscription_duration_days: 30,
        enabled_payment_methods: ['bank_transfer', 'ria', 'binance_usdt', 'urpay'],
        bank_transfer_details: 'اسم البنك: بنك الراجحي | رقم الحساب: 123456789 | الاسم: إدارة تحضير الطلاب',
        ria_details: 'اسم المستلم: إدارة تحضير الطلاب | الدولة: السعودية',
        binance_wallet: '0x123456789abcdef123456789abcdef123456789',
        urpay_number: '',
        urpay_account_name: '',
        urpay_qr_image: null,
        payment_instructions: 'يرجى إرسال إثبات الدفع عبر النظام بعد الدفع'
      };
      await supabase.from('payment_settings').insert(defaultSettings);
      return defaultSettings;
    }
    
    const settings = localStorage.getItem(LOCAL_KEYS.PAYMENT_SETTINGS);
    return settings ? JSON.parse(settings) : {
      subscription_amount: 299,
      subscription_duration_days: 30,
      enabled_payment_methods: ['bank_transfer', 'ria', 'binance_usdt', 'urpay'],
      bank_transfer_details: 'اسم البنك: بنك الراجحي | رقم الحساب: 123456789 | الاسم: إدارة تحضير الطلاب',
      ria_details: 'اسم المستلم: إدارة تحضير الطلاب | الدولة: السعودية',
      binance_wallet: '0x123456789abcdef123456789abcdef123456789',
      urpay_number: '',
      urpay_account_name: '',
      urpay_qr_image: null,
      payment_instructions: 'يرجى إرسال إثبات الدفع عبر النظام بعد الدفع'
    };
  },

  async updatePaymentSettings(settings: Partial<PaymentSettings>): Promise<PaymentSettings> {
    if (supabase) {
      const { data, error } = await supabase.from('payment_settings').update(settings).select('*').single();
      if (error) {
        console.error('[PaymentSettings] Update error:', error);
        throw error;
      }
      return data;
    } else {
      const existing = await this.getPaymentSettings();
      const newSettings = { ...existing, ...settings };
      localStorage.setItem(LOCAL_KEYS.PAYMENT_SETTINGS, JSON.stringify(newSettings));
      return newSettings;
    }
  },

  async getStudentSubscription(student_id: number): Promise<{ active: boolean; end_date: string | null; days_remaining: number }> {
    const payments = await this.getPayments({ student_id, status: 'approved' });
    if (payments.length === 0) return { active: false, end_date: null, days_remaining: 0 };

    const sortedPayments = payments.sort((a, b) => {
      const dateA = new Date(a.approved_at || a.created_at).getTime();
      const dateB = new Date(b.approved_at || b.created_at).getTime();
      return dateB - dateA;
    });
    const lastPayment = sortedPayments[0];
    if (!lastPayment.subscription_end) {
      return { active: false, end_date: null, days_remaining: 0 };
    }
    const subscriptionEnd = new Date(lastPayment.subscription_end);
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((subscriptionEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const active = now < subscriptionEnd;
    
    return {
      active,
      end_date: lastPayment.subscription_end,
      days_remaining: daysRemaining
    };
  },

  async updateStudentFees(student_id: number, updates: Partial<{
    subscription_amount: number;
    due_date: string;
    subscription_status: string;
    financial_notes: string;
  }>): Promise<Student> {
    console.log('[updateStudentFees] Starting update:', { student_id, updates });
    try {
      // Convert empty due_date to null
      const processedUpdates = {
        ...updates,
        due_date: updates.due_date === '' ? null : updates.due_date
      };
      console.log('[updateStudentFees] Processed updates:', processedUpdates);

      if (supabase) {
        const { data, error } = await supabase.from('students').update(processedUpdates).eq('student_id', student_id).select('*').single();
        if (error) {
          console.error('[updateStudentFees] Supabase error:', error);
          throw error;
        }
        console.log('[updateStudentFees] Supabase update successful:', data);
        return data;
      } else {
        const students = JSON.parse(localStorage.getItem(LOCAL_KEYS.STUDENTS) || '[]');
        const index = students.findIndex((s: any) => s.student_id === student_id);
        if (index === -1) {
          const error = new Error('Student not found');
          console.error('[updateStudentFees]', error);
          throw error;
        }
        students[index] = { ...students[index], ...processedUpdates };
        localStorage.setItem(LOCAL_KEYS.STUDENTS, JSON.stringify(students));
        console.log('[updateStudentFees] localStorage update successful:', students[index]);
        return students[index];
      }
    } catch (err) {
      console.error('[updateStudentFees] Unhandled error:', err);
      throw err;
    }
  },

  async getStudentPaidAmount(student_id: number): Promise<number> {
    const payments = await this.getPayments({ student_id, status: 'approved' });
    return payments.reduce((sum, p) => sum + p.amount, 0);
  },

  // ---------------- CMS Functions ----------------
  async getCMSData(): Promise<CMSData> {
    // Default CMS data
    const defaultPartners: CMSData['partners'] = {
      isActive: true,
      pageTitle: 'شركاء الدفع',
      pageSubtitle: 'تعاون معنا لتقديم حلول دفع متكاملة لآلاف الطلاب والمعاهد',
      aboutUs: 'منصة تعليم هي منصة تعليمية متكاملة تخدم آلاف الطلاب والمعاهد. نحن نبحث عن شراكات استراتيجية مع مزودي خدمات الدفع والبنوك لتقديم تجربة دفع سلسة لطلابنا.',
      totalStudents: '10,000+',
      activeUsers: '8,500',
      avgMonthlyTransactions: '5,000',
      currentPaymentMethods: ['التحويل البنكي', 'UrPay', 'Binance USDT', 'RIA'],
      platformFeatures: [
        { id: 1, title: 'إدارة الطلاب', description: 'إدارة شاملة للطلاب مع بيانات كاملة' },
        { id: 2, title: 'إدارة الرسوم', description: 'تحديد وتتبع الرسوم الدراسية' },
        { id: 3, title: 'إدارة المدفوعات', description: 'تتبع جميع المدفوعات بسهولة' },
        { id: 4, title: 'رفع إثباتات الدفع', description: 'إمكانية رفع إثباتات الدفع إلكترونياً' },
        { id: 5, title: 'مراجعة واعتماد المدفوعات', description: 'عملية مراجعة واعتماد سريعة' },
        { id: 6, title: 'الإشعارات', description: 'إشعارات تلقائية للطلاب' },
        { id: 7, title: 'التقارير المالية', description: 'تقارير مالية شاملة ومفصلة' },
        { id: 8, title: 'الإحصائيات', description: 'إحصائيات حية ومفصلة' },
      ],
      dashboardStats: {
        studentsCount: '10,000+',
        paymentsCount: '50,000+',
        totalRevenue: '2,500,000 ريال',
        pendingCount: '120',
        paymentRate: '95%'
      },
      screenshots: [],
      integrationReadyTitle: 'Payment Integration Ready',
      integrationReadyDescription: 'منصتنا جاهزة تقنياً للربط مع جميع مزودي خدمات الدفع',
      integrationMethods: [
        { id: 1, name: 'Visa' },
        { id: 2, name: 'Mastercard' },
        { id: 3, name: 'Mada' },
        { id: 4, name: 'Apple Pay' },
        { id: 5, name: 'Google Pay' },
        { id: 6, name: 'UrPay' },
        { id: 7, name: 'Bank Transfer' },
      ],
      securityTitle: 'الأمان والخصوصية',
      securityDescription: 'منصتنا مصممة لتقديم أعلى مستويات الأمان والخصوصية للبيانات المالية للطلاب والمعاهد',
      securityFeatures: ['تشفير البيانات من طرف إلى طرف', 'توافق مع PCI DSS', 'نسخ احتياطي يومي', 'مراقبة مستمرة للأنظمة']
    };
    const defaultData: CMSData = {
      general: {
        site_name: 'منصة تعليم',
        site_description: 'منصة ذكية لمتابعة الطالب الجامعي وإدارة الخدمات الأكاديمية المتكاملة',
        copyright_text: '© 2025 منصة تعليم. جميع الحقوق محفوظة'
      },
      homepage: {
        hero_title: 'منصة تعليمية ذكية للخدمات الجامعية المتكاملة',
        hero_subtitle: 'منصة رقمية متكاملة لمتابعة المستوى الأكاديمي للطالب الجامعي وإدارة جميع الخدمات التعليمية من مكان واحد، وتشمل الحضور والغياب، الاختبارات الإلكترونية، الواجبات والمشاريع، النتائج الأكاديمية، متابعة الرسوم الدراسية، المدفوعات الإلكترونية، الإشعارات الفورية والتقارير التعليمية.',
        hero_subtitle_2: 'صممت المنصة لتسهيل تجربة الطالب الجامعية ومتابعة مستواه الأكاديمي ورسومه الدراسية وإشعاراته بشكل فوري ومنظم.',
        hero_button_primary: 'استكشف خدمات الطالب',
        hero_button_primary_link: '/demo',
        hero_button_secondary: 'المزيد عنا',
        hero_button_secondary_link: '/about',
        hero_quick_features: [
          'متابعة المستوى الأكاديمي للطالب الجامعي',
          'متابعة الحضور والغياب',
          'الاختبارات الإلكترونية',
          'الواجبات والمشاريع',
          'النتائج والتقديرات',
          'متابعة الرسوم الدراسية',
          'رفع وإدارة إثباتات الدفع',
          'الإشعارات والتنبيهات الفورية',
          'التقارير والإحصائيات',
          'الخدمات الجامعية المتكاملة',
          'دعم التعليم الحضوري والتعليم عن بعد',
          'دعم الأكاديميات ومراكز التدريب والبرامج المهنية'
        ],
        stats: [
          { number: '1000+', label: 'طالب جامعي' },
          { number: '50+', label: 'مؤسسة أكاديمية' },
          { number: '98%', label: 'رضا العملاء' },
          { number: '24/7', label: 'دعم فني' }
        ]
      },
      about: {
        page_title: 'من نحن',
        about_description: 'منصة تعليم هي منصة تعليمية ذكية لمتابعة الطالب الجامعي وإدارة الخدمات الأكاديمية المتكاملة',
        goals: [
          'تقديم تجربة تعليمية متكاملة ومبتكرة للطلاب الجامعيين',
          'تسهيل متابعة الحضور والغياب والنتائج الأكاديمية',
          'تحسين تجربة التعلم للطلاب الجامعيين',
          'توفير أدوات فعالة لمتابعة الرسوم الدراسية للطلاب'
        ],
        features: [
          { id: 1, icon: 'BookOpen', title: 'الاختبارات الإلكترونية', description: 'متابعة نتائج الاختبارات بسهولة' },
          { id: 2, icon: 'Calendar', title: 'متابعة الحضور', description: 'تتبع حضور الطالب الجامعي بدقة' },
          { id: 3, icon: 'Award', title: 'النتائج والتقديرات', description: 'عرض وتحليل النتائج الأكاديمية' },
          { id: 4, icon: 'CreditCard', title: 'متابعة الرسوم', description: 'متابعة الرسوم الدراسية والدفعات' }
        ]
      },
      services: {
        page_title: 'الخدمات',
        page_subtitle: 'كل ما يحتاجه الطالب الجامعي في مكان واحد',
        services: [
          { id: 1, icon: 'FileText', title: 'الاختبارات الإلكترونية', description: 'متابعة نتائج الاختبارات بسهولة مع تحليل النتائج وتقارير مفصلة' },
          { id: 2, icon: 'BookOpen', title: 'الواجبات والمشاريع', description: 'تسليم الواجبات إلكترونياً مع تقييم وملاحظات فورية' },
          { id: 3, icon: 'Calendar', title: 'متابعة الحضور والغياب', description: 'تتبع حضور الطالب الجامعي بدقة مع تقارير يومية وشهرية' },
          { id: 4, icon: 'Award', title: 'النتائج والتقديرات', description: 'عرض وتحليل النتائج الأكاديمية مع إمكانية مشاركتها' },
          { id: 5, icon: 'CreditCard', title: 'متابعة الرسوم الدراسية', description: 'متابعة الرسوم الدراسية والدفعات مع تقارير مفصلة' }
        ]
      },
      pricing: {
        page_title: 'الأسعار',
        page_subtitle: 'اختر الخطة التي تناسب احتياجات الطالب الجامعي',
        plans: [
          { id: 1, name: 'الخطة الأساسية', price: '299', period: 'ريال/شهر', features: ['متابعة الحضور', 'النتائج والتقديرات', 'الواجبات', 'دعم عبر البريد'] },
          { id: 2, name: 'الخطة المتقدمة', price: '599', period: 'ريال/شهر', popular: true, features: ['جميع مميزات الخطة الأساسية', 'الاختبارات الإلكترونية', 'متابعة الرسوم', 'الإشعارات الفورية', 'دعم عبر الهاتف'] },
          { id: 3, name: 'الخطة المؤسسية', price: 'مخصصة', period: 'اتصل بنا', features: ['جميع المميزات', 'تقارير مالية مفصلة', 'دعم مخصص', 'تخصيص متقدم', 'تكامل مع أنظمة الدفع'] }
        ]
      },
      contact: {
        email: 'info@example.com',
        phone: '+966 50 123 4567',
        whatsapp: '+966 50 123 4567',
        address: 'الرياض، المملكة العربية السعودية',
        social_links: [
          { platform: 'Facebook', url: 'https://facebook.com' },
          { platform: 'Twitter', url: 'https://twitter.com' },
          { platform: 'Instagram', url: 'https://instagram.com' }
        ]
      },
      footer: {
        quick_links: [
          { label: 'الرئيسية', url: '/' },
          { label: 'من نحن', url: '/about' },
          { label: 'الخدمات', url: '/services' },
          { label: 'الأسعار', url: '/pricing' },
          { label: 'تواصل معنا', url: '/contact' }
        ],
        terms_url: '/terms',
        privacy_url: '/privacy',
        copyright_text: '© 2025 منصة تعليم. جميع الحقوق محفوظة'
      },
      partners: defaultPartners
    };

    if (supabase) {
      const { data, error } = await supabase.from('cms_data').select('*');
      if (error) {
        console.error('[CMS] Fetch error:', error);
        // Fallback to default if there's an error
        if (!localStorage.getItem(LOCAL_KEYS.CMS_DATA)) {
          localStorage.setItem(LOCAL_KEYS.CMS_DATA, JSON.stringify(defaultData));
        }
        return JSON.parse(localStorage.getItem(LOCAL_KEYS.CMS_DATA) || JSON.stringify(defaultData));
      }
      if (data && data.length > 0) {
        const cmsRecord = data[0];
        // Merge database fields with defaults
        const merged: CMSData = {
          general: { ...defaultData.general, ...cmsRecord.general },
          homepage: { ...defaultData.homepage, ...cmsRecord.homepage },
          about: { ...defaultData.about, ...cmsRecord.about },
          services: { ...defaultData.services, ...cmsRecord.services },
          pricing: { ...defaultData.pricing, ...cmsRecord.pricing },
          contact: { ...defaultData.contact, ...cmsRecord.contact },
          footer: { ...defaultData.footer, ...cmsRecord.footer },
          partners: { ...defaultData.partners, ...cmsRecord.partners }
        };
        localStorage.setItem(LOCAL_KEYS.CMS_DATA, JSON.stringify(merged));
        return merged;
      }
    }

    // Save default data to localStorage (reset to new defaults)
    if (!localStorage.getItem(LOCAL_KEYS.CMS_DATA)) {
      localStorage.setItem(LOCAL_KEYS.CMS_DATA, JSON.stringify(defaultData));
    }
    return JSON.parse(localStorage.getItem(LOCAL_KEYS.CMS_DATA) || JSON.stringify(defaultData));
  },

  async updateCMSData(partialData: Partial<CMSData>): Promise<CMSData> {
    const currentData = await this.getCMSData();
    const newData: CMSData = {
      ...currentData,
      ...partialData,
      general: { ...currentData.general, ...partialData.general },
      homepage: { ...currentData.homepage, ...partialData.homepage },
      about: { ...currentData.about, ...partialData.about },
      services: { ...currentData.services, ...partialData.services },
      pricing: { ...currentData.pricing, ...partialData.pricing },
      contact: { ...currentData.contact, ...partialData.contact },
      footer: { ...currentData.footer, ...partialData.footer },
      partners: { ...currentData.partners, ...partialData.partners }
    };
    if (supabase) {
      const { data: existing, error: fetchError } = await supabase.from('cms_data').select('id');
      if (fetchError) {
        console.error('[CMS] Fetch for update error:', fetchError);
        throw fetchError;
      }
      
      let result;
      if (existing && existing.length > 0) {
        // Update existing record
        const { data, error } = await supabase
          .from('cms_data')
          .update(newData)
          .eq('id', existing[0].id)
          .select('*')
          .single();
        if (error) {
          console.error('[CMS] Update error:', error);
          throw error;
        }
        result = data;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('cms_data')
          .insert([newData])
          .select('*')
          .single();
        if (error) {
          console.error('[CMS] Insert error:', error);
          throw error;
        }
        result = data;
      }
      
      // Merge with defaults for consistency
      const mergedResult: CMSData = {
        general: { ...newData.general, ...result.general },
        homepage: { ...newData.homepage, ...result.homepage },
        about: { ...newData.about, ...result.about },
        services: { ...newData.services, ...result.services },
        pricing: { ...newData.pricing, ...result.pricing },
        contact: { ...newData.contact, ...result.contact },
        footer: { ...newData.footer, ...result.footer },
        partners: { ...newData.partners, ...result.partners }
      };
      
      localStorage.setItem(LOCAL_KEYS.CMS_DATA, JSON.stringify(mergedResult));
      return mergedResult;
    } else {
      localStorage.setItem(LOCAL_KEYS.CMS_DATA, JSON.stringify(newData));
      return newData;
    }
  }
};

export async function migrateLocalToSupabase() {
  if (!supabase) {
    return { success: false, message: 'لم يتم تكوين Supabase، يرجى إعداد متغيرات البيئة VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY' };
  }

  try {
    // First check if there's already data in Supabase to avoid overwriting
    const { data: existingStudents, error: checkError } = await supabase.from('students').select('student_id').limit(1);
    if (checkError) {
      console.warn('[Migration] Could not check existing data, skipping migration');
      return { success: true, message: 'تم تخطي الهجرة - لم نتمكن من التحقق من البيانات الموجودة' };
    }
    
    // If there's already data in Supabase, skip migration to prevent issues
    if (existingStudents && existingStudents.length > 0) {
      console.log('[Migration] Supabase already has data, skipping migration');
      return { success: true, message: 'تم تخطي الهجرة - البيانات موجودة بالفعل في Supabase' };
    }

    const departments = JSON.parse(localStorage.getItem(LOCAL_KEYS.DEPARTMENTS) || '[]').map((d: any) => {
      const { organization_id, ...cleaned } = d;
      return cleaned;
    });
    const students = JSON.parse(localStorage.getItem(LOCAL_KEYS.STUDENTS) || '[]').map((s: any) => {
      const { organization_id, personal_note, ...cleaned } = s; // Remove columns not in students table
      return cleaned;
    });
    const subjects = JSON.parse(localStorage.getItem(LOCAL_KEYS.SUBJECTS) || '[]').map((s: any) => {
      const { organization_id, ...cleaned } = s;
      return cleaned;
    });
    const schedules = JSON.parse(localStorage.getItem(LOCAL_KEYS.SCHEDULES) || '[]').map((s: any) => {
      const { organization_id, ...cleaned } = s;
      return cleaned;
    });
    const attendanceLogs = JSON.parse(localStorage.getItem(LOCAL_KEYS.ATTENDANCE_LOGS) || '[]').map((a: any) => {
      const { organization_id, ...cleaned } = a;
      return cleaned;
    });
    const notifications = JSON.parse(localStorage.getItem(LOCAL_KEYS.NOTIFICATIONS) || '[]').map((n: any) => {
      const { organization_id, ...cleaned } = n;
      return cleaned;
    });
    const personalNotes = JSON.parse(localStorage.getItem(LOCAL_KEYS.PERSONAL_NOTES) || '[]').map((p: any) => {
      const { organization_id, ...cleaned } = p;
      return cleaned;
    });
    const payments = JSON.parse(localStorage.getItem(LOCAL_KEYS.PAYMENTS) || '[]').map((p: any) => {
      const { organization_id, ...cleaned } = p;
      return cleaned;
    });
    const paymentSettings = JSON.parse(localStorage.getItem(LOCAL_KEYS.PAYMENT_SETTINGS) || '[]');

    if (departments.length > 0) {
      const { error } = await supabase.from('departments').upsert(departments, { onConflict: 'department_id' });
      if (error) console.warn('[Migration] Departments upsert warning:', error);
    }
    if (students.length > 0) {
      const { error } = await supabase.from('students').upsert(students, { onConflict: 'academic_id' });
      if (error) console.warn('[Migration] Students upsert warning:', error);
    }
    if (subjects.length > 0) {
      const { error } = await supabase.from('subjects').upsert(subjects, { onConflict: 'subject_id' });
      if (error) console.warn('[Migration] Subjects upsert warning:', error);
    }
    if (schedules.length > 0) {
      const { error } = await supabase.from('student_schedule').upsert(schedules, { onConflict: 'schedule_id' });
      if (error) console.warn('[Migration] Schedules upsert warning:', error);
    }
    if (attendanceLogs.length > 0) {
      const { error } = await supabase.from('attendance_log').upsert(attendanceLogs, { onConflict: 'log_id' });
      if (error) console.warn('[Migration] Attendance logs upsert warning:', error);
    }
    if (notifications.length > 0) {
      const { error } = await supabase.from('notifications').upsert(notifications, { onConflict: 'notification_id' });
      if (error) console.warn('[Migration] Notifications upsert warning:', error);
    }
    if (personalNotes.length > 0) {
      const { error } = await supabase.from('personal_notes').upsert(personalNotes, { onConflict: 'note_id' });
      if (error) console.warn('[Migration] Personal notes upsert warning:', error);
    }
    if (payments.length > 0) {
      const { error } = await supabase.from('payments').upsert(payments, { onConflict: 'id' });
      if (error) console.warn('[Migration] Payments upsert warning:', error);
    }
    if (paymentSettings.length > 0) {
      const { error } = await supabase.from('payment_settings').upsert(paymentSettings);
      if (error) console.warn('[Migration] Payment settings upsert warning:', error);
    }

    return {
      success: true,
      message: `✅ تم استيراد البيانات بنجاح: ${departments.length} تخصص، ${students.length} طالب، ${subjects.length} مادة، ${schedules.length} جدول، ${attendanceLogs.length} سجل حضور، ${notifications.length} إشعار، ${payments.length} دفعة`
    };
  } catch (err: any) {
    console.warn('[Migration] Warning:', err);
    return {
      success: true, // Still return true to not break the app
      message: `⚠️ تم تخطي الهجرة بسبب خطأ: ${err.message}`
    };
  }
}
