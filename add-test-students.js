const fs = require('fs');
const path = require('path');

const LOCAL_KEYS = {
  DEPARTMENTS: 'attendance_departments',
  STUDENTS: 'attendance_students',
  SUBJECTS: 'attendance_subjects',
  WEEKDAYS: 'attendance_weekdays',
  TIME_SLOTS: 'attendance_time_slots',
  SCHEDULES: 'attendance_schedules',
  ATTENDANCE_LOGS: 'attendance_logs'
};

async function hashPassword(password) {
  const crypto = require('crypto');
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'attendance_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

async function addTestStudents() {
  console.log('📚 Adding test students...');
  
  // Initialize departments if not present
  let departments = JSON.parse(localStorage.getItem(LOCAL_KEYS.DEPARTMENTS) || '[]');
  if (departments.length === 0) {
    departments = [
      { department_id: 1, department_name: 'هندسة البرمجيات', degree_type: 'بكالوريوس' },
      { department_id: 2, department_name: 'علوم الحاسب', degree_type: 'بكالوريوس' },
      { department_id: 3, department_name: 'نظم المعلومات', degree_type: 'بكالوريوس' },
      { department_id: 4, department_name: 'عام', degree_type: 'بكالوريوس' }
    ];
    localStorage.setItem(LOCAL_KEYS.DEPARTMENTS, JSON.stringify(departments));
  }
  
  // Get current students
  let students = JSON.parse(localStorage.getItem(LOCAL_KEYS.STUDENTS) || '[]');
  console.log('Current students count:', students.length);
  
  // Find next student ID
  let nextId = students.length > 0 ? Math.max(...students.map(s => s.student_id)) + 1 : 1;
  
  // Student 1
  const student1Password = 'Student123';
  const student1 = {
    student_id: nextId++,
    full_name: 'أحمد محمد علي',
    phone: '0501234567',
    academic_id: '26204116',
    national_id: '123456789',
    password: student1Password,
    password_hash: await hashPassword(student1Password),
    role: 'student',
    department_id: 1
  };
  
  // Student 2
  const student2Password = 'Student456';
  const student2 = {
    student_id: nextId++,
    full_name: 'فاطمة أحمد سعيد',
    phone: '0507654321',
    academic_id: '26204117',
    national_id: '987654321',
    password: student2Password,
    password_hash: await hashPassword(student2Password),
    role: 'student',
    department_id: 2
  };
  
  // Add admin if not exists
  const adminExists = students.some(s => s.national_id === '715580715');
  if (!adminExists) {
    const adminPassword = 'Abdullah772091';
    const admin = {
      student_id: nextId++,
      full_name: 'أدمن النظام',
      phone: null,
      academic_id: 'ADMIN001',
      national_id: '715580715',
      password: adminPassword,
      password_hash: await hashPassword(adminPassword),
      role: 'admin',
      department_id: 1
    };
    students.push(admin);
  }
  
  // Add the two test students
  students.push(student1);
  students.push(student2);
  
  // Save to localStorage
  localStorage.setItem(LOCAL_KEYS.STUDENTS, JSON.stringify(students));
  
  console.log('\n✅ Test students added successfully!\n');
  console.log('📋 Student 1:');
  console.log('   - الاسم:', student1.full_name);
  console.log('   - رقم الهوية:', student1.national_id);
  console.log('   - كلمة المرور:', student1Password);
  console.log('   - الرقم الأكاديمي:', student1.academic_id);
  console.log('\n📋 Student 2:');
  console.log('   - الاسم:', student2.full_name);
  console.log('   - رقم الهوية:', student2.national_id);
  console.log('   - كلمة المرور:', student2Password);
  console.log('   - الرقم الأكاديمي:', student2.academic_id);
  console.log('\n📋 Admin (if added):');
  console.log('   - رقم الهوية: 715580715');
  console.log('   - كلمة المرور: Abdullah772091');
  console.log('\n✅ Done!');
}

// Since we can't use localStorage directly in Node.js, let's simulate it
const localStorage = {
  data: {},
  getItem: (key) => localStorage.data[key] || null,
  setItem: (key, value) => localStorage.data[key] = value,
  removeItem: (key) => delete localStorage.data[key],
  clear: () => localStorage.data = {}
};

// Also, let's create a mock for TextEncoder and crypto
class TextEncoder {
  encode(str) {
    return Buffer.from(str, 'utf8');
  }
}

const crypto = {
  subtle: {
    async digest(algorithm, data) {
      const hash = require('crypto').createHash('sha256');
      hash.update(data);
      return hash.digest();
    }
  }
};

// Add to global
global.TextEncoder = TextEncoder;
global.crypto = crypto;

addTestStudents();
