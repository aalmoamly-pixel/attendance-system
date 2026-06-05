export type UserRole = 'admin' | 'student';

export interface Department {
  department_id: number;
  department_name: string;
  degree_type: string | null;
}

export interface Student {
  student_id: number;
  full_name: string;
  phone: string | null;
  academic_id: string;
  national_id: string;
  password_hash: string;
  password: string;
  role: UserRole;
  department_id: number | null;
  departments?: Department;
  personal_note?: string;
  subscription_amount: number;
  due_date: string | null;
  subscription_status: string;
  financial_notes: string | null;
}

export interface Notification {
  notification_id: number;
  student_id: number;
  sender_id: number;
  sender_role: UserRole;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface PersonalNote {
  note_id: number;
  student_id: number;
  note: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  subject_id: number;
  subject_name: string;
  department_id: number | null;
  departments?: Department;
}

export interface Weekday {
  weekday_id: number;
  weekday_name_ar: string;
  weekday_name_en: string;
}

export interface TimeSlot {
  slot_id: number;
  slot_name: string;
  start_time: string;
  end_time: string;
}

export interface StudentSchedule {
  schedule_id: number;
  student_id: number;
  subject_id: number;
  weekday_id: number;
  slot_id: number;
  students?: Student;
  subjects?: Subject;
  weekdays?: Weekday;
  time_slots?: TimeSlot;
}

export type AttendanceStatus = 'حاضر' | 'غائب' | 'متأخر' | 'مستأذن';

export interface AttendanceLog {
  log_id: number;
  schedule_id: number;
  attendance_date: string;
  status: AttendanceStatus;
  check_in_time: string | null;
  notes: string | null;
  student_schedule?: StudentSchedule;
}

export interface DashboardStats {
  totalStudents: number;
  totalSubjects: number;
  totalSchedules: number;
  averageAttendance: number;
  absencesCount: number;
  warningsCount: number;
  lowAttendanceCount: number;
}

export interface LoginCredentials {
  national_id: string;
  password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: Student | null;
  role: UserRole | null;
}

// ------------------------------ Payment Types ------------------------------

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'unpaid';

export type PaymentMethod = 
  | 'bank_transfer' 
  | 'ria' 
  | 'binance_usdt' 
  | 'urpay'
  | 'visa' 
  | 'mastercard' 
  | 'apple_pay' 
  | 'google_pay' 
  | 'paypal';

export interface Payment {
  id: number;
  student_id: number;
  invoice_number: string;
  amount: number;
  payment_method: PaymentMethod | null;
  transaction_id: string | null;
  receipt_image: string | null;
  notes: string | null;
  admin_notes: string | null;
  status: PaymentStatus;
  created_at: string;
  approved_at: string | null;
  approved_by: number | null;
  subscription_start: string | null;
  subscription_end: string | null;
  students?: Student;
}

export interface PaymentSettings {
  subscription_amount: number;
  subscription_duration_days: number;
  enabled_payment_methods: PaymentMethod[];
  bank_transfer_details: string;
  ria_details: string;
  binance_wallet: string;
  urpay_number: string;
  urpay_account_name: string;
  urpay_qr_image: string | null;
  payment_instructions: string;
  [key: string]: any;
}

// ------------------------------ CMS Types ------------------------------

export interface CMSFeature {
  id: number;
  icon?: string;
  title: string;
  description: string;
}

export interface CMSService {
  id: number;
  icon: string;
  title: string;
  description: string;
}

export interface CMSPricingPlan {
  id: number;
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
}

export interface CMSHomepage {
  hero_title: string;
  hero_subtitle: string;
  hero_subtitle_2: string;
  hero_button_primary: string;
  hero_button_primary_link: string;
  hero_button_secondary: string;
  hero_button_secondary_link: string;
  hero_image?: string;
  hero_quick_features: string[];
  stats: {
    number: string;
    label: string;
  }[];
}

export interface CMSAboutPage {
  page_title: string;
  about_description: string;
  goals: string[];
  features: CMSFeature[];
}

export interface CMSServicesPage {
  page_title: string;
  page_subtitle: string;
  services: CMSService[];
}

export interface CMSPricingPage {
  page_title: string;
  page_subtitle: string;
  plans: CMSPricingPlan[];
}

export interface CMSContactPage {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  social_links: {
    platform: string;
    url: string;
  }[];
}

export interface CMSFooter {
  quick_links: {
    label: string;
    url: string;
  }[];
  terms_url: string;
  privacy_url: string;
  copyright_text: string;
}

export interface CMSGeneralSettings {
  site_name: string;
  site_logo?: string;
  site_description: string;
  copyright_text: string;
}

// ------------------------------ Payment Partners Page Types ------------------------------

export interface CMSPartnerPage {
  isActive: boolean;
  pageTitle: string;
  pageSubtitle: string;
  aboutUs: string;
  // Stats
  totalStudents: string;
  activeUsers: string;
  avgMonthlyTransactions: string;
  // Payment Methods
  currentPaymentMethods: string[];
  // Features
  platformFeatures: {
    id: number;
    title: string;
    description: string;
  }[];
  // Real-time Dashboard Stats (for the page)
  dashboardStats: {
    studentsCount: string;
    paymentsCount: string;
    totalRevenue: string;
    pendingCount: string;
    paymentRate: string;
  };
  // Screenshots Gallery
  screenshots: {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
  }[];
  // Integration Ready Section
  integrationReadyTitle: string;
  integrationReadyDescription: string;
  integrationMethods: {
    id: number;
    name: string;
  }[];
  // Security Info
  securityTitle: string;
  securityDescription: string;
  securityFeatures: string[];
}

export interface CMSData {
  general: CMSGeneralSettings;
  homepage: CMSHomepage;
  about: CMSAboutPage;
  services: CMSServicesPage;
  pricing: CMSPricingPage;
  contact: CMSContactPage;
  footer: CMSFooter;
  partners: CMSPartnerPage;
}
