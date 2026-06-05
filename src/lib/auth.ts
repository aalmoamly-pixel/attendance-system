import { db } from './supabase';
import { hashPassword, verifyPassword } from './crypto';
import type { AuthState, LoginCredentials } from '../types/database';

const AUTH_KEY = 'attendance_auth';

export { hashPassword, verifyPassword };

export const getAuthState = (): AuthState => {
  const stored = localStorage.getItem(AUTH_KEY);
  if (!stored) {
    return {
      isAuthenticated: false,
      user: null,
      role: null
    };
  }
  try {
    return JSON.parse(stored);
  } catch {
    return {
      isAuthenticated: false,
      user: null,
      role: null
    };
  }
};

export const setAuthState = (state: AuthState) => {
  localStorage.setItem(AUTH_KEY, JSON.stringify(state));
};

export const clearAuthState = () => {
  localStorage.clear();
  sessionStorage.clear();
};

export const login = async (credentials: LoginCredentials): Promise<AuthState> => {
  console.log('[login] 🔐 Attempting login with:');
  console.log('[login] - national_id:', credentials.national_id);
  console.log('[login] - password:', credentials.password);
  
  const students = await db.getStudents();
  console.log('[login] 📚 All students in DB (count:', students.length, '):', students);
  
  // Log each student's national_id for debugging
  console.log('[login] 🔍 Student national_ids in DB:');
  students.forEach((s, i) => {
    console.log(`[login]   Student ${i + 1}: id=${s.student_id}, name="${s.full_name}", national_id="${s.national_id}", password="${s.password}"`);
  });
  
  const user = students.find(s => String(s.national_id).trim() === String(credentials.national_id).trim());
  console.log('[login] ✅ Found user:', user);
  
  if (!user) {
    console.error('[login] ❌ No user found with national_id:', credentials.national_id);
    throw new Error('رقم الهوية غير صحيح');
  }
  
  console.log('[login] 🔑 Verifying password...');
  console.log('[login] - Input password:', credentials.password);
  console.log('[login] - User password (plain):', user.password);
  console.log('[login] - User password_hash:', user.password_hash);
  
  const isValid = credentials.password === user.password;
  console.log('[login] 🔐 Password valid:', isValid);
  
  if (!isValid) {
    console.error('[login] ❌ Invalid password for user:', user.national_id);
    throw new Error('كلمة المرور غير صحيحة');
  }
  
  const authState: AuthState = {
    isAuthenticated: true,
    user,
    role: user.role
  };
  
  setAuthState(authState);
  console.log('[login] ✅ Auth state set:', authState);
  return authState;
};

export const logout = () => {
  clearAuthState();
};

const DEMO_KEY = 'demo_mode';

export const isDemoMode = (): boolean => {
  return localStorage.getItem(DEMO_KEY) === 'true';
};

export const setDemoMode = (enabled: boolean) => {
  if (enabled) {
    localStorage.setItem(DEMO_KEY, 'true');
  } else {
    localStorage.removeItem(DEMO_KEY);
  }
};

export const loginDemo = async (): Promise<AuthState> => {
  // Clear any old authentication data first!
  clearAuthState();

  // Re-initialize default data (departments, students, CMS, etc.)!
  const { initializeLocalData } = await import('./supabase');
  await initializeLocalData();
  
  const demoUser = {
    student_id: 999,
    full_name: 'محمد أحمد',
    phone: '0501234567',
    academic_id: 'STD001',
    national_id: '123456789',
    password: 'demo123',
    password_hash: await hashPassword('demo123'),
    role: 'student' as const,
    department_id: 1,
    personal_note: undefined,
    subscription_amount: 500,
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    subscription_status: 'active',
    financial_notes: null
  };

  const authState: AuthState = {
    isAuthenticated: true,
    user: demoUser,
    role: 'student'
  };

  setAuthState(authState);
  setDemoMode(true);
  return authState;
};

export const initializeDefaultAdmin = async () => {
  const students = await db.getStudents();
  const adminExists = students.some(s => s.role === 'admin' && s.national_id === '715580715');
  const existingAdmin = students.find(s => s.role === 'admin' && s.national_id === '715580715');
  
  if (existingAdmin && existingAdmin.password !== 'Abdullah772091') {
    try {
      await db.updateStudent(existingAdmin.student_id, {
        password: 'Abdullah772091'
      });
      console.log('[Auth] Admin password updated to Abdullah772091');
    } catch (err) {
      console.log('[Auth] Error updating admin password:', err);
    }
  } else if (!adminExists) {
    const adminPassword = await hashPassword('Abdullah772091');
    try {
      await db.createStudent({
        full_name: 'أدمن النظام',
        phone: null,
        academic_id: 'ADMIN001',
        national_id: '715580715',
        password: 'Abdullah772091',
        password_hash: adminPassword,
        role: 'admin',
        department_id: 1,
        subscription_amount: 0,
        due_date: null,
        subscription_status: 'active',
        financial_notes: null
      });
      console.log('[Auth] Default admin created successfully with password Abdullah772091');
    } catch (err) {
      console.log('[Auth] Admin may already exist, continuing...');
    }
  }
  
  console.log('[Auth] Admin credentials confirmed:');
  console.log('[Auth] - National ID: 715580715');
  console.log('[Auth] - Password: Abdullah772091');
};
