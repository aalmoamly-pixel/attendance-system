import { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Award,
  Calendar
} from 'lucide-react';
import { db } from '../lib/supabase';
import type { Student, Subject } from '../types/database';

export default function AttendancePage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [weekdays, setWeekdays] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  
  const [selectedStudentId, setSelectedStudentId] = useState<string | ''>('');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | ''>('');
  const [selectedWeek, setSelectedWeek] = useState<string>('1');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceRates, setAttendanceRates] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allStudents, allSubjectsData, allSchedules, allAttendance, days, slots] = await Promise.all([
        db.getStudents(),
        db.getSubjects(),
        db.getSchedules(),
        db.getAttendance(),
        db.getWeekdays(),
        db.getTimeSlots()
      ]);
      
      setStudents(allStudents);
      setAllSubjects(allSubjectsData);
      setSchedules(allSchedules);
      setAttendanceLogs(allAttendance);
      setWeekdays(days);
      setTimeSlots(slots);
      
    } catch (err) {
      console.error('[Attendance] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = students.find(s => String(s.student_id) === selectedStudentId);
  
  const getStudentSubjects = () => {
    if (!selectedStudent) return [];
    const studentSchedules = schedules.filter(s => s.student_id === selectedStudent.student_id);
    // Return all schedule entries (including multiple subjects on same day)
    return studentSchedules.map(schedule => {
      const subject = allSubjects.find(sub => sub.subject_id === schedule.subject_id);
      return subject ? { ...subject, schedule_id: schedule.schedule_id, schedule } : null;
    }).filter(Boolean) as any[];
  };

  const getScheduleInfo = (subject: any) => {
    if (!selectedStudent || !subject.schedule) return null;
    
    const day = weekdays.find(d => d.weekday_id === subject.schedule.weekday_id);
    const slot = timeSlots.find(s => s.slot_id === subject.schedule.slot_id);
    
    return {
      day: day?.weekday_name_ar || '',
      time: slot ? `${slot.start_time} - ${slot.end_time}` : ''
    };
  };

  const getAttendanceStats = (student: Student, subject: any) => {
    const subjectRates = attendanceRates?.bySubject?.find((s: any) => s.subject_id === subject.subject_id);
    const logs = attendanceLogs.filter(log => 
      log.schedule_id === subject.schedule_id
    );
    
    const absents = logs.filter(log => log.status === 'غائب').length;
    const late = logs.filter(log => log.status === 'متأخر').length;

    if (subjectRates) {
      return {
        totalSessions: subjectRates.totalSessions,
        attended: subjectRates.attended,
        absents,
        late,
        rate: subjectRates.rate,
        isWarning: subjectRates.rate <75
      };
    }

    return {
      totalSessions: 0,
      attended: 0,
      absents,
      late,
      rate: 0,
      isWarning: false
    };
  };

  const studentSubjects = getStudentSubjects();
  const selectedSchedule = studentSubjects.find(s => String(s.schedule_id) === selectedScheduleId);
  const selectedSubject = selectedSchedule ? allSubjects.find(s => s.subject_id === selectedSchedule.subject_id) : null;

  const getOverallAttendanceStats = (_student: Student) => {
    if (attendanceRates) {
      return {
        rate: attendanceRates.overallRate,
        isWarning: attendanceRates.overallRate <75,
        warningCount: attendanceRates.bySubject?.filter((s: any) => s.rate <75).length
      };
    }

    return { rate: 0, isWarning: false, warningCount: 0 };
  };

  const getCurrentStatus = () => {
    if (!selectedStudent || !selectedSchedule || !selectedDate) return null;
    
    return attendanceLogs.find(
      log => log.schedule_id === selectedSchedule.schedule_id && 
             log.attendance_date === selectedDate
    );
  };

  const markAttendance = async (status: 'حاضر' | 'غائب' | 'متأخر' | 'مستأذن') => {
    if (!selectedStudent || !selectedSchedule || !selectedDate) return;
    
    await db.markAttendance(
      selectedSchedule.schedule_id,
      selectedDate,
      status,
      new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    );
    
    await fetchData();
    if (selectedStudent) {
      const rates = await db.calculateAttendanceRates(selectedStudent.student_id);
      setAttendanceRates(rates);
    }
  };

  const getRateColor = (rate: number) => {
    if (rate >= 85) return 'text-brand-success';
    if (rate >= 75) return 'text-yellow-500';
    return 'text-brand-danger';
  };

  const getRateBg = (rate: number) => {
    if (rate >= 85) return 'bg-brand-success/10';
    if (rate >= 75) return 'bg-yellow-500/10';
    return 'bg-brand-danger/10';
  };

  const studentSubjects = getStudentSubjects();
  const overallStats = selectedStudent ? getOverallAttendanceStats(selectedStudent) : null;

  const weeks = Array.from({ length: 15 }, (_, i) => i + 1);

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
          <h1 className="text-2xl md:text-3xl font-bold text-white">📋 تسجيل الحضور</h1>
          <p className="text-dark-muted mt-1">اختر الطالب ثم سجل الحضور</p>
        </div>
        <button 
          onClick={fetchData}
          className="btn-secondary px-4 py-2 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> تحديث
        </button>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Users className="w-6 h-6 text-brand-primary" />
          اختيار الطالب والمادة والاسبوع
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-dark-muted">الطالب</label>
            <select
              value={selectedStudentId}
              onChange={async (e) => {
                setSelectedStudentId(e.target.value);
                setSelectedSubjectId('');
                setAttendanceRates(null);
                if (e.target.value) {
                  const rates = await db.calculateAttendanceRates(parseInt(e.target.value));
                  setAttendanceRates(rates);
                }
              }}
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

          <div className="space-y-2">
            <label className="text-sm font-bold text-dark-muted">المادة الدراسية</label>
            <select
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
              disabled={!selectedStudent}
              className="w-full bg-dark-card border border-dark-border rounded-xl p-4 text-white focus:outline-none focus:border-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">اختر المادة</option>
              {studentSubjects.map(subject => {
                const scheduleInfo = getScheduleInfo(subject);
                return (
                  <option key={subject.schedule_id} value={String(subject.schedule_id)}>
                  {subject.subject_name} - {scheduleInfo?.day} {scheduleInfo?.time ? `(${scheduleInfo.time})` : ''}
                </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-dark-muted flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              الاسبوع
            </label>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="w-full bg-dark-card border border-dark-border rounded-xl p-4 text-white focus:outline-none focus:border-brand-primary"
            >
              {weeks.map(week => (
                <option key={week} value={String(week)}>
                  الاسبوع {week}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-dark-muted">تاريخ الحضور</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-dark-card border border-dark-border rounded-xl p-4 text-white focus:outline-none focus:border-brand-primary"
            />
          </div>
        </div>
      </div>

      {selectedStudent && (
        <div className="glass-card p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                overallStats?.isWarning 
                  ? 'bg-brand-danger/10 text-brand-danger' 
                  : (overallStats?.rate ?? 0) >= 85 
                    ? 'bg-brand-success/10 text-brand-success' 
                    : 'bg-yellow-500/10 text-yellow-500'
              }`}>
                {selectedStudent.full_name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {selectedStudent.full_name}
                  {overallStats?.isWarning && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-brand-danger/20 text-brand-danger">
                      <AlertTriangle className="w-3 h-3" /> مرحلة حرمان
                    </span>
                  )}
                </h3>
                <p className="text-dark-muted">{selectedStudent.academic_id}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`px-6 py-3 rounded-xl ${getRateBg(overallStats?.rate || 0)}`}>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  <span className={`text-lg font-bold ${getRateColor(overallStats?.rate || 0)}`}>
                    النسبة الإجمالية: {overallStats?.rate || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedStudent && studentSubjects.length > 0 && (
        <div className="space-y-4">
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-secondary" />
              المواد و نسب الحضور
            </h3>
            
            <div className="space-y-4">
              {studentSubjects.map(subject => {
                const stats = getAttendanceStats(selectedStudent, subject);
                const isSelected = selectedSchedule?.schedule_id === subject.schedule_id;
                const scheduleInfo = getScheduleInfo(subject);
                
                return (
                  <div 
                    key={subject.schedule_id}
                    className={`p-4 rounded-xl border transition-all ${
                      isSelected 
                        ? 'border-brand-primary bg-brand-primary/5' 
                        : 'border-dark-border bg-dark-bg/30'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${getRateBg(stats.rate)} ${getRateColor(stats.rate)}`}>
                          {subject.subject_name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-white font-bold flex items-center gap-2">
                            {subject.subject_name}
                            {stats.isWarning && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-brand-danger/20 text-brand-danger">
                                <AlertTriangle className="w-3 h-3" /> تحذير
                              </span>
                            )}
                          </h4>
                          {scheduleInfo && (
                            <p className="text-xs text-dark-muted mt-1 flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {scheduleInfo.day} - {scheduleInfo.time}
                            </p>
                          )}
                          <p className="text-sm text-dark-muted mt-2">
                            الحاضر: <span className="text-brand-success font-bold">{stats.attended}</span> | 
                            الغائب: <span className="text-brand-danger font-bold">{stats.absents}</span> | 
                            المتأخر: <span className="text-yellow-500 font-bold">{stats.late}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className={`px-4 py-2 rounded-lg ${getRateBg(stats.rate)}`}>
                          <span className={`font-bold ${getRateColor(stats.rate)}`}>
                            {stats.rate}%
                          </span>
                        </div>
                        
                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => markAttendance('حاضر')}
                              className={`p-2 rounded-lg transition-all ${
                                getCurrentStatus()?.status === 'حاضر' 
                                  ? 'bg-brand-success text-white shadow-lg' 
                                  : 'bg-dark-card text-brand-success hover:bg-brand-success/10'
                              }`}
                              title="حاضر"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => markAttendance('متأخر')}
                              className={`p-2 rounded-lg transition-all ${
                                getCurrentStatus()?.status === 'متأخر' 
                                  ? 'bg-yellow-500 text-white shadow-lg' 
                                  : 'bg-dark-card text-yellow-500 hover:bg-yellow-500/10'
                              }`}
                              title="متأخر"
                            >
                              <Clock className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => markAttendance('غائب')}
                              className={`p-2 rounded-lg transition-all ${
                                getCurrentStatus()?.status === 'غائب' 
                                  ? 'bg-brand-danger text-white shadow-lg' 
                                  : 'bg-dark-card text-brand-danger hover:bg-brand-danger/10'
                              }`}
                              title="غائب"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!selectedStudent && (
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-brand-primary/10 flex items-center justify-center">
            <Users className="w-10 h-10 text-brand-primary" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">اختر طالبًا للبدء</h3>
          <p className="text-dark-muted">اختر الطالب من القائمة أعلاه لعرض المواد و نسب الحضور</p>
        </div>
      )}

      {selectedStudent && studentSubjects.length === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-brand-secondary/10 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-brand-secondary" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">لا توجد مواد مسجلة</h3>
          <p className="text-dark-muted">لم يتم إضافة مواد لهذا الطالب بعد</p>
        </div>
      )}
    </div>
  );
}
