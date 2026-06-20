import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  GraduationCap, 
  RefreshCw,
  AlertCircle,
  Building2,
  BookOpen,
  StickyNote
} from 'lucide-react';
import { db } from '../lib/supabase';
import type { Student, Department, Subject, Weekday, TimeSlot, PersonalNote } from '../types/database';

interface StudentSubjectForm {
  subject_name: string;
  weekday_id: number;
  slot_id: number | null; // null when using manual times
  use_manual_time: boolean; // true to use manual time entry
  start_time: string;
  end_time: string;
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [weekdays, setWeekdays] = useState<Weekday[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudentForNote, setSelectedStudentForNote] = useState<Student | null>(null);
  const [_personalNote, setPersonalNote] = useState<PersonalNote | null>(null);
  const [noteText, setNoteText] = useState('');
  const [noteActive, setNoteActive] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    academic_id: '',
    national_id: '',
    password: 'Aa123456',
    department_name: ''
  });
  
  const [studentSubjects, setStudentSubjects] = useState<StudentSubjectForm[]>([]);
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [stus, depts, subs, days, slots] = await Promise.all([
        db.getStudents(),
        db.getDepartments(),
        db.getSubjects(),
        db.getWeekdays(),
        db.getTimeSlots()
      ]);
      setStudents(stus);
      setDepartments(depts.sort((a, b) => a.department_name.localeCompare(b.department_name, 'ar'))); // Sort departments
      setSubjects(subs.sort((a, b) => a.subject_name.localeCompare(b.subject_name, 'ar'))); // Sort subjects
      setWeekdays(days);
      setTimeSlots(slots);
      if (depts.length > 0) setSelectedDeptId(depts[0].department_id);
    } catch (err: any) {
      console.error(err);
      setError('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    // لا تختفي تلقائياً - تختفي فقط عند النقر عليها
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      full_name: '',
      phone: '',
      academic_id: '',
      national_id: '',
      password: 'Aa123456',
      department_name: departments[0]?.department_name || 'هندسة البرمجيات'
    });
    setStudentSubjects([
      { 
        subject_name: '', 
        weekday_id: 1, 
        slot_id: timeSlots[0]?.slot_id || 1,
        use_manual_time: false,
        start_time: '',
        end_time: ''
      }
    ]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (student: Student) => {
    setEditingStudent(student);
    
    const department = departments.find(d => d.department_id === student.department_id);
    
    setFormData({
      full_name: student.full_name,
      phone: student.phone || '',
      academic_id: student.academic_id,
      national_id: student.national_id,
      password: '',
      department_name: department?.department_name || ''
    });
    
    try {
      const studentSchedule = await db.getStudentSchedule(student.student_id);
      
      if (studentSchedule.length > 0) {
        setStudentSubjects(
          studentSchedule.map(s => ({
            subject_name: s.subjects?.subject_name || '',
            weekday_id: s.weekday_id,
            slot_id: s.slot_id,
            use_manual_time: false,
            start_time: s.time_slots?.start_time || '',
            end_time: s.time_slots?.end_time || ''
          }))
        );
      } else {
        setStudentSubjects([
          { 
            subject_name: '', 
            weekday_id: 1, 
            slot_id: timeSlots[0]?.slot_id || 1,
            use_manual_time: false,
            start_time: '',
            end_time: ''
          }
        ]);
      }
    } catch (err) {
      console.error('[Students] Error loading schedule:', err);
      setStudentSubjects([
        { 
          subject_name: '', 
          weekday_id: 1, 
          slot_id: timeSlots[0]?.slot_id || 1,
          use_manual_time: false,
          start_time: '',
          end_time: ''
        }
      ]);
    }
    
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
      try {
        await db.deleteStudent(id);
        showToast('تم حذف الطالب بنجاح');
        fetchData();
      } catch (err: any) {
        setFormError('فشل حذف الطالب');
      }
    }
  };

  const handleDeleteAll = async () => {
    console.log('[DeleteAll] Button clicked!');
    console.log('[DeleteAll] Current students in state:', students);
    if (window.confirm('⚠️ هل أنت متأكد من حذف جميع الطلاب والجداول؟\n\nهذه العملية لا يمكن التراجع عنها!')) {
      console.log('[DeleteAll] Confirm accepted!');
      try {
        console.log('[DeleteAll] Calling db.deleteAllStudents...');
        await db.deleteAllStudents();
        console.log('[DeleteAll] Deleted successfully!');
        showToast('✅ تم حذف جميع الطلاب بنجاح');
        console.log('[DeleteAll] Refreshing data...');
        await fetchData();
      } catch (err: any) {
        console.error('[DeleteAll] Error:', err);
        setFormError('❌ فشل حذف جميع الطلاب: ' + (err.message || err));
      }
    }
  };

  const handleOpenNote = async (student: Student) => {
    setSelectedStudentForNote(student);
    const note = await db.getPersonalNote(student.student_id);
    setPersonalNote(note);
    setNoteText(note?.note || '');
    setNoteActive(note?.is_active ?? true);
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = async () => {
    if (!selectedStudentForNote) return;
    
    try {
      await db.setPersonalNote({
        student_id: selectedStudentForNote.student_id,
        note: noteText,
        is_active: noteActive
      });
      showToast('تم حفظ الملاحظة بنجاح');
      setIsNoteModalOpen(false);
    } catch (err: any) {
      setFormError('فشل حفظ الملاحظة');
    }
  };

  const addSubjectRow = () => {
    setStudentSubjects([
      ...studentSubjects,
      { 
        subject_name: '', 
        weekday_id: 1, 
        slot_id: timeSlots[0]?.slot_id || 1,
        use_manual_time: false,
        start_time: '',
        end_time: ''
      }
    ]);
  };

  const removeSubjectRow = (index: number) => {
    setStudentSubjects(studentSubjects.filter((_, i) => i !== index));
  };

  const updateSubjectRow = (index: number, field: keyof StudentSubjectForm, value: any) => {
    const updated = [...studentSubjects];
    updated[index] = { ...updated[index], [field]: value };
    setStudentSubjects(updated);
  };

  const normalizeTime = (timeStr: string) => {
    // Normalize time like '16:00' or '4:00 PM' etc.
    if (!timeStr) return null;
    
    let time = timeStr.trim();
    
    // If it's in HH:MM format already
    if (/^\d{1,2}:\d{2}$/.test(time)) {
      let [h, m] = time.split(':').map(Number);
      if (h < 10) time = `0${h}:${String(m).padStart(2, '0')}`;
      return time;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[Students handleSubmit] formData:', formData);
    
    if (!formData.full_name || !formData.academic_id || !formData.national_id || !formData.department_name) {
      setFormError('الرجاء ملء الحقول المطلوبة');
      return;
    }
    
    for (const subj of studentSubjects) {
      if (subj.subject_name && subj.use_manual_time) {
        if (!subj.start_time || !subj.end_time) {
          setFormError('الرجاء إدخال وقت البداية والنهاية للمواد التي تختار إدخال وقت يدوياً');
          return;
        }
      }
    }
    
    if (!editingStudent && !formData.password) {
      setFormError('الرجاء إدخال كلمة المرور');
      return;
    }

    try {
      setFormError(null);
      
      let departmentId: number | null = null;
      
      let existingDept = departments.find(d => 
        d.department_name.toLowerCase() === formData.department_name.toLowerCase()
      );
      
      if (existingDept) {
        departmentId = existingDept.department_id;
      } else {
        const newDept = await db.createDepartment({
          department_name: formData.department_name,
          degree_type: null
        });
        departmentId = newDept.department_id;
        setDepartments([...departments, newDept]);
      }
      
      // Process time slots first for manual times
      const currentTimeSlots = [...timeSlots];
      
      if (editingStudent) {
        const updateData: any = {
          full_name: formData.full_name,
          phone: formData.phone,
          academic_id: formData.academic_id,
          national_id: formData.national_id,
          department_id: departmentId
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        console.log('[Students handleSubmit] updateData:', updateData);
        await db.updateStudent(editingStudent.student_id, updateData);
        
        const oldSchedule = await db.getStudentSchedule(editingStudent.student_id);
        
        for (const scheduleEntry of oldSchedule) {
          try {
            await db.deleteSchedule(scheduleEntry.schedule_id);
          } catch (e) {
            console.log('[Students] Error deleting schedule:', e);
          }
        }
        
        for (const subj of studentSubjects) {
          if (subj.subject_name) {
            let subjectId = subjects.find(s => 
              s.subject_name.toLowerCase() === subj.subject_name.toLowerCase()
            )?.subject_id;
            
            if (!subjectId) {
              const newSubject = await db.createSubject({
                subject_name: subj.subject_name,
                department_id: departmentId
              });
              subjectId = newSubject.subject_id;
              setSubjects([...subjects, newSubject]);
            }
            
            let finalSlotId: number | null = subj.slot_id;
            
            if (subj.use_manual_time) {
              const start = normalizeTime(subj.start_time);
              const end = normalizeTime(subj.end_time);
              
              let matchingSlot = currentTimeSlots.find(s => 
                s.start_time === start && s.end_time === end
              );
              
              if (!matchingSlot) {
                const newSlotName = `فترة ${start}-${end}`;
                const newSlot = await db.createTimeSlot({
                  slot_name: newSlotName,
                  start_time: start!,
                  end_time: end!
                });
                if (newSlot) {
                  finalSlotId = newSlot.slot_id;
                  currentTimeSlots.push(newSlot);
                  setTimeSlots([...timeSlots, newSlot]);
                } else {
                  finalSlotId = timeSlots[0]?.slot_id || 1;
                }
              } else {
                finalSlotId = matchingSlot.slot_id;
              }
            }
            
            await db.createSchedule({
              student_id: editingStudent.student_id,
              subject_id: subjectId,
              weekday_id: subj.weekday_id,
              slot_id: finalSlotId!
            });
          }
        }
        
        showToast('تم تحديث الطالب والمواد بنجاح');
      } else {
        const newStudentData = {
          full_name: formData.full_name,
          phone: formData.phone,
          academic_id: formData.academic_id,
          national_id: formData.national_id,
          password: formData.password,
          role: 'student',
          department_id: departmentId,
          password_hash: ''
        } as any;
        console.log('[Students handleSubmit] newStudentData:', newStudentData);
        const newStudent = await db.createStudent(newStudentData);
        const studentId = newStudent.student_id;
        
        for (const subj of studentSubjects) {
          if (subj.subject_name) {
            let subjectId = subjects.find(s => 
              s.subject_name.toLowerCase() === subj.subject_name.toLowerCase()
            )?.subject_id;
            
            if (!subjectId) {
              const newSubject = await db.createSubject({
                subject_name: subj.subject_name,
                department_id: departmentId
              });
              subjectId = newSubject.subject_id;
              setSubjects([...subjects, newSubject]);
            }
            
            let finalSlotId: number | null = subj.slot_id;
            
            if (subj.use_manual_time) {
              const start = normalizeTime(subj.start_time);
              const end = normalizeTime(subj.end_time);
              
              let matchingSlot = currentTimeSlots.find(s => 
                s.start_time === start && s.end_time === end
              );
              
              if (!matchingSlot) {
                const newSlotName = `فترة ${start}-${end}`;
                const newSlot = await db.createTimeSlot({
                  slot_name: newSlotName,
                  start_time: start!,
                  end_time: end!
                });
                if (newSlot) {
                  finalSlotId = newSlot.slot_id;
                  currentTimeSlots.push(newSlot);
                  setTimeSlots([...timeSlots, newSlot]);
                } else {
                  finalSlotId = timeSlots[0]?.slot_id || 1;
                }
              } else {
                finalSlotId = matchingSlot.slot_id;
              }
            }
            
            await db.createSchedule({
              student_id: studentId,
              subject_id: subjectId,
              weekday_id: subj.weekday_id,
              slot_id: finalSlotId!
            });
          }
        }
        
        showToast('تم إضافة الطالب بنجاح مع المواد');
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('[Students] Error in handleSubmit:', err);
      setFormError(err.message || 'فشل حفظ البيانات');
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.academic_id.includes(searchQuery);
    const matchesDept = !selectedDeptId || student.department_id === selectedDeptId;
    return matchesSearch && matchesDept;
  }).sort((a, b) => a.full_name.localeCompare(b.full_name, 'ar')); // Sort alphabetically (Arabic)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">إدارة الطلاب</h1>
          <p className="text-dark-muted mt-1">إضافة وتعديل وحذف الطلاب مع جدولهم الدراسي</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData}
            className="btn-secondary px-4 py-2 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> تحديث
          </button>
          <button 
            onClick={handleDeleteAll}
            className="px-4 py-2 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" /> حذف جميع الطلاب
          </button>
          <button 
            onClick={handleOpenAdd}
            className="btn-primary px-4 py-2 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> إضافة طالب
          </button>
        </div>
      </div>

      {successMsg && (
        <div 
          onClick={() => setSuccessMsg(null)}
          className="fixed top-4 right-4 z-[99999] bg-brand-success/20 border border-brand-success/30 text-brand-success px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg animate-slide-up cursor-pointer hover:bg-brand-success/30 transition-all"
        >
          <Check className="w-5 h-5" />
          {successMsg}
          <span className="text-xs text-dark-muted ml-2">(انقر للإغلاق)</span>
        </div>
      )}

      {error && (
        <div className="glass-card p-4 bg-brand-danger/10 border border-brand-danger/30 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-brand-danger" />
          <span className="text-brand-danger">{error}</span>
        </div>
      )}

      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-muted" />
              <input
                type="text"
                placeholder="بحث بالاسم أو الرقم الأكاديمي..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-card border border-dark-border rounded-xl pr-10 pl-4 py-3 text-white placeholder-dark-muted focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>
          
          <div className="w-full md:w-64">
            <label className="text-sm font-bold text-dark-muted mb-2 block">التخصص</label>
            <select
              value={selectedDeptId || ''}
              onChange={(e) => setSelectedDeptId(e.target.value ? Number(e.target.value) : null)}
              className="w-full bg-dark-card border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-brand-primary"
            >
              <option value="">جميع التخصصات</option>
              {departments.map(dept => (
                <option key={dept.department_id} value={String(dept.department_id)}>
                  {dept.department_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden w-full min-w-0">
        <div className="overflow-x-auto w-full min-w-0">
          <table className="w-full">
            <thead className="bg-dark-bg/50">
              <tr>
                <th className="text-right py-4 px-6 text-dark-muted font-bold text-sm">الطالب</th>
                <th className="text-center py-4 px-6 text-dark-muted font-bold text-sm">الرقم الأكاديمي</th>
                <th className="text-center py-4 px-6 text-dark-muted font-bold text-sm">رقم الهوية</th>
                <th className="text-center py-4 px-6 text-dark-muted font-bold text-sm">كلمة المرور</th>
                <th className="text-center py-4 px-6 text-dark-muted font-bold text-sm">التخصص</th>
                <th className="text-center py-4 px-6 text-dark-muted font-bold text-sm">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-dark-muted">
                    لا يوجد طلاب مطابقين للبحث
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.student_id} className="border-t border-dark-border/30 hover:bg-dark-bg/30 transition-all">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
                          {student.full_name.charAt(0)}
                        </div>
                        <span className="text-white font-medium">{student.full_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-dark-muted font-mono">{student.academic_id}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-dark-muted font-mono">{student.national_id}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-dark-muted font-mono">{student.password || '-'}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-dark-muted flex items-center justify-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {departments.find(d => d.department_id === student.department_id)?.department_name || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenNote(student)}
                          className="p-2 rounded-lg hover:bg-brand-warning/10 text-brand-warning transition-all"
                          title="ملاحظة"
                        >
                          <StickyNote className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="p-2 rounded-lg hover:bg-brand-primary/10 text-brand-primary transition-all"
                          title="تعديل"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(student.student_id)}
                          className="p-2 rounded-lg hover:bg-brand-danger/10 text-brand-danger transition-all"
                          title="حذف"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative glass-card w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-dark-border">
              <h2 className="text-xl font-bold text-white">
                {editingStudent ? 'تعديل الطالب' : 'إضافة طالب جديد'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg hover:bg-dark-hover text-dark-muted hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {formError && (
                <div className="bg-brand-danger/10 border border-brand-danger/30 text-brand-danger px-4 py-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-brand-primary" />
                  معلومات الطالب
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-dark-muted">الاسم الكامل *</label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full bg-dark-card border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-brand-primary"
                      placeholder="أدخل اسم الطالب"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-dark-muted">الرقم الأكاديمي *</label>
                    <input
                      type="text"
                      value={formData.academic_id}
                      onChange={(e) => setFormData({ ...formData, academic_id: e.target.value })}
                      className="w-full bg-dark-card border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-brand-primary font-mono"
                      placeholder="مثال: 26204116"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-dark-muted">رقم الهوية *</label>
                    <input
                      type="text"
                      value={formData.national_id}
                      onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                      className="w-full bg-dark-card border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-brand-primary font-mono"
                      placeholder="أدخل رقم الهوية"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-dark-muted">كلمة المرور *</label>
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-dark-card border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-brand-primary"
                      placeholder="أدخل كلمة المرور"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-dark-muted">رقم الجوال</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-dark-card border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-brand-primary"
                      placeholder="مثال: 0501234567"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-dark-muted">التخصص *</label>
                    <input
                      type="text"
                      value={formData.department_name}
                      onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                      className="w-full bg-dark-card border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-brand-primary"
                      placeholder="أدخل اسم التخصص"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-brand-secondary" />
                    المواد الدراسية
                  </h3>
                  <button
                    type="button"
                    onClick={addSubjectRow}
                    className="btn-secondary px-4 py-2 text-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> إضافة مادة
                  </button>
                </div>
                
                <div className="space-y-3">
                  {studentSubjects.map((subj, index) => (
                    <div key={index} className="p-4 bg-dark-bg/50 rounded-xl border border-dark-border">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-bold text-dark-muted">مادة #{index + 1}</span>
                        {studentSubjects.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSubjectRow(index)}
                            className="p-1 rounded hover:bg-brand-danger/10 text-brand-danger"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-dark-muted">اسم المادة</label>
                          <input
                            type="text"
                            value={subj.subject_name}
                            onChange={(e) => updateSubjectRow(index, 'subject_name', e.target.value)}
                            className="w-full bg-dark-card border border-dark-border rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-brand-primary"
                            placeholder="مثال: أساسيات البرمجة"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-dark-muted">اليوم</label>
                          <select
                            value={String(subj.weekday_id)}
                            onChange={(e) => updateSubjectRow(index, 'weekday_id', Number(e.target.value))}
                            className="w-full bg-dark-card border border-dark-border rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-brand-primary"
                          >
                            {weekdays.map(day => (
                              <option key={day.weekday_id} value={String(day.weekday_id)}>
                                {day.weekday_name_ar}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              id={`manual_time_${index}`}
                              checked={subj.use_manual_time}
                              onChange={(e) => updateSubjectRow(index, 'use_manual_time', e.target.checked)}
                              className="w-4 h-4 rounded border-dark-border bg-dark-card text-brand-primary focus:ring-brand-primary"
                            />
                            <label htmlFor={`manual_time_${index}`} className="text-xs font-bold text-dark-muted cursor-pointer">
                              إدخال وقت يدوياً
                            </label>
                          </div>
                          {!subj.use_manual_time ? (
                            <div>
                              <label className="text-xs font-bold text-dark-muted">الفترة</label>
                              <select
                                value={String(subj.slot_id || 1)}
                                onChange={(e) => updateSubjectRow(index, 'slot_id', Number(e.target.value))}
                                className="w-full bg-dark-card border border-dark-border rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-brand-primary"
                              >
                                {timeSlots.map(slot => (
                                  <option key={slot.slot_id} value={String(slot.slot_id)}>
                                    {slot.slot_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-dark-muted">وقت البداية</label>
                                <input
                                  type="time"
                                  value={subj.start_time}
                                  onChange={(e) => updateSubjectRow(index, 'start_time', e.target.value)}
                                  className="w-full bg-dark-card border border-dark-border rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-brand-primary"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-dark-muted">وقت النهاية</label>
                                <input
                                  type="time"
                                  value={subj.end_time}
                                  onChange={(e) => updateSubjectRow(index, 'end_time', e.target.value)}
                                  className="w-full bg-dark-card border border-dark-border rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-brand-primary"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary px-6 py-2.5"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn-primary px-6 py-2.5 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {editingStudent ? 'تحديث' : 'إضافة الطالب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isNoteModalOpen && (
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNoteModalOpen(false)} />
          <div className="relative glass-card w-full max-w-2xl animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-dark-border">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <StickyNote className="w-6 h-6 text-brand-warning" />
                ملاحظة خاصة لـ {selectedStudentForNote?.full_name}
              </h2>
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="p-2 rounded-lg hover:bg-dark-hover text-dark-muted hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-dark-muted">الملاحظة</label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full bg-dark-card border border-dark-border rounded-xl p-4 text-white focus:outline-none focus:border-brand-primary min-h-[150px] resize-none"
                  placeholder="اكتب الملاحظة هنا..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="noteActive"
                  checked={noteActive}
                  onChange={(e) => setNoteActive(e.target.checked)}
                  className="w-5 h-5 rounded border-dark-border bg-dark-card text-brand-primary focus:ring-brand-primary"
                />
                <label htmlFor="noteActive" className="text-sm text-dark-muted cursor-pointer">
                  إظهار الملاحظة للطالب عند الدخول
                </label>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="btn-secondary px-6 py-2.5"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="btn-primary px-6 py-2.5 flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  حفظ الملاحظة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
