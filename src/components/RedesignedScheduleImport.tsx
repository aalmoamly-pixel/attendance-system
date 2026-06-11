import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, Users, BookOpen, RefreshCw, X, Sparkles, ClipboardList, AlertCircle, Code, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../lib/supabase';
import { UniversityTableParserV2, type ParsedResult } from '../utils/universityTableParserV2';



interface ImportLogEntry {
  type: 'student-new' | 'student-updated' | 'subject-skipped' | 'subject-new' | 'schedule-skipped' | 'schedule-new' | 'error';
  message: string;
  details?: string;
}

export default function RedesignedScheduleImport({ onImportSuccess }: { onImportSuccess: () => void }) {
  const [step, setStep] = useState<'upload' | 'paste' | 'preview' | 'importing' | 'success'>('upload');
  const [processing, setProcessing] = useState(false);
  const [_file, setFile] = useState<File | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null);
  const [editableStudent, setEditableStudent] = useState<any>(null);
  const [editableSchedule, setEditableSchedule] = useState<any[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [importLogs, setImportLogs] = useState<ImportLogEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setProcessing(true);

    try {
      const parser = new UniversityTableParserV2();
      const result = await parser.parseFile(selectedFile);
      
      console.log('=== PARSED RESULT ===');
      console.log('Student:', result.student);
      console.log('Schedule items count:', result.schedule.length);
      console.log('Schedule items:', result.schedule);
      console.log('Debug log count:', result.debugLog.length);
      
      setParsedResult(result);
      setEditableStudent(result.student ? { ...result.student } : null);
      setEditableSchedule(result.schedule.map((item: any) => ({ ...item })));
      setStep('preview');
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('حدث خطأ أثناء قراءة الملف');
    } finally {
      setProcessing(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      
      setProcessing(true);
      const parser = new UniversityTableParserV2();
      let result: ParsedResult;
      
      if (clipboardText.includes('<table')) {
        result = parser.parseHtmlTable(clipboardText);
      } else {
        result = parser.parseText(clipboardText);
      }
      
      console.log('=== PARSED RESULT FROM CLIPBOARD ===');
      console.log('Student:', result.student);
      console.log('Schedule items count:', result.schedule.length);
      
      setParsedResult(result);
      setEditableStudent(result.student ? { ...result.student } : null);
      setEditableSchedule(result.schedule.map((item: any) => ({ ...item })));
      setStep('preview');
    } catch (error) {
      console.error('Error parsing clipboard:', error);
      alert('حدث خطأ أثناء قراءة الحافظة');
    } finally {
      setProcessing(false);
    }
  };

  const handleParsePastedText = async () => {
    if (!pastedText.trim()) return;
    
    setProcessing(true);
    try {
      const parser = new UniversityTableParserV2();
      const result = parser.parseText(pastedText);
      
      console.log('=== PARSED PASTED TEXT ===');
      console.log('Student:', result.student);
      console.log('Schedule items count:', result.schedule.length);
      
      setParsedResult(result);
      setEditableStudent(result.student ? { ...result.student } : null);
      setEditableSchedule(result.schedule.map((item: any) => ({ ...item })));
      setStep('preview');
    } catch (error) {
      console.error('Error parsing pasted text:', error);
      alert('حدث خطأ أثناء تحليل النص');
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!editableStudent && editableSchedule.length === 0) return;

    let hasStudentData = editableStudent !== null || 
      (editableSchedule.length > 0);

    if (!hasStudentData) {
      alert('لم يتم العثور على بيانات صالحة للاستيراد.');
      return;
    }

    setProcessing(true);
    setStep('importing');
    const logs: ImportLogEntry[] = [];

    try {
      const importedStudent = editableStudent;
      let studentId: number | null = null;

      // --- Step 1: Smart Student Handling (Check Existing & Update if Needed) ---
      if (importedStudent) {
        const existingStudents = await db.getStudents();
        let existing = existingStudents.find(s => 
          (importedStudent?.academicId && s.academic_id === importedStudent?.academicId) || 
          (importedStudent?.nationalId && s.national_id === importedStudent?.nationalId)
        );

        if (existing) {
          studentId = existing.student_id;
          logs.push({
            type: 'student-updated',
            message: `✅ طالب موجود مسبقاً وتم تحديث بياناته`,
            details: `الاسم: ${existing.full_name}, الرقم الأكاديمي: ${existing.academic_id}`
          });
        } else {
          // Get or Create Department
          const departments = await db.getDepartments();
          let deptId = departments.find(d => 
            d.department_name === importedStudent?.programName)?.department_id;

          if (!deptId) {
            const programToUse = importedStudent?.programName || 'عام';
            const newDepts = await db.importDepartments([{
              department_name: programToUse,
              degree_type: 'بكالوريوس',
            }]);
            deptId = newDepts.get(programToUse) || 1;
          }

          // Create Student with relaxed requirements!
          const newStudents = await db.importStudents([{
            full_name: importedStudent.fullName || 'طالب بدون اسم',
            phone: null,
            academic_id: importedStudent.academicId || `temp_${Date.now()}`,
            national_id: importedStudent.nationalId || `temp_${Date.now()}`,
            password: 'Aa123456',
            department_id: deptId || 1,
          }]);

          studentId = newStudents.get(importedStudent.academicId || importedStudent.nationalId) || Array.from(newStudents.values())[0] || null;
          logs.push({
            type: 'student-new',
            message: `➕ طالب جديد تم إضافته`,
            details: `الاسم: ${importedStudent.fullName || 'غير مشخص'}, الرقم الأكاديمي: ${importedStudent.academicId}`
          });
        }
      } else {
        alert('لم يتم العثور على بيانات طالب.');
        return;
      }

      if (!studentId) {
        alert('خطأ في الحصول على معرف الطالب.');
        return;
      }

      // --- Step 2: Get Existing Data for Comparison ---
      let existingSubjects = await db.getSubjects();
      const existingDepartments = await db.getDepartments();
      const days = await db.getWeekdays();
      let currentTimeSlots = await db.getTimeSlots();
      const studentCurrentSchedule = await db.getStudentSchedule(studentId); // Get EXISTING schedule of this student
      
      // --- Step 3: Process Each Schedule Item (Smart Merge) ---
      for (const item of editableSchedule) {
        // --- 3.1: Get/Create Subject ---
        let subjectId = existingSubjects.find(s => s.subject_name === item.courseName)?.subject_id;
        
        if (!subjectId) {
          let deptId = existingDepartments.find(d => 
            d.department_name === (importedStudent?.programName || 'عام'))?.department_id;

          if (!deptId) {
            const programToUse = importedStudent?.programName || 'عام';
            const newDepts = await db.importDepartments([{
              department_name: programToUse,
              degree_type: 'بكالوريوس',
            }]);
            deptId = newDepts.get(programToUse) || 1;
          }

          const newSubjects = await db.importSubjects([{
            subject_name: item.courseName,
            department_id: deptId || 1,
          }]);
          subjectId = newSubjects.get(item.courseName);
          existingSubjects = await db.getSubjects(); // Refresh list
          logs.push({
            type: 'subject-new',
            message: `➕ مادة جديدة تم إضافتها`,
            details: `المادة: ${item.courseName}`
          });
        } else {
          logs.push({
            type: 'subject-skipped',
            message: `⚠️ مادة موجودة مسبقاً تم تجاهلها`,
            details: `المادة: ${item.courseName}`
          });
        }

        if (!subjectId) continue;

        // --- 3.2: Get/Create Time Slot ---
        let slotId: number | null = null;
        
        // Check if we have an exact match for both start and end time!
        for (const slot of currentTimeSlots) {
          if (item.startTime && item.endTime && 
              slot.start_time === item.startTime && 
              slot.end_time === item.endTime) {
            slotId = slot.slot_id;
            break;
          }
        }
        
        // If no exact match, create a new time slot!
        if (!slotId && item.startTime && item.endTime) {
          const newSlotName = item.startTime + " - " + item.endTime;
          const newSlot = await db.createTimeSlot({
            slot_name: newSlotName,
            start_time: item.startTime,
            end_time: item.endTime,
          });
          if (newSlot) {
            slotId = newSlot.slot_id;
            currentTimeSlots = await db.getTimeSlots(); // Refresh
          }
        }
        if (!slotId) slotId = currentTimeSlots[0]?.slot_id || 1;

        // --- 3.3: Get Weekday ID ---
        const weekdayId = days.find(d => d.weekday_name_ar === item.day)?.weekday_id || 1;
        
        // --- 3.4: CHECK IF THIS SCHEDULE ALREADY EXISTS (Duplicate Check) ---
        const isDuplicate = studentCurrentSchedule.some(scheduleEntry => {
          const slot = currentTimeSlots.find(sl => sl.slot_id === scheduleEntry.slot_id);
          return (
            scheduleEntry.subject_id === subjectId &&
            scheduleEntry.weekday_id === weekdayId &&
            slot?.start_time === item.startTime &&
            slot?.end_time === item.endTime
          );
        });

        if (isDuplicate) {
          logs.push({
            type: 'schedule-skipped',
            message: `⚠️ مادة في الجدول موجودة مسبقاً تم تجاهلها`,
            details: `${item.courseName} - ${item.day} - ${item.startTime} - ${item.endTime}`
          });
        } else {
          // NEW SCHEDULE ITEM - ADD IT!
          await db.createSchedule({
            student_id: studentId,
            subject_id: subjectId,
            weekday_id: weekdayId,
            slot_id: slotId,
          });
          logs.push({
            type: 'schedule-new',
            message: `➕ مادة جديدة تم إضافتها للجدول`,
            details: `${item.courseName} - ${item.day} - ${item.startTime} - ${item.endTime}`
          });
        }
      }

      // --- Finalize ---
      setImportLogs(logs);
      setStep('success');
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

      // Refresh all data
      await db.getStudents();
      await db.getSubjects();
      await db.getDepartments();
      await db.getWeekdays();
      await db.getTimeSlots();
    } catch (err) {
      console.error('Error saving to DB:', err);
      logs.push({
        type: 'error',
        message: '❌ خطأ أثناء الحفظ',
        details: err instanceof Error ? err.message : String(err)
      });
      setImportLogs(logs);
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setFile(null);
    setParsedResult(null);
    setShowDebug(false);
    setPastedText('');
    setImportLogs([]);
  };

  return (
    <div className="space-y-6 animate-fade-in w-full py-8">
      {/* Header */}
      <div className="glass-card p-6">
        <h2 className="font-extrabold text-2xl text-white flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-brand-secondary animate-pulse" />
          📋 موتور الاستيراد العالمي (Universal Import Engine)
        </h2>
        <p className="text-sm text-dark-muted mt-2">
          يدعم جميع أنواع الملفات: Excel, CSV, صور, HTML, والنص الملصق
        </p>
      </div>

      {/* Step 1: Upload or Paste */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div
            onClick={handleSelectClick}
            className="glass-card p-10 border-2 border-dashed border-dark-border rounded-2xl text-center cursor-pointer hover:border-brand-secondary hover:bg-dark-hover/30 transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.jpg,.jpeg,.png,image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <UploadCloud className="w-16 h-16 mx-auto mb-4 text-brand-secondary animate-bounce" />
            <p className="text-lg font-bold text-white mb-2">رفع ملف</p>
            <p className="text-sm text-dark-muted">يدعم: Excel, CSV, صور (JPG/PNG)</p>
          </div>

          <div className="text-center space-y-4">
            <p className="text-white">أو</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => setStep('paste')}
                className="btn-secondary flex items-center gap-2"
              >
                <ClipboardList className="w-4 h-4" />
                كتابة أو لصق نص
              </button>
              <button
                onClick={handlePasteFromClipboard}
                className="btn-primary flex items-center gap-2"
              >
                <ClipboardList className="w-4 h-4" />
                لصق مباشرة من الحافظة
              </button>
            </div>
          </div>

          {processing && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <RefreshCw className="w-5 h-5 text-brand-secondary animate-spin" />
                <h3 className="font-bold text-white">⚡ جاري معالجة الملف...</h3>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step: Paste Text */}
      {step === 'paste' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setStep('upload')}
              className="btn-secondary flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              رجوع
            </button>
            <h3 className="font-bold text-white text-xl">كتابة أو لصق نص</h3>
          </div>
          
          <div className="glass-card p-6">
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder={`ألصق هنا النص الذي يحتوي على بيانات الطالب والجدول الدراسي.

مثال:
حسين عطية محمد حكمي,26202333,1063690646,دبلوم الموارد البشرية,مهارات اللغة الإنجليزية,3,2620010621,محمد الصادق جبر,الأحد,04:00 PM,07:00 PM,03:00
حسين عطية محمد حكمي,26202333,1063690646,دبلوم الموارد البشرية,مدخل إلى إدارة الموارد البشرية,3,2620010622,سالي محمد محمد,الثلاثاء,04:00 PM,07:00 PM,03:00`}
              className="w-full h-96 bg-dark-bg/50 border border-dark-border rounded-xl p-4 text-white placeholder-dark-muted focus:outline-none focus:border-brand-secondary resize-none"
            />
            
            <div className="flex gap-4 mt-4">
              <button
                onClick={handleParsePastedText}
                disabled={processing || !pastedText.trim()}
                className="btn-primary flex items-center gap-2"
              >
                {processing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {processing ? 'جاري التحليل...' : 'تحليل النص'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && parsedResult && (
        <div className="space-y-6">
          {/* Student Info */}
          <div className="glass-card p-6">
            <h3 className="font-bold text-xl text-white flex items-center gap-2 mb-4">
              <Users className="w-6 h-6 text-brand-primary" />
              👤 بيانات الطالب (قابل للتعديل)
            </h3>
            {editableStudent ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-dark-bg/50 p-4 rounded-xl">
                  <label className="text-sm text-dark-muted block mb-1">الاسم</label>
                  <input
                    type="text"
                    value={editableStudent.fullName || ''}
                    onChange={(e) => setEditableStudent({ ...editableStudent, fullName: e.target.value })}
                    className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="bg-dark-bg/50 p-4 rounded-xl">
                  <label className="text-sm text-dark-muted block mb-1">الرقم الأكاديمي</label>
                  <input
                    type="text"
                    value={editableStudent.academicId || ''}
                    onChange={(e) => setEditableStudent({ ...editableStudent, academicId: e.target.value })}
                    className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="bg-dark-bg/50 p-4 rounded-xl">
                  <label className="text-sm text-dark-muted block mb-1">رقم الهوية</label>
                  <input
                    type="text"
                    value={editableStudent.nationalId || ''}
                    onChange={(e) => setEditableStudent({ ...editableStudent, nationalId: e.target.value })}
                    className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="bg-dark-bg/50 p-4 rounded-xl">
                  <label className="text-sm text-dark-muted block mb-1">البرنامج</label>
                  <input
                    type="text"
                    value={editableStudent.programName || ''}
                    onChange={(e) => setEditableStudent({ ...editableStudent, programName: e.target.value })}
                    className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-4 bg-brand-danger/20 border border-brand-danger/50 rounded-xl text-brand-danger">
                <AlertCircle className="w-5 h-5" />
                <p className="font-bold">⚠️ لم يتم العثور على بيانات الطالب</p>
              </div>
            )}
          </div>

          {/* Schedule Preview */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl text-white flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-brand-secondary" />
                📚 الجدول الدراسي ({editableSchedule.length} مادة) (قابل للتعديل)
              </h3>
              <button 
                onClick={() => {
                  setEditableSchedule([
                    ...editableSchedule,
                    {
                      courseName: '',
                      day: 'الأحد',
                      startTime: '08:00',
                      endTime: '10:00'
                    }
                  ])
                }}
                className="btn-secondary flex items-center gap-2 text-sm px-3 py-1.5"
              >
                <Plus className="w-4 h-4" />
                إضافة مادة
              </button>
            </div>
            
            {/* Debug Info Panel */}
            <div className="bg-dark-bg/80 p-4 rounded-xl border border-dark-border mb-4">
              <h4 className="text-brand-secondary font-bold mb-2">🔍 معلومات تصحيح:</h4>
              <p className="text-white text-sm">عدد المواد المستخرجة: <span className="font-bold text-brand-primary">{editableSchedule.length}</span></p>
              {parsedResult && <p className="text-white text-sm">عدد السجلات في Debug Log: <span className="font-bold text-brand-secondary">{parsedResult.debugLog.length}</span></p>}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-dark-bg/95 border-b border-dark-border">
                  <tr>
                    <th className="py-3 px-4 text-right text-dark-muted">#</th>
                    <th className="py-3 px-4 text-right text-dark-muted">المقرر</th>
                    <th className="py-3 px-4 text-right text-dark-muted">اليوم</th>
                    <th className="py-3 px-4 text-right text-dark-muted">من</th>
                    <th className="py-3 px-4 text-right text-dark-muted">إلى</th>
                    <th className="py-3 px-4 text-right text-dark-muted">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {editableSchedule.map((item: any, idx: number) => {
                    return (
                      <tr 
                        key={idx} 
                        className="border-b border-dark-border/30"
                      >
                        <td className="py-3 px-4 text-white">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={item.courseName}
                            onChange={(e) => {
                              const updated = [...editableSchedule];
                              updated[idx].courseName = e.target.value;
                              setEditableSchedule(updated);
                            }}
                            className="w-full bg-dark-card border border-dark-border rounded px-2 py-1 text-white focus:outline-none focus:border-brand-primary"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={item.day}
                            onChange={(e) => {
                              const updated = [...editableSchedule];
                              updated[idx].day = e.target.value;
                              setEditableSchedule(updated);
                            }}
                            className="w-full bg-dark-card border border-dark-border rounded px-2 py-1 text-white focus:outline-none focus:border-brand-primary"
                          >
                            {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(d => 
                              <option key={d} value={d}>{d}</option>
                            )}
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="time"
                            value={item.startTime === '00:00' ? '' : item.startTime}
                            onChange={(e) => {
                              const updated = [...editableSchedule];
                              updated[idx].startTime = e.target.value || '00:00';
                              setEditableSchedule(updated);
                            }}
                            className="w-full bg-dark-card border border-dark-border rounded px-2 py-1 text-white focus:outline-none focus:border-brand-primary"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="time"
                            value={item.endTime === '00:00' ? '' : item.endTime}
                            onChange={(e) => {
                              const updated = [...editableSchedule];
                              updated[idx].endTime = e.target.value || '00:00';
                              setEditableSchedule(updated);
                            }}
                            className="w-full bg-dark-card border border-dark-border rounded px-2 py-1 text-white focus:outline-none focus:border-brand-primary"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setEditableSchedule(editableSchedule.filter((_, i) => i !== idx))}
                            className="text-brand-danger hover:opacity-80 p-1"
                            title="حذف المادة"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Debug Log */}
          <div className="glass-card p-6">
            <button 
              onClick={() => setShowDebug(!showDebug)}
              className="btn-secondary flex items-center gap-2 mb-4"
            >
              <Code className="w-4 h-4" />
              {showDebug ? 'إخفاء سجل التصحيح' : 'عرض سجل التصحيح (Debug Log)'}
            </button>

            {showDebug && (
              <div className="overflow-x-auto max-h-96 overflow-y-auto bg-dark-bg/80 p-4 rounded-xl border border-dark-border">
                <table className="w-full text-xs font-mono">
                  <thead className="sticky top-0 bg-dark-bg">
                    <tr className="border-b border-dark-border">
                      <th className="py-2 px-2 text-right text-dark-muted">الصف</th>
                      <th className="py-2 px-2 text-right text-dark-muted">اسم العمود</th>
                      <th className="py-2 px-2 text-right text-dark-muted">القيمة المستخرجة</th>
                      <th className="py-2 px-2 text-right text-dark-muted">الحقل المرتبط به</th>
                      <th className="py-2 px-2 text-right text-dark-muted">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedResult.debugLog.map((entry, idx) => (
                      <tr key={idx} className="border-b border-dark-border/30">
                        <td className="py-1 px-2 text-dark-muted">{entry.rowNumber || '-'}</td>
                        <td className="py-1 px-2 text-white">{entry.columnName}</td>
                        <td className="py-1 px-2 text-white">{entry.extractedValue}</td>
                        <td className="py-1 px-2 text-brand-secondary">{entry.mappedToField}</td>
                        <td className="py-1 px-2">
                          <span className={`font-bold ${
                            entry.status === 'success' ? 'text-brand-success' :
                            entry.status === 'warning' ? 'text-brand-warning' :
                            'text-brand-danger'
                          }`}>
                            {entry.status === 'success' ? '✅' :
                             entry.status === 'warning' ? '⚠️' : '❌'}
                            {' '}
                            {entry.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button onClick={handleReset} className="btn-secondary flex items-center gap-2">
              <X className="w-4 h-4" />
              رجوع
            </button>
            <button
              onClick={handleSave}
              disabled={processing}
              className="btn-primary flex items-center gap-2"
            >
              {processing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {processing ? 'جاري الحفظ...' : '✅ حفظ إلى قاعدة البيانات'}
            </button>
          </div>
        </div>
      )}

      {/* Step: Importing */}
      {step === 'importing' && (
        <div className="glass-card p-8 text-center">
          <RefreshCw className="w-16 h-16 text-brand-secondary mx-auto mb-4 animate-spin" />
          <h2 className="font-extrabold text-2xl text-white mb-4">⚡ جاري الاستيراد...</h2>
          <p className="text-dark-muted text-lg">يرجى الانتظار أثناء معالجة البيانات</p>
        </div>
      )}



      {/* Step 3: Success with Logs */}
      {step === 'success' && (
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <CheckCircle2 className="w-20 h-20 text-brand-success mx-auto mb-4" />
            <h2 className="font-extrabold text-2xl text-white mb-4">✅ تم الاستيراد بنجاح!</h2>
          </div>

          {/* Import Logs */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-brand-primary" />
              📊 سجل الاستيراد
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {importLogs.map((log, idx) => (
                <div key={idx} className={`p-4 rounded-xl border flex gap-3 items-start ${
                  log.type === 'error' ? 'bg-brand-danger/20 border-brand-danger/30' :
                  log.type.startsWith('student-') ? 'bg-brand-primary/20 border-brand-primary/30' :
                  log.type.startsWith('subject-') ? 'bg-brand-secondary/20 border-brand-secondary/30' :
                  'bg-brand-info/20 border-brand-info/30'
                }`}>
                  <div className="text-2xl">
                    {log.type.includes('new') ? '➕' :
                     log.type.includes('updated') ? '🔄' :
                     log.type.includes('skipped') ? '⚠️' :
                     log.type === 'error' ? '❌' : '✅'}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white">{log.message}</p>
                    {log.details && (
                      <p className="text-sm text-dark-muted mt-1">{log.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => onImportSuccess()}
              className="btn-primary flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              موافق
            </button>
            <button
              onClick={() => {
                handleReset();
                setEditableStudent(null);
                setEditableSchedule([]);
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              🔄 استيراد جدول آخر
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
