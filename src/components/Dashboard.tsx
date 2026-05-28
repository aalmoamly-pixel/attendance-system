import { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Building2, 
  Clock,
  CheckCircle2,
  RefreshCw,
  UploadCloud,
  Database
} from 'lucide-react';
import { db, migrateLocalToSupabase } from '../lib/supabase';
import type { 
  Student, 
  Subject, 
  Department, 
  StudentSchedule, 
  TimeSlot
} from '../types/database';

export default function Dashboard({ setActivePage: _setActivePage }: { setActivePage: (p: string) => void }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [schedules, setSchedules] = useState<StudentSchedule[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayDate, setTodayDate] = useState('');
  const [todayWeekdayId, setTodayWeekdayId] = useState(1);
  const [migrating, setMigrating] = useState(false);
  const [migrateMessage, setMigrateMessage] = useState<string | null>(null);

  // Helper: Get today's date in Arabic format
  const formatTodayDate = () => {
    const now = new Date();
    const daysAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const dayIndex = now.getDay();
    const adjustedDayIndex = dayIndex === 0 ? 0 : dayIndex; // Sunday is 1, but Date.getDay() returns 0 for Sunday
    
    setTodayWeekdayId(adjustedDayIndex + 1); // 1=الأحد, 2=الإثنين...
    setTodayDate(`${daysAr[adjustedDayIndex]} ${now.getDate()} ${monthsAr[now.getMonth()]} ${now.getFullYear()}`);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      formatTodayDate();

      const [studentsData, subjectsData, deptsData, schedulesData, slotsData] = await Promise.all([
        db.getStudents(),
        db.getSubjects(),
        db.getDepartments(),
        db.getSchedules(),
        db.getTimeSlots()
      ]);

      setStudents(studentsData);
      setSubjects(subjectsData);
      setDepartments(deptsData);
      setSchedules(schedulesData);
      setTimeSlots(slotsData);
    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ أثناء تحميل البيانات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Group today's schedules by slot
  const getTodayScheduleBySlot = () => {
    const todaySchedules = schedules.filter(s => s.weekday_id === todayWeekdayId);
    
    const grouped = new Map<number, { slot: TimeSlot, subjects: Map<number, { subject: Subject, count: number }> }>();
    
    timeSlots.forEach(slot => {
      grouped.set(slot.slot_id, { slot, subjects: new Map() });
    });

    // Count students per subject
    const subjectStudentCount = new Map<number, number>();
    todaySchedules.forEach(schedule => {
      const current = subjectStudentCount.get(schedule.subject_id) || 0;
      subjectStudentCount.set(schedule.subject_id, current + 1);
    });

    // Add unique subjects to each slot
    const processedSubjectIds = new Set<number>();
    todaySchedules.forEach(schedule => {
      const slotData = grouped.get(schedule.slot_id);
      const subject = subjects.find(s => s.subject_id === schedule.subject_id);
      
      if (slotData && subject && !processedSubjectIds.has(subject.subject_id)) {
        processedSubjectIds.add(subject.subject_id);
        const count = subjectStudentCount.get(subject.subject_id) || 0;
        slotData.subjects.set(subject.subject_id, { subject, count });
      }
    });

    return grouped;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-6 h-28 bg-dark-border/50 rounded-2xl" />
          ))}
        </div>
        <div className="glass-card p-6 h-80 bg-dark-border/50 rounded-2xl" />
      </div>
    );
  }

  const todaySchedule = getTodayScheduleBySlot();

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* MIGRATION MESSAGE */}
      {migrateMessage && (
        <div className="p-4 bg-brand-success/10 border border-brand-success/20 rounded-xl text-brand-success flex items-center justify-between">
          <span>{migrateMessage}</span>
        </div>
      )}
      
      {/* ERROR HEADER */}
      {error && (
        <div className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-xl text-brand-danger flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchData} className="btn-secondary px-3 py-1 flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> إعادة المحاولة
          </button>
        </div>
      )}
      
      {/* MIGRATION BUTTON */}
      <div className="glass-card p-6 border-2 border-brand-primary/30 bg-brand-primary/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white">🔄 استيراد البيانات من التخزين المحلي إلى قاعدة البيانات</h3>
              <p className="text-sm text-dark-muted">انقر هنا لنقل جميع الطلاب والمواد والجداول من التخزين المحلي إلى Supabase</p>
            </div>
          </div>
          <button 
            onClick={async () => {
              setMigrating(true);
              setMigrateMessage(null);
              setError(null);
              try {
                const result = await migrateLocalToSupabase();
                if (result.success) {
                  setMigrateMessage(result.message);
                  await fetchData();
                } else {
                  setError(result.message);
                }
              } catch (err: any) {
                setError(err.message || 'حدث خطأ');
              } finally {
                setMigrating(false);
              }
            }}
            disabled={migrating}
            className="btn-primary px-6 py-3 flex items-center gap-2"
          >
            {migrating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" /> جاري الاستيراد...
              </>
            ) : (
              <>
                <Database className="w-5 h-5" /> استيراد الآن
              </>
            )}
          </button>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* TOTAL STUDENTS */}
        <div className="glass-card p-6 hover:-translate-y-1 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl group-hover:bg-brand-primary/10 transition-colors" />
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-white mb-1">{students.length}</p>
            <p className="text-sm text-dark-muted font-semibold">طالب إجمالي</p>
          </div>
        </div>

        {/* TOTAL SUBJECTS */}
        <div className="glass-card p-6 hover:-translate-y-1 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-secondary/5 rounded-full blur-3xl group-hover:bg-brand-secondary/10 transition-colors" />
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-secondary/10 text-brand-secondary flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-white mb-1">{subjects.length}</p>
            <p className="text-sm text-dark-muted font-semibold">مادة مسجلة</p>
          </div>
        </div>

        {/* TOTAL SCHEDULES */}
        <div className="glass-card p-6 hover:-translate-y-1 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-info/5 rounded-full blur-3xl group-hover:bg-brand-info/10 transition-colors" />
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-info/10 text-brand-info flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-white mb-1">{schedules.length}</p>
            <p className="text-sm text-dark-muted font-semibold">جلسة مجدولة</p>
          </div>
        </div>

        {/* TOTAL DEPARTMENTS */}
        <div className="glass-card p-6 hover:-translate-y-1 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-success/5 rounded-full blur-3xl group-hover:bg-brand-success/10 transition-colors" />
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-success/10 text-brand-success flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-white mb-1">{departments.length}</p>
            <p className="text-sm text-dark-muted font-semibold">تخصصات مختلفة</p>
          </div>
        </div>

      </div>

      {/* TODAY'S SCHEDULE */}
      <div className="glass-card p-6">
        <h2 className="font-extrabold text-xl text-white mb-6 flex items-center gap-3">
          <Calendar className="w-6 h-6 text-brand-secondary" />
          📅 جدول اليوم: {todayDate}
        </h2>

        <div className="space-y-8">
          {Array.from(todaySchedule.values()).map(({ slot, subjects }) => (
            subjects.size > 0 && (
              <div key={slot.slot_id} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-dark-bg/80 text-brand-info flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    🕓 {slot.slot_name} ({slot.start_time} - {slot.end_time})
                  </h3>
                </div>
                
                <div className="mr-13 space-y-2">
                  {Array.from(subjects.values()).map(({ subject, count }) => (
                    <div 
                      key={subject.subject_id}
                      className="p-4 bg-dark-bg/60 rounded-xl border border-dark-border/40 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 rounded-full bg-brand-primary" />
                        <div>
                          <p className="font-bold text-white">{subject.subject_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-brand-success" />
                        <span className="text-sm font-semibold text-brand-success">{count} طلاب حاضرين</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}

          {Array.from(todaySchedule.values()).every(s => s.subjects.size === 0) && (
            <div className="py-12 text-center">
              <p className="text-lg font-bold text-dark-muted">لا توجد محاضرات مجدولة اليوم 🎉</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
