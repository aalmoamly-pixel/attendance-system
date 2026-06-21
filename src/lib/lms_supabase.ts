import { supabase } from './supabase';

export interface LMSUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'admin' | 'instructor' | 'student';
  avatar_url?: string;
  status?: 'active' | 'pending' | 'rejected';
  subscription_plan_id?: string;
  created_at: string;
}

export interface LMSDepartment {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface LMSCourse {
  id: string;
  code: string;
  title: string;
  description?: string;
  department_id?: string;
  price?: number;
  created_at: string;
}

export interface LMSSection {
  id: string;
  course_id: string;
  instructor_id?: string;
  section_number: string;
  semester: string;
  capacity: number;
  schedule_days?: string[];
  schedule_time?: string;
  created_at: string;
  course?: LMSCourse;
  instructor?: LMSUser;
}

export interface LMSEnrollment {
  id: string;
  student_id: string;
  section_id: string;
  enrolled_at: string;
  final_grade?: number;
  student?: LMSUser;
  section?: LMSSection;
}

export interface LMSMaterial {
  id: string;
  section_id: string;
  title: string;
  description?: string;
  type: 'pdf' | 'video' | 'audio' | 'document' | 'link';
  file_url: string;
  uploaded_at: string;
}

export interface LMSAssignment {
  id: string;
  section_id: string;
  title: string;
  instructions?: string;
  due_date: string;
  max_points: number;
  created_at: string;
}

export interface LMSSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url?: string;
  student_notes?: string;
  grade?: number;
  feedback?: string;
  submitted_at: string;
  student?: LMSUser;
}

export interface LMSQuestion {
  id: string;
  course_id: string;
  type: 'mcq' | 'tf' | 'essay';
  question_text: string;
  choices?: string[];
  correct_answer?: string;
  points: number;
  created_at: string;
}

export interface LMSExam {
  id: string;
  section_id: string;
  title: string;
  duration_minutes: number;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface LMSExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  answers: Record<string, string>;
  score: number;
  started_at: string;
  completed_at?: string;
}

export interface LMSMeeting {
  id: string;
  section_id: string;
  title: string;
  meeting_url: string;
  start_time: string;
  duration_minutes: number;
}

export interface LMSAttendance {
  id: string;
  section_id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  recorded_by?: string;
  created_at: string;
  student?: LMSUser;
}

export interface LMSAnnouncement {
  id: string;
  section_id: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  creator?: LMSUser;
}

export interface LMSMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender?: LMSUser;
  receiver?: LMSUser;
}

export interface LMSCertificate {
  id: string;
  student_id: string;
  course_id: string;
  certificate_code: string;
  issued_at: string;
  grade?: number;
  course?: LMSCourse;
}

export interface LMSSpecialRequest {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  student_phone?: string;
  details: string;
  price?: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface LMSSubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billing_cycle: string; // e.g. "شهري", "فصلي", "سنوي"
  features: string[];
  created_at: string;
}

// Local storage key names
const LOCAL_KEYS = {
  USERS: 'lms_users',
  DEPARTMENTS: 'lms_departments',
  COURSES: 'lms_courses',
  SECTIONS: 'lms_sections',
  ENROLLMENTS: 'lms_enrollments',
  MATERIALS: 'lms_materials',
  ASSIGNMENTS: 'lms_assignments',
  SUBMISSIONS: 'lms_submissions',
  QUESTIONS: 'lms_questions',
  EXAMS: 'lms_exams',
  EXAM_QUESTIONS: 'lms_exam_questions',
  EXAM_ATTEMPTS: 'lms_exam_attempts',
  MEETINGS: 'lms_meetings',
  ATTENDANCE: 'lms_attendance',
  ANNOUNCEMENTS: 'lms_announcements',
  MESSAGES: 'lms_messages',
  CERTIFICATES: 'lms_certificates',
  SPECIAL_REQUESTS: 'lms_special_requests',
  SITE_CONFIG: 'lms_site_config',
  SUBSCRIPTION_PLANS: 'lms_subscription_plans',
};

// State flags for database detection
// Force LocalStorage mode — all LMS data is stored locally
const useLmsLocal = true;
let isChecked = false;

const getLocal = <T>(key: string): T[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
};

const setLocal = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initialize local storage and seed data
const checkLmsMode = async () => {
  if (isChecked) return;
  isChecked = true;
  console.log('[LMS DB] Using LocalStorage mode for all data.');
  seedLMSLocalData();
};

// Seed LocalStorage dummy data
function seedLMSLocalData() {
  const existingCourses = getLocal<LMSCourse>(LOCAL_KEYS.COURSES);
  const hasV2Courses = existingCourses.some(c => c.id === 'course-eng101');
  
  if (getLocal(LOCAL_KEYS.USERS).length === 0 || !hasV2Courses) {
    console.log('[LMS DB] Seeding default data to LocalStorage...');

    const users: LMSUser[] = [
      { id: 'usr-admin-123', email: 'admin@lms.com', full_name: 'مدير النظام (LMS)', phone: '0500000001', role: 'admin', status: 'active', created_at: new Date().toISOString() },
      { id: 'usr-instructor-123', email: 'teacher@lms.com', full_name: 'أ.د. عبد الله محمد', phone: '0500000002', role: 'instructor', status: 'active', created_at: new Date().toISOString() },
      { id: 'usr-student-123', email: 'student@lms.com', full_name: 'أحمد خالد العتيبي', phone: '0500000003', role: 'student', status: 'active', created_at: new Date().toISOString() }
    ];
    setLocal(LOCAL_KEYS.USERS, users);
    
    const depts: LMSDepartment[] = [
      { id: 'dept-cs', name: 'علوم الحاسب والمعلومات', description: 'قسم مختص بعلوم الحاسب وهندسة البرمجيات ونظم المعلومات', created_at: new Date().toISOString() },
      { id: 'dept-gen', name: 'المواد العامة والتقوية', description: 'مساقات لتقوية وتطوير المهارات اللغوية والأكاديمية', created_at: new Date().toISOString() },
      { id: 'dept-med', name: 'العلوم الطبية والصحية', description: 'البرامج التدريبية والطبية العامة', created_at: new Date().toISOString() },
      { id: 'dept-acc', name: 'العلوم الإدارية والمالية', description: 'إدارة الأعمال والمحاسبة والمالية', created_at: new Date().toISOString() }
    ];
    setLocal(LOCAL_KEYS.DEPARTMENTS, depts);

    const courses: LMSCourse[] = [
      { id: 'course-eng101', code: 'ENG101', title: 'اللغة الإنجليزية (مادة تقوية)', description: 'تقوية مهارات الكتابة، القراءة والمحادثة باللغة الإنجليزية للأغراض الأكاديمية.', department_id: 'dept-gen', price: 150, created_at: new Date().toISOString() },
      { id: 'course-cs101', code: 'CS101', title: 'مقدمة في البرمجة (Python)', description: 'مقرر تمهيدي لتعلم أساسيات البرمجة وقواعد البيانات بلغة بايثون.', department_id: 'dept-cs', price: 250, created_at: new Date().toISOString() },
      { id: 'course-acc101', code: 'ACC101', title: 'مبادئ المحاسبة والمالية', description: 'شرح القوائم المالية، الحسابات الختامية والتحليل المالي للشركات.', department_id: 'dept-acc', price: 200, created_at: new Date().toISOString() },
      { id: 'course-med101', code: 'MED101', title: 'مقدمة في العلوم الطبية والصحية', description: 'دراسة أساسيات التشريح ووظائف الأعضاء والمصطلحات الطبية العامة.', department_id: 'dept-med', price: 300, created_at: new Date().toISOString() }
    ];
    setLocal(LOCAL_KEYS.COURSES, courses);

    const sections: LMSSection[] = [
      { id: 'sec-eng-1', course_id: 'course-eng101', instructor_id: 'usr-instructor-123', section_number: '01', semester: 'Fall 2026', capacity: 30, schedule_days: ['الأحد', 'الثلاثاء'], schedule_time: '08:00 - 09:30', created_at: new Date().toISOString() },
      { id: 'sec-101-1', course_id: 'course-cs101', instructor_id: 'usr-instructor-123', section_number: '01', semester: 'Fall 2026', capacity: 30, schedule_days: ['الأحد', 'الثلاثاء', 'الخميس'], schedule_time: '10:00 - 11:30', created_at: new Date().toISOString() },
      { id: 'sec-acc-1', course_id: 'course-acc101', instructor_id: 'usr-instructor-123', section_number: '01', semester: 'Fall 2026', capacity: 30, schedule_days: ['الإثنين', 'الأربعاء'], schedule_time: '13:00 - 14:30', created_at: new Date().toISOString() },
      { id: 'sec-med-1', course_id: 'course-med101', instructor_id: 'usr-instructor-123', section_number: '01', semester: 'Fall 2026', capacity: 30, schedule_days: ['الإثنين', 'الأربعاء'], schedule_time: '15:00 - 16:30', created_at: new Date().toISOString() }
    ];
    setLocal(LOCAL_KEYS.SECTIONS, sections);

    const enrollments: LMSEnrollment[] = [
      { id: 'enr-1', student_id: 'usr-student-123', section_id: 'sec-101-1', enrolled_at: new Date().toISOString() },
      { id: 'enr-2', student_id: 'usr-student-123', section_id: 'sec-eng-1', enrolled_at: new Date().toISOString() },
      { id: 'enr-3', student_id: 'usr-student-123', section_id: 'sec-acc-1', enrolled_at: new Date().toISOString() },
      { id: 'enr-4', student_id: 'usr-student-123', section_id: 'sec-med-1', enrolled_at: new Date().toISOString() }
    ];
    setLocal(LOCAL_KEYS.ENROLLMENTS, enrollments);

    const materials: LMSMaterial[] = [
      { id: 'mat-1', section_id: 'sec-101-1', title: 'المحاضرة الأولى: مقدمة عن بايثون', description: 'عرض تقديمي يشرح المفاهيم الأساسية وتثبيت بايثون', type: 'pdf', file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', uploaded_at: new Date().toISOString() },
      { id: 'mat-2', section_id: 'sec-101-1', title: 'فيديو تعليمي: أساسيات الدوال المتغيرة', description: 'شرح مبسط ومصور لكيفية عمل الدوال والمتغيرات', type: 'video', file_url: 'https://www.w3schools.com/html/mov_bbb.mp4', uploaded_at: new Date().toISOString() }
    ];
    setLocal(LOCAL_KEYS.MATERIALS, materials);

    const assignments: LMSAssignment[] = [
      { id: 'asg-1', section_id: 'sec-101-1', title: 'الواجب الأول: طباعة العبارات البسيطة والحلقات التكرارية', instructions: 'قم بكتابة برنامج يطبع الأعداد الفردية من 1 إلى 20 وحمله في ملف نصي أو pdf.', due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), max_points: 10, created_at: new Date().toISOString() }
    ];
    setLocal(LOCAL_KEYS.ASSIGNMENTS, assignments);

    const questions: LMSQuestion[] = [
      { id: 'q-1', course_id: 'course-cs101', type: 'mcq', question_text: 'ما هي الكلمة المفتاحية المستخدمة لتعريف دالة في لغة بايثون؟', choices: ['function', 'def', 'define', 'func'], correct_answer: 'def', points: 2, created_at: new Date().toISOString() },
      { id: 'q-2', course_id: 'course-cs101', type: 'tf', question_text: 'تعتبر لغة بايثون من اللغات المفسرة (Interpreted).', choices: ['صح', 'خطأ'], correct_answer: 'صح', points: 2, created_at: new Date().toISOString() },
      { id: 'q-3', course_id: 'course-cs101', type: 'essay', question_text: 'اشرح باختصار الفرق بين القائمة (List) والصف (Tuple) في بايثون.', points: 4, created_at: new Date().toISOString() }
    ];
    setLocal(LOCAL_KEYS.QUESTIONS, questions);

    const exams: LMSExam[] = [
      { id: 'exam-1', section_id: 'sec-101-1', title: 'الاختبار القصير الأول (أساسيات البرمجة)', duration_minutes: 30, start_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(), end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() }
    ];
    setLocal(LOCAL_KEYS.EXAMS, exams);

    const examQuestions = [
      { exam_id: 'exam-1', question_id: 'q-1' },
      { exam_id: 'exam-1', question_id: 'q-2' },
      { exam_id: 'exam-1', question_id: 'q-3' }
    ];
    setLocal(LOCAL_KEYS.EXAM_QUESTIONS, examQuestions);

    const meetings: LMSMeeting[] = [
      { id: 'meet-1', section_id: 'sec-101-1', title: 'محاضرة تفاعلية مباشرة: مناقشة الواجب الأول', meeting_url: 'https://zoom.us', start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), duration_minutes: 60 }
    ];
    setLocal(LOCAL_KEYS.MEETINGS, meetings);

    const announcements: LMSAnnouncement[] = [
      { id: 'ann-1', section_id: 'sec-101-1', title: 'ترحيب حار بالطلاب الجدد', content: 'أهلاً بكم جميعاً في مقرر مقدمة البرمجة. أتمنى لكم فصلاً دراسياً حافلاً بالنجاح والتفوق. يرجى الاطلاع على المادة الأولى المرفوعة.', created_by: 'usr-instructor-123', created_at: new Date().toISOString() }
    ];
    setLocal(LOCAL_KEYS.ANNOUNCEMENTS, announcements);
    console.log('[LMS DB] LocalStorage Seeding complete.');
  }
}

// Seed Supabase dummy data
export async function seedLMSSupabaseData() {
  if (!supabase) return;
  try {
    const { count, error: countError } = await supabase.from('lms_users').select('id', { count: 'exact', head: true });
    if (countError) throw countError;

    if (count === 0) {
      console.log('[LMS DB] Seeding default data to Supabase...');

      const users = [
        { id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', email: 'admin@lms.com', password_hash: 'Abdullah772091', full_name: 'مدير النظام (LMS)', role: 'admin', phone: '0500000001' },
        { id: '4fa85f64-5717-4562-b3fc-2c963f66afa7', email: 'teacher@lms.com', password_hash: 'Abdullah772091', full_name: 'أ.د. عبد الله محمد', role: 'instructor', phone: '0500000002' },
        { id: '5fa85f64-5717-4562-b3fc-2c963f66afa8', email: 'student@lms.com', password_hash: 'Abdullah772091', full_name: 'أحمد خالد العتيبي', role: 'student', phone: '0500000003' }
      ];
      await supabase.from('lms_users').insert(users);

      const deptId = '6fa85f64-5717-4562-b3fc-2c963f66afa9';
      await supabase.from('lms_departments').insert({ id: deptId, name: 'علوم الحاسب والمعلومات', description: 'قسم مختص بعلوم الحاسب وهندسة البرمجيات ونظم المعلومات' });

      const courseId = '7fa85f64-5717-4562-b3fc-2c963f66afaa';
      await supabase.from('lms_courses').insert({ id: courseId, code: 'CS101', title: 'مقدمة في البرمجة (Python)', description: 'مقرر تمهيدي لتعلم أساسيات البرمجة بلغة بايثون', department_id: deptId });

      const sectionId = '8fa85f64-5717-4562-b3fc-2c963f66afab';
      await supabase.from('lms_sections').insert({ id: sectionId, course_id: courseId, instructor_id: '4fa85f64-5717-4562-b3fc-2c963f66afa7', section_number: '01', semester: 'Fall 2026', capacity: 30 });

      await supabase.from('lms_enrollments').insert({ student_id: '5fa85f64-5717-4562-b3fc-2c963f66afa8', section_id: sectionId });

      await supabase.from('lms_materials').insert([
        { section_id: sectionId, title: 'المحاضرة الأولى: مقدمة عن بايثون', description: 'عرض تقديمي يشرح المفاهيم الأساسية وتثبيت بايثون', type: 'pdf', file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
        { section_id: sectionId, title: 'فيديو تعليمي: أساسيات الدوال المتغيرة', description: 'شرح مبسط ومصور لكيفية عمل الدوال والمتغيرات', type: 'video', file_url: 'https://www.w3schools.com/html/mov_bbb.mp4' }
      ]);

      const assignmentId = '9fa85f64-5717-4562-b3fc-2c963f66afac';
      await supabase.from('lms_assignments').insert({ id: assignmentId, section_id: sectionId, title: 'الواجب الأول: طباعة العبارات البسيطة والحلقات التكرارية', instructions: 'قم بكتابة برنامج يطبع الأعداد الفردية من 1 إلى 20 وحمله في ملف نصي أو pdf.', due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), max_points: 10 });

      const questions = [
        { id: '1fa85f64-5717-4562-b3fc-2c963f66afad', course_id: courseId, type: 'mcq', question_text: 'ما هي الكلمة المفتاحية المستخدمة لتعريف دالة في لغة بايثون؟', choices: ['function', 'def', 'define', 'func'], correct_answer: 'def', points: 2 },
        { id: '2fa85f64-5717-4562-b3fc-2c963f66afae', course_id: courseId, type: 'tf', question_text: 'تعتبر لغة بايثون من اللغات المفسرة (Interpreted).', choices: ['صح', 'خطأ'], correct_answer: 'صح', points: 2 },
        { id: '3fa85f64-5717-4562-b3fc-2c963f66afaf', course_id: courseId, type: 'essay', question_text: 'اشرح باختصار الفرق بين القائمة (List) والصف (Tuple) في بايثون.', points: 4 }
      ];
      await supabase.from('lms_questions').insert(questions);

      const examId = '4fa85f64-5717-4562-b3fc-2c963f66afb0';
      await supabase.from('lms_exams').insert({ id: examId, section_id: sectionId, title: 'الاختبار القصير الأول (أساسيات البرمجة)', duration_minutes: 30, start_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(), end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() });

      await supabase.from('lms_exam_questions').insert([
        { exam_id: examId, question_id: '1fa85f64-5717-4562-b3fc-2c963f66afad' },
        { exam_id: examId, question_id: '2fa85f64-5717-4562-b3fc-2c963f66afae' },
        { exam_id: examId, question_id: '3fa85f64-5717-4562-b3fc-2c963f66afaf' }
      ]);

      await supabase.from('lms_meetings').insert({ section_id: sectionId, title: 'محاضرة تفاعلية مباشرة: مناقشة الواجب الأول', meeting_url: 'https://zoom.us', start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), duration_minutes: 60 });

      await supabase.from('lms_announcements').insert({ section_id: sectionId, title: 'ترحيب حار بالطلاب الجدد', content: 'أهلاً بكم جميعاً في مقرر مقدمة البرمجة. أتمنى لكم فصلاً دراسياً حافلاً بالنجاح والتفوق. يرجى الاطلاع على المادة الأولى المرفوعة.', created_by: '4fa85f64-5717-4562-b3fc-2c963f66afa7' });

      console.log('[LMS DB] Seeding default data to Supabase complete!');
    }
  } catch (err) {
    console.error('[LMS DB] Error during Supabase seeding:', err);
  }
}

export const lmsDb = {
  // 1. Auth & Users
  async registerUser(email: string, password_hash: string, full_name: string, role: LMSUser['role'], phone = '', status?: LMSUser['status'], subscriptionPlanId?: string): Promise<LMSUser> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_users')
        .insert({ email, password_hash, full_name, role, phone, status: status || (role === 'student' ? 'pending' : 'active'), subscription_plan_id: subscriptionPlanId })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    } else {
      const users = getLocal<LMSUser>(LOCAL_KEYS.USERS);
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('البريد الإلكتروني مسجل بالفعل');
      }
      const newUser: LMSUser = {
        id: `usr-${Math.random().toString(36).substring(2, 9)}`,
        email,
        full_name,
        phone,
        role,
        status: status || (role === 'student' ? 'pending' : 'active'),
        subscription_plan_id: subscriptionPlanId,
        created_at: new Date().toISOString()
      };
      users.push(newUser);
      
      // Also save password locally in a separate mock auth store for simplicity
      const localAuth = JSON.parse(localStorage.getItem('lms_local_auth_passwords') || '{}');
      localAuth[email.toLowerCase()] = password_hash;
      localStorage.setItem('lms_local_auth_passwords', JSON.stringify(localAuth));

      setLocal(LOCAL_KEYS.USERS, users);
      return newUser;
    }
  },

  async loginUser(email: string, password_hash: string): Promise<LMSUser> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_users')
        .select('*')
        .eq('email', email)
        .eq('password_hash', password_hash)
        .maybeSingle();

      if (error || !data) {
        throw new Error('بيانات الدخول غير صحيحة');
      }
      return data;
    } else {
      const users = getLocal<LMSUser>(LOCAL_KEYS.USERS);
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        throw new Error('بيانات الدخول غير صحيحة');
      }
      // Check password: for local seed users password is 'Abdullah772091'
      // Or check in lms_local_auth_passwords
      const localAuth = JSON.parse(localStorage.getItem('lms_local_auth_passwords') || '{}');
      const savedPass = localAuth[email.toLowerCase()] || 'Abdullah772091';
      if (password_hash !== savedPass) {
        throw new Error('كلمة المرور غير صحيحة');
      }
      return user;
    }
  },

  async getUsers(role?: LMSUser['role']): Promise<LMSUser[]> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      let query = supabase.from('lms_users').select('*').order('full_name');
      if (role) {
        query = query.eq('role', role);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } else {
      const users = getLocal<LMSUser>(LOCAL_KEYS.USERS);
      if (role) {
        return users.filter(u => u.role === role).sort((a,b) => a.full_name.localeCompare(b.full_name));
      }
      return users.sort((a,b) => a.full_name.localeCompare(b.full_name));
    }
  },

  // 2. Departments
  async getDepartments(): Promise<LMSDepartment[]> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase.from('lms_departments').select('*').order('name');
      if (error) throw error;
      return data || [];
    } else {
      return getLocal<LMSDepartment>(LOCAL_KEYS.DEPARTMENTS).sort((a,b) => a.name.localeCompare(b.name));
    }
  },

  async createDepartment(name: string, description = ''): Promise<LMSDepartment> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_departments')
        .insert({ name, description })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    } else {
      const depts = getLocal<LMSDepartment>(LOCAL_KEYS.DEPARTMENTS);
      const newDept: LMSDepartment = {
        id: `dept-${Math.random().toString(36).substring(2, 9)}`,
        name,
        description,
        created_at: new Date().toISOString()
      };
      depts.push(newDept);
      setLocal(LOCAL_KEYS.DEPARTMENTS, depts);
      return newDept;
    }
  },

  // 3. Courses
  async getCourses(): Promise<LMSCourse[]> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase.from('lms_courses').select('*').order('title');
      if (error) throw error;
      return data || [];
    } else {
      return getLocal<LMSCourse>(LOCAL_KEYS.COURSES).sort((a,b) => a.title.localeCompare(b.title));
    }
  },

  async createCourse(code: string, title: string, description = '', departmentId?: string, price?: number): Promise<LMSCourse> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_courses')
        .insert({ code, title, description, department_id: departmentId, price })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    } else {
      const courses = getLocal<LMSCourse>(LOCAL_KEYS.COURSES);
      const newCourse: LMSCourse = {
        id: `course-${Math.random().toString(36).substring(2, 9)}`,
        code,
        title,
        description,
        department_id: departmentId,
        price,
        created_at: new Date().toISOString()
      };
      courses.push(newCourse);
      setLocal(LOCAL_KEYS.COURSES, courses);
      return newCourse;
    }
  },

  // 4. Sections
  async getSections(): Promise<LMSSection[]> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_sections')
        .select('*, course:lms_courses(*), instructor:lms_users(*)')
        .order('section_number');
      if (error) throw error;
      return data || [];
    } else {
      const sections = getLocal<LMSSection>(LOCAL_KEYS.SECTIONS);
      const courses = getLocal<LMSCourse>(LOCAL_KEYS.COURSES);
      const users = getLocal<LMSUser>(LOCAL_KEYS.USERS);

      return sections.map(sec => ({
        ...sec,
        course: courses.find(c => c.id === sec.course_id),
        instructor: users.find(u => u.id === sec.instructor_id)
      })).sort((a,b) => a.section_number.localeCompare(b.section_number));
    }
  },

  async createSection(courseId: string, instructorId: string | null, sectionNumber: string, semester: string, capacity = 30, scheduleDays?: string[], scheduleTime?: string): Promise<LMSSection> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_sections')
        .insert({ course_id: courseId, instructor_id: instructorId, section_number: sectionNumber, semester, capacity, schedule_days: scheduleDays, schedule_time: scheduleTime })
        .select('*, course:lms_courses(*), instructor:lms_users(*)')
        .single();
      if (error) throw error;
      return data;
    } else {
      const sections = getLocal<LMSSection>(LOCAL_KEYS.SECTIONS);
      const courses = getLocal<LMSCourse>(LOCAL_KEYS.COURSES);
      const users = getLocal<LMSUser>(LOCAL_KEYS.USERS);

      const newSection: LMSSection = {
        id: `sec-${Math.random().toString(36).substring(2, 9)}`,
        course_id: courseId,
        instructor_id: instructorId || undefined,
        section_number: sectionNumber,
        semester,
        capacity,
        schedule_days: scheduleDays,
        schedule_time: scheduleTime,
        created_at: new Date().toISOString()
      };
      sections.push(newSection);
      setLocal(LOCAL_KEYS.SECTIONS, sections);

      return {
        ...newSection,
        course: courses.find(c => c.id === courseId),
        instructor: instructorId ? users.find(u => u.id === instructorId) : undefined
      };
    }
  },

  async getInstructorSections(instructorId: string): Promise<LMSSection[]> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_sections')
        .select('*, course:lms_courses(*)')
        .eq('instructor_id', instructorId)
        .order('section_number');
      if (error) throw error;
      return data || [];
    } else {
      const sections = getLocal<LMSSection>(LOCAL_KEYS.SECTIONS);
      const courses = getLocal<LMSCourse>(LOCAL_KEYS.COURSES);

      return sections
        .filter(s => s.instructor_id === instructorId)
        .map(sec => ({
          ...sec,
          course: courses.find(c => c.id === sec.course_id)
        }))
        .sort((a,b) => a.section_number.localeCompare(b.section_number));
    }
  },

  async getStudentSections(studentId: string): Promise<LMSSection[]> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_enrollments')
        .select('*, section:lms_sections(*, course:lms_courses(*), instructor:lms_users(*))')
        .eq('student_id', studentId);
      if (error) throw error;
      return (data || []).map((e: any) => e.section).filter(Boolean);
    } else {
      const enrolls = getLocal<LMSEnrollment>(LOCAL_KEYS.ENROLLMENTS);
      const sections = getLocal<LMSSection>(LOCAL_KEYS.SECTIONS);
      const courses = getLocal<LMSCourse>(LOCAL_KEYS.COURSES);
      const users = getLocal<LMSUser>(LOCAL_KEYS.USERS);

      const studentSectionIds = enrolls.filter(e => e.student_id === studentId).map(e => e.section_id);
      return sections
        .filter(sec => studentSectionIds.includes(sec.id))
        .map(sec => ({
          ...sec,
          course: courses.find(c => c.id === sec.course_id),
          instructor: users.find(u => u.id === sec.instructor_id)
        }));
    }
  },

  // 5. Enrollments
  async enrollStudent(studentId: string, sectionId: string): Promise<LMSEnrollment> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_enrollments')
        .insert({ student_id: studentId, section_id: sectionId })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    } else {
      const enrolls = getLocal<LMSEnrollment>(LOCAL_KEYS.ENROLLMENTS);
      if (enrolls.some(e => e.student_id === studentId && e.section_id === sectionId)) {
        throw new Error('أنت مسجل بالفعل في هذه الشعبة');
      }
      const newEnroll: LMSEnrollment = {
        id: `enr-${Math.random().toString(36).substring(2, 9)}`,
        student_id: studentId,
        section_id: sectionId,
        enrolled_at: new Date().toISOString()
      };
      enrolls.push(newEnroll);
      setLocal(LOCAL_KEYS.ENROLLMENTS, enrolls);
      return newEnroll;
    }
  },

  async getSectionEnrollments(sectionId: string): Promise<LMSEnrollment[]> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_enrollments')
        .select('*, student:lms_users(*)')
        .eq('section_id', sectionId);
      if (error) throw error;
      return data || [];
    } else {
      const enrolls = getLocal<LMSEnrollment>(LOCAL_KEYS.ENROLLMENTS);
      const users = getLocal<LMSUser>(LOCAL_KEYS.USERS);

      return enrolls
        .filter(e => e.section_id === sectionId)
        .map(e => ({
          ...e,
          student: users.find(u => u.id === e.student_id)
        }));
    }
  },

  // 6. Materials
  async getMaterials(sectionId: string): Promise<LMSMaterial[]> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_materials')
        .select('*')
        .eq('section_id', sectionId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      const materials = getLocal<LMSMaterial>(LOCAL_KEYS.MATERIALS);
      return materials
        .filter(m => m.section_id === sectionId)
        .sort((a,b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
    }
  },

  async createMaterial(sectionId: string, title: string, description: string, type: LMSMaterial['type'], fileUrl: string): Promise<LMSMaterial> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_materials')
        .insert({ section_id: sectionId, title, description, type, file_url: fileUrl })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    } else {
      const materials = getLocal<LMSMaterial>(LOCAL_KEYS.MATERIALS);
      const newMaterial: LMSMaterial = {
        id: `mat-${Math.random().toString(36).substring(2, 9)}`,
        section_id: sectionId,
        title,
        description,
        type,
        file_url: fileUrl,
        uploaded_at: new Date().toISOString()
      };
      materials.push(newMaterial);
      setLocal(LOCAL_KEYS.MATERIALS, materials);
      return newMaterial;
    }
  },

  // 7. Assignments & Submissions
  async getAssignments(sectionId: string): Promise<LMSAssignment[]> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_assignments')
        .select('*')
        .eq('section_id', sectionId)
        .order('due_date');
      if (error) throw error;
      return data || [];
    } else {
      const assignments = getLocal<LMSAssignment>(LOCAL_KEYS.ASSIGNMENTS);
      return assignments
        .filter(a => a.section_id === sectionId)
        .sort((a,b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    }
  },

  async createAssignment(sectionId: string, title: string, instructions: string, dueDate: string, maxPoints = 100.0): Promise<LMSAssignment> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_assignments')
        .insert({ section_id: sectionId, title, instructions, due_date: dueDate, max_points: maxPoints })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    } else {
      const assignments = getLocal<LMSAssignment>(LOCAL_KEYS.ASSIGNMENTS);
      const newAssignment: LMSAssignment = {
        id: `asg-${Math.random().toString(36).substring(2, 9)}`,
        section_id: sectionId,
        title,
        instructions,
        due_date: dueDate,
        max_points: maxPoints,
        created_at: new Date().toISOString()
      };
      assignments.push(newAssignment);
      setLocal(LOCAL_KEYS.ASSIGNMENTS, assignments);
      return newAssignment;
    }
  },

  async getSubmissions(assignmentId: string): Promise<LMSSubmission[]> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_submissions')
        .select('*, student:lms_users(*)')
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      const subs = getLocal<LMSSubmission>(LOCAL_KEYS.SUBMISSIONS);
      const users = getLocal<LMSUser>(LOCAL_KEYS.USERS);

      return subs
        .filter(s => s.assignment_id === assignmentId)
        .map(s => ({
          ...s,
          student: users.find(u => u.id === s.student_id)
        }))
        .sort((a,b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
    }
  },

  async getStudentSubmission(assignmentId: string, studentId: string): Promise<LMSSubmission | null> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .maybeSingle();
      if (error) throw error;
      return data;
    } else {
      const subs = getLocal<LMSSubmission>(LOCAL_KEYS.SUBMISSIONS);
      const found = subs.find(s => s.assignment_id === assignmentId && s.student_id === studentId);
      return found || null;
    }
  },

  async submitAssignment(assignmentId: string, studentId: string, fileUrl: string, studentNotes = ''): Promise<LMSSubmission> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_submissions')
        .upsert({ assignment_id: assignmentId, student_id: studentId, file_url: fileUrl, student_notes: studentNotes, submitted_at: new Date().toISOString() })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    } else {
      const subs = getLocal<LMSSubmission>(LOCAL_KEYS.SUBMISSIONS);
      const existingIdx = subs.findIndex(s => s.assignment_id === assignmentId && s.student_id === studentId);

      const submissionData: LMSSubmission = {
        id: existingIdx !== -1 ? subs[existingIdx].id : `sub-${Math.random().toString(36).substring(2, 9)}`,
        assignment_id: assignmentId,
        student_id: studentId,
        file_url: fileUrl,
        student_notes: studentNotes,
        submitted_at: new Date().toISOString(),
        grade: existingIdx !== -1 ? subs[existingIdx].grade : undefined,
        feedback: existingIdx !== -1 ? subs[existingIdx].feedback : undefined
      };

      if (existingIdx !== -1) {
        subs[existingIdx] = submissionData;
      } else {
        subs.push(submissionData);
      }

      setLocal(LOCAL_KEYS.SUBMISSIONS, subs);
      return submissionData;
    }
  },

  async gradeSubmission(submissionId: string, grade: number, feedback = ''): Promise<LMSSubmission> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_submissions')
        .update({ grade, feedback })
        .eq('id', submissionId)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    } else {
      const subs = getLocal<LMSSubmission>(LOCAL_KEYS.SUBMISSIONS);
      const idx = subs.findIndex(s => s.id === submissionId);
      if (idx === -1) throw new Error('تسليم غير موجود');

      subs[idx] = {
        ...subs[idx],
        grade,
        feedback
      };
      setLocal(LOCAL_KEYS.SUBMISSIONS, subs);
      return subs[idx];
    }
  },

  // 8. Questions & Exams
  async getQuestionBank(courseId: string): Promise<LMSQuestion[]> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_questions')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      const questions = getLocal<LMSQuestion>(LOCAL_KEYS.QUESTIONS);
      return questions
        .filter(q => q.course_id === courseId)
        .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  async createQuestion(courseId: string, type: LMSQuestion['type'], questionText: string, choices: string[] | null, correctAnswer: string, points = 1.0): Promise<LMSQuestion> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_questions')
        .insert({ course_id: courseId, type, question_text: questionText, choices, correct_answer: correctAnswer, points })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    } else {
      const questions = getLocal<LMSQuestion>(LOCAL_KEYS.QUESTIONS);
      const newQuestion: LMSQuestion = {
        id: `q-${Math.random().toString(36).substring(2, 9)}`,
        course_id: courseId,
        type,
        question_text: questionText,
        choices: choices || undefined,
        correct_answer: correctAnswer,
        points,
        created_at: new Date().toISOString()
      };
      questions.push(newQuestion);
      setLocal(LOCAL_KEYS.QUESTIONS, questions);
      return newQuestion;
    }
  },

  async getExams(sectionId: string): Promise<LMSExam[]> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_exams')
        .select('*')
        .eq('section_id', sectionId)
        .order('start_time');
      if (error) throw error;
      return data || [];
    } else {
      const exams = getLocal<LMSExam>(LOCAL_KEYS.EXAMS);
      return exams
        .filter(e => e.section_id === sectionId)
        .sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    }
  },

  async createExam(sectionId: string, title: string, durationMinutes: number, startTime: string, endTime: string, questionIds: string[]): Promise<LMSExam> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      // 1. Create Exam record
      const { data: exam, error: examError } = await supabase
        .from('lms_exams')
        .insert({ section_id: sectionId, title, duration_minutes: durationMinutes, start_time: startTime, end_time: endTime })
        .select('*')
        .single();
      if (examError) throw examError;

      // 2. Link questions in junction table
      const junctionRows = questionIds.map(qid => ({ exam_id: exam.id, question_id: qid }));
      const { error: junctionError } = await supabase.from('lms_exam_questions').insert(junctionRows);
      if (junctionError) throw junctionError;

      return exam;
    } else {
      const exams = getLocal<LMSExam>(LOCAL_KEYS.EXAMS);
      const newExam: LMSExam = {
        id: `exam-${Math.random().toString(36).substring(2, 9)}`,
        section_id: sectionId,
        title,
        duration_minutes: durationMinutes,
        start_time: startTime,
        end_time: endTime,
        created_at: new Date().toISOString()
      };
      exams.push(newExam);
      setLocal(LOCAL_KEYS.EXAMS, exams);

      // Junction
      const junctions = JSON.parse(localStorage.getItem(LOCAL_KEYS.EXAM_QUESTIONS) || '[]');
      questionIds.forEach(qid => {
        junctions.push({ exam_id: newExam.id, question_id: qid });
      });
      localStorage.setItem(LOCAL_KEYS.EXAM_QUESTIONS, JSON.stringify(junctions));

      return newExam;
    }
  },

  async getExamQuestions(examId: string): Promise<LMSQuestion[]> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_exam_questions')
        .select('question:lms_questions(*)')
        .eq('exam_id', examId);
      if (error) throw error;
      return (data || []).map((row: any) => row.question).filter(Boolean);
    } else {
      const junctions = JSON.parse(localStorage.getItem(LOCAL_KEYS.EXAM_QUESTIONS) || '[]');
      const questions = getLocal<LMSQuestion>(LOCAL_KEYS.QUESTIONS);

      const linkedIds = junctions.filter((j: any) => j.exam_id === examId).map((j: any) => j.question_id);
      return questions.filter(q => linkedIds.includes(q.id));
    }
  },

  async submitExamAttempt(examId: string, studentId: string, answers: Record<string, string>, score: number): Promise<LMSExamAttempt> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_exam_attempts')
        .insert({
          exam_id: examId,
          student_id: studentId,
          answers,
          score,
          completed_at: new Date().toISOString()
        })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    } else {
      const attempts = getLocal<LMSExamAttempt>(LOCAL_KEYS.EXAM_ATTEMPTS);
      const newAttempt: LMSExamAttempt = {
        id: `att-${Math.random().toString(36).substring(2, 9)}`,
        exam_id: examId,
        student_id: studentId,
        answers,
        score,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };
      attempts.push(newAttempt);
      setLocal(LOCAL_KEYS.EXAM_ATTEMPTS, attempts);
      return newAttempt;
    }
  },

  async getExamAttempts(examId: string): Promise<LMSExamAttempt[]> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_exam_attempts')
        .select('*')
        .eq('exam_id', examId);
      if (error) throw error;
      return data || [];
    } else {
      const attempts = getLocal<LMSExamAttempt>(LOCAL_KEYS.EXAM_ATTEMPTS);
      return attempts.filter(a => a.exam_id === examId);
    }
  },

  async getStudentExamAttempt(examId: string, studentId: string): Promise<LMSExamAttempt | null> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_exam_attempts')
        .select('*')
        .eq('exam_id', examId)
        .eq('student_id', studentId)
        .maybeSingle();
      if (error) throw error;
      return data;
    } else {
      const attempts = getLocal<LMSExamAttempt>(LOCAL_KEYS.EXAM_ATTEMPTS);
      const found = attempts.find(a => a.exam_id === examId && a.student_id === studentId);
      return found || null;
    }
  },

  // 9. Virtual Meetings
  async getMeetings(sectionId: string): Promise<LMSMeeting[]> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_meetings')
        .select('*')
        .eq('section_id', sectionId)
        .order('start_time');
      if (error) throw error;
      return data || [];
    } else {
      const meetings = getLocal<LMSMeeting>(LOCAL_KEYS.MEETINGS);
      return meetings
        .filter(m => m.section_id === sectionId)
        .sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    }
  },

  async createMeeting(sectionId: string, title: string, meetingUrl: string, startTime: string, durationMinutes = 60): Promise<LMSMeeting> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_meetings')
        .insert({ section_id: sectionId, title, meeting_url: meetingUrl, start_time: startTime, duration_minutes: durationMinutes })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    } else {
      const meetings = getLocal<LMSMeeting>(LOCAL_KEYS.MEETINGS);
      const newMeeting: LMSMeeting = {
        id: `meet-${Math.random().toString(36).substring(2, 9)}`,
        section_id: sectionId,
        title,
        meeting_url: meetingUrl,
        start_time: startTime,
        duration_minutes: durationMinutes
      };
      meetings.push(newMeeting);
      setLocal(LOCAL_KEYS.MEETINGS, meetings);
      return newMeeting;
    }
  },

  // 10. Attendance
  async getAttendance(sectionId: string, date: string): Promise<LMSAttendance[]> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_attendance')
        .select('*, student:lms_users(*)')
        .eq('section_id', sectionId)
        .eq('date', date);
      if (error) throw error;
      return data || [];
    } else {
      const att = getLocal<LMSAttendance>(LOCAL_KEYS.ATTENDANCE);
      const users = getLocal<LMSUser>(LOCAL_KEYS.USERS);

      return att
        .filter(a => a.section_id === sectionId && a.date === date)
        .map(a => ({
          ...a,
          student: users.find(u => u.id === a.student_id)
        }));
    }
  },

  async recordAttendance(sectionId: string, studentId: string, date: string, status: LMSAttendance['status'], recordedBy: string): Promise<LMSAttendance> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_attendance')
        .upsert({ section_id: sectionId, student_id: studentId, date, status, recorded_by: recordedBy })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    } else {
      const att = getLocal<LMSAttendance>(LOCAL_KEYS.ATTENDANCE);
      const idx = att.findIndex(a => a.section_id === sectionId && a.student_id === studentId && a.date === date);

      const record: LMSAttendance = {
        id: idx !== -1 ? att[idx].id : `att-${Math.random().toString(36).substring(2, 9)}`,
        section_id: sectionId,
        student_id: studentId,
        date,
        status,
        recorded_by: recordedBy,
        created_at: idx !== -1 ? att[idx].created_at : new Date().toISOString()
      };

      if (idx !== -1) {
        att[idx] = record;
      } else {
        att.push(record);
      }

      setLocal(LOCAL_KEYS.ATTENDANCE, att);
      return record;
    }
  },

  // 11. Announcements
  async getAnnouncements(sectionId: string): Promise<LMSAnnouncement[]> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_announcements')
        .select('*, creator:lms_users(*)')
        .eq('section_id', sectionId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      const anns = getLocal<LMSAnnouncement>(LOCAL_KEYS.ANNOUNCEMENTS);
      const users = getLocal<LMSUser>(LOCAL_KEYS.USERS);

      return anns
        .filter(a => a.section_id === sectionId)
        .map(a => ({
          ...a,
          creator: users.find(u => u.id === a.created_by)
        }))
        .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  async createAnnouncement(sectionId: string, title: string, content: string, createdBy: string): Promise<LMSAnnouncement> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_announcements')
        .insert({ section_id: sectionId, title, content, created_by: createdBy })
        .select('*, creator:lms_users(*)')
        .single();
      if (error) throw error;
      return data;
    } else {
      const anns = getLocal<LMSAnnouncement>(LOCAL_KEYS.ANNOUNCEMENTS);
      const users = getLocal<LMSUser>(LOCAL_KEYS.USERS);

      const newAnn: LMSAnnouncement = {
        id: `ann-${Math.random().toString(36).substring(2, 9)}`,
        section_id: sectionId,
        title,
        content,
        created_by: createdBy,
        created_at: new Date().toISOString()
      };
      anns.push(newAnn);
      setLocal(LOCAL_KEYS.ANNOUNCEMENTS, anns);

      return {
        ...newAnn,
        creator: users.find(u => u.id === createdBy)
      };
    }
  },

  // 12. Internal Messages
  async getMessages(user1: string, user2: string): Promise<LMSMessage[]> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_messages')
        .select('*, sender:lms_users(*), receiver:lms_users(*)')
        .or(`and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } else {
      const msgs = getLocal<LMSMessage>(LOCAL_KEYS.MESSAGES);
      const users = getLocal<LMSUser>(LOCAL_KEYS.USERS);

      return msgs
        .filter(m => (m.sender_id === user1 && m.receiver_id === user2) || (m.sender_id === user2 && m.receiver_id === user1))
        .map(m => ({
          ...m,
          sender: users.find(u => u.id === m.sender_id),
          receiver: users.find(u => u.id === m.receiver_id)
        }))
        .sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
  },

  async sendMessage(senderId: string, receiverId: string, message: string): Promise<LMSMessage> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_messages')
        .insert({ sender_id: senderId, receiver_id: receiverId, message })
        .select('*, sender:lms_users(*), receiver:lms_users(*)')
        .single();
      if (error) throw error;
      return data;
    } else {
      const msgs = getLocal<LMSMessage>(LOCAL_KEYS.MESSAGES);
      const users = getLocal<LMSUser>(LOCAL_KEYS.USERS);

      const newMsg: LMSMessage = {
        id: `msg-${Math.random().toString(36).substring(2, 9)}`,
        sender_id: senderId,
        receiver_id: receiverId,
        message,
        is_read: false,
        created_at: new Date().toISOString()
      };
      msgs.push(newMsg);
      setLocal(LOCAL_KEYS.MESSAGES, msgs);

      return {
        ...newMsg,
        sender: users.find(u => u.id === senderId),
        receiver: users.find(u => u.id === receiverId)
      };
    }
  },

  // 13. Certificates
  async getCertificates(studentId: string): Promise<LMSCertificate[]> {
    await checkLmsMode();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_certificates')
        .select('*, course:lms_courses(*)')
        .eq('student_id', studentId);
      if (error) throw error;
      return data || [];
    } else {
      const certs = getLocal<LMSCertificate>(LOCAL_KEYS.CERTIFICATES);
      const courses = getLocal<LMSCourse>(LOCAL_KEYS.COURSES);

      return certs
        .filter(c => c.student_id === studentId)
        .map(c => ({
          ...c,
          course: courses.find(course => course.id === c.course_id)
        }));
    }
  },

  async issueCertificate(studentId: string, courseId: string, grade?: number): Promise<LMSCertificate> {
    await checkLmsMode();
    const code = `CERT-${studentId.substring(0, 4)}-${courseId.substring(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`.toUpperCase();
    if (!useLmsLocal && supabase) {
      const { data, error } = await supabase
        .from('lms_certificates')
        .insert({ student_id: studentId, course_id: courseId, certificate_code: code, grade })
        .select('*, course:lms_courses(*)')
        .single();
      if (error) throw error;
      return data;
    } else {
      const certs = getLocal<LMSCertificate>(LOCAL_KEYS.CERTIFICATES);
      const courses = getLocal<LMSCourse>(LOCAL_KEYS.COURSES);

      const newCert: LMSCertificate = {
        id: `cert-${Math.random().toString(36).substring(2, 9)}`,
        student_id: studentId,
        course_id: courseId,
        certificate_code: code,
        grade,
        issued_at: new Date().toISOString()
      };
      certs.push(newCert);
      setLocal(LOCAL_KEYS.CERTIFICATES, certs);

      return {
        ...newCert,
        course: courses.find(c => c.id === courseId)
      };
    }
  },

  // 14. Special requests for custom boosting lessons
  async getSpecialRequests(): Promise<LMSSpecialRequest[]> {
    await checkLmsMode();
    return getLocal<LMSSpecialRequest>(LOCAL_KEYS.SPECIAL_REQUESTS).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async createSpecialRequest(studentId: string, details: string): Promise<LMSSpecialRequest> {
    await checkLmsMode();
    const requests = getLocal<LMSSpecialRequest>(LOCAL_KEYS.SPECIAL_REQUESTS);
    const users = getLocal<LMSUser>(LOCAL_KEYS.USERS);
    const user = users.find(u => u.id === studentId);

    const newRequest: LMSSpecialRequest = {
      id: `req-${Math.random().toString(36).substring(2, 9)}`,
      student_id: studentId,
      student_name: user?.full_name || 'طالب مجهول',
      student_email: user?.email || '',
      student_phone: user?.phone || '',
      details,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    requests.push(newRequest);
    setLocal(LOCAL_KEYS.SPECIAL_REQUESTS, requests);
    return newRequest;
  },

  async updateSpecialRequest(requestId: string, status: 'approved' | 'rejected', price?: number): Promise<void> {
    await checkLmsMode();
    const requests = getLocal<LMSSpecialRequest>(LOCAL_KEYS.SPECIAL_REQUESTS);
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex !== -1) {
      requests[reqIndex].status = status;
      if (price !== undefined) {
        requests[reqIndex].price = price;
      }
      setLocal(LOCAL_KEYS.SPECIAL_REQUESTS, requests);
      
      // Auto-approve user status as well if the request is approved
      const studentId = requests[reqIndex].student_id;
      const users = getLocal<LMSUser>(LOCAL_KEYS.USERS);
      const userIndex = users.findIndex(u => u.id === studentId);
      if (userIndex !== -1 && status === 'approved') {
        users[userIndex].status = 'active';
        setLocal(LOCAL_KEYS.USERS, users);
      }
    }
  },

  // 15. User approvals & management
  async updateUserStatus(userId: string, status: 'active' | 'pending' | 'rejected'): Promise<void> {
    await checkLmsMode();
    const users = getLocal<LMSUser>(LOCAL_KEYS.USERS);
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index].status = status;
      setLocal(LOCAL_KEYS.USERS, users);
    }
  },

  // 16. Site settings dynamic management (site info, stats, features)
  async getSiteConfig(): Promise<any> {
    await checkLmsMode();
    const configStr = localStorage.getItem(LOCAL_KEYS.SITE_CONFIG);
    if (configStr) {
      try {
        return JSON.parse(configStr);
      } catch {
        // Fallback to default seeding
      }
    }
    // Seed and return default config
    const defaultConfig = {
      welcomeTitle: 'مستقبل التعليم الأكاديمي الذكي والحديث',
      welcomeDesc: 'منصة رقمية متكاملة تمنح الطلاب والأساتذة بيئة تعليمية تفاعلية لإدارة المحاضرات، حل الواجبات، أداء الاختبارات المحوسبة، والتواصل الفوري بهوية بصرية رائعة.',
      stats: [
        { label: 'طالب نشط', value: '+15,000' },
        { label: 'مقرر دراسي رقمي', value: '480+' },
        { label: 'نسبة الرضا والنجاح', value: '99.8%' },
        { label: 'شريك أكاديمي معتمد', value: '50+' }
      ],
      features: [
        { title: 'محاضرات ومواد علمية رقمية', desc: 'استعراض مستندات المناهج والعروض التقديمية ومقاطع الفيديو التعليمية بجودة عالية.' },
        { title: 'واجبات ومهام تفاعلية', desc: 'نظام متكامل لتسليم الواجبات المنزلية، وتلقي التقييمات والملاحظات من الأستاذ مباشرة.' },
        { title: 'اختبارات مؤقتة ذكية', desc: 'أداء الاختبارات الدورية بنظام محوسب ذكي مع احتساب الوقت تلقائياً وتصحيح فوري.' },
        { title: 'حلقات دراسية وبث مباشر', desc: 'قاعات محاضرات افتراضية متكاملة عبر Zoom وTeams للتفاعل الفوري مع الهيئة التدريسية.' },
        { title: 'مراسلة خاصة وتواصل سريع', desc: 'نظام محادثات فوري يسمح للطلاب بالتواصل المباشر مع أساتذة المقرر لطلب المساعدة.' },
        { title: 'شهادات ودرجات معتمدة', desc: 'استخراج كشوفات الدرجات وإصدار شهادات التفوق الأكاديمي الرقمية القابلة للطباعة بنقرة زر.' }
      ]
    };
    localStorage.setItem(LOCAL_KEYS.SITE_CONFIG, JSON.stringify(defaultConfig));
    return defaultConfig;
  },

  async updateSiteConfig(config: any): Promise<void> {
    await checkLmsMode();
    localStorage.setItem(LOCAL_KEYS.SITE_CONFIG, JSON.stringify(config));
  },

  // 17. CRUD for Departments
  async updateDepartment(id: string, name: string, description?: string): Promise<void> {
    await checkLmsMode();
    const depts = getLocal<LMSDepartment>(LOCAL_KEYS.DEPARTMENTS);
    const index = depts.findIndex(d => d.id === id);
    if (index !== -1) {
      depts[index].name = name;
      depts[index].description = description;
      setLocal(LOCAL_KEYS.DEPARTMENTS, depts);
    }
  },
  async deleteDepartment(id: string): Promise<void> {
    await checkLmsMode();
    const depts = getLocal<LMSDepartment>(LOCAL_KEYS.DEPARTMENTS);
    const courses = getLocal<LMSCourse>(LOCAL_KEYS.COURSES);
    // Unlink courses from deleted department
    courses.forEach((c, idx) => {
      if (c.department_id === id) {
        courses[idx].department_id = undefined;
      }
    });
    setLocal(LOCAL_KEYS.COURSES, courses);
    setLocal(LOCAL_KEYS.DEPARTMENTS, depts.filter(d => d.id !== id));
  },

  // 18. CRUD for Courses
  async updateCourse(id: string, code: string, title: string, description?: string, departmentId?: string, price?: number): Promise<void> {
    await checkLmsMode();
    const courses = getLocal<LMSCourse>(LOCAL_KEYS.COURSES);
    const index = courses.findIndex(c => c.id === id);
    if (index !== -1) {
      courses[index].code = code;
      courses[index].title = title;
      courses[index].description = description;
      courses[index].department_id = departmentId;
      courses[index].price = price;
      setLocal(LOCAL_KEYS.COURSES, courses);
    }
  },
  async deleteCourse(id: string): Promise<void> {
    await checkLmsMode();
    const courses = getLocal<LMSCourse>(LOCAL_KEYS.COURSES);
    const sections = getLocal<LMSSection>(LOCAL_KEYS.SECTIONS);
    // Delete related sections
    setLocal(LOCAL_KEYS.SECTIONS, sections.filter(s => s.course_id !== id));
    setLocal(LOCAL_KEYS.COURSES, courses.filter(c => c.id !== id));
  },

  // 19. CRUD for Sections
  async updateSection(id: string, courseId: string, instructorId: string | null, sectionNumber: string, semester: string, capacity: number, scheduleDays?: string[], scheduleTime?: string): Promise<void> {
    await checkLmsMode();
    const sections = getLocal<LMSSection>(LOCAL_KEYS.SECTIONS);
    const index = sections.findIndex(s => s.id === id);
    if (index !== -1) {
      sections[index].course_id = courseId;
      sections[index].instructor_id = instructorId || undefined;
      sections[index].section_number = sectionNumber;
      sections[index].semester = semester;
      sections[index].capacity = capacity;
      sections[index].schedule_days = scheduleDays;
      sections[index].schedule_time = scheduleTime;
      setLocal(LOCAL_KEYS.SECTIONS, sections);
    }
  },
  async deleteSection(id: string): Promise<void> {
    await checkLmsMode();
    const sections = getLocal<LMSSection>(LOCAL_KEYS.SECTIONS);
    setLocal(LOCAL_KEYS.SECTIONS, sections.filter(s => s.id !== id));
  },

  // 20. CRUD for Users
  async updateUser(id: string, email: string, fullName: string, role: 'admin' | 'instructor' | 'student', phone?: string, status?: LMSUser['status'], passwordHash?: string, subscriptionPlanId?: string): Promise<void> {
    await checkLmsMode();
    const users = getLocal<LMSUser>(LOCAL_KEYS.USERS);
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index].email = email;
      users[index].full_name = fullName;
      users[index].role = role;
      users[index].phone = phone;
      if (status) users[index].status = status;
      if (passwordHash) {
        (users[index] as any).password_hash = passwordHash;
      }
      if (subscriptionPlanId !== undefined) {
        users[index].subscription_plan_id = subscriptionPlanId || undefined;
      }
      setLocal(LOCAL_KEYS.USERS, users);
    }
  },
  async deleteUser(id: string): Promise<void> {
    await checkLmsMode();
    const users = getLocal<LMSUser>(LOCAL_KEYS.USERS);
    setLocal(LOCAL_KEYS.USERS, users.filter(u => u.id !== id));
  },

  // 21. CRUD for Subscription Plans
  async getSubscriptionPlans(): Promise<LMSSubscriptionPlan[]> {
    await checkLmsMode();
    const plans = getLocal<LMSSubscriptionPlan>(LOCAL_KEYS.SUBSCRIPTION_PLANS);
    if (plans.length === 0) {
      const defaultPlans: LMSSubscriptionPlan[] = [
        { id: 'plan-silver', name: 'الباقة الفضية (شاملة)', price: 150, billing_cycle: 'شهري', features: ['الوصول لكافة المحاضرات والملفات', 'تسليم الواجبات وحل الاختبارات', 'شات ومراسلة مع الأساتذة'], created_at: new Date().toISOString() },
        { id: 'plan-gold', name: 'الباقة الذهبية (شاملة + دعم)', price: 299, billing_cycle: 'فصلي', features: ['الوصول لكافة المحاضرات والملفات', 'تسليم الواجبات وحل الاختبارات', 'شات ومراسلة مع الأساتذة', 'حضور المحاضرات المباشرة وتتبع التقدم'], created_at: new Date().toISOString() },
        { id: 'plan-diamond', name: 'الباقة الماسية (دعم خاص)', price: 499, billing_cycle: 'سنوي', features: ['الوصول لكافة المحاضرات والملفات', 'تسليم الواجبات وحل الاختبارات', 'شات ومراسلة مع الأساتذة', 'حضور المحاضرات المباشرة وتتبع التقدم', 'أولوية رصد طلبات الحصص والدروس الخاصة الموجهة'], created_at: new Date().toISOString() }
      ];
      setLocal(LOCAL_KEYS.SUBSCRIPTION_PLANS, defaultPlans);
      return defaultPlans;
    }
    return plans;
  },
  async createSubscriptionPlan(name: string, price: number, billingCycle: string, features: string[]): Promise<LMSSubscriptionPlan> {
    await checkLmsMode();
    const plans = getLocal<LMSSubscriptionPlan>(LOCAL_KEYS.SUBSCRIPTION_PLANS);
    const newPlan: LMSSubscriptionPlan = {
      id: `plan-${Math.random().toString(36).substring(2, 9)}`,
      name,
      price,
      billing_cycle: billingCycle,
      features,
      created_at: new Date().toISOString()
    };
    plans.push(newPlan);
    setLocal(LOCAL_KEYS.SUBSCRIPTION_PLANS, plans);
    return newPlan;
  },
  async updateSubscriptionPlan(id: string, name: string, price: number, billingCycle: string, features: string[]): Promise<void> {
    await checkLmsMode();
    const plans = getLocal<LMSSubscriptionPlan>(LOCAL_KEYS.SUBSCRIPTION_PLANS);
    const index = plans.findIndex(p => p.id === id);
    if (index !== -1) {
      plans[index].name = name;
      plans[index].price = price;
      plans[index].billing_cycle = billingCycle;
      plans[index].features = features;
      setLocal(LOCAL_KEYS.SUBSCRIPTION_PLANS, plans);
    }
  },
  async deleteSubscriptionPlan(id: string): Promise<void> {
    await checkLmsMode();
    const plans = getLocal<LMSSubscriptionPlan>(LOCAL_KEYS.SUBSCRIPTION_PLANS);
    setLocal(LOCAL_KEYS.SUBSCRIPTION_PLANS, plans.filter(p => p.id !== id));
  }
};
