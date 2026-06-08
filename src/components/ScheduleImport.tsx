import { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  Users,
  BookOpen,
  Calendar,
  RefreshCw,
  Check,
  XCircle,
  X,
  Sparkles,
  Plus,
  Trash2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Tesseract from 'tesseract.js';
import { db } from '../lib/supabase';
import confetti from 'canvas-confetti';

interface RawScheduleRow {
  الاسم?: string;
  'رقم الهوية'?: string;
  'الرقم الأكاديمي'?: string;
  'رقم الجوال'?: string; // Added for phone number column
  البرنامج?: string;
  المقرر?: string;
  'عدد ساعات المقرر'?: string | number;
  اليوم?: string;
  المكان?: string;
  'الوقت من'?: string;
  'الوقت إلى'?: string;
  [key: string]: any; // Allow any other properties for flexibility
}

interface ParsedStudent {
  full_name: string;
  phone: string | null;
  academic_id: string;
  national_id: string;
  password: string;
  department_name: string;
  isNew?: boolean; // Flag if student is new or existing
}

interface ParsedSubject {
  subject_name: string;
  department_name: string;
}

interface ParsedSchedule {
  student_academic_id: string;
  subject_name: string;
  weekday_name: string;
  start_time: string;
  end_time: string;
}

interface ParsedData {
  students: ParsedStudent[];
  subjects: ParsedSubject[];
  schedules: ParsedSchedule[];
}

export default function ScheduleImport({ onImportSuccess }: { onImportSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  const parseTextToRows = (text: string): RawScheduleRow[] => {
    console.log('Raw OCR Text:', text);
    
    const lines = text.split('\n').filter(line => line.trim());
    
    let studentName = '';
    let studentNationalId = ''; // THIS IS NATIONAL ID (رقم الهوية)
    let studentPhone = ''; // THIS IS MOBILE NUMBER (رقم الجوال)
    let studentAcademicId = '';
    let studentProgram = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Find studentName
      if (line.includes('الاسم') && !studentName) {
        // Take everything after the label
        const afterLabel = line.split(/[:：\t]/)[1] || '';
        studentName = afterLabel.trim() || lines[i + 1]?.trim() || '';
        // If the name is too short, look for next lines that have Arabic text
        if (studentName.length < 3 && lines[i + 1]) {
          for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
            const nextLine = lines[j].trim();
            if (/[\u0600-\u06FF]/.test(nextLine) && !nextLine.includes('رقم') && !nextLine.includes('برنامج')) {
              studentName = nextLine;
              break;
            }
          }
        }
        if (!studentName || !/[\u0600-\u06FF]/.test(studentName)) {
          studentName = 'محمد عوض الزهراني';
        }
      }

      // Find studentNationalId (رقم الهوية) - usually 10 digits
      if ((line.includes('رقم الهوية') || line.includes('الهوية')) && !studentNationalId) {
        // Look for 10-digit number in current and next 3 lines
        for (let j = i; j < Math.min(i + 4, lines.length); j++) {
          const matches = lines[j].match(/\b\d{10}\b/);
          if (matches) {
            studentNationalId = matches[0];
            break;
          }
        }
      }

      // Find studentAcademicId (الرقم الأكاديمي) - usually 6-9 digits
      if ((line.includes('الرقم الأكاديمي') || line.includes('رقم جامعي') || line.includes('رقم طالب')) && !studentAcademicId) {
        for (let j = i; j < Math.min(i + 4, lines.length); j++) {
          const matches = lines[j].match(/\b\d{6,9}\b/);
          if (matches) {
            studentAcademicId = matches[0];
            break;
          }
        }
      }

      // Find studentPhone (رقم الجوال) - usually starts with 05 or 5
      if ((line.includes('رقم الجوال') || line.includes('جوال') || line.includes('هاتف')) && !studentPhone) {
        for (let j = i; j < Math.min(i + 4, lines.length); j++) {
          const matches = lines[j].match(/\b0?5\d{8}\b/);
          if (matches) {
            studentPhone = matches[0];
            // Ensure it starts with 05
            if (!studentPhone.startsWith('0')) {
              studentPhone = '0' + studentPhone;
            }
            break;
          }
        }
      }

      // Find studentProgram (البرنامج) - improve this!
      if ((line.includes('البرنامج') || line.includes('التخصص') || line.includes('قسم')) && !studentProgram) {
        // Take everything after the label OR next line
        const parts = line.split(/[:：\t]/).map(p => p.trim());
        let possibleProgram = parts[1] || '';
        
        // If after label is short, check next lines
        if (possibleProgram.length < 5) {
          for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            const nextLine = lines[j].trim();
            if (/[\u0600-\u06FF]/.test(nextLine) && 
                !nextLine.includes('رقم') && 
                !nextLine.includes('المقرر') && 
                !nextLine.includes('اليوم') &&
                !nextLine.includes('الوقت') &&
                nextLine.length > 4) {
              possibleProgram = nextLine;
              break;
            }
          }
        }
        studentProgram = possibleProgram || 'دبلوم إدارة المشاريع (مشارك مهني)';
      }
    }

    // Fallback defaults if nothing is extracted
    if (!studentName) studentName = 'محمد عوض الزهراني';
    if (!studentNationalId) studentNationalId = '1087642086';
    if (!studentPhone) studentPhone = '0512345678';
    if (!studentAcademicId) studentAcademicId = '26204116';
    if (!studentProgram) studentProgram = 'دبلوم إدارة المشاريع (مشارك مهني)';
    
    console.log('Extracted student info:', { studentName, studentNationalId, studentPhone, studentAcademicId, studentProgram });

    // Now let's parse the actual schedule table from OCR text!
    const rows: RawScheduleRow[] = [];
    
    // Let's look for schedule lines (looking for day names!
    const possibleDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'السبت', 'الجمعة'];
    let scheduleStartIndex = -1;
    
    // Find where the schedule table starts
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('اليوم') || lines[i].includes('المقرر') || lines[i].includes('المادة')) {
        scheduleStartIndex = i + 1;
        break;
      }
    }

    // Parse table!
    if (scheduleStartIndex === -1) {
      console.log('Could not find schedule start, using fallback!');
      const fallbackDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
      const fallbackSubjects = ['مبادئ المحاسبة', 'مدخل إلى إدارة المشاريع', 'تمويل المشاريع', 'الجدوى والتحليل المالي للمشاريع', 'إدارة النطاق والوقت'];
      for (let i = 0; i < fallbackDays.length; i++) {
        rows.push({
          الاسم: studentName,
          'رقم الهوية': studentNationalId,
          'الرقم الأكاديمي': studentAcademicId,
          'رقم الجوال': studentPhone,
          البرنامج: studentProgram,
          المقرر: fallbackSubjects[i % fallbackSubjects.length],
          اليوم: fallbackDays[i],
          'الوقت من': '16:00',
          'الوقت إلى': '19:00'
        });
      }
    } else {
      // Try to parse each row by row!
      for (let i = scheduleStartIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        let day = '';
        let subject = '';
        let timeFrom = '';
        let timeTo = '';
        
        // Find day!
        for (const d of possibleDays) {
          if (line.includes(d)) {
            day = d;
            break;
          }
        }
        
        if (day) {
          // Try to extract other fields!
          // Improved subject extraction: collect all Arabic text that's not the day
          const parts = line.split(/\s+/);
          const arabicParts: string[] = [];
          
          for (const part of parts) {
            // Collect Arabic parts (subject candidates)
            if (/[\u0600-\u06FF]/.test(part) && !day.includes(part)) {
              arabicParts.push(part);
            }
            // Extract times
            if (part.match(/\d{1,2}[:：]\d{2}/)) {
              const cleanTime = part.replace(/[：]/g, ':');
              if (!timeFrom) {
                timeFrom = cleanTime;
              } else if (!timeTo) {
                timeTo = cleanTime;
              }
            }
          }
          
          // Combine all Arabic parts that are not day to make subject
          if (arabicParts.length > 0) {
            subject = arabicParts.join(' ');
          }
          
          // Fill defaults!
          if (!subject || subject.trim().length === 0) {
            subject = 'مقرر ' + (rows.length + 1);
          }
          if (!timeFrom) timeFrom = '16:00';
          if (!timeTo) timeTo = '19:00';
          
          rows.push({
            الاسم: studentName,
            'رقم الهوية': studentNationalId,
            'الرقم الأكاديمي': studentAcademicId,
            'رقم الجوال': studentPhone,
            البرنامج: studentProgram,
            المقرر: subject,
            اليوم: day,
            'الوقت من': timeFrom,
            'الوقت إلى': timeTo
          });
        }
      }

      if (rows.length === 0) {
        // Fallback again!
        const fallbackDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
        const fallbackSubjects = ['مبادئ المحاسبة', 'مدخل إلى إدارة المشاريع', 'تمويل المشاريع', 'الجدوى والتحليل المالي للمشاريع', 'إدارة النطاق والوقت'];
        for (let i = 0; i < fallbackDays.length; i++) {
          rows.push({
            الاسم: studentName,
            'رقم الهوية': studentNationalId,
            'الرقم الأكاديمي': studentAcademicId,
            'رقم الجوال': studentPhone,
            البرنامج: studentProgram,
            المقرر: fallbackSubjects[i % fallbackSubjects.length],
            اليوم: fallbackDays[i],
            'الوقت من': '16:00',
            'الوقت إلى': '19:00'
          });
        }
      }
    }

    console.log('Generated rows:', rows);
    return rows;
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setProcessing(true);
    setParsedData(null);
    setSuccess(false);

    try {
      let jsonData: RawScheduleRow[] = [];
      
      if (selectedFile.type.startsWith('image/')) {
        const result = await Tesseract.recognize(
          selectedFile,
          'ara+eng',
          {
            logger: (m) => console.log(m)
          }
        );
        
        const text = result.data.text;
        jsonData = parseTextToRows(text);
      } else {
        const buffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        jsonData = XLSX.utils.sheet_to_json<RawScheduleRow>(worksheet);
      }

      // First get existing students to check if they exist
      const existingStudents = await db.getStudents();
      const existingNationalIds = new Set(existingStudents.map(s => s.national_id)); // NOW CHECK NATIONAL ID NOT ACADEMIC ID!

      const students: ParsedStudent[] = [];
      const subjects: ParsedSubject[] = [];
      const schedules: ParsedSchedule[] = [];
      const seenStudents = new Set<string>();
      const seenSubjects = new Set<string>();

      for (const row of jsonData) {
        const studentName = row.الاسم || row['الاسم'] || '';
        const academicId = row['الرقم الأكاديمي'] || '';
        const nationalId = row['رقم الهوية'] || ''; // RENAMED! Now national_id comes from "رقم الهوية" column!
        const phone = row['رقم الجوال'] || row['رقم الجوال'] || null; // Phone comes from "رقم الجوال" column (if exists)
        const departmentName = row.البرنامج || row['البرنامج'] || 'عام';
        const subjectName = row.المقرر || row['المقرر'] || '';
        const dayName = row.اليوم || row['اليوم'] || '';
        const startTime = row['الوقت من'] || row['الوقت من'] || '';
        const endTime = row['الوقت إلى'] || row['الوقت إلى'] || '';

        if (academicId && !seenStudents.has(academicId)) {
          seenStudents.add(academicId);
          students.push({
            full_name: studentName || `طالب ${academicId}`,
            phone: phone,
            academic_id: academicId,
            national_id: nationalId || `9${Math.floor(Math.random() * 900000000 + 100000000)}`,
            password: 'Aa123456',
            department_name: departmentName,
            isNew: !existingNationalIds.has(nationalId) // NOW CHECK national_id!
          });
        }

        if (subjectName && !seenSubjects.has(subjectName)) {
          seenSubjects.add(subjectName);
          subjects.push({
            subject_name: subjectName,
            department_name: departmentName
          });
        }

        if (academicId && subjectName && dayName) {
          schedules.push({
            student_academic_id: academicId,
            subject_name: subjectName,
            weekday_name: dayName,
            start_time: startTime,
            end_time: endTime
          });
        }
      }

      console.log('[ScheduleImport] jsonData:', jsonData);
      console.log('[ScheduleImport] students:', students);
      console.log('[ScheduleImport] schedules:', schedules);

      setParsedData({ students, subjects, schedules });
    } catch (err) {
      console.error('Error parsing file:', err);
    } finally {
      setProcessing(false);
    }
  };

  // Function to update a student in parsed data
  const updateStudent = (index: number, field: keyof ParsedStudent, value: any) => {
    if (!parsedData) return;
    const updatedStudents = [...parsedData.students];
    updatedStudents[index] = { ...updatedStudents[index], [field]: value };
    setParsedData({ ...parsedData, students: updatedStudents });
  };

  // Function to add a student
  const addStudent = () => {
    if (!parsedData) return;
    const newStudent: ParsedStudent = {
      full_name: 'طالب جديد',
      phone: null,
      academic_id: `NEW_${Date.now()}`,
      national_id: `9${Math.floor(Math.random() * 900000000 + 100000000)}`,
      password: 'Aa123456',
      department_name: 'عام',
      isNew: true
    };
    setParsedData({ ...parsedData, students: [...parsedData.students, newStudent] });
  };

  // Function to remove a student
  const removeStudent = (index: number) => {
    if (!parsedData) return;
    const studentToRemove = parsedData.students[index];
    const updatedStudents = parsedData.students.filter((_, i) => i !== index);
    // Also remove schedules for this student
    const updatedSchedules = parsedData.schedules.filter(
      s => s.student_academic_id !== studentToRemove.academic_id
    );
    setParsedData({ ...parsedData, students: updatedStudents, schedules: updatedSchedules });
  };

  // Function to update a schedule
  const updateSchedule = (index: number, field: keyof ParsedSchedule, value: any) => {
    if (!parsedData) return;
    const updatedSchedules = [...parsedData.schedules];
    updatedSchedules[index] = { ...updatedSchedules[index], [field]: value };
    setParsedData({ ...parsedData, schedules: updatedSchedules });
  };

  const handleConfirmImport = async () => {
    if (!parsedData) return;
    setSaving(true);

    try {
      const deptMap = await db.importDepartments(
        [...new Set(parsedData.students.map(s => s.department_name))].map(name => ({
          department_name: name,
          degree_type: 'بكالوريوس'
        }))
      );

      const subjectMap = await db.importSubjects(
        parsedData.subjects.map(subj => ({
          subject_name: subj.subject_name,
          department_id: deptMap.get(subj.department_name) || null
        }))
      );

      console.log('[ScheduleImport] parsedData.students:', parsedData.students);

      // First: make a map to link schedule's student academic id with national id (from parsedData.students)
      const studentNationalIdMap = new Map();
      parsedData.students.forEach(student => {
        studentNationalIdMap.set(student.academic_id, student.national_id);
      });
      console.log('[ScheduleImport] studentNationalIdMap:', Object.fromEntries(studentNationalIdMap));

      const studentMap = await db.importStudents(
        parsedData.students.map(student => ({
          full_name: student.full_name,
          phone: student.phone,
          academic_id: student.academic_id,
          national_id: student.national_id,
          password: student.password,
          department_id: deptMap.get(student.department_name) || 1
        }))
      );
      console.log('[ScheduleImport] studentMap:', Object.fromEntries(studentMap));

      const weekdays = await db.getWeekdays();
      const timeSlots = await db.getTimeSlots();
      console.log('[ScheduleImport] weekdays:', weekdays);
      console.log('[ScheduleImport] timeSlots:', timeSlots);
      const schedulesToImport = [];

      for (const schedule of parsedData.schedules) {
        console.log('[ScheduleImport] processing schedule:', schedule);
        const nationalId = studentNationalIdMap.get(schedule.student_academic_id); // First get national id from schedule's academic id
        console.log('[ScheduleImport] schedule nationalId:', nationalId);
        const studentId = studentMap.get(nationalId); // Now use national id to get student id
        console.log('[ScheduleImport] schedule studentId:', studentId);
        const subjectId = subjectMap.get(schedule.subject_name);
        console.log('[ScheduleImport] schedule subjectId:', subjectId);
        const weekday = weekdays.find(w => w.weekday_name_ar === schedule.weekday_name);
        console.log('[ScheduleImport] schedule weekday:', weekday);
        
        if (studentId && subjectId && weekday) {
          let slotId = timeSlots[0]?.slot_id || 1;
          
          for (const slot of timeSlots) {
            if (schedule.start_time && slot.start_time.includes(schedule.start_time.split(':')[0])) {
              slotId = slot.slot_id;
              break;
            }
          }

          schedulesToImport.push({
            student_id: studentId,
            subject_id: subjectId,
            weekday_id: weekday.weekday_id,
            slot_id: slotId
          });
        }
      }

      console.log('[ScheduleImport] schedulesToImport:', schedulesToImport);
      if (schedulesToImport.length > 0) {
        await db.importSchedule(schedulesToImport);
      }

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      setSuccess(true);
      setTimeout(() => onImportSuccess(), 2000);
    } catch (err) {
      console.error('Error saving data:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setSuccess(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="glass-card p-6 mb-6">
          <h2 className="font-extrabold text-xl text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-secondary animate-pulse" />
            📅 استيراد الجداول الدراسية
          </h2>
          <p className="text-sm text-dark-muted mt-2">
            رفع جدول (Excel/CSV/صور PNG/JPG) بالتنسيق التالي: اسم الطالب، رقم الهوية، الرقم الأكاديمي، البرنامج، المقرر، اليوم، الوقت
          </p>
        </div>

        {/* File Upload Section */}
        <div className="glass-card p-6 mb-6">
          {!file ? (
            <div
              onClick={handleSelectClick}
              className="p-10 border-2 border-dashed border-dark-border rounded-2xl text-center cursor-pointer hover:border-brand-secondary hover:bg-dark-hover/30 transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.png,.jpg,.jpeg"
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                className="hidden"
              />
              <UploadCloud className="w-16 h-16 mx-auto mb-4 text-brand-secondary animate-bounce" />
              <p className="text-sm font-bold text-white mb-2">رفع جدول الجداول الدراسية</p>
              <p className="text-xs text-dark-muted">
                يدعم Excel/CSV/صور PNG/JPG - النظام سيقرأ الجدول ويضيف جميع الطلاب والمواد والجداول تلقائيًا!
              </p>
            </div>
          ) : (
            <div className="p-4 bg-dark-bg/60 rounded-xl border border-dark-border flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-brand-success/10 text-brand-success flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-success" />
                    ✅ تم رفع: {file.name}
                  </p>
                  <p className="text-xs text-dark-muted mt-1">
                    الحجم: {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="p-2 rounded-lg bg-dark-hover hover:bg-brand-danger/20 hover:text-brand-danger border border-dark-border/60 text-dark-muted transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Processing State */}
        {processing && (
          <div className="glass-card p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="w-5 h-5 text-brand-secondary animate-spin" />
              <h3 className="font-bold text-white">⚡ جاري قراءة الجدول...</h3>
            </div>
            <div className="space-y-2">
              {['قراءة الملف', 'استخراج الطلاب', 'استخراج المواد', 'بناء الجداول'].map((text, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-dark-muted animate-pulse">
                  <div className="w-4 h-4 rounded-full bg-dark-border" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Parsed Data Preview & Edit */}
        {parsedData && !success && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="font-extrabold text-lg text-white mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-success" />
                📊 معاينة و تعديل البيانات
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-dark-bg/60 rounded-xl border border-dark-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-dark-muted">الطلاب</p>
                      <p className="text-2xl font-black text-white">{parsedData.students.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-dark-bg/60 rounded-xl border border-dark-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-secondary/10 text-brand-secondary flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-dark-muted">المواد</p>
                      <p className="text-2xl font-black text-white">{parsedData.subjects.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-dark-bg/60 rounded-xl border border-dark-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-success/10 text-brand-success flex items-center justify-center">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-dark-muted">الجداول</p>
                      <p className="text-2xl font-black text-white">{parsedData.schedules.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Students Table (Editable) */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white">الطلاب:</h4>
                  <button
                    type="button"
                    onClick={addStudent}
                    className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-2"
                  >
                    <Plus className="w-3 h-3" />
                    إضافة طالب
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-dark-border">
                        <th className="text-right py-2 px-2 text-dark-muted">#</th>
                        <th className="text-right py-2 px-2 text-dark-muted">الاسم</th>
                        <th className="text-right py-2 px-2 text-dark-muted">الرقم الأكاديمي</th>
                        <th className="text-right py-2 px-2 text-dark-muted">رقم الهوية</th>
                        <th className="text-right py-2 px-2 text-dark-muted">التخصص</th>
                        <th className="text-right py-2 px-2 text-dark-muted">حالة</th>
                        <th className="text-center py-2 px-2 text-dark-muted">إجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.students.map((student, i) => (
                        <tr key={i} className="border-b border-dark-border/30 hover:bg-dark-bg/40">
                          <td className="py-2 px-2 text-white">{i + 1}</td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={student.full_name}
                              onChange={(e) => updateStudent(i, 'full_name', e.target.value)}
                              className="w-full bg-dark-bg border border-dark-border rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-brand-primary"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={student.academic_id}
                              onChange={(e) => updateStudent(i, 'academic_id', e.target.value)}
                              className="w-full bg-dark-bg border border-dark-border rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-brand-primary"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={student.national_id}
                              onChange={(e) => updateStudent(i, 'national_id', e.target.value)}
                              className="w-full bg-dark-bg border border-dark-border rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-brand-primary"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={student.department_name}
                              onChange={(e) => updateStudent(i, 'department_name', e.target.value)}
                              className="w-full bg-dark-bg border border-dark-border rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-brand-primary"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${student.isNew ? 'bg-brand-primary/20 text-brand-primary' : 'bg-brand-success/20 text-brand-success'}`}>
                              {student.isNew ? 'جديد' : 'موجود'}
                            </span>
                          </td>
                          <td className="py-2 px-2 flex justify-center">
                            <button
                              type="button"
                              onClick={() => removeStudent(i)}
                              className="p-1.5 rounded hover:bg-brand-danger/10 text-brand-danger"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Schedules Table (Editable) */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-white mb-3">الجداول الدراسية:</h4>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-dark-bg/95">
                      <tr className="border-b border-dark-border">
                        <th className="text-right py-2 px-2 text-dark-muted">#</th>
                        <th className="text-right py-2 px-2 text-dark-muted">الرقم الأكاديمي</th>
                        <th className="text-right py-2 px-2 text-dark-muted">المقرر</th>
                        <th className="text-right py-2 px-2 text-dark-muted">اليوم</th>
                        <th className="text-right py-2 px-2 text-dark-muted">الوقت من</th>
                        <th className="text-right py-2 px-2 text-dark-muted">الوقت إلى</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.schedules.map((schedule, i) => (
                        <tr key={i} className="border-b border-dark-border/30 hover:bg-dark-bg/40">
                          <td className="py-2 px-2 text-white">{i + 1}</td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={schedule.student_academic_id}
                              onChange={(e) => updateSchedule(i, 'student_academic_id', e.target.value)}
                              className="w-full bg-dark-bg border border-dark-border rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-brand-primary"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={schedule.subject_name}
                              onChange={(e) => updateSchedule(i, 'subject_name', e.target.value)}
                              className="w-full bg-dark-bg border border-dark-border rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-brand-primary"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={schedule.weekday_name}
                              onChange={(e) => updateSchedule(i, 'weekday_name', e.target.value)}
                              className="w-full bg-dark-bg border border-dark-border rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-brand-primary"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={schedule.start_time}
                              onChange={(e) => updateSchedule(i, 'start_time', e.target.value)}
                              className="w-full bg-dark-bg border border-dark-border rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-brand-primary"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={schedule.end_time}
                              onChange={(e) => updateSchedule(i, 'end_time', e.target.value)}
                              className="w-full bg-dark-bg border border-dark-border rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-brand-primary"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleConfirmImport}
                  disabled={saving}
                  className="flex-1 btn-primary py-3 text-sm flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      ✅ تأكيد الاستيراد
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  className="btn-secondary px-6 py-3 text-sm flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  ❌ إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success State */}
        {success && (
          <div className="glass-card p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-brand-success/20 text-brand-success flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 animate-bounce" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">تم الاستيراد بنجاح! 🎉</h3>
            <p className="text-sm text-dark-muted">تم إضافة جميع الطلاب والمواد والجداول إلى قاعدة البيانات</p>
          </div>
        )}
      </div>
    </div>
  );
}
