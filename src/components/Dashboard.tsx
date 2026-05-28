import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  UploadCloud,
  Database,
  BarChart3,
  LogIn,
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  PlayCircle,
  X
} from 'lucide-react';
import { db, migrateLocalToSupabase } from '../lib/supabase';
import type { 
  Student, 
  Subject, 
  StudentSchedule, 
  TimeSlot,
  AttendanceLog
} from '../types/database';

// Animated Counter Component
const AnimatedCounter = ({ value, suffix = '' }: { value: number, suffix?: string }) => {
  const [display, setDisplay] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const duration = 800;
    const increment = value / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span className="text-3xl font-black text-white mb-1">{display}{suffix}</span>;
};

export default function Dashboard({ setActivePage }: { setActivePage: (p: string) => void }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schedules, setSchedules] = useState<StudentSchedule[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayDate, setTodayDate] = useState('');
  const [todayWeekdayId, setTodayWeekdayId] = useState(1);
  const [migrating, setMigrating] = useState(false);
  const [migrateMessage, setMigrateMessage] = useState<string | null>(null);
  
  // Modals
  const [showLoginLogs, setShowLoginLogs] = useState(false);
  const [showSmartAnalysis, setShowSmartAnalysis] = useState(false);
  
  // Simulated login logs type
  type SimulatedLoginLog = {
    id: number;
    studentName: string;
    academicId: string;
    loginTime: string;
    device: string;
    lastActivity: string;
    status: string;
    loginCount: number;
  };
  
  // Simulated login logs (since we don't have real data)
  const [loginLogs, setLoginLogs] = useState<SimulatedLoginLog[]>([]);
  
  // Update login logs when students change
  useEffect(() => {
    const devices = ['جهاز محمول', 'كمبيوتر مكتب', 'تابلت', 'مستعرض الإنترنت'];
    const newLogs: SimulatedLoginLog[] = [];
    
    students.forEach((student, i) => {
      const lastLogin = new Date();
      lastLogin.setMinutes(lastLogin.getMinutes() - (i * 30));
      
      newLogs.push({
        id: student.student_id,
        studentName: student.full_name,
        academicId: student.academic_id,
        loginTime: lastLogin.toISOString(),
        device: devices[Math.floor(Math.random() * devices.length)],
        lastActivity: 'مشاهدة جدول المحاضرات',
        status: i < 5 ? 'متصل الآن' : 'غير متصل',
        loginCount: Math.floor(Math.random() * 50) + 10
      });
    });
    
    // Sort by login time
    newLogs.sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime());
    
    // Update the state
    setLoginLogs(newLogs);
  }, [students]);
  
  // Search state for login logs
  const [loginSearch, setLoginSearch] = useState('');

  // Helper: Get today's date in Arabic format
  const formatTodayDate = () => {
    const now = new Date();
    const daysAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const dayIndex = now.getDay();
    const adjustedDayIndex = dayIndex === 0 ? 0 : dayIndex;
    
    setTodayWeekdayId(adjustedDayIndex + 1);
    setTodayDate(`${daysAr[adjustedDayIndex]} ${now.getDate()} ${monthsAr[now.getMonth()]} ${now.getFullYear()}`);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      formatTodayDate();

      const [studentsData, subjectsData, schedulesData, slotsData, attendanceData] = await Promise.all([
        db.getStudents(),
        db.getSubjects(),
        db.getSchedules(),
        db.getTimeSlots(),
        db.getAttendance()
      ]);

      setStudents(studentsData);
      setSubjects(subjectsData);
      setSchedules(schedulesData);
      setTimeSlots(slotsData);
      setAttendanceLogs(attendanceData);
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

  // Calculate attendance stats
  const attendanceStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = attendanceLogs.filter(log => log.attendance_date === todayStr);
    const presentToday = new Set<number>();
    const absentToday = new Set<number>();
    
    todayLogs.forEach(log => {
      const schedule = schedules.find(s => s.schedule_id === log.schedule_id);
      if (schedule) {
        if (log.status === 'حاضر' || log.status === 'متأخر') {
          presentToday.add(schedule.student_id);
        } else {
          absentToday.add(schedule.student_id);
        }
      }
    });
    
    const totalStudents = students.filter(s => s.role === 'student').length;
    const presentCount = presentToday.size;
    const absentCount = totalStudents - presentCount;
    const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
    const absenceRate = 100 - attendanceRate;
    
    return {
      totalStudents,
      presentCount,
      absentCount,
      attendanceRate,
      absenceRate
    };
  }, [students, schedules, attendanceLogs]);
  
  // Student attendance analysis
  const studentAttendanceAnalysis = useMemo(() => {
    const studentOnly = students.filter(s => s.role === 'student');
    const analysis = studentOnly.map(student => {
      const studentAttendanceLogs = attendanceLogs.filter(log => {
        const schedule = schedules.find(s => s.schedule_id === log.schedule_id);
        return schedule && schedule.student_id === student.student_id;
      });
      
      const daysPresent = new Set<string>();
      const daysAbsent = new Set<string>();
      let lastAttendance: string | null = null;
      
      studentAttendanceLogs.forEach(log => {
        if (log.status === 'حاضر' || log.status === 'متأخر') {
          daysPresent.add(log.attendance_date);
        } else {
          daysAbsent.add(log.attendance_date);
        }
        
        if (!lastAttendance || new Date(log.attendance_date) > new Date(lastAttendance)) {
          lastAttendance = log.attendance_date;
        }
      });
      
      const totalTrackedDays = daysPresent.size + daysAbsent.size;
      const overallRate = totalTrackedDays > 0 ? Math.round((daysPresent.size / totalTrackedDays) * 100) : 100;
      
      return {
        student,
        daysPresent: daysPresent.size,
        daysAbsent: daysAbsent.size,
        overallRate,
        lastAttendance
      };
    });
    
    return analysis.sort((a, b) => a.student.full_name.localeCompare(b.student.full_name, 'ar'));
  }, [students, schedules, attendanceLogs]);

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
  
  const todaySchedule = getTodayScheduleBySlot();
  
  // Smart analysis data
  const smartAnalysis = useMemo(() => {
    const sortedByAttendance = [...studentAttendanceAnalysis].sort((a, b) => b.overallRate - a.overallRate);
    const top5 = sortedByAttendance.slice(0, 5);
    const bottom5 = sortedByAttendance.slice(-5).reverse();
    const averageRate = Math.round(sortedByAttendance.reduce((sum, a) => sum + a.overallRate, 0) / sortedByAttendance.length);
    
    return { top5, bottom5, averageRate };
  }, [studentAttendanceAnalysis]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-6 h-32 bg-dark-border/50 rounded-2xl" />
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 h-40 bg-dark-border/50 rounded-2xl" />
          <div className="glass-card p-6 h-40 bg-dark-border/50 rounded-2xl" />
        </div>
        
        <div className="glass-card p-6 h-80 bg-dark-border/50 rounded-2xl" />
        <div className="glass-card p-6 h-80 bg-dark-border/50 rounded-2xl" />
      </div>
    );
  }

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

      {/* 1. SMART ATTENDANCE STATS */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-primary" />
          📊 إحصائيات الحضور الذكية
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="glass-card p-6 hover:-translate-y-1 transition-all relative overflow-hidden group col-span-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl group-hover:bg-brand-primary/10 transition-colors" />
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div>
              <AnimatedCounter value={attendanceStats.totalStudents} />
              <p className="text-sm text-dark-muted font-semibold">طالب إجمالي</p>
            </div>
          </div>
          
          <div className="glass-card p-6 hover:-translate-y-1 transition-all relative overflow-hidden group col-span-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-success/5 rounded-full blur-3xl group-hover:bg-brand-success/10 transition-colors" />
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-success/10 text-brand-success flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
            <div>
              <AnimatedCounter value={attendanceStats.presentCount} />
              <p className="text-sm text-dark-muted font-semibold">حاضرين اليوم</p>
            </div>
          </div>
          
          <div className="glass-card p-6 hover:-translate-y-1 transition-all relative overflow-hidden group col-span-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-danger/5 rounded-full blur-3xl group-hover:bg-brand-danger/10 transition-colors" />
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-danger/10 text-brand-danger flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
            </div>
            <div>
              <AnimatedCounter value={attendanceStats.absentCount} />
              <p className="text-sm text-dark-muted font-semibold">غائبين اليوم</p>
            </div>
          </div>
          
          <div className="glass-card p-6 hover:-translate-y-1 transition-all relative overflow-hidden group col-span-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-info/5 rounded-full blur-3xl group-hover:bg-brand-info/10 transition-colors" />
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-info/10 text-brand-info flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <div>
              <AnimatedCounter value={attendanceStats.attendanceRate} suffix="%" />
              <p className="text-sm text-dark-muted font-semibold">نسبة الحضور</p>
            </div>
          </div>
          
          <div className="glass-card p-6 hover:-translate-y-1 transition-all relative overflow-hidden group col-span-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-warning/5 rounded-full blur-3xl group-hover:bg-brand-warning/10 transition-colors" />
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-warning/10 text-brand-warning flex items-center justify-center">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>
            <div>
              <AnimatedCounter value={attendanceStats.absenceRate} suffix="%" />
              <p className="text-sm text-dark-muted font-semibold">نسبة الغياب</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 2. LOGIN STATS + VIEW LOGS BUTTON */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <LogIn className="w-6 h-6 text-brand-secondary" />
            👥 إحصائيات الدخول للنظام
          </h2>
          <button onClick={() => setShowLoginLogs(true)} className="btn-secondary px-6 py-3 flex items-center gap-2 rounded-xl">
            <Calendar className="w-5 h-5" /> عرض سجلات الدخول
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6 hover:-translate-y-1 transition-all relative overflow-hidden group col-span-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl group-hover:bg-brand-primary/10 transition-colors" />
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
            </div>
            <div>
              <AnimatedCounter value={Math.min(5, students.length)} />
              <p className="text-sm text-dark-muted font-semibold">متصلون الآن</p>
            </div>
          </div>
          
          <div className="glass-card p-6 hover:-translate-y-1 transition-all relative overflow-hidden group col-span-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-success/5 rounded-full blur-3xl group-hover:bg-brand-success/10 transition-colors" />
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-success/10 text-brand-success flex items-center justify-center">
                <LogIn className="w-6 h-6" />
              </div>
            </div>
            <div>
              <AnimatedCounter value={students.filter(s => s.role === 'student').length} />
              <p className="text-sm text-dark-muted font-semibold">دخلوا اليوم</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 4. STUDENT ATTENDANCE ANALYSIS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-info" />
            📈 تحليل حضور الطلاب
          </h2>
          <button onClick={() => setShowSmartAnalysis(true)} className="btn-primary px-6 py-3 flex items-center gap-2 rounded-xl">
            <Activity className="w-5 h-5" /> تحليل ذكي
          </button>
        </div>
        
        <div className="glass-card p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-dark-border/50">
                  <th className="pb-4 text-white font-bold text-sm">اسم الطالب</th>
                  <th className="pb-4 text-white font-bold text-sm">الرقم الأكاديمي</th>
                  <th className="pb-4 text-white font-bold text-sm">نسبة الحضور</th>
                  <th className="pb-4 text-white font-bold text-sm">أيام الحضور</th>
                  <th className="pb-4 text-white font-bold text-sm">أيام الغياب</th>
                  <th className="pb-4 text-white font-bold text-sm">آخر حضور</th>
                </tr>
              </thead>
              <tbody>
                {studentAttendanceAnalysis.map(({ student, daysPresent, daysAbsent, overallRate, lastAttendance }) => (
                  <tr key={student.student_id} className="border-b border-dark-border/30 hover:bg-dark-bg/40 transition-colors">
                    <td className="py-4 text-white font-medium">{student.full_name}</td>
                    <td className="py-4 text-dark-muted">{student.academic_id}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${overallRate >= 90 ? 'text-brand-success' : overallRate >= 70 ? 'text-brand-warning' : 'text-brand-danger'}`}>
                          {overallRate}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-brand-success text-sm font-semibold">{daysPresent}</td>
                    <td className="py-4 text-brand-danger text-sm font-semibold">{daysAbsent}</td>
                    <td className="py-4 text-dark-muted text-sm">
                      {lastAttendance || 'لم يحضر بعد'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                
                <div className="mr-13 space-y-3">
                  {Array.from(subjects.values()).map(({ subject, count }) => (
                    <div 
                      key={subject.subject_id}
                      className="p-4 bg-dark-bg/60 rounded-xl border border-dark-border/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 rounded-full bg-brand-primary" />
                        <div>
                          <p className="font-bold text-white">{subject.subject_name}</p>
                          <p className="text-xs text-dark-muted">عدد الطلاب: {count}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setActivePage('attendance')}
                        className="btn-primary px-4 py-2 flex items-center gap-2 text-sm"
                      >
                        <PlayCircle className="w-4 h-4" />
                        بدء التحضير
                      </button>
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
      
      {/* LOGIN LOGS MODAL */}
      {showLoginLogs && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl">
            <div className="p-6 border-b border-dark-border flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <LogIn className="w-6 h-6 text-brand-primary" />
                سجلات الدخول للنظام
              </h3>
              <button onClick={() => setShowLoginLogs(false)} className="p-2 bg-dark-hover rounded-lg">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="p-4 border-b border-dark-border">
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-muted" />
                <input 
                  type="text" 
                  placeholder="بحث برقم الأكاديمي أو الاسم..."
                  value={loginSearch}
                  onChange={(e) => setLoginSearch(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl pr-12 pl-4 py-3 text-white focus:outline-none"
                />
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-dark-border/50">
                      <th className="pb-4 text-white font-bold text-sm">اسم الطالب</th>
                      <th className="pb-4 text-white font-bold text-sm">الرقم الأكاديمي</th>
                      <th className="pb-4 text-white font-bold text-sm">وقت الدخول</th>
                      <th className="pb-4 text-white font-bold text-sm">نوع الجهاز</th>
                      <th className="pb-4 text-white font-bold text-sm">آخر نشاط</th>
                      <th className="pb-4 text-white font-bold text-sm">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginLogs.filter(log => 
                      log.studentName.includes(loginSearch) || log.academicId.includes(loginSearch)
                    ).map(log => (
                      <tr key={log.id} className="border-b border-dark-border/30 hover:bg-dark-bg/40 transition-colors">
                        <td className="py-3 text-white font-medium">{log.studentName}</td>
                        <td className="py-3 text-dark-muted">{log.academicId}</td>
                        <td className="py-3 text-dark-muted text-sm">
                          {new Date(log.loginTime).toLocaleString('ar-SA')}
                        </td>
                        <td className="py-3 text-dark-muted">{log.device}</td>
                        <td className="py-3 text-dark-muted text-sm">{log.lastActivity}</td>
                        <td className="py-3">
                          <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                            log.status === 'متصل الآن' 
                              ? 'bg-brand-success/20 text-brand-success' 
                              : 'bg-dark-muted/20 text-dark-muted'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="p-4 border-t border-dark-border text-center">
              <button 
                onClick={() => setShowLoginLogs(false)}
                className="btn-secondary px-6 py-2"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* SMART ANALYSIS MODAL */}
      {showSmartAnalysis && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl">
            <div className="p-6 border-b border-dark-border flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="w-6 h-6 text-brand-primary" />
                تحليل ذكي للحضور
              </h3>
              <button onClick={() => setShowSmartAnalysis(false)} className="p-2 bg-dark-hover rounded-lg">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="text-center mb-8">
                <p className="text-4xl font-black text-brand-primary">{smartAnalysis.averageRate}%</p>
                <p className="text-dark-muted text-lg">متوسط الحضور العام</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Top 5 */}
                <div>
                  <h4 className="text-lg font-bold text-brand-success mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    🎉 أعلى 5 طلاب حضوراً
                  </h4>
                  <div className="space-y-3">
                    {smartAnalysis.top5.map((a, i) => (
                      <div key={a.student.student_id} className="p-4 bg-brand-success/5 border border-brand-success/20 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-black text-brand-success">#{i + 1}</span>
                          <div>
                            <p className="font-bold text-white">{a.student.full_name}</p>
                            <p className="text-xs text-dark-muted">{a.student.academic_id}</p>
                          </div>
                        </div>
                        <span className="text-2xl font-black text-brand-success">{a.overallRate}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Bottom 5 */}
                <div>
                  <h4 className="text-lg font-bold text-brand-danger mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    ⚠️ أقل 5 طلاب حضوراً
                  </h4>
                  <div className="space-y-3">
                    {smartAnalysis.bottom5.map((a, i) => (
                      <div key={a.student.student_id} className="p-4 bg-brand-danger/5 border border-brand-danger/20 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-black text-brand-danger">#{i + 1}</span>
                          <div>
                            <p className="font-bold text-white">{a.student.full_name}</p>
                            <p className="text-xs text-dark-muted">{a.student.academic_id}</p>
                          </div>
                        </div>
                        <span className="text-2xl font-black text-brand-danger">{a.overallRate}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-dark-border text-center">
              <button 
                onClick={() => setShowSmartAnalysis(false)}
                className="btn-secondary px-6 py-2"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
