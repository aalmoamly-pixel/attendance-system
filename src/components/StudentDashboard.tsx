import { useState, useEffect } from 'react';
import { 
  User, 
  BookOpen, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  LogOut,
  Award,
  Clock,
  X,
  Check,
  MessageSquare,
  Bell,
  Sparkles
} from 'lucide-react';
import { db } from '../lib/supabase';
import { getAuthState, logout } from '../lib/auth';
import type { Student, Subject, Notification, PersonalNote } from '../types/database';
import Notifications from './Notifications';

interface StudentDashboardProps {
  onLogout: () => void;
}

export default function StudentDashboard({ onLogout }: StudentDashboardProps) {
  const [student, setStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [attendanceRates, setAttendanceRates] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [personalNote, setPersonalNote] = useState<PersonalNote | null>(null);
  const [showNote, setShowNote] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'notifications'>('dashboard');

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
      const [studentSchedule, rates, allSubjects, note, notifs] = await Promise.all([
        db.getStudentSchedule(studentId),
        db.calculateAttendanceRates(studentId),
        db.getSubjects(),
        db.getPersonalNote(studentId),
        db.getNotifications(studentId)
      ]);
      
      setSchedule(studentSchedule);
      setAttendanceRates(rates);
      setSubjects(allSubjects);
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
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">أهلاً {student?.full_name}</h1>
              <p className="text-dark-muted">رقم الطالب: {student?.academic_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`relative px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
                activeTab === 'notifications'
                  ? 'bg-brand-primary text-white'
                  : 'bg-dark-card text-dark-muted hover:bg-dark-hover'
              }`}
            >
              <Bell className="w-5 h-5" />
              الرسائل
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-danger text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-brand-primary text-white'
                  : 'bg-dark-card text-dark-muted hover:bg-dark-hover'
              }`}
            >
              <Award className="w-5 h-5" />
              لوحة التحكم
            </button>
            <button
              onClick={onLogout}
              className="btn-secondary px-4 py-2 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
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
                      <p className="text-sm text-dark-muted mt-1">من إدارة المدرسة</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="glass-card p-6 hover:scale-[1.02] transition-transform">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${attendanceRates ? getRateBg(attendanceRates.overallRate) : 'bg-dark-card'}`}>
                    <Award className={`w-8 h-8 ${attendanceRates ? getRateColor(attendanceRates.overallRate) : 'text-brand-primary'}`} />
                  </div>
                  <div>
                    <p className="text-dark-muted text-sm">النسبة الإجمالية</p>
                    <p className={`text-3xl font-bold ${attendanceRates ? getRateColor(attendanceRates.overallRate) : 'text-white'}`}>
                      {attendanceRates ? attendanceRates.overallRate : 0}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 hover:scale-[1.02] transition-transform">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-dark-muted text-sm">المواد المسجلة</p>
                    <p className="text-3xl font-bold text-white">{schedule.length}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 hover:scale-[1.02] transition-transform">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-brand-secondary/10 flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-brand-secondary" />
                  </div>
                  <div>
                    <p className="text-dark-muted text-sm">الحاضر</p>
                    <p className="text-3xl font-bold text-brand-success">
                      {attendanceRates ? attendanceRates.bySubject.reduce((sum: number, s: any) => sum + s.attended, 0) : 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass-card p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-brand-primary" />
                  المواد و نسب الحضور
                </h2>
                
                {attendanceRates && attendanceRates.bySubject.length > 0 ? (
                  <div className="space-y-4">
                    {attendanceRates.bySubject.map((subject: any) => (
                      <div key={subject.subject_id} className="p-4 rounded-xl bg-dark-bg border border-dark-border hover:border-brand-primary/50 transition-all">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-white">{subject.subject_name}</h4>
                            <p className="text-sm text-dark-muted mt-1">
                              {subject.attended} من {subject.totalSessions} جلسة
                            </p>
                          </div>
                          <div className={`px-4 py-2 rounded-lg ${getRateBg(subject.rate)}`}>
                            <span className={`font-bold ${getRateColor(subject.rate)}`}>
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
                              style={{ width: `${subject.rate}%` }}
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

              <div className="glass-card p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-brand-secondary" />
                  جدول المحاضرات
                </h2>
                
                {schedule.length > 0 ? (
                  <div className="space-y-3">
                    {schedule.map((item: any, index: number) => (
                      <div key={item.schedule_id || index} className="p-4 rounded-xl bg-dark-bg border border-dark-border hover:border-brand-secondary/50 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                              <Clock className="w-5 h-5 text-brand-primary" />
                            </div>
                            <div>
                              <h4 className="font-bold text-white">{item.subjects?.subject_name}</h4>
                              <p className="text-sm text-dark-muted">
                                {item.weekdays?.weekday_name_ar}
                              </p>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-white">
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
        ) : (
          <Notifications studentId={student?.student_id} isAdmin={false} />
        )}
      </div>
    </div>
  );
}
