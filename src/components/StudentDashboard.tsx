import { useState, useEffect } from 'react';
import { 
  User, 
  BookOpen, 
  Calendar, 
  AlertTriangle, 
  LogOut,
  Award,
  Clock,
  X,
  Check,
  Bell,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { db } from '../lib/supabase';
import { getAuthState } from '../lib/auth';
import type { Student, Notification, PersonalNote } from '../types/database';
import Notifications from './Notifications';
import StudentPayments from './StudentPayments';

interface StudentDashboardProps {
  onLogout: () => void;
}

export default function StudentDashboard({ onLogout }: StudentDashboardProps) {
  const [student, setStudent] = useState<Student | null>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [attendanceRates, setAttendanceRates] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [personalNote, setPersonalNote] = useState<PersonalNote | null>(null);
  const [showNote, setShowNote] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'notifications' | 'payments'>('dashboard');

  useEffect(() => {
    const authState = getAuthState();
    if (authState.user) {
      setStudent(authState.user);
      loadData(authState.user.student_id);
    }
  }, []);

  const loadData = async (studentId: number) => {
    try {
      setLoading(true);
      const [studentSchedule, rates, note, notifs] = await Promise.all([
        db.getStudentSchedule(studentId),
        db.calculateAttendanceRates(studentId),
        db.getPersonalNote(studentId),
        db.getNotifications(studentId)
      ]);
      
      setSchedule(studentSchedule);
      setAttendanceRates(rates);
      setPersonalNote(note);
      setNotifications(notifs);
      setShowNote(note?.is_active ?? false);
    } catch (err) {
      console.error('[StudentDashboard] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRateColor = (rate: number) => {
    if (rate >= 85) return 'text-brand-success';
    if (rate >= 70) return 'text-yellow-500';
    return 'text-brand-danger';
  };

  const getRateBg = (rate: number) => {
    if (rate >= 85) return 'bg-brand-success/10';
    if (rate >= 70) return 'bg-yellow-500/10';
    return 'bg-brand-danger/10';
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">أهلاً {student?.full_name}</h1>
              <p className="text-sm text-dark-muted">رقم الطالب: {student?.academic_id}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`relative flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-all text-sm ${
                activeTab === 'notifications'
                  ? 'bg-brand-primary text-white'
                  : 'bg-dark-card text-dark-muted hover:bg-dark-hover'
              }`}
            >
              <Bell className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="hidden sm:inline">الرسائل</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-danger text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-all text-sm ${
                activeTab === 'payments'
                  ? 'bg-brand-primary text-white'
                  : 'bg-dark-card text-dark-muted hover:bg-dark-hover'
              }`}
            >
              <DollarSign className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="hidden sm:inline">المدفوعات</span>
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-all text-sm ${
                activeTab === 'dashboard'
                  ? 'bg-brand-primary text-white'
                  : 'bg-dark-card text-dark-muted hover:bg-dark-hover'
              }`}
            >
              <Award className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="hidden sm:inline">لوحة التحكم</span>
            </button>
            <button
              onClick={onLogout}
              className="btn-secondary flex-1 md:flex-none px-3 sm:px-4 py-2 flex items-center justify-center gap-2 text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
            </button>
          </div>
        </div>

        {showNote && personalNote && (
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-md" onClick={() => setShowNote(false)} />
            <div className="relative glass-card w-full max-w-2xl animate-slide-up overflow-hidden border-2 border-brand-warning/30 shadow-2xl shadow-brand-warning/20">
              <div className="bg-gradient-to-r from-brand-warning/20 to-brand-primary/20 p-6 border-b border-dark-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-warning to-brand-primary flex items-center justify-center animate-pulse">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">ملاحظة مهمة</h2>
                      <p className="text-sm text-dark-muted mt-1">من إدارة تحضير الطلاب</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNote(false)}
                    className="p-3 rounded-xl bg-dark-card border border-dark-border hover:bg-dark-hover text-dark-muted hover:text-white transition-all hover:scale-105"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-8">
                <div className="relative">
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-brand-warning/10 rounded-full blur-3xl" />
                  <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-brand-primary/10 rounded-full blur-3xl" />
                  
                  <div className="relative bg-gradient-to-br from-brand-warning/10 via-brand-warning/5 to-brand-primary/10 border-2 border-brand-warning/30 rounded-2xl p-8">
                    <p className="text-white text-xl leading-relaxed whitespace-pre-wrap">
                      {personalNote.note}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-dark-bg/50 p-6 border-t border-dark-border flex items-center justify-end gap-4">
                <button
                  onClick={() => setShowNote(false)}
                  className="btn-primary px-8 py-3.5 flex items-center gap-3 text-lg font-bold hover:scale-105 transition-transform"
                >
                  <Check className="w-6 h-6" />
                  فهمت والشكر
                </button>
              </div>
            </div>
          </div>
        )}

        {attendanceRates && attendanceRates.overallRate < 75 && activeTab === 'dashboard' && (
          <div className="mb-8 p-6 rounded-xl bg-brand-danger/10 border border-brand-danger/20 flex items-center gap-4 animate-pulse">
            <AlertTriangle className="w-10 h-10 text-brand-danger flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold text-brand-danger">⚠️ مرحلة حرمان</h3>
              <p className="text-dark-muted mt-1">نسبة حضورك أقل من 75%، يرجى الحرص على الحضور</p>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="glass-card p-4 sm:p-6 hover:scale-[1.02] transition-transform overflow-hidden">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${attendanceRates ? getRateBg(attendanceRates.overallRate) : 'bg-dark-card'}`}>
                    <Award className={`w-6 h-6 sm:w-8 sm:h-8 ${attendanceRates ? getRateColor(attendanceRates.overallRate) : 'text-brand-primary'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-dark-muted text-sm">النسبة الإجمالية</p>
                    <p className={`text-2xl sm:text-3xl font-bold truncate ${attendanceRates ? getRateColor(attendanceRates.overallRate) : 'text-white'}`}>
                      {attendanceRates ? attendanceRates.overallRate : 0}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 sm:p-6 hover:scale-[1.02] transition-transform overflow-hidden">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-brand-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-dark-muted text-sm">المواد المسجلة</p>
                    <p className="text-2xl sm:text-3xl font-bold text-white truncate">{schedule.length}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 sm:p-6 hover:scale-[1.02] transition-transform overflow-hidden sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-brand-secondary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-brand-secondary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-dark-muted text-sm">الحاضر</p>
                    <p className="text-2xl sm:text-3xl font-bold text-brand-success truncate">
                      {attendanceRates ? attendanceRates.bySubject.reduce((sum: number, s: any) => sum + s.attended, 0) : 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div className="glass-card p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                  <BookOpen className="w-5 sm:w-6 h-5 sm:h-6 text-brand-primary" />
                  المواد و نسب الحضور
                </h2>
                
                {attendanceRates && attendanceRates.bySubject.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {attendanceRates.bySubject.map((subject: any) => (
                      <div key={subject.subject_id} className="p-3 sm:p-4 rounded-xl bg-dark-bg border border-dark-border hover:border-brand-primary/50 transition-all overflow-hidden">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-white truncate">{subject.subject_name}</h4>
                            <p className="text-sm text-dark-muted mt-1">
                              {subject.attended} من {subject.totalSessions} جلسة
                            </p>
                          </div>
                          <div className={`px-3 sm:px-4 py-2 rounded-lg ${getRateBg(subject.rate)} flex-shrink-0`}>
                            <span className={`font-bold text-sm sm:text-base ${getRateColor(subject.rate)}`}>
                              {subject.rate}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <div className="h-2 bg-dark-card rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                subject.rate >= 85 ? 'bg-brand-success' :
                                subject.rate >= 70 ? 'bg-yellow-500' : 'bg-brand-danger'
                              }`}
                              style={{ width: `${Math.min(subject.rate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-dark-muted">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لم يتم تسجيل أي مواد بعد</p>
                  </div>
                )}
              </div>

              <div className="glass-card p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                  <Calendar className="w-5 sm:w-6 h-5 sm:h-6 text-brand-secondary" />
                  جدول المحاضرات
                </h2>
                
                {schedule.length > 0 ? (
                  <div className="space-y-3">
                    {schedule.map((item: any, index: number) => (
                      <div key={item.schedule_id || index} className="p-3 sm:p-4 rounded-xl bg-dark-bg border border-dark-border hover:border-brand-secondary/50 transition-all overflow-hidden">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                              <Clock className="w-4 sm:w-5 h-4 sm:h-5 text-brand-primary" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-white truncate">{item.subjects?.subject_name}</h4>
                              <p className="text-sm text-dark-muted">
                                {item.weekdays?.weekday_name_ar}
                              </p>
                            </div>
                          </div>
                          <div className="text-left flex-shrink-0">
                            <p className="font-medium text-white text-sm sm:text-base">
                              {item.time_slots?.start_time}
                            </p>
                            <p className="text-xs text-dark-muted">
                              {item.time_slots?.end_time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-dark-muted">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لم يتم تسجيل جدول بعد</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : activeTab === 'payments' ? (
          <StudentPayments />
        ) : (
          <Notifications studentId={student?.student_id} isAdmin={false} />
        )}
      </div>
    </div>
  );
}
