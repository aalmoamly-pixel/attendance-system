import { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Sparkles, 
  Check, 
  RefreshCw, 
  FileSpreadsheet, 
  CheckCircle2, 
  Users, 
  BookOpen, 
  Building2, 
  Calendar, 
  AlertCircle,
  XCircle,
  X,
  Eye,
  AlertTriangle,
  Info
} from 'lucide-react';
import { flexibleParseExcelOrCsv, flexibleParseImage } from '../utils/flexibleImportEngine';
import type { FlexibleImportResult } from '../utils/flexibleImportTypes';
import { db } from '../lib/supabase';
import confetti from 'canvas-confetti';

export default function SmartImport({ onImportSuccess }: { onImportSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<FlexibleImportResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setProcessing(true);
    setParseResult(null);
    setSuccess(false);
    setShowPreview(false);

    try {
      let res;
      
      if (selectedFile.type.startsWith('image/')) {
        res = await flexibleParseImage(selectedFile, (progress) => {
          console.log('Processing:', progress);
        });
      } else {
        res = await flexibleParseExcelOrCsv(selectedFile);
      }
      
      setParseResult(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!parseResult) return;
    setSaving(true);

    try {
      // First import departments and get real IDs
      const deptNameToRealId = await db.importDepartments(parseResult.departments.map(d => ({
        department_name: d.department_name,
        degree_type: d.degree_type
      })));

      // Then map temporary subject dept IDs to real dept IDs, import subjects, and get real subject IDs
      const tempSubjectIdToName = new Map<number, string>();
      parseResult.subjects.forEach(s => {
        tempSubjectIdToName.set(s.subject_id, s.subject_name);
      });

      // Prepare subjects with real department IDs
      const subjectsToImport = parseResult.subjects.map(s => ({
        subject_name: s.subject_name,
        department_id: deptNameToRealId.get(parseResult.departments.find(d => d.department_id === s.department_id)?.department_name || 'عام')!
      }));

      // Import subjects and get real subject IDs by name
      const subjectNameToRealId = await db.importSubjects(subjectsToImport);

      // Now map students' temp dept IDs to real ones, import students
      const studentsToImport = parseResult.students.map(s => {
        // Find original dept name by temp ID
        const deptName = parseResult.departments.find(d => d.department_id === s.department_id)?.department_name || 'عام';
        return {
          ...s,
          department_id: deptNameToRealId.get(deptName)!
        };
      });

      // Import students and get real student IDs
      const studentIdMapping = await db.importStudents(studentsToImport);
      
      // Now process schedules with time slots
      if (parseResult.schedules.length > 0) {
        // First, we need to handle time ranges properly
        // Let's get all current time slots
        let currentTimeSlots = await db.getTimeSlots();
        
        // Process each schedule item to get proper slot IDs
        const processedSchedules = [];
        
        for (let i = 0; i < parseResult.schedules.length; i++) {
          const schedule = parseResult.schedules[i] as any;
          
          // Get real student ID from the mapping using the schedule's academic_id
          const realStudentId = studentIdMapping.get(schedule.academic_id);
          if (!realStudentId) continue;
          
          // Get real subject ID using temp subject id -> name -> real id
          const subjectName = tempSubjectIdToName.get(schedule.subject_id);
          if (!subjectName) continue;
          const realSubjectId = subjectNameToRealId.get(subjectName);
          if (!realSubjectId) continue;
          
          // Use the parsed start and end times from flexibleImportEngine
          let slotId = schedule.slot_id;
          
          if (schedule.startTime && schedule.endTime && schedule.startTime !== '00:00') {
            // Find exact match for both start and end time
            const matchingSlot = currentTimeSlots.find(
              slot => slot.start_time === schedule.startTime && slot.end_time === schedule.endTime
            );
            
            if (matchingSlot) {
              slotId = matchingSlot.slot_id;
            } else {
              // Create new time slot
              const newSlotName = `${schedule.startTime} - ${schedule.endTime}`;
              const newSlot = await db.createTimeSlot({
                slot_name: newSlotName,
                start_time: schedule.startTime,
                end_time: schedule.endTime
              });
              
              if (newSlot) {
                slotId = newSlot.slot_id;
                // Refresh time slots list
                currentTimeSlots = await db.getTimeSlots();
              }
            }
          }
          
          processedSchedules.push({
            student_id: realStudentId,
            subject_id: realSubjectId,
            weekday_id: schedule.weekday_id,
            slot_id: slotId
          });
        }
        
        await db.importSchedule(processedSchedules);
      }

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      setSuccess(true);

    } catch (err: any) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParseResult(null);
    setSuccess(false);
    setShowPreview(false);
  };

  const getStatusIcon = (type: string) => {
    if (type.includes('MISSING') || type.includes('UNKNOWN')) {
      return <AlertTriangle className="w-4 h-4 text-brand-warning" />;
    }
    if (type.includes('COLUMN_COUNT') || type.includes('EMPTY') || type.includes('MERGED')) {
      return <AlertCircle className="w-4 h-4 text-brand-info" />;
    }
    return <Info className="w-4 h-4 text-dark-muted" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="glass-card p-6 mb-6">
          <h2 className="font-extrabold text-xl text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-secondary animate-pulse" />
            📤 Flexible Import Mode
          </h2>
          <p className="text-sm text-dark-muted mt-2">
            نظام مرن للغاية! يقبل أي ملف، يكمل النقص تلقائيًا، ولا يرفض إلا إذا كان الملف تالفًا تمامًا.
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
              <p className="text-sm font-bold text-white mb-2">اختيار ملف (أي ملف!)</p>
              <p className="text-xs text-dark-muted">
                يدعم Excel/CSV/صور - النظام سيعمل مع أي تنسيق!
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
              <h3 className="font-bold text-white">⚡ جاري تحليل وتصحيح الملف تلقائيًا...</h3>
            </div>
            <div className="space-y-2">
              {[
                'قراءة الملف',
                'تحليل العناوين',
                'تحديد الأعمدة',
                'تصحيح النقص تلقائيًا',
                'تحضير التقرير'
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-dark-muted animate-pulse">
                  <div className="w-4 h-4 rounded-full bg-dark-border" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Parse Result */}
        {parseResult && (
          <div className="space-y-6">
            {/* Import Report */}
            <div className="glass-card p-6">
              <h3 className="font-extrabold text-lg text-white mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-success" />
                📊 Import Report
              </h3>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-dark-bg/60 rounded-xl border border-dark-border">
                  <p className="text-xs text-dark-muted mb-1">الصفوف الناجحة</p>
                  <p className="text-2xl font-black text-brand-success">
                    {parseResult.report.successfulRows}
                  </p>
                </div>
                <div className="p-4 bg-dark-bg/60 rounded-xl border border-dark-border">
                  <p className="text-xs text-dark-muted mb-1">تحذيرات</p>
                  <p className="text-2xl font-black text-brand-warning">
                    {parseResult.report.totalWarnings}
                  </p>
                </div>
                <div className="p-4 bg-dark-bg/60 rounded-xl border border-dark-border">
                  <p className="text-xs text-dark-muted mb-1">تم التصحيح تلقائيًا</p>
                  <p className="text-2xl font-black text-brand-info">
                    {parseResult.report.autoFixedCount}
                  </p>
                </div>
                <div className="p-4 bg-dark-bg/60 rounded-xl border border-dark-border">
                  <p className="text-xs text-dark-muted mb-1">أعمدة متجاهلة</p>
                  <p className="text-2xl font-black text-dark-muted">
                    {parseResult.report.ignoredColumns.length}
                  </p>
                </div>
              </div>

              {/* Warnings List */}
              {parseResult.report.warnings.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-brand-warning" />
                    ⚠️ التحذيرات:
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto bg-dark-bg/40 rounded-xl p-3">
                    {parseResult.report.warnings.slice(0, 10).map((warning) => (
                      <div key={warning.id} className="flex items-start gap-2 text-xs">
                        {getStatusIcon(warning.type)}
                        <span className={warning.autoFixed ? 'text-brand-success' : 'text-brand-warning'}>
                          {warning.message}
                          {warning.autoFixed && ' (تم التصحيح)'}
                        </span>
                      </div>
                    ))}
                    {parseResult.report.warnings.length > 10 && (
                      <div className="text-center text-xs text-dark-muted">
                        +{parseResult.report.warnings.length - 10} تحذير آخر...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-dark-bg/60 rounded-xl border border-dark-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-dark-muted">الطلاب</p>
                      <p className="text-xl font-black text-white">{parseResult.stats.totalStudents}</p>
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
                      <p className="text-xl font-black text-white">{parseResult.stats.totalSubjects}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-dark-bg/60 rounded-xl border border-dark-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-info/10 text-brand-info flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-dark-muted">التخصصات</p>
                      <p className="text-xl font-black text-white">{parseResult.stats.totalDepartments}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-dark-bg/60 rounded-xl border border-dark-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-success/10 text-brand-success flex items-center justify-center">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-dark-muted">الجلسات</p>
                      <p className="text-xl font-black text-white">{parseResult.stats.totalSchedules}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Toggle */}
            {!success && (
              <div className="glass-card p-4 flex items-center justify-between">
                <p className="text-sm text-white">
                  عرض البيانات قبل الحفظ؟
                </p>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="btn-secondary px-4 py-2 text-xs flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? 'إخفاء المعاينة' : 'معاينة البيانات'}
                </button>
              </div>
            )}

            {/* Preview Table */}
            {showPreview && parseResult.report.processedRows.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-brand-info" />
                  📋 معاينة بيانات الطلاب (أول 10 صفوف)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-dark-border">
                        <th className="text-right py-3 px-2 text-dark-muted">#</th>
                        <th className="text-right py-3 px-2 text-dark-muted">الاسم</th>
                        <th className="text-right py-3 px-2 text-dark-muted">الرقم الأكاديمي</th>
                        <th className="text-right py-3 px-2 text-dark-muted">الجوال</th>
                        <th className="text-right py-3 px-2 text-dark-muted">التخصص</th>
                        <th className="text-right py-3 px-2 text-dark-muted">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseResult.report.processedRows.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-b border-dark-border/30 hover:bg-dark-bg/40">
                          <td className="py-2 px-2 text-white">{i + 1}</td>
                          <td className="py-2 px-2 text-white">{row.processed.fullName}</td>
                          <td className="py-2 px-2 text-dark-muted">{row.processed.academicId}</td>
                          <td className="py-2 px-2 text-dark-muted">{row.processed.phone}</td>
                          <td className="py-2 px-2 text-dark-muted">{row.processed.department}</td>
                          <td className="py-2 px-2">
                            {row.warnings.length > 0 ? (
                              <span className="text-brand-warning flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                تم التصحيح
                              </span>
                            ) : (
                              <span className="text-brand-success flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                ناجح
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parseResult.report.processedRows.length > 10 && (
                    <div className="text-center text-xs text-dark-muted mt-3">
                      +{parseResult.report.processedRows.length - 10} طالب آخر...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!success && (
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
            )}

            {/* Success State */}
            {success && (
              <div className="glass-card p-10 text-center">
                <div className="w-20 h-20 rounded-full bg-brand-success/20 text-brand-success flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 animate-bounce" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">تم الاستيراد بنجاح! 🎉</h3>
                <p className="text-sm text-dark-muted mb-6">اضغط على "موافق" للعودة إلى لوحة التحكم</p>
                <button
                  onClick={onImportSuccess}
                  className="btn-primary flex items-center justify-center gap-2 mx-auto"
                >
                  <Check className="w-5 h-5" />
                  موافق
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
