import { useState, useEffect } from 'react';
import { 
  Users, 
  BarChart3, 
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  Eye,
  Calendar,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { db } from '../lib/supabase';
import type { Student, Subject } from '../types/database';

export default function AttendanceReport({ setActivePage: _setActivePage }: { setActivePage: (p: string) => void }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [weekdays, setWeekdays] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  
  const [selectedStudentId, setSelectedStudentId] = useState<string | ''>('');
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSubjectForDetails, setSelectedSubjectForDetails] = useState<any>(null);
  const [subjectAttendanceDetails, setSubjectAttendanceDetails] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  useEffect(() => {
    if (selectedStudentId) {
      loadStudentAttendance(selectedStudentId);
    }
  }, [refreshKey, students]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stus, subs, schs, atts, days, slots] = await Promise.all([
        db.getStudents(),
        db.getSubjects(),
        db.getSchedules(),
        db.getAttendance(),
        db.getWeekdays(),
        db.getTimeSlots()
      ]);
      setStudents(stus);
      setSubjects(subs);
      setSchedules(schs);
      setAttendanceLogs(atts);
      setWeekdays(days);
      setTimeSlots(slots);
    } catch (err) {
      console.error('[AttendanceReport] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentAttendance = async (studentId: string) => {
    if (!studentId) {
      setSelectedStudentId('');
      setAttendanceData(null);
      return;
    }
    
    const student = students.find(s => String(s.student_id) === studentId);
    if (!student) return;
    
    setSelectedStudentId(studentId);
    try {
      const rates = await db.calculateAttendanceRates(student.student_id);
      setAttendanceData(rates);
    } catch (err) {
      console.error('[AttendanceReport] Rate calculation error:', err);
    }
  };

  const selectedStudent = students.find(s => String(s.student_id) === selectedStudentId);

  const getScheduleInfo = (subject: Subject) => {
    if (!selectedStudent) return null;
    const schedule = schedules.find(
      s => s.student_id === selectedStudent.student_id && s.subject_id === subject.subject_id
    );
    if (!schedule) return null;
    
    const day = weekdays.find(d => d.weekday_id === schedule.weekday_id);
    const slot = timeSlots.find(s => s.slot_id === schedule.slot_id);
    
    return {
      day: day?.weekday_name_ar || '',
      time: slot ? `${slot.start_time} - ${slot.end_time}` : ''
    };
  };

  const getAttendanceDetails = (subject: Subject) => {
    if (!selectedStudent) return [];
    
    const studentSchedules = schedules.filter(
      s => s.student_id === selectedStudent.student_id && s.subject_id === subject.subject_id
    );
    
    const details = attendanceLogs
      .filter(log => studentSchedules.some(s => s.schedule_id === log.schedule_id))
      .sort((a, b) => new Date(a.attendance_date).getTime() - new Date(b.attendance_date).getTime());
    
    return details;
  };

  const showSubjectDetails = (subject: Subject) => {
    setSelectedSubjectForDetails(subject);
    setSubjectAttendanceDetails(getAttendanceDetails(subject));
    setShowDetailsModal(true);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'حاضر':
        return <CheckCircle2 className="w-4 h-4 text-brand-success" />;
      case 'غائب':
        return <XCircle className="w-4 h-4 text-brand-danger" />;
      case 'متأخر':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-dark-muted" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'حاضر':
        return 'حاضر';
      case 'غائب':
        return 'غائب';
      case 'متأخر':
        return 'متأخر';
      default:
        return 'غير محدد';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'حاضر':
        return 'bg-brand-success/10 border-brand-success/20';
      case 'غائب':
        return 'bg-brand-danger/10 border-brand-danger/20';
      case 'متأخر':
        return 'bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'bg-dark-bg/50 border-dark-border';
    }
  };

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
          <h1 className="text-2xl md:text-3xl font-bold text-white">📊 تقارير الحضور والغياب</h1>
          <p className="text-dark-muted mt-1">عرض نسب الحضور للطلاب لكل مادة</p>
        </div>
        <button 
          onClick={() => setRefreshKey(prev => prev +1)}
          className="btn-secondary px-4 py-2 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> تحديث
        </button>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-primary" />
          اختيار الطالب
        </h2>
        
        <div className="max-w-2xl">
          <select
            value={selectedStudentId}
            onChange={(e) => loadStudentAttendance(e.target.value)}
            className="w-full bg-dark-card border border-dark-border rounded-xl p-4 text-white focus:outline-none focus:border-brand-primary"
          >
            <option value="">اختر الطالب</option>
            {students.map(student => (
              <option key={student.student_id} value={String(student.student_id)}>
                {student.full_name} ({student.academic_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedStudent && attendanceData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className={`w-20 h-20 rounded-xl flex items-center justify-center text-3xl font-bold ${getRateBg(attendanceData.overallRate)} ${getRateColor(attendanceData.overallRate)}`}>
                  {attendanceData.overallRate}%
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">النسبة الإجمالية</h3>
                  <p className="text-dark-muted">لحضور الطالب في جميع المواد</p>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="h-3 bg-dark-card rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      attendanceData.overallRate >= 85 ? 'bg-brand-success' :
                      attendanceData.overallRate >= 70 ? 'bg-yellow-500' : 'bg-brand-danger'
                    }`}
                    style={{ width: `${attendanceData.overallRate}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                {attendanceData.overallRate >= 85 ? (
                  <CheckCircle2 className="w-5 h-5 text-brand-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-brand-danger" />
                )}
                <span className={`text-sm ${getRateColor(attendanceData.overallRate)}`}>
                  {attendanceData.overallRate >= 85 ? 'ممتاز! مستوى حضور عالي' :
                   attendanceData.overallRate >= 70 ? 'جيد، لكن يحتاج تحسين' : 'تحذير: حضور منخفض'}
                </span>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-primary" />
                معلومات الطالب
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-dark-muted">الاسم الكامل:</span>
                  <span className="text-white font-medium">{selectedStudent.full_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-dark-muted">الرقم الأكاديمي:</span>
                  <span className="text-white font-medium">{selectedStudent.academic_id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-dark-muted">المسجل:</span>
                  <span className="text-brand-primary font-medium">{attendanceData.bySubject.length} مواد</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-brand-primary" />
              نسب الحضور لكل مادة
            </h3>

            <div className="space-y-4">
              {attendanceData.bySubject.map((subject: any) => {
                const fullSubject = subjects.find(s => s.subject_id === subject.subject_id);
                const scheduleInfo = fullSubject ? getScheduleInfo(fullSubject) : null;
                
                return (
                  <div key={subject.subject_id} className="bg-dark-card rounded-xl p-4 border border-dark-border">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-white text-lg flex items-center gap-2">
                          {subject.subject_name}
                          {scheduleInfo && (
                            <span className="text-xs text-dark-muted flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {scheduleInfo.day} - {scheduleInfo.time}
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-dark-muted">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-brand-success" />
                            {subject.attended} من {subject.totalSessions} جلسة
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-48">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-dark-muted">نسبة الحضور</span>
                            <span className={`font-bold ${getRateColor(subject.rate)}`}>{subject.rate}%</span>
                          </div>
                          <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                subject.rate >= 85 ? 'bg-brand-success' :
                                subject.rate >= 70 ? 'bg-yellow-500' : 'bg-brand-danger'
                              }`}
                              style={{ width: `${subject.rate}%` }}
                            />
                          </div>
                        </div>

                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold ${getRateBg(subject.rate)} ${getRateColor(subject.rate)}`}>
                          {subject.rate}%
                        </div>

                        {fullSubject && (
                          <button
                            onClick={() => showSubjectDetails(fullSubject)}
                            className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition-all"
                            title="تفاصيل الحضور"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {attendanceData.bySubject.length === 0 && (
                <div className="text-center py-12 text-dark-muted">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-dark-card flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 opacity-50" />
                  </div>
                  <p>لم يتم تسجيل مواد للطالب بعد</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {!selectedStudent && (
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-brand-primary/10 flex items-center justify-center">
            <Users className="w-10 h-10 text-brand-primary" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">اختر طالبًا لعرض تقارير الحضور</h3>
          <p className="text-dark-muted">ستظهر نسب الحضور لكل مادة والنسبة الإجمالية</p>
        </div>
      )}

      {showDetailsModal && selectedSubjectForDetails && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-2xl max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-dark-border">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-6 h-6 text-brand-primary" />
                تفاصيل الحضور - {selectedSubjectForDetails.subject_name}
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 rounded-lg hover:bg-dark-hover text-dark-muted hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {subjectAttendanceDetails.length === 0 ? (
                <div className="text-center py-12 text-dark-muted">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>لم يتم تسجيل أي حضور بعد لهذه المادة</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subjectAttendanceDetails.map((log, index) => (
                    <div 
                      key={log.attendance_id || index}
                      className={`p-4 rounded-xl border ${getStatusBg(log.status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(log.status)}
                          <div>
                            <div className="text-white font-bold">
                              {new Date(log.attendance_date).toLocaleDateString('ar-SA', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-dark-muted">
                              الوقت: {log.attendance_time || '-'}
                            </div>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-lg font-bold ${
                          log.status === 'حاضر' ? 'text-brand-success' :
                          log.status === 'غائب' ? 'text-brand-danger' : 'text-yellow-500'
                        }`}>
                          {getStatusText(log.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-4 p-6 border-t border-dark-border">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="btn-secondary px-6 py-2.5"
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
