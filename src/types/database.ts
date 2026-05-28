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
