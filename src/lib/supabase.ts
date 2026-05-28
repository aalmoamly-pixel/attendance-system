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
  PersonalNote
} from '../types/database';
import { hashPassword } from './auth';

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
  PERSONAL_NOTES: 'attendance_personal_notes'
};

const initializeLocalData = async () => {
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
      const { data, error } = await supabase.from('departments').insert(depts).select('*');
      if (error) {
        console.error('[Departments] Import error:', error);
        throw error;
      }
      (data || []).forEach(d => mapping.set(d.department_name, d.department_id));
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
      const existingNationalIds = new Set(existingStudents.map(s => s.national_id));
      
      const studentsToInsert = [];
      for (const stu of students) {
        if (!existingNationalIds.has(stu.national_id)) {
          studentsToInsert.push({
            full_name: stu.full_name,
            phone: stu.phone,
            academic_id: stu.academic_id,
            national_id: stu.national_id,
            password: stu.password,
            password_hash: await hashPassword(stu.password),
            role: 'student' as const,
            department_id: stu.department_id
          });
          existingNationalIds.add(stu.national_id);
        }
      }
      
      if (studentsToInsert.length > 0) {
        const { data, error } = await supabase.from('students').insert(studentsToInsert).select('*');
        if (error) {
          console.error('[Students] Import error:', error);
          throw error;
        }
        (data || []).forEach(s => mapping.set(s.academic_id, s.student_id));
      }
    } else {
      const existing = JSON.parse(localStorage.getItem(LOCAL_KEYS.STUDENTS) || '[]');
      let nextId = existing.length > 0 ? Math.max(...existing.map((s: any) => s.student_id)) + 1 : 1;
      
      for (const stu of students) {
        const found = existing.find((s: any) => s.national_id === stu.national_id);
        if (found) {
          mapping.set(stu.academic_id, found.student_id);
        } else {
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
          mapping.set(stu.academic_id, newStu.student_id);
        }
      }
      localStorage.setItem(LOCAL_KEYS.STUDENTS, JSON.stringify(existing));
    }
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
      const { data, error } = await supabase.from('subjects').insert(subjects).select('*');
      if (error) {
        console.error('[Subjects] Import error:', error);
        throw error;
      }
      (data || []).forEach(s => mapping.set(s.subject_name, s.subject_id));
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
    if (supabase) {
      const { error } = await supabase.from('student_schedule').insert(schedules);
      if (error) {
        console.error('[Schedules] Import error:', error);
        throw error;
      }
    } else {
      const existing = JSON.parse(localStorage.getItem(LOCAL_KEYS.SCHEDULES) || '[]');
      let nextId = existing.length > 0 ? Math.max(...existing.map((s: any) => s.schedule_id)) + 1 : 1;
      schedules.forEach(sch => {
        existing.push({ ...sch, schedule_id: nextId++ });
      });
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
    const [allLogs, allSchedules, allSubjects, allTimeSlots] = await Promise.all([
      this.getAttendance(),
      this.getSchedules(),
      this.getSubjects(),
      this.getTimeSlots()
    ]);

    const studentSchedules = allSchedules.filter(s => s.student_id === student_id);
    const subjectMap = new Map<number, { totalCompleted: number; attended: number; name: string }>();
    
    // Initialize subjects
    studentSchedules.forEach(schedule => {
      const subject = allSubjects.find(sub => sub.subject_id === schedule.subject_id);
      if (subject) {
        if (!subjectMap.has(subject.subject_id)) {
          subjectMap.set(subject.subject_id, { totalCompleted: 0, attended: 0, name: subject.subject_name });
        }
      }
    });

    // Process each schedule to count completed sessions and check attendance
    for (const schedule of studentSchedules) {
      const subject = allSubjects.find(sub => sub.subject_id === schedule.subject_id);
      if (!subject) continue;
      
      const timeSlot = allTimeSlots.find(t => t.slot_id === schedule.slot_id);
      if (!timeSlot) continue;

      // Check if this lecture has ended
      const hasEnded = this.isLectureEnded(schedule.weekday_id, timeSlot.start_time, timeSlot.end_time);
      if (!hasEnded) continue;

      const data = subjectMap.get(subject.subject_id)!;
      data.totalCompleted++;

      // Check if there's an existing log for this lecture
      const attendanceDate = this.getLectureAttendanceDate(schedule.weekday_id);
      const existingLog = allLogs.find(log => 
        log.schedule_id === schedule.schedule_id && 
        log.attendance_date === attendanceDate
      );

      if (existingLog) {
        if (existingLog.status === 'حاضر' || existingLog.status === 'متأخر') {
          data.attended++;
        }
      }
      // If no log exists, it's an automatic absence, so we don't increment attended
    }

    const bySubject = Array.from(subjectMap.entries()).map(([subject_id, data]) => {
      let rate = 100;
      if (data.totalCompleted > 0) {
        rate = Math.round((data.attended / data.totalCompleted) * 100);
      }
      return {
        subject_id,
        subject_name: data.name,
        totalSessions: data.totalCompleted,
        attended: data.attended,
        rate: Math.min(rate, 100)
      };
    });

    // Calculate overall rate
    const totalAttendedAll = bySubject.reduce((sum, s) => sum + s.attended, 0);
    const totalCompletedAll = bySubject.reduce((sum, s) => sum + s.totalSessions, 0);
    let overallRate = 100;
    if (totalCompletedAll > 0) {
      overallRate = Math.round((totalAttendedAll / totalCompletedAll) * 100);
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
  }
};

export async function migrateLocalToSupabase() {
  if (!supabase) {
    return { success: false, message: 'لم يتم تكوين Supabase، يرجى إعداد متغيرات البيئة VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY' };
  }

  try {
    const departments = JSON.parse(localStorage.getItem(LOCAL_KEYS.DEPARTMENTS) || '[]');
    const students = JSON.parse(localStorage.getItem(LOCAL_KEYS.STUDENTS) || '[]');
    const subjects = JSON.parse(localStorage.getItem(LOCAL_KEYS.SUBJECTS) || '[]');
    const schedules = JSON.parse(localStorage.getItem(LOCAL_KEYS.SCHEDULES) || '[]');
    const attendanceLogs = JSON.parse(localStorage.getItem(LOCAL_KEYS.ATTENDANCE_LOGS) || '[]');

    if (departments.length > 0) {
      const { error } = await supabase.from('departments').upsert(departments);
      if (error) throw error;
    }
    if (students.length > 0) {
      const { error } = await supabase.from('students').upsert(students);
      if (error) throw error;
    }
    if (subjects.length > 0) {
      const { error } = await supabase.from('subjects').upsert(subjects);
      if (error) throw error;
    }
    if (schedules.length > 0) {
      const { error } = await supabase.from('student_schedule').upsert(schedules);
      if (error) throw error;
    }
    if (attendanceLogs.length > 0) {
      const { error } = await supabase.from('attendance_log').upsert(attendanceLogs);
      if (error) throw error;
    }

    return {
      success: true,
      message: `✅ تم استيراد البيانات بنجاح: ${departments.length} تخصص، ${students.length} طالب، ${subjects.length} مادة، ${schedules.length} جدول، ${attendanceLogs.length} سجل حضور`
    };
  } catch (err: any) {
    console.error('[Migration] Error:', err);
    return {
      success: false,
      message: `❌ حدث خطأ أثناء الاستيراد: ${err.message}`
    };
  }
}
