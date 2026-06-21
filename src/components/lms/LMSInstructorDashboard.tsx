import { useState, useEffect } from 'react';
import {
  FileText, CheckSquare, HelpCircle, Award, ClipboardList,
  Video, Bell, Plus, Eye,
  CheckCircle, Clock
} from 'lucide-react';
import { lmsDb, type LMSUser, type LMSSection, type LMSMaterial, type LMSAssignment, type LMSQuestion, type LMSExam, type LMSAnnouncement, type LMSMeeting } from '../../lib/lms_supabase';

export default function LMSInstructorDashboard({ instructor, activeTab: propActiveTab }: { instructor: LMSUser, activeTab?: string }) {
  const [activeTab, setActiveTab] = useState('sections');

  useEffect(() => {
    if (propActiveTab) {
      const mapped = propActiveTab === 'dashboard' ? 'sections' : propActiveTab;
      setActiveTab(mapped);
    }
  }, [propActiveTab]);
  const [sections, setSections] = useState<LMSSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<LMSSection | null>(null);
  const [materials, setMaterials] = useState<LMSMaterial[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sectionStudents, setSectionStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<LMSAssignment[]>([]);
  const [questions, setQuestions] = useState<LMSQuestion[]>([]);
  const [exams, setExams] = useState<LMSExam[]>([]);
  const [announcements, setAnnouncements] = useState<LMSAnnouncement[]>([]);
  const [meetings, setMeetings] = useState<LMSMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Modal states
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);

  // Forms
  const [matForm, setMatForm] = useState({ title: '', description: '', type: 'pdf' as LMSMaterial['type'], file_url: '' });
  const [assignForm, setAssignForm] = useState({ title: '', instructions: '', due_date: '', max_points: '100' });
  const [qForm, setQForm] = useState({ type: 'mcq' as LMSQuestion['type'], question_text: '', choices: ['', '', '', ''], correct_answer: '', points: '1' });
  const [examForm, setExamForm] = useState({ title: '', duration_minutes: '60', start_time: '', end_time: '', selectedQIds: [] as string[] });
  const [annForm, setAnnForm] = useState({ title: '', content: '' });
  const [meetForm, setMeetForm] = useState({ title: '', meeting_url: '', start_time: '', duration_minutes: '60' });

  useEffect(() => {
    loadSections();
  }, []);

  useEffect(() => {
    if (selectedSection) {
      loadSectionData(selectedSection.id);
    }
  }, [selectedSection, activeTab]);

  useEffect(() => {
    if (selectedSection && activeTab === 'attendance') {
      loadAttendanceData(selectedSection.id, selectedDate);
    }
  }, [selectedDate, selectedSection, activeTab]);

  const loadSections = async () => {
    setLoading(true);
    try {
      const sects = await lmsDb.getInstructorSections(instructor.id);
      setSections(sects);
      if (sects.length > 0 && !selectedSection) setSelectedSection(sects[0]);
    } finally {
      setLoading(false);
    }
  };

  const loadSectionData = async (sectionId: string) => {
    if (activeTab === 'materials') setMaterials(await lmsDb.getMaterials(sectionId));
    if (activeTab === 'assignments') setAssignments(await lmsDb.getAssignments(sectionId));
    if (activeTab === 'exams') setExams(await lmsDb.getExams(sectionId));
    if (activeTab === 'announcements') setAnnouncements(await lmsDb.getAnnouncements(sectionId));
    if (activeTab === 'meetings') setMeetings(await lmsDb.getMeetings(sectionId));
    if (selectedSection) {
      const course = (selectedSection.course as any);
      if (course?.id && activeTab === 'questions') setQuestions(await lmsDb.getQuestionBank(course.id));
    }
    if (activeTab === 'attendance') {
      await loadAttendanceData(sectionId, selectedDate);
    }
  };

  const loadAttendanceData = async (secId: string, dateStr: string) => {
    try {
      const studentsList = await lmsDb.getSectionEnrollments(secId);
      setSectionStudents(studentsList);
      const records = await lmsDb.getAttendance(secId, dateStr);
      setAttendanceRecords(records);
    } catch (err) {
      console.error('[LMSInstructor] Attendance load error:', err);
    }
  };

  const handleRecordAttendance = async (studentId: string, status: any) => {
    if (!selectedSection) return;
    try {
      await lmsDb.recordAttendance(selectedSection.id, studentId, selectedDate, status, instructor.id);
      showToast('تم رصد حالة الحضور بنجاح');
      const records = await lmsDb.getAttendance(selectedSection.id, selectedDate);
      setAttendanceRecords(records);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleAddMaterial = async () => {
    if (!selectedSection) return;
    await lmsDb.createMaterial(selectedSection.id, matForm.title, matForm.description, matForm.type, matForm.file_url);
    setShowMaterialModal(false);
    setMatForm({ title: '', description: '', type: 'pdf', file_url: '' });
    setMaterials(await lmsDb.getMaterials(selectedSection.id));
    showToast('تم رفع المادة التعليمية بنجاح');
  };

  const handleAddAssignment = async () => {
    if (!selectedSection) return;
    await lmsDb.createAssignment(selectedSection.id, assignForm.title, assignForm.instructions, assignForm.due_date, parseFloat(assignForm.max_points));
    setShowAssignmentModal(false);
    setAssignForm({ title: '', instructions: '', due_date: '', max_points: '100' });
    setAssignments(await lmsDb.getAssignments(selectedSection.id));
    showToast('تم إنشاء الواجب بنجاح');
  };

  const handleAddQuestion = async () => {
    const courseId = (selectedSection?.course as any)?.id;
    if (!courseId) return;
    await lmsDb.createQuestion(courseId, qForm.type, qForm.question_text, qForm.type === 'mcq' ? qForm.choices : null, qForm.correct_answer, parseFloat(qForm.points));
    setShowQuestionModal(false);
    setQForm({ type: 'mcq', question_text: '', choices: ['', '', '', ''], correct_answer: '', points: '1' });
    setQuestions(await lmsDb.getQuestionBank(courseId));
    showToast('تم إضافة السؤال لبنك الأسئلة');
  };

  const handleAddExam = async () => {
    if (!selectedSection) return;
    await lmsDb.createExam(selectedSection.id, examForm.title, parseInt(examForm.duration_minutes), examForm.start_time, examForm.end_time, examForm.selectedQIds);
    setShowExamModal(false);
    setExamForm({ title: '', duration_minutes: '60', start_time: '', end_time: '', selectedQIds: [] });
    setExams(await lmsDb.getExams(selectedSection.id));
    showToast('تم إنشاء الاختبار بنجاح');
  };

  const handleAddAnnouncement = async () => {
    if (!selectedSection) return;
    await lmsDb.createAnnouncement(selectedSection.id, annForm.title, annForm.content, instructor.id);
    setShowAnnouncementModal(false);
    setAnnForm({ title: '', content: '' });
    setAnnouncements(await lmsDb.getAnnouncements(selectedSection.id));
    showToast('تم نشر الإعلان بنجاح');
  };

  const handleAddMeeting = async () => {
    if (!selectedSection) return;
    await lmsDb.createMeeting(selectedSection.id, meetForm.title, meetForm.meeting_url, meetForm.start_time, parseInt(meetForm.duration_minutes));
    setShowMeetingModal(false);
    setMeetForm({ title: '', meeting_url: '', start_time: '', duration_minutes: '60' });
    setMeetings(await lmsDb.getMeetings(selectedSection.id));
    showToast('تم إضافة الاجتماع بنجاح');
  };

  const tabs = [
    { id: 'sections', label: 'شُعبي الدراسية', icon: ClipboardList },
    { id: 'materials', label: 'المحاضرات', icon: FileText },
    { id: 'assignments', label: 'الواجبات', icon: CheckSquare },
    { id: 'questions', label: 'بنك الأسئلة', icon: HelpCircle },
    { id: 'exams', label: 'الاختبارات', icon: Award },
    { id: 'attendance', label: 'حضور وغياب الطلاب', icon: ClipboardList },
    { id: 'announcements', label: 'الإعلانات', icon: Bell },
    { id: 'meetings', label: 'المحاضرات المباشرة', icon: Video },
  ];

  const inputClass = 'w-full bg-[#121522] border border-[#21263d] rounded-xl p-3 text-white focus:outline-none focus:border-brand-primary text-right text-sm';
  const labelClass = 'block text-xs font-bold text-slate-400 mb-1.5';

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#20c997] text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold animate-slide-up border border-[#20c997]/20">
          <CheckCircle className="w-5 h-5" /> {toast}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 flex-row-reverse justify-start">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === tab.id 
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                : 'bg-[#131622] border border-[#21263d] text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {/* Section selector (show in most tabs) */}
      {activeTab !== 'sections' && sections.length > 0 && (
        <div className="bg-[#131622] border border-[#21263d] p-5 rounded-2xl">
          <label className={labelClass}>اختر الشعبة الدراسية</label>
          <select value={selectedSection?.id || ''} onChange={e => setSections(s => { const sec = sections.find(x => x.id === e.target.value) || null; setSelectedSection(sec); return s; })} className={inputClass + ' max-w-sm bg-[#090b10]'}>
            {sections.map(s => (
              <option key={s.id} value={s.id}>{(s.course as any)?.title} — شعبة {s.section_number} ({s.semester})</option>
            ))}
          </select>
        </div>
      )}

      {/* SECTIONS Tab */}
      {activeTab === 'sections' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map(sec => (
            <div key={sec.id} className="bg-[#131622] border border-[#21263d] p-5 space-y-3 cursor-pointer hover:border-brand-primary/55 transition rounded-2xl text-right flex flex-col justify-between" onClick={() => { setSelectedSection(sec); setActiveTab('materials'); }}>
              <div className="flex items-start justify-between flex-row-reverse">
                <span className="bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-black px-2.5 py-1 rounded-lg">{sec.semester}</span>
                <div className="text-right">
                  <h4 className="font-black text-white text-base">{(sec.course as any)?.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">شعبة {sec.section_number} — {sec.capacity} طالب</p>
                  {sec.schedule_days && sec.schedule_time && (
                    <p className="text-[10px] text-brand-secondary font-bold mt-1.5">
                      المواعيد: {sec.schedule_days.join(' - ')} ({sec.schedule_time})
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 font-mono text-left pt-2 border-t border-[#21263d]/50">{(sec.course as any)?.code}</p>
            </div>
          ))}
          {sections.length === 0 && <div className="col-span-3 bg-[#131622] border border-[#21263d] p-12 text-center text-slate-400 rounded-3xl">لم يتم تعيينك في أي شعبة دراسية بعد. تواصل مع مدير النظام.</div>}
        </div>
      )}
      {/* MATERIALS Tab */}
      {activeTab === 'materials' && (
        <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between flex-row-reverse">
            <h3 className="text-white font-black text-lg">المحاضرات والمواد ({materials.length})</h3>
            <button onClick={() => setShowMaterialModal(true)} className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-sm font-bold text-white shadow shadow-brand-primary/20 hover:scale-[1.01] transition-all flex items-center gap-2 cursor-pointer flex-row-reverse">
              <Plus className="w-4 h-4" /> <span>رفع مادة تعليمية</span>
            </button>
          </div>
          <div className="space-y-3">
            {materials.map(mat => (
              <div key={mat.id} className="flex items-center justify-between p-4 bg-[#090b10] rounded-xl border border-[#21263d] flex-row-reverse text-right">
                <div className="text-right">
                  <p className="font-bold text-white text-sm">{mat.title}</p>
                  <p className="text-xs text-slate-500 font-mono mt-1">{mat.type.toUpperCase()} — {new Date(mat.uploaded_at).toLocaleDateString('ar-SA')}</p>
                </div>
                <a href={mat.file_url} target="_blank" rel="noreferrer" className="text-brand-primary hover:underline flex items-center gap-2 text-xs font-bold flex-row-reverse">
                  <Eye className="w-4 h-4" /> <span>فتح الملف</span>
                </a>
              </div>
            ))}
            {materials.length === 0 && <p className="text-center text-slate-500 py-8">لا توجد مواد مرفوعة لهذه الشعبة.</p>}
          </div>
        </div>
      )}

      {/* ASSIGNMENTS Tab */}
      {activeTab === 'assignments' && (
        <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between flex-row-reverse">
            <h3 className="text-white font-black text-lg">الواجبات الدراسية ({assignments.length})</h3>
            <button onClick={() => setShowAssignmentModal(true)} className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-sm font-bold text-white shadow shadow-brand-primary/20 hover:scale-[1.01] transition-all flex items-center gap-2 cursor-pointer flex-row-reverse">
              <Plus className="w-4 h-4" /> <span>إنشاء واجب جديد</span>
            </button>
          </div>
          <div className="space-y-3">
            {assignments.map(asgn => (
              <div key={asgn.id} className="p-4 bg-[#090b10] rounded-xl border border-[#21263d] text-right flex flex-col md:flex-row md:items-center justify-between gap-4 flex-row-reverse">
                <div className="text-right">
                  <p className="font-black text-white text-sm">{asgn.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{asgn.instructions}</p>
                  <p className="text-xs text-[#20c997] font-bold mt-1">الدرجة الكاملة: {asgn.max_points}</p>
                </div>
                <div className="flex items-center gap-2 flex-row-reverse shrink-0">
                  <Clock className="w-4 h-4 text-brand-warning" />
                  <span className="text-xs text-brand-warning font-bold font-mono">{new Date(asgn.due_date).toLocaleDateString('ar-SA')}</span>
                </div>
              </div>
            ))}
            {assignments.length === 0 && <p className="text-center text-slate-500 py-8">لا توجد واجبات لهذه الشعبة.</p>}
          </div>
        </div>
      )}

      {/* QUESTIONS Tab */}
      {activeTab === 'questions' && (
        <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between flex-row-reverse">
            <h3 className="text-white font-black text-lg">بنك الأسئلة ({questions.length})</h3>
            <button onClick={() => setShowQuestionModal(true)} className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-sm font-bold text-white shadow shadow-brand-primary/20 hover:scale-[1.01] transition-all flex items-center gap-2 cursor-pointer flex-row-reverse">
              <Plus className="w-4 h-4" /> <span>إضافة سؤال</span>
            </button>
          </div>
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id} className="p-4 bg-[#090b10] rounded-xl border border-[#21263d] text-right flex flex-col md:flex-row md:items-start justify-between gap-4 flex-row-reverse">
                <div className="text-right flex-1">
                  <p className="font-bold text-white text-sm">({idx + 1}) {q.question_text}</p>
                  {q.choices && <p className="text-xs text-slate-400 mt-1 font-mono">{ (q.choices as string[]).join(' | ') }</p>}
                  {q.correct_answer && <p className="text-xs text-emerald-400 font-bold mt-1.5">✓ الإجابة الصحيحة: {q.correct_answer}</p>}
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase shrink-0 border ${
                  q.type === 'mcq' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' :
                  q.type === 'tf' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                  'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}>
                  {q.type === 'mcq' ? 'اختيار متعدد' : q.type === 'tf' ? 'صح / خطأ' : 'مقالي'}
                </span>
              </div>
            ))}
            {questions.length === 0 && <p className="text-center text-slate-500 py-8">لا توجد أسئلة في بنك الأسئلة لهذا المقرر.</p>}
          </div>
        </div>
      )}

      {/* EXAMS Tab */}
      {activeTab === 'exams' && (
        <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between flex-row-reverse">
            <h3 className="text-white font-black text-lg">الاختبارات الإلكترونية ({exams.length})</h3>
            <button onClick={() => { loadSectionData(selectedSection?.id || ''); setShowExamModal(true); }} className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-sm font-bold text-white shadow shadow-brand-primary/20 hover:scale-[1.01] transition-all flex items-center gap-2 cursor-pointer flex-row-reverse">
              <Plus className="w-4 h-4" /> <span>إنشاء اختبار</span>
            </button>
          </div>
          <div className="space-y-3">
            {exams.map(exam => (
              <div key={exam.id} className="p-4 bg-[#090b10] rounded-xl border border-[#21263d] flex items-center justify-between flex-row-reverse text-right">
                <h4 className="font-black text-white text-sm">{exam.title}</h4>
                <div className="flex items-center gap-3">
                  <span className="bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold px-2.5 py-1 rounded-lg font-mono">
                    {new Date(exam.start_time).toLocaleDateString('ar-SA')}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{exam.duration_minutes} دقيقة</span>
                </div>
              </div>
            ))}
            {exams.length === 0 && <p className="text-center text-slate-500 py-8">لا توجد اختبارات لهذه الشعبة.</p>}
          </div>
        </div>
      )}

      {/* ANNOUNCEMENTS Tab */}
      {activeTab === 'announcements' && (
        <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between flex-row-reverse">
            <h3 className="text-white font-black text-lg">الإعلانات الأكاديمية</h3>
            <button onClick={() => setShowAnnouncementModal(true)} className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-sm font-bold text-white shadow shadow-brand-primary/20 hover:scale-[1.01] transition-all flex items-center gap-2 cursor-pointer flex-row-reverse">
              <Plus className="w-4 h-4" /> <span>نشر إعلان</span>
            </button>
          </div>
          <div className="space-y-3">
            {announcements.map(ann => (
              <div key={ann.id} className="p-4 bg-[#090b10] rounded-xl border border-[#21263d] text-right">
                <p className="text-xs text-slate-500 mb-2 font-mono">{new Date(ann.created_at).toLocaleString('ar-SA')}</p>
                <h4 className="font-black text-white text-sm mb-1">{ann.title}</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{ann.content}</p>
              </div>
            ))}
            {announcements.length === 0 && <p className="text-center text-slate-500 py-8">لا توجد إعلانات لهذه الشعبة.</p>}
          </div>
        </div>
      )}

      {/* MEETINGS Tab */}
      {activeTab === 'meetings' && (
        <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between flex-row-reverse">
            <h3 className="text-white font-black text-lg">المحاضرات المباشرة</h3>
            <button onClick={() => setShowMeetingModal(true)} className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-sm font-bold text-white shadow shadow-brand-primary/20 hover:scale-[1.01] transition-all flex items-center gap-2 cursor-pointer flex-row-reverse">
              <Plus className="w-4 h-4" /> <span>جدولة محاضرة مباشرة</span>
            </button>
          </div>
          <div className="space-y-3">
            {meetings.map(meet => (
              <div key={meet.id} className="p-4 bg-[#090b10] rounded-xl border border-[#21263d] flex items-center justify-between flex-row-reverse text-right">
                <div className="text-right">
                  <h4 className="font-black text-white text-sm">{meet.title}</h4>
                  <p className="text-xs text-brand-primary font-semibold">{new Date(meet.start_time).toLocaleString('ar-SA')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-mono">{meet.duration_minutes} دقيقة</span>
                  <a href={meet.meeting_url} target="_blank" rel="noreferrer" className="bg-[#20c997] hover:bg-[#20c997]/90 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 flex-row-reverse cursor-pointer">
                    <Video className="w-4 h-4" /> <span>الانضمام</span>
                  </a>
                </div>
              </div>
            ))}
            {meetings.length === 0 && <p className="text-center text-dark-muted py-8">لا توجد محاضرات مجدولة.</p>}
          </div>
        </div>
      )}

      {/* ATTENDANCE Tab */}
      {activeTab === 'attendance' && (
        <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#21263d] pb-4 flex-row-reverse">
            <h3 className="text-white font-black text-lg">رصد حضور وغياب الطلاب</h3>
            <div className="flex items-center gap-3 flex-row-reverse">
              <label className="text-xs text-slate-400 font-bold shrink-0">اختر التاريخ:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-[#090b10] border border-[#21263d] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-primary font-mono text-center"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-[#21263d] text-slate-400">
                  <th className="p-3 font-bold text-right">اسم الطالب</th>
                  <th className="p-3 font-bold text-right">البريد الإلكتروني</th>
                  <th className="p-3 font-bold text-right">حالة الحضور</th>
                  <th className="p-3 font-bold text-center">إجراءات الرصد</th>
                </tr>
              </thead>
              <tbody>
                {sectionStudents.map(enr => {
                  const s = enr.student;
                  if (!s) return null;
                  const record = attendanceRecords.find(r => r.student_id === s.id);
                  const currentStatus = record?.status;

                  return (
                    <tr key={s.id} className="border-b border-[#21263d]/30 hover:bg-[#121626]/30 transition">
                      <td className="p-3 text-white font-bold text-sm">{s.full_name}</td>
                      <td className="p-3 font-mono text-slate-400 text-sm">{s.email}</td>
                      <td className="p-3">
                        {currentStatus ? (
                          <span className={`px-2.5 py-1 rounded-lg font-black text-[9px] uppercase border ${
                            currentStatus === 'present' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            currentStatus === 'absent' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                            currentStatus === 'late' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                            'bg-blue-500/10 border-blue-500/20 text-blue-400'
                          }`}>
                            {currentStatus === 'present' ? 'حاضر' :
                             currentStatus === 'absent' ? 'غائب' :
                             currentStatus === 'late' ? 'متأخر' : 'بعذر'}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs italic">غير مرصود</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleRecordAttendance(s.id, 'present')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              currentStatus === 'present' 
                                ? 'bg-emerald-600 text-white shadow shadow-emerald-600/20' 
                                : 'bg-[#090b10] border border-[#21263d] text-slate-400 hover:text-white'
                            }`}
                          >
                            حاضر
                          </button>
                          <button
                            onClick={() => handleRecordAttendance(s.id, 'absent')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              currentStatus === 'absent' 
                                ? 'bg-rose-600 text-white shadow shadow-rose-600/20' 
                                : 'bg-[#090b10] border border-[#21263d] text-slate-400 hover:text-white'
                            }`}
                          >
                            غائب
                          </button>
                          <button
                            onClick={() => handleRecordAttendance(s.id, 'late')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              currentStatus === 'late' 
                                ? 'bg-amber-500 text-[#090b10] shadow shadow-amber-500/20' 
                                : 'bg-[#090b10] border border-[#21263d] text-slate-400 hover:text-white'
                            }`}
                          >
                            متأخر
                          </button>
                          <button
                            onClick={() => handleRecordAttendance(s.id, 'excused')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              currentStatus === 'excused' 
                                ? 'bg-blue-600 text-white shadow shadow-blue-600/20' 
                                : 'bg-[#090b10] border border-[#21263d] text-slate-400 hover:text-white'
                            }`}
                          >
                            بعذر
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {sectionStudents.length === 0 && (
                  <tr><td colSpan={4} className="text-center text-slate-500 p-8">لا يوجد طلاب مسجلون في هذه الشعبة لتسجيل حضورهم.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====== MODALS ====== */}
      {/* Material Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-[#0c0e18] border border-[#212739] w-full max-w-md p-6 space-y-4 rounded-3xl text-right shadow-2xl">
            <div className="flex items-center justify-between mb-2 flex-row-reverse">
              <h3 className="text-white font-black text-lg">رفع مادة تعليمية</h3>
              <button onClick={() => setShowMaterialModal(false)} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">✕</button>
            </div>
            <div><label className={labelClass}>عنوان المادة *</label><input value={matForm.title} onChange={e => setMatForm(f => ({ ...f, title: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>نوع الملف *</label>
              <select value={matForm.type} onChange={e => setMatForm(f => ({ ...f, type: e.target.value as any }))} className={inputClass + ' bg-[#0c0e18]'}>
                <option value="pdf">PDF محاضرة</option>
                <option value="video">فيديو تعليمي</option>
                <option value="audio">تسجيل صوتي</option>
                <option value="document">مستند Word/PPT</option>
                <option value="link">رابط خارجي</option>
              </select>
            </div>
            <div><label className={labelClass}>رابط الملف أو URL *</label><input value={matForm.file_url} onChange={e => setMatForm(f => ({ ...f, file_url: e.target.value }))} placeholder="https://..." className={inputClass + ' font-mono text-left'} /></div>
            <div><label className={labelClass}>الوصف</label><textarea value={matForm.description} onChange={e => setMatForm(f => ({ ...f, description: e.target.value }))} rows={2} className={inputClass + ' resize-none'} /></div>
            <button onClick={handleAddMaterial} disabled={!matForm.title || !matForm.file_url} className="w-full py-3.5 mt-2 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-sm shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40">رفع المادة</button>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-[#0c0e18] border border-[#212739] w-full max-w-md p-6 space-y-4 rounded-3xl text-right shadow-2xl">
            <div className="flex items-center justify-between mb-2 flex-row-reverse">
              <h3 className="text-white font-black text-lg">إنشاء واجب دراسي</h3>
              <button onClick={() => setShowAssignmentModal(false)} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">✕</button>
            </div>
            <div><label className={labelClass}>عنوان الواجب *</label><input value={assignForm.title} onChange={e => setAssignForm(f => ({ ...f, title: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>التعليمات</label><textarea value={assignForm.instructions} onChange={e => setAssignForm(f => ({ ...f, instructions: e.target.value }))} rows={3} className={inputClass + ' resize-none'} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>تاريخ الاستحقاق *</label><input type="datetime-local" value={assignForm.due_date} onChange={e => setAssignForm(f => ({ ...f, due_date: e.target.value }))} className={inputClass} /></div>
              <div><label className={labelClass}>الدرجة الكاملة</label><input type="number" value={assignForm.max_points} onChange={e => setAssignForm(f => ({ ...f, max_points: e.target.value }))} className={inputClass + ' font-mono text-left'} /></div>
            </div>
            <button onClick={handleAddAssignment} disabled={!assignForm.title || !assignForm.due_date} className="w-full py-3.5 mt-2 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-sm shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40">إنشاء الواجب</button>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-[#0c0e18] border border-[#212739] w-full max-w-lg p-6 space-y-4 rounded-3xl text-right shadow-2xl">
            <div className="flex items-center justify-between mb-2 flex-row-reverse">
              <h3 className="text-white font-black text-lg">إضافة سؤال لبنك الأسئلة</h3>
              <button onClick={() => setShowQuestionModal(false)} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>نوع السؤال *</label>
                <select value={qForm.type} onChange={e => setQForm(f => ({ ...f, type: e.target.value as any }))} className={inputClass + ' bg-[#0c0e18]'}>
                  <option value="mcq">اختيار متعدد MCQ</option>
                  <option value="tf">صح أو خطأ T/F</option>
                  <option value="essay">مقالي Essay</option>
                </select>
              </div>
              <div><label className={labelClass}>الدرجة</label><input type="number" value={qForm.points} onChange={e => setQForm(f => ({ ...f, points: e.target.value }))} className={inputClass + ' font-mono text-left'} /></div>
            </div>
            <div><label className={labelClass}>نص السؤال *</label><textarea value={qForm.question_text} onChange={e => setQForm(f => ({ ...f, question_text: e.target.value }))} rows={3} className={inputClass + ' resize-none'} /></div>
            {qForm.type === 'mcq' && (
              <div className="space-y-2">
                <label className={labelClass}>خيارات الإجابة (A, B, C, D)</label>
                {qForm.choices.map((ch, i) => (
                  <input key={i} value={ch} onChange={e => setQForm(f => { const c = [...f.choices]; c[i] = e.target.value; return { ...f, choices: c }; })} placeholder={`الخيار ${String.fromCharCode(65 + i)}`} className={inputClass} />
                ))}
              </div>
            )}
            {qForm.type !== 'essay' && (
              <div><label className={labelClass}>الإجابة الصحيحة *</label><input value={qForm.correct_answer} onChange={e => setQForm(f => ({ ...f, correct_answer: e.target.value }))} placeholder={qForm.type === 'tf' ? 'صح أو خطأ' : 'أدخل نص الخيار الصحيح'} className={inputClass} /></div>
            )}
            <button onClick={handleAddQuestion} disabled={!qForm.question_text} className="w-full py-3.5 mt-2 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-sm shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40">إضافة السؤال</button>
          </div>
        </div>
      )}

      {/* Exam Modal */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-[#0c0e18] border border-[#212739] w-full max-w-lg p-6 space-y-4 rounded-3xl text-right max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-2 flex-row-reverse">
              <h3 className="text-white font-black text-lg">إنشاء اختبار إلكتروني</h3>
              <button onClick={() => setShowExamModal(false)} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">✕</button>
            </div>
            <div><label className={labelClass}>عنوان الاختبار *</label><input value={examForm.title} onChange={e => setExamForm(f => ({ ...f, title: e.target.value }))} className={inputClass} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={labelClass}>وقت النهاية *</label><input type="datetime-local" value={examForm.end_time} onChange={e => setExamForm(f => ({ ...f, end_time: e.target.value }))} className={inputClass} /></div>
              <div><label className={labelClass}>وقت البداية *</label><input type="datetime-local" value={examForm.start_time} onChange={e => setExamForm(f => ({ ...f, start_time: e.target.value }))} className={inputClass} /></div>
              <div><label className={labelClass}>المدة (دقيقة)</label><input type="number" value={examForm.duration_minutes} onChange={e => setExamForm(f => ({ ...f, duration_minutes: e.target.value }))} className={inputClass + ' font-mono text-left'} /></div>
            </div>
            <div>
              <label className={labelClass}>اختر الأسئلة من البنك ({examForm.selectedQIds.length} محدد)</label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-[#21263d] bg-[#090b10] rounded-xl p-3 flex flex-col items-end">
                {questions.map(q => (
                  <label key={q.id} className="flex items-center gap-3 cursor-pointer hover:bg-[#121626]/40 p-2 rounded-lg w-full flex-row-reverse text-right justify-start">
                    <input type="checkbox" checked={examForm.selectedQIds.includes(q.id)} onChange={e => setExamForm(f => ({ ...f, selectedQIds: e.target.checked ? [...f.selectedQIds, q.id] : f.selectedQIds.filter(id => id !== q.id) }))} className="w-4 h-4 accent-brand-primary cursor-pointer" />
                    <span className="text-white text-sm truncate">{q.question_text.slice(0, 60)}...</span>
                  </label>
                ))}
                {questions.length === 0 && <p className="text-center text-slate-500 text-sm py-2 w-full">لا توجد أسئلة. أضف أسئلة أولاً.</p>}
              </div>
            </div>
            <button onClick={handleAddExam} disabled={!examForm.title || !examForm.start_time || !examForm.end_time} className="w-full py-3.5 mt-2 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-sm shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40">إنشاء الاختبار</button>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-[#0c0e18] border border-[#212739] w-full max-w-md p-6 space-y-4 rounded-3xl text-right shadow-2xl">
            <div className="flex items-center justify-between mb-2 flex-row-reverse">
              <h3 className="text-white font-black text-lg">نشر إعلان أكاديمي</h3>
              <button onClick={() => setShowAnnouncementModal(false)} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">✕</button>
            </div>
            <div><label className={labelClass}>عنوان الإعلان *</label><input value={annForm.title} onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>محتوى الإعلان *</label><textarea value={annForm.content} onChange={e => setAnnForm(f => ({ ...f, content: e.target.value }))} rows={5} className={inputClass + ' resize-none'} /></div>
            <button onClick={handleAddAnnouncement} disabled={!annForm.title || !annForm.content} className="w-full py-3.5 mt-2 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-sm shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40">نشر الإعلان</button>
          </div>
        </div>
      )}

      {/* Meeting Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-[#0c0e18] border border-[#212739] w-full max-w-md p-6 space-y-4 rounded-3xl text-right shadow-2xl">
            <div className="flex items-center justify-between mb-2 flex-row-reverse">
              <h3 className="text-white font-black text-lg">جدولة محاضرة مباشرة</h3>
              <button onClick={() => setShowMeetingModal(false)} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">✕</button>
            </div>
            <div><label className={labelClass}>عنوان المحاضرة *</label><input value={meetForm.title} onChange={e => setMeetForm(f => ({ ...f, title: e.target.value }))} className={inputClass} /></div>
            <div><label className={labelClass}>رابط الاجتماع (Zoom / Teams / WebRTC) *</label><input value={meetForm.meeting_url} onChange={e => setMeetForm(f => ({ ...f, meeting_url: e.target.value }))} placeholder="https://zoom.us/j/..." className={inputClass + ' font-mono text-left'} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>وقت البداية *</label><input type="datetime-local" value={meetForm.start_time} onChange={e => setMeetForm(f => ({ ...f, start_time: e.target.value }))} className={inputClass} /></div>
              <div><label className={labelClass}>المدة (دقيقة)</label><input type="number" value={meetForm.duration_minutes} onChange={e => setMeetForm(f => ({ ...f, duration_minutes: e.target.value }))} className={inputClass + ' font-mono text-left'} /></div>
            </div>
            <button onClick={handleAddMeeting} disabled={!meetForm.title || !meetForm.meeting_url || !meetForm.start_time} className="w-full py-3.5 mt-2 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-sm shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40">جدولة المحاضرة</button>
          </div>
        </div>
      )}
    </div>
  );
}
