import { useState, useEffect, useRef } from 'react';
import {
  BookOpen, FileText, CheckSquare, Award, ClipboardList,
  Video, MessageSquare, Bell, Eye, Clock,
  Send, CheckCircle, ChevronLeft, Plus, CreditCard
} from 'lucide-react';
import { lmsDb, type LMSUser, type LMSSection, type LMSMaterial, type LMSAssignment, type LMSQuestion, type LMSExam, type LMSAnnouncement, type LMSMeeting, type LMSAttendance, type LMSMessage, type LMSCertificate, type LMSSubmission, type LMSExamAttempt, type LMSSpecialRequest } from '../../lib/lms_supabase';
import { db } from '../../lib/supabase';

interface LMSStudentDashboardProps {
  student: LMSUser;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export default function LMSStudentDashboard({ student, activeTab: propActiveTab, setActiveTab }: LMSStudentDashboardProps) {
  const [activeTab, setLocalActiveTab] = useState('dashboard');
  const changeTab = setActiveTab || setLocalActiveTab;

  // Payments states
  const [coreStudent, setCoreStudent] = useState<any>(null);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [existingPayments, setExistingPayments] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptImage, setReceiptImage] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);

  // Load payment settings and link student
  useEffect(() => {
    const loadPaymentDetails = async () => {
      try {
        const studentsList = await db.getStudents();
        const found = studentsList.find(s => s.academic_id === student.email || `${s.academic_id}@lms.com` === student.email);
        if (found) {
          setCoreStudent(found);
        }
        
        // Fetch all payments and filter by lms_user_id or core student_id
        const paymentsList = await db.getPayments();
        const studentPayments = paymentsList.filter(p => 
          (p as any).lms_user_id === student.id || (found && p.student_id === found.student_id)
        );
        setExistingPayments(studentPayments);
        
        const pending = studentPayments.find(p => p.status === 'pending');
        if (pending) {
          setPaymentMessage('تم استلام الإيصال وهو الآن بانتظار مراجعة الإدارة.');
        } else {
          setPaymentMessage('');
        }

        const settings = await db.getPaymentSettings();
        setPaymentSettings(settings);
        if (settings.enabled_payment_methods && settings.enabled_payment_methods.length > 0) {
          setSelectedMethod(settings.enabled_payment_methods[0]);
        }

        const reqs = await lmsDb.getSpecialRequests();
        setSpecialRequests(reqs);

        const plans = await lmsDb.getSubscriptionPlans();
        setSubscriptionPlans(plans);
      } catch (err) {
        console.error('[Payment] Load details error:', err);
      }
    };

    if (activeTab === 'payment' || activeTab === 'dashboard') {
      loadPaymentDetails();
    }
  }, [activeTab, student.email, student.id]);

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Calculate active plan/custom price
  const approvedRequest = specialRequests.find(r => r.student_id === student.id && r.status === 'approved');
  const customPrice = approvedRequest ? approvedRequest.price : null;
  const selectedPlan = subscriptionPlans.find(p => p.id === student.subscription_plan_id);
  const planPrice = selectedPlan ? selectedPlan.price : 150;
  const finalPrice = customPrice !== null && customPrice !== undefined ? customPrice : planPrice;

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptImage) {
      alert('يرجى رفع صورة الإيصال أولاً.');
      return;
    }
    setSubmittingPayment(true);
    try {
      const invoiceNum = `INV-LMS-${Math.floor(100000 + Math.random() * 900000)}`;
      
      await db.createPayment({
        student_id: coreStudent ? coreStudent.student_id : null,
        lms_user_id: student.id,
        plan_id: student.subscription_plan_id || 'custom',
        amount: finalPrice,
        payment_method: selectedMethod as any,
        status: 'pending',
        receipt_image: receiptImage,
        invoice_number: invoiceNum,
        transaction_id: transactionId || null,
        notes: notes || null,
        admin_notes: null,
        approved_at: null,
        approved_by: null,
        subscription_start: null,
        subscription_end: null
      } as any);

      if (coreStudent) {
        await db.updateStudent(coreStudent.student_id, {
          subscription_status: 'pending_payment'
        });
      }

      setPaymentMessage('تم استلام الإيصال وهو الآن بانتظار مراجعة الإدارة.');
      showToast('تم رفع إيصال الدفع بنجاح');
      
      const paymentsList = await db.getPayments();
      setExistingPayments(paymentsList.filter(p => 
        (p as any).lms_user_id === student.id || (coreStudent && p.student_id === coreStudent.student_id)
      ));
      
      setReceiptImage('');
      setTransactionId('');
      setNotes('');
    } catch (err: any) {
      console.error(err);
      alert('فشل رفع الإيصال: ' + err.message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  useEffect(() => {
    if (propActiveTab) {
      setLocalActiveTab(propActiveTab);
    }
  }, [propActiveTab]);
  const [sections, setSections] = useState<LMSSection[]>([]);
  const [allSections, setAllSections] = useState<LMSSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<LMSSection | null>(null);

  // Dynamic content states
  const [materials, setMaterials] = useState<LMSMaterial[]>([]);
  const [assignments, setAssignments] = useState<LMSAssignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, LMSSubmission | null>>({});
  const [exams, setExams] = useState<LMSExam[]>([]);
  const [attempts, setAttempts] = useState<Record<string, LMSExamAttempt | null>>({});
  const [attendance, setAttendance] = useState<LMSAttendance[]>([]);
  const [meetings, setMeetings] = useState<LMSMeeting[]>([]);
  const [announcements, setAnnouncements] = useState<LMSAnnouncement[]>([]);
  const [certificates, setCertificates] = useState<LMSCertificate[]>([]);
  const [specialRequests, setSpecialRequests] = useState<LMSSpecialRequest[]>([]);
  const [newRequestText, setNewRequestText] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Messages/Chat states
  const [instructors, setInstructors] = useState<LMSUser[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<LMSUser | null>(null);
  const [chatMessages, setChatMessages] = useState<LMSMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Modal / Interactive states
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState<LMSAssignment | null>(null);
  const [submitForm, setSubmitForm] = useState({ file_url: '', student_notes: '' });
  
  // Timed Exam engine states
  const [activeExam, setActiveExam] = useState<LMSExam | null>(null);
  const [examQuestions, setExamQuestions] = useState<LMSQuestion[]>([]);
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
  const [examTimer, setExamTimer] = useState(0);

  // Certificate Modal
  const [activeCertificate, setActiveCertificate] = useState<LMSCertificate | null>(null);

  useEffect(() => {
    loadStudentData();
    loadAllSections();
  }, [activeTab]);

  useEffect(() => {
    if (selectedSection) {
      loadSectionSpecificData(selectedSection.id);
    }
  }, [selectedSection, activeTab]);

  useEffect(() => {
    if (activeTab === 'messages') {
      loadInstructors();
    }
  }, [activeTab]);

  useEffect(() => {
    let interval: any;
    if (activeTab === 'messages' && selectedInstructor) {
      loadChatHistory(selectedInstructor.id);
      interval = setInterval(() => loadChatHistory(selectedInstructor.id), 4000);
    }
    return () => clearInterval(interval);
  }, [selectedInstructor, activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Exam timer countdown
  useEffect(() => {
    let timerInterval: any;
    if (activeExam && examTimer > 0) {
      timerInterval = setInterval(() => {
        setExamTimer(t => {
          if (t <= 1) {
            clearInterval(timerInterval);
            handleAutoSubmitExam();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [activeExam, examTimer]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const sects = await lmsDb.getStudentSections(student.id);
      setSections(sects);
      if (sects.length > 0 && !selectedSection) {
        setSelectedSection(sects[0]);
      }
      
      if (activeTab === 'dashboard') {
        // Load recent announcements and upcoming tasks from all student sections
        const allAnns: LMSAnnouncement[] = [];
        const allExams: LMSExam[] = [];
        const allAsgns: LMSAssignment[] = [];
        const subsMap: Record<string, LMSSubmission | null> = {};
        const attMap: Record<string, LMSExamAttempt | null> = {};

        await Promise.all(sects.map(async (sec) => {
          const [secAnns, secExams, secAsgns] = await Promise.all([
            lmsDb.getAnnouncements(sec.id),
            lmsDb.getExams(sec.id),
            lmsDb.getAssignments(sec.id)
          ]);
          allAnns.push(...secAnns);
          allExams.push(...secExams);
          allAsgns.push(...secAsgns);

          // Fetch submissions for assignments
          await Promise.all(secAsgns.map(async (a) => {
            const sub = await lmsDb.getStudentSubmission(a.id, student.id);
            subsMap[a.id] = sub;
          }));

          // Fetch exam attempts
          await Promise.all(secExams.map(async (e) => {
            const att = await lmsDb.getStudentExamAttempt(e.id, student.id);
            attMap[e.id] = att;
          }));
        }));

        setAnnouncements(allAnns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5));
        setExams(allExams);
        setAttempts(attMap);
        setAssignments(allAsgns);
        setSubmissions(subsMap);
      }

      if (activeTab === 'certificates') {
        const certs = await lmsDb.getCertificates(student.id);
        setCertificates(certs);
      }

      const reqs = await lmsDb.getSpecialRequests();
      setSpecialRequests(reqs.filter(r => r.student_id === student.id));
    } catch (err) {
      console.error('[LMS Student Dashboard] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllSections = async () => {
    try {
      const allSects = await lmsDb.getSections();
      setAllSections(allSects);
    } catch (err) {
      console.error('[LMS Student Dashboard] Error loading all sections:', err);
    }
  };

  const loadSectionSpecificData = async (sectionId: string) => {
    try {
      if (activeTab === 'materials') {
        const mats = await lmsDb.getMaterials(sectionId);
        setMaterials(mats);
      }
      if (activeTab === 'assignments') {
        const asgns = await lmsDb.getAssignments(sectionId);
        setAssignments(asgns);
        
        // Fetch submission for each assignment
        const newSubs = { ...submissions };
        await Promise.all(asgns.map(async (a) => {
          const sub = await lmsDb.getStudentSubmission(a.id, student.id);
          newSubs[a.id] = sub;
        }));
        setSubmissions(newSubs);
      }
      if (activeTab === 'exams') {
        const exms = await lmsDb.getExams(sectionId);
        setExams(exms);

        // Fetch exam attempts
        const newAtts = { ...attempts };
        await Promise.all(exms.map(async (e) => {
          const att = await lmsDb.getStudentExamAttempt(e.id, student.id);
          newAtts[e.id] = att;
        }));
        setAttempts(newAtts);
      }
      if (activeTab === 'attendance') {
        // Attendance logs for this course section
        // We will fetch attendance logs for current student in local storage fallback
        // In local lmsDb, attendance checks are filtered by student_id and section_id
        // However, lmsDb.getAttendance(sectionId, date) gets everyone on a specific date.
        // Let's retrieve all logs locally or mock for this section
        const localAtt = JSON.parse(localStorage.getItem('lms_attendance') || '[]');
        const filtered = localAtt.filter((a: any) => a.section_id === sectionId && a.student_id === student.id);
        setAttendance(filtered);
      }
      if (activeTab === 'meetings') {
        const meets = await lmsDb.getMeetings(sectionId);
        setMeetings(meets);
      }
    } catch (err) {
      console.error('[LMS Student Dashboard] Section data load error:', err);
    }
  };

  const loadInstructors = async () => {
    try {
      const teachers = await lmsDb.getUsers('instructor');
      setInstructors(teachers);
      if (teachers.length > 0 && !selectedInstructor) {
        setSelectedInstructor(teachers[0]);
      }
    } catch (err) {
      console.error('[LMS Student Dashboard] Error loading instructors:', err);
    }
  };

  const loadChatHistory = async (teacherId: string) => {
    try {
      const msgs = await lmsDb.getMessages(student.id, teacherId);
      setChatMessages(msgs);
    } catch (err) {
      console.error('[LMS Student Dashboard] Message load error:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedInstructor) return;
    try {
      const sent = await lmsDb.sendMessage(student.id, selectedInstructor.id, newMessage);
      setChatMessages(prev => [...prev, sent]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleEnroll = async (sectionId: string) => {
    try {
      await lmsDb.enrollStudent(student.id, sectionId);
      showToast('تم التسجيل في الشعبة الدراسية بنجاح');
      loadStudentData();
      loadAllSections();
    } catch (err: any) {
      alert(err?.message || 'فشل التسجيل');
    }
  };

  const handleCreateSpecialRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequestText.trim()) return;
    setSubmittingRequest(true);
    try {
      await lmsDb.createSpecialRequest(student.id, newRequestText);
      showToast('تم تقديم طلبك بنجاح وسيقوم المدير بمراجعته وتحديد السعر قريباً.');
      setNewRequestText('');
      const reqs = await lmsDb.getSpecialRequests();
      setSpecialRequests(reqs.filter(r => r.student_id === student.id));
    } catch (err) {
      console.error('[LMS Student Dashboard] Error creating special request:', err);
      showToast('عذراً، فشل تقديم الطلب.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleOpenSubmitAssignment = (asgn: LMSAssignment) => {
    setShowSubmitModal(asgn);
    const existing = submissions[asgn.id];
    setSubmitForm({
      file_url: existing?.file_url || '',
      student_notes: existing?.student_notes || ''
    });
  };

  const handleSubmitAssignment = async () => {
    if (!showSubmitModal) return;
    try {
      const sub = await lmsDb.submitAssignment(showSubmitModal.id, student.id, submitForm.file_url, submitForm.student_notes);
      setSubmissions(prev => ({ ...prev, [showSubmitModal.id]: sub }));
      setShowSubmitModal(null);
      showToast('تم تسليم الواجب بنجاح');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Timed Exam engine functions
  const handleStartExam = async (exam: LMSExam) => {
    try {
      const questionsList = await lmsDb.getExamQuestions(exam.id);
      if (questionsList.length === 0) {
        alert('لا توجد أسئلة مضافة لهذا الاختبار بعد.');
        return;
      }
      setExamQuestions(questionsList);
      setExamAnswers({});
      setActiveExam(exam);
      setExamTimer(exam.duration_minutes * 60);
      showToast('بدأ مؤقت الاختبار، حظاً موفقاً!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoSubmitExam = () => {
    alert('انتهى وقت الاختبار المحدد! سيتم تسليم إجاباتك تلقائياً.');
    handleSubmitExamAnswers(true);
  };

  const handleSubmitExamAnswers = async (forced = false) => {
    if (!activeExam) return;
    if (!forced && !confirm('هل أنت متأكد من رغبتك في تسليم الاختبار الآن؟')) return;

    let correctScore = 0;
    examQuestions.forEach(q => {
      const studentAns = examAnswers[q.id];
      if (studentAns && studentAns.trim().toLowerCase() === q.correct_answer?.trim().toLowerCase()) {
        correctScore += q.points;
      }
    });

    try {
      const attempt = await lmsDb.submitExamAttempt(activeExam.id, student.id, examAnswers, correctScore);
      setAttempts(prev => ({ ...prev, [activeExam.id]: attempt }));
      setActiveExam(null);
      setExamQuestions([]);
      showToast(`تم تسليم الاختبار بنجاح. النتيجة المحققة: ${correctScore} درجة`);
      loadStudentData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatTimer = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const getAttendanceRate = () => {
    if (attendance.length === 0) return 100;
    const present = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    return Math.round((present / attendance.length) * 100);
  };

  const getOverallGPA = () => {
    const gradedSubs = Object.values(submissions).filter(s => s && s.grade !== undefined && s.grade !== null) as LMSSubmission[];
    if (gradedSubs.length === 0) return '—';
    const totalGrades = gradedSubs.reduce((sum, s) => sum + (s.grade || 0), 0);
    const totalMax = gradedSubs.reduce((sum, s) => {
      const assignment = assignments.find(a => a.id === s.assignment_id);
      return sum + (assignment?.max_points || 100);
    }, 0);
    return totalMax > 0 ? `${Math.round((totalGrades / totalMax) * 100)}%` : '—';
  };

  const inputClass = 'w-full bg-[#121522] border border-[#21263d] rounded-xl p-3 text-white focus:outline-none focus:border-brand-primary text-right text-sm';
  const labelClass = 'block text-xs font-bold text-slate-400 mb-1.5';

  // If inside active timed exam, block dashboard view and show only Exam interface
  if (activeExam) {
    return (
      <div className="min-h-screen bg-[#090b10] text-[#cbd5e1] text-right p-6 flex flex-col justify-between font-sans relative">
        <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-rose-500/5 blur-[100px] pointer-events-none" />
        <div className="max-w-3xl mx-auto w-full space-y-6 flex-1 relative z-10">
          {/* Header */}
          <div className="bg-[#131622] border border-rose-500/30 p-6 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3 bg-rose-500/10 text-rose-400 px-4 py-2.5 rounded-xl font-bold font-mono border border-rose-500/20 shadow-lg shadow-rose-950/20">
              <Clock className="w-5 h-5 animate-pulse" />
              <span>{formatTimer(examTimer)}</span>
            </div>
            <div>
              <span className="bg-rose-500/10 text-rose-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase border border-rose-500/20">منطقة اختبار محمي</span>
              <h2 className="text-xl md:text-2xl font-black text-white mt-2">{activeExam.title}</h2>
              <p className="text-xs text-slate-400 mt-1">مقرر: {selectedSection?.course?.title}</p>
            </div>
          </div>

          {/* Questions list */}
          <div className="space-y-4">
            {examQuestions.map((q, idx) => (
              <div key={q.id} className="bg-[#131622] border border-[#21263d] p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#21263d] pb-3 flex-row-reverse">
                  <span className="text-xs font-bold text-brand-primary">درجة السؤال: {q.points}</span>
                  <h4 className="font-bold text-white text-base">السؤال {idx + 1}</h4>
                </div>
                <p className="text-white text-sm leading-relaxed">{q.question_text}</p>

                {/* MCQ Choices */}
                {q.type === 'mcq' && q.choices && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
                    {q.choices.map((choice, i) => (
                      <label key={i} className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer flex-row-reverse ${
                        examAnswers[q.id] === choice 
                          ? 'bg-brand-primary/10 border-brand-primary text-white font-bold' 
                          : 'bg-[#090b10] border-[#21263d] text-slate-400 hover:border-slate-700 hover:text-white'
                      }`}>
                        <input type="radio" name={`q-${q.id}`} value={choice} checked={examAnswers[q.id] === choice} onChange={e => setExamAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} className="w-4 h-4 accent-brand-primary cursor-pointer" />
                        <span className="text-sm">{choice}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* True/False Choices */}
                {q.type === 'tf' && (
                  <div className="flex gap-4 pt-2">
                    {['صح', 'خطأ'].map((choice) => (
                      <label key={choice} className={`flex-1 flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer flex-row-reverse ${
                        examAnswers[q.id] === choice 
                          ? 'bg-brand-primary/10 border-brand-primary text-white font-bold' 
                          : 'bg-[#090b10] border-[#21263d] text-slate-400 hover:border-slate-700 hover:text-white'
                      }`}>
                        <input type="radio" name={`q-${q.id}`} value={choice} checked={examAnswers[q.id] === choice} onChange={e => setExamAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} className="w-4 h-4 accent-brand-primary cursor-pointer" />
                        <span className="text-sm">{choice}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Essay input */}
                {q.type === 'essay' && (
                  <div className="pt-2">
                    <textarea rows={4} value={examAnswers[q.id] || ''} onChange={e => setExamAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} placeholder="اكتب إجابتك المقالية هنا بالتفصيل..." className="w-full bg-[#090b10] border border-[#21263d] rounded-xl p-3 text-white focus:outline-none focus:border-brand-primary text-right text-sm" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="pb-12 text-center">
            <button onClick={() => handleSubmitExamAnswers(false)} className="w-full max-w-md py-4 text-base font-bold mx-auto rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-white shadow-xl shadow-brand-primary/20 hover:scale-[1.01] transition-all cursor-pointer">
              إنهاء وتكليف الإجابات
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = student.subscription_status === 'active'
    ? [
        { id: 'dashboard', label: 'لوحة التحكم', icon: BookOpen },
        { id: 'enrollment', label: 'تسجيل المقررات', icon: Plus },
        { id: 'materials', label: 'المحاضرات', icon: FileText },
        { id: 'assignments', label: 'الواجبات والمهام', icon: CheckSquare },
        { id: 'exams', label: 'الاختبارات', icon: Award },
        { id: 'attendance', label: 'سجل الحضور', icon: ClipboardList },
        { id: 'schedule', label: 'الجدول الدراسي', icon: Clock },
        { id: 'meetings', label: 'المحاضرات المباشرة', icon: Video },
        { id: 'messages', label: 'مراسلة الأساتذة', icon: MessageSquare },
        { id: 'certificates', label: 'الشهادات والدرجات', icon: Award }
      ]
    : [
        { id: 'dashboard', label: 'لوحة التحكم', icon: BookOpen },
        { id: 'payment', label: 'الدفع والاشتراك', icon: CreditCard }
      ];

  const currentTab = student.subscription_status === 'active' 
    ? activeTab 
    : (activeTab === 'dashboard' || activeTab === 'payment' ? activeTab : 'dashboard');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#20c997] text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold animate-slide-up border border-[#20c997]/20">
          <CheckCircle className="w-5 h-5" /> {toast}
        </div>
      )}

      {/* Tab Selector Buttons */}
      <div className="flex flex-wrap gap-2 flex-row-reverse justify-start">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => changeTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              currentTab === tab.id 
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                : 'bg-[#131622] border border-[#21263d] text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {/* Course Selector (rendered for course-specific tabs) */}
      {['materials', 'assignments', 'exams', 'attendance', 'meetings'].includes(currentTab) && sections.length > 0 && (
        <div className="bg-[#131622] border border-[#21263d] p-5 rounded-2xl">
          <label className={labelClass}>اختر المقرر الدراسي الحالي</label>
          <select value={selectedSection?.id || ''} onChange={e => {
            const sec = sections.find(s => s.id === e.target.value) || null;
            setSelectedSection(sec);
          }} className={inputClass + ' max-w-sm font-bold bg-[#090b10]'}>
            {sections.map(s => (
              <option key={s.id} value={s.id}>{(s.course as any)?.title} — شعبة {s.section_number} ({s.semester})</option>
            ))}
          </select>
        </div>
      )}

      {/* OVERVIEW Tab */}
      {currentTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Active Subscription Verification Warning Card */}
          {student.subscription_status !== 'active' && (
            <div className="bg-rose-500/10 border-2 border-rose-500/30 p-6 rounded-3xl text-right flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-rose-950/20">
              <div className="space-y-1">
                <h3 className="text-white font-black text-lg flex items-center gap-2 flex-row-reverse justify-start">
                  <span>🔒 اشتراكك غير مفعل</span>
                </h3>
                <p className="text-xs text-rose-300">
                  رسوم الاشتراك المستحقة: <span className="font-mono text-emerald-400 font-bold">{finalPrice} ر.س</span>. يرجى إتمام عملية الدفع ورفع صورة الإيصال ليتم تفعيل حسابك والوصول لكافة المواد العلمية والاختبارات.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5 shrink-0 flex-row-reverse">
                <button
                  onClick={() => changeTab('payment')}
                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-500/20 cursor-pointer transition-all"
                >
                  الدفع الآن
                </button>
                <button
                  onClick={() => changeTab('payment')}
                  className="px-5 py-2.5 bg-[#131622] border border-rose-500/30 text-rose-400 hover:text-white font-bold rounded-xl text-xs cursor-pointer transition-all"
                >
                  رفع الإيصال
                </button>
                <a
                  href={paymentSettings?.whatsapp_link || 'https://wa.me/966501234567'}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-[#090b10] font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
                >
                  التواصل عبر واتساب
                </a>
              </div>
            </div>
          )}

          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-secondary to-brand-primary p-8 text-white shadow-xl border border-brand-primary/25">
            <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 flex-row-reverse text-right">
              <div className="md:w-3/4">
                <span className="bg-white/20 text-white text-[10px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">المنصة الأكاديمية الذكية</span>
                <h1 className="text-2xl md:text-3xl font-black mt-3">أهلاً بك مجدداً، {student.full_name}!</h1>
                <p className="text-white/80 text-sm mt-1">تمنياتنا لك بفصل دراسي حافلاً بالنجاح والتفوق الأكاديمي. الرقم الجامعي: {student.phone || '20261102'}</p>
              </div>
              <div className="bg-[#0c0d12]/45 backdrop-blur-md rounded-2xl p-4.5 border border-white/10 text-center md:text-right shrink-0">
                <p className="text-[10px] text-white/70">المعدل التراكمي للواجبات</p>
                <p className="text-3xl font-black mt-1 font-mono text-cyan-300">{getOverallGPA()}</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#131622] border border-[#21263d] p-5 rounded-2xl flex items-center justify-between flex-row-reverse">
              <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400"><BookOpen className="w-6 h-6" /></div>
              <div className="text-right">
                <p className="text-3xl font-black text-white font-mono">{sections.length}</p>
                <p className="text-xs text-slate-400 mt-1">المقررات المسجلة</p>
              </div>
            </div>
            <div className="bg-[#131622] border border-[#21263d] p-5 rounded-2xl flex items-center justify-between flex-row-reverse">
              <div className="w-12 h-12 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400"><CheckSquare className="w-6 h-6" /></div>
              <div className="text-right">
                <p className="text-3xl font-black text-white font-mono">
                  {Object.values(submissions).filter(s => s !== null).length}
                </p>
                <p className="text-xs text-slate-400 mt-1">الواجبات المسلمة</p>
              </div>
            </div>
            <div className="bg-[#131622] border border-[#21263d] p-5 rounded-2xl flex items-center justify-between flex-row-reverse">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400"><ClipboardList className="w-6 h-6" /></div>
              <div className="text-right">
                <p className="text-3xl font-black text-white font-mono">{getAttendanceRate()}%</p>
                <p className="text-xs text-slate-400 mt-1">نسبة الحضور الإجمالية</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Announcements */}
            <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-4">
              <h3 className="text-white font-black text-base flex items-center gap-2 flex-row-reverse"><Bell className="w-5 h-5 text-brand-secondary" /> <span>آخر الإعلانات الأكاديمية</span></h3>
              <div className="space-y-3">
                {announcements.map(ann => (
                  <div key={ann.id} className="p-4 bg-[#090b10] rounded-2xl border border-[#21263d] text-right">
                    <p className="text-[10px] text-slate-500 mb-1 font-mono">{new Date(ann.created_at).toLocaleString('ar-SA')}</p>
                    <h4 className="font-bold text-white text-sm">{ann.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{ann.content}</p>
                  </div>
                ))}
                {announcements.length === 0 && <p className="text-center text-slate-500 py-8 text-sm">لا توجد إعلانات نشطة</p>}
              </div>
            </div>

            {/* Upcoming items */}
            <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-4">
              <h3 className="text-white font-black text-base flex items-center gap-2 flex-row-reverse"><Clock className="w-5 h-5 text-brand-warning animate-pulse" /> <span>المهام والاختبارات القادمة</span></h3>
              <div className="space-y-3">
                {assignments.slice(0, 3).map(asg => {
                  const sub = submissions[asg.id];
                  return (
                    <div key={asg.id} className="flex items-center justify-between p-3.5 bg-[#090b10] rounded-2xl border border-[#21263d] flex-row-reverse">
                      <div className="text-right">
                        <p className="font-bold text-white text-sm">{asg.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-mono">تاريخ الاستحقاق: {new Date(asg.due_date).toLocaleDateString('ar-SA')}</p>
                      </div>
                      <div>
                        {sub ? (
                          <span className="text-emerald-400 text-xs font-bold">تم التسليم</span>
                        ) : (
                          <span className="text-amber-400 text-xs font-bold">معلق</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {assignments.length === 0 && <p className="text-center text-slate-500 py-8 text-sm">لا توجد مهام قادمة</p>}
              </div>
            </div>
          </div>

          {/* Custom Lesson Requests Widget */}
          <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#21263d] pb-4 flex-row-reverse">
              <h3 className="text-white font-black text-base flex items-center gap-2 flex-row-reverse">
                <MessageSquare className="w-5 h-5 text-brand-secondary" />
                <span>طلبات الدروس الخاصة والتقوية</span>
              </h3>
              <span className="text-xs text-slate-400">تواصل مع الإدارة لترتيب حصص دعم مخصصة ومجموعات تقوية</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Request Form */}
              <form onSubmit={handleCreateSpecialRequest} className="space-y-4 lg:col-span-1 border-t lg:border-t-0 lg:border-l border-[#21263d] pt-6 lg:pt-0 lg:pl-6 text-right flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm">طلب درس خاص جديد</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    حدد الموضوع أو المقرر الدراسي الذي ترغب في تقويتك فيه، وسيقوم المدير بمراجعة طلبك وتحديد التكلفة المناسبة.
                  </p>
                  <textarea
                    rows={3}
                    value={newRequestText}
                    onChange={(e) => setNewRequestText(e.target.value)}
                    placeholder="مثال: أريد تقوية مكثفة في قواعد بيانات SQL، شرح الاستعلامات المتقدمة وإعداد الجداول..."
                    className="w-full text-right bg-[#090b10] border border-[#21263d] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-primary placeholder:text-slate-600"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingRequest || !newRequestText.trim()}
                  className="w-full mt-4 py-2.5 rounded-xl bg-brand-secondary hover:bg-brand-secondary/90 text-xs font-bold text-[#090b10] shadow shadow-brand-secondary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {submittingRequest ? 'جاري الإرسال...' : 'إرسال الطلب'}
                </button>
              </form>

              {/* Requests List */}
              <div className="lg:col-span-2 space-y-3 text-right">
                <h4 className="font-bold text-white text-sm">طلباتك الحالية</h4>
                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                  {specialRequests.map((req) => (
                    <div key={req.id} className="p-4 bg-[#090b10] rounded-2xl border border-[#21263d] space-y-2">
                      <div className="flex items-center justify-between flex-row-reverse">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(req.created_at).toLocaleDateString('ar-SA')}
                        </span>
                        <div>
                          {req.status === 'pending' && (
                            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full">
                              قيد المراجعة
                            </span>
                          )}
                          {req.status === 'approved' && (
                            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full">
                              مقبول - السعر: {req.price} ر.س
                            </span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold px-2.5 py-1 rounded-full">
                              مرفوض
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{req.details}</p>
                    </div>
                  ))}
                  {specialRequests.length === 0 && (
                    <div className="text-center text-slate-500 py-12 text-sm border border-dashed border-[#21263d] rounded-2xl">
                      لا توجد لديك طلبات دروس خاصة حالياً
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ENROLLMENT Tab */}
      {currentTab === 'enrollment' && (
        <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-4">
          <h3 className="text-white font-black text-lg">بوابة تسجيل المقررات والشعب الدراسية</h3>
          <p className="text-xs text-slate-400">سجل في الشعبة المطلوبة للالتحاق بالمحاضرات واستقبال الواجبات والاختبارات.</p>
          <div className="space-y-3">
            {allSections.map(sec => {
              const isRegistered = sections.some(s => s.id === sec.id);
              return (
                <div key={sec.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-[#090b10] rounded-2xl border border-[#21263d] gap-4 flex-row-reverse text-right">
                  <div className="text-right space-y-1">
                    <p className="font-bold text-white text-base">{(sec.course as any)?.title || 'مقرر دراسي'}</p>
                    <p className="text-xs text-slate-400">كود: {(sec.course as any)?.code} — شعبة {sec.section_number}</p>
                    <p className="text-xs text-brand-secondary font-bold">الأستاذ: {(sec.instructor as any)?.full_name || 'غير حدد'}</p>
                    <p className="text-[10px] text-slate-500 font-mono">الفصل الدراسي: {sec.semester} | السعة: {sec.capacity} طالب</p>
                  </div>
                  <div>
                    {isRegistered ? (
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold block text-center">أنت مسجل في هذه الشعبة</span>
                    ) : (
                      <button onClick={() => handleEnroll(sec.id)} className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-xs font-bold text-white shadow shadow-brand-primary/20 hover:scale-[1.02] transition-all cursor-pointer">تسجيل في الشعبة</button>
                    )}
                  </div>
                </div>
              );
            })}
            {allSections.length === 0 && <p className="text-center text-slate-500 py-8">لا تتوفر شعب دراسية للتسجيل حالياً</p>}
          </div>
        </div>
      )}

      {/* MATERIALS Tab */}
      {currentTab === 'materials' && (
        <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-4">
          <h3 className="text-white font-black text-lg">المحاضرات والمواد العلمية</h3>
          <div className="space-y-3">
            {materials.map(mat => (
              <div key={mat.id} className="flex items-center justify-between p-4 bg-[#090b10] rounded-xl border border-[#21263d] flex-row-reverse text-right">
                <div className="text-right">
                  <p className="font-bold text-white">{mat.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{mat.description || 'لا يوجد وصف للمادة'}</p>
                  <span className="text-[9px] bg-[#131622] border border-[#21263d] px-2.5 py-0.5 rounded text-brand-secondary mt-2 inline-block font-mono uppercase font-bold">{mat.type}</span>
                </div>
                <a href={mat.file_url} target="_blank" rel="noreferrer" className="text-brand-primary hover:underline flex items-center gap-2 text-xs font-bold flex-row-reverse">
                  <Eye className="w-4 h-4" /> <span>فتح المادة التعليمية</span>
                </a>
              </div>
            ))}
            {materials.length === 0 && <p className="text-center text-slate-500 py-8">لا توجد محاضرات مرفوعة لهذا المقرر الدراسي بعد</p>}
          </div>
        </div>
      )}

      {/* ASSIGNMENTS Tab */}
      {currentTab === 'assignments' && (
        <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-4">
          <h3 className="text-white font-black text-lg">الواجبات والمهام الدراسية</h3>
          <div className="space-y-3">
            {assignments.map(asg => {
              const sub = submissions[asg.id];
              return (
                <div key={asg.id} className="p-5 bg-[#090b10] rounded-2xl border border-[#21263d] space-y-3 text-right">
                  <div className="flex flex-col md:flex-row md:items-start justify-between border-b border-[#21263d] pb-3 gap-3 flex-row-reverse">
                    <div className="text-right">
                      <h4 className="font-black text-white text-base">{asg.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{asg.instructions}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {sub ? (
                        <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black px-3.5 py-1.5 rounded-lg">✓ تم التسليم</span>
                      ) : (
                        <button onClick={() => handleOpenSubmitAssignment(asg)} className="px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-xs font-bold text-white shadow shadow-brand-primary/10 cursor-pointer">تسليم الواجب</button>
                      )}
                      {sub && !sub.grade && (
                        <button onClick={() => handleOpenSubmitAssignment(asg)} className="px-4 py-2 rounded-xl bg-[#131622] border border-[#21263d] text-xs font-bold text-white hover:bg-[#1a1f32] cursor-pointer">تعديل التسليم</button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1 flex-row-reverse">
                    <div>تاريخ الاستحقاق: <span className="font-mono text-brand-warning font-bold">{new Date(asg.due_date).toLocaleString('ar-SA')}</span></div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-emerald-400">الدرجة الكلية: {asg.max_points} نقاط</span>
                      {sub && sub.grade !== undefined && sub.grade !== null && (
                        <span className="font-extrabold text-brand-secondary bg-brand-secondary/10 px-2 py-0.5 rounded-lg border border-brand-secondary/20">
                          الدرجة الحاصل عليها: {sub.grade} / {asg.max_points}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Instructor Feedback */}
                  {sub && sub.feedback && (
                    <div className="bg-brand-primary/5 border border-brand-primary/15 rounded-xl p-3.5 mt-2 text-right">
                      <p className="text-xs text-brand-primary font-bold">ملاحظات وتقييم الأستاذ:</p>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed whitespace-pre-wrap">{sub.feedback}</p>
                    </div>
                  )}
                </div>
              );
            })}
            {assignments.length === 0 && <p className="text-center text-slate-500 py-8">لا توجد واجبات معلنة لهذا المقرر</p>}
          </div>
        </div>
      )}

      {/* EXAMS Tab */}
      {currentTab === 'exams' && (
        <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-4">
          <h3 className="text-white font-black text-lg">الاختبارات الإلكترونية</h3>
          <div className="space-y-3">
            {exams.map(ex => {
              const attempt = attempts[ex.id];
              const isPast = new Date(ex.end_time).getTime() < Date.now();
              const isFuture = new Date(ex.start_time).getTime() > Date.now();

              return (
                <div key={ex.id} className="p-5 bg-[#090b10] rounded-2xl border border-[#21263d] flex flex-col md:flex-row md:items-center justify-between gap-4 flex-row-reverse text-right">
                  <div className="text-right space-y-1">
                    <h4 className="font-black text-white text-base">{ex.title}</h4>
                    <p className="text-xs text-slate-400">المدة: {ex.duration_minutes} دقيقة</p>
                    <p className="text-[10px] text-slate-500 font-mono">البداية: {new Date(ex.start_time).toLocaleString('ar-SA')} | النهاية: {new Date(ex.end_time).toLocaleString('ar-SA')}</p>
                  </div>
                  <div>
                    {attempt ? (
                      <div className="text-right md:text-left flex flex-col items-end">
                        <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-xl text-xs font-black inline-block">✓ تم تقديم المحاولة</span>
                        <p className="text-xs text-white font-bold mt-1.5">النتيجة: {attempt.score} درجة</p>
                      </div>
                    ) : isPast ? (
                      <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-1.5 rounded-xl text-xs font-bold inline-block">فائت / مغلق</span>
                    ) : isFuture ? (
                      <span className="bg-slate-900 border border-slate-800 text-slate-500 px-4 py-1.5 rounded-xl text-xs font-bold inline-block">غير متاح بعد</span>
                    ) : (
                      <button onClick={() => handleStartExam(ex)} className="px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-xs font-bold text-white shadow shadow-brand-primary/20 hover:scale-[1.01] transition-all cursor-pointer">بدء الاختبار الآن</button>
                    )}
                  </div>
                </div>
              );
            })}
            {exams.length === 0 && <p className="text-center text-slate-500 py-8">لا توجد اختبارات مجدولة لهذا المقرر</p>}
          </div>
        </div>
      )}

      {/* ATTENDANCE Tab */}
      {currentTab === 'attendance' && (
        <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#21263d] pb-4 flex-row-reverse">
            <h3 className="text-white font-black text-lg">سجل الحضور والغياب التفصيلي</h3>
            <div className="text-right">
              <p className="text-[10px] text-slate-500">النسبة في هذا المقرر</p>
              <p className="text-2xl font-black text-[#20c997] mt-0.5 font-mono">{getAttendanceRate()}%</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-[#21263d] text-slate-400">
                  <th className="p-3 font-bold text-right">التاريخ</th>
                  <th className="p-3 font-bold text-right">الحالة</th>
                  <th className="p-3 font-bold text-right">تم الرصد بواسطة</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map(a => (
                  <tr key={a.id} className="border-b border-[#21263d]/30 hover:bg-[#121626]/30 transition">
                    <td className="p-3 font-mono font-bold text-white">{a.date}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-lg font-black text-[9px] uppercase border ${
                        a.status === 'present' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        a.status === 'absent' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                        a.status === 'late' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                        'bg-blue-500/10 border-blue-500/20 text-blue-400'
                      }`}>
                        {a.status === 'present' ? 'حاضر' :
                         a.status === 'absent' ? 'غائب' :
                         a.status === 'late' ? 'متأخر' : 'عذر مقبول'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">مدير النظام أو الأستاذ</td>
                  </tr>
                ))}
                {attendance.length === 0 && (
                  <tr><td colSpan={3} className="text-center text-slate-500 p-8">لم يتم رصد أي سجلات حضور حتى الآن</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* MEETINGS Tab */}
      {currentTab === 'meetings' && (
        <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-4">
          <h3 className="text-white font-black text-lg">المحاضرات التفاعلية والاجتماعات المباشرة</h3>
          <div className="space-y-3">
            {meetings.map(meet => (
              <div key={meet.id} className="p-5 bg-[#090b10] rounded-2xl border border-[#21263d] flex flex-col md:flex-row md:items-center justify-between gap-4 flex-row-reverse text-right">
                <div className="text-right">
                  <h4 className="font-bold text-white text-base">{meet.title}</h4>
                  <p className="text-xs text-brand-primary mt-1 font-semibold">{new Date(meet.start_time).toLocaleString('ar-SA')}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">المدة المخططة: {meet.duration_minutes} دقيقة</p>
                </div>
                <a href={meet.meeting_url} target="_blank" rel="noreferrer" className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-xs font-bold text-white shadow shadow-brand-primary/20 flex items-center gap-2 flex-row-reverse cursor-pointer">
                  <Video className="w-4 h-4" /> <span>انضمام للمحاضرة</span>
                </a>
              </div>
            ))}
            {meetings.length === 0 && <p className="text-center text-slate-500 py-8">لا توجد محاضرات مباشرة مجدولة حالياً</p>}
          </div>
        </div>
      )}

      {/* MESSAGES/CHAT Tab */}
      {currentTab === 'messages' && (
        <div className="glass-card overflow-hidden flex flex-col md:flex-row h-[550px] border border-dark-border/40">
          {/* Messages Main Box */}
          <div className="flex-1 flex flex-col bg-dark-bg/25">
            {selectedInstructor ? (
              <>
                {/* Active Chat Header */}
                <div className="p-4 bg-dark-card border-b border-dark-border/40 flex items-center justify-between shrink-0">
                  <span className="bg-brand-primary/10 text-brand-primary text-[10px] font-bold px-2 py-1 rounded-lg">مراسلة مباشرة</span>
                  <div className="text-right">
                    <h4 className="font-bold text-white">{selectedInstructor.full_name}</h4>
                    <p className="text-[10px] text-dark-muted mt-0.5">عضو هيئة التدريس</p>
                  </div>
                </div>

                {/* Chat Message Bubble area */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3.5 flex flex-col bg-[#090b10]">
                  {chatMessages.map(msg => {
                    const isSender = msg.sender_id === student.id;
                    return (
                      <div key={msg.id} className={`max-w-[70%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                        isSender 
                          ? 'self-start bg-brand-primary text-white rounded-tr-none shadow shadow-brand-primary/10' 
                          : 'self-end bg-[#131622] border border-[#21263d] text-white rounded-tl-none'
                      }`}>
                        <p>{msg.message}</p>
                        <span className="text-[9px] opacity-70 mt-1.5 block text-left font-mono">
                          {new Date(msg.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Send Input Box */}
                <form onSubmit={handleSendMessage} className="p-3 bg-[#131622] border-t border-[#21263d] flex items-center gap-2 shrink-0 flex-row-reverse">
                  <button type="submit" className="p-3 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl transition cursor-pointer shadow shadow-brand-primary/25">
                    <Send className="w-4 h-4 transform" />
                  </button>
                  <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="اكتب رسالتك للأستاذ هنا..." className="w-full bg-[#090b10] border border-[#21263d] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary text-right text-sm" />
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-[#090b10]">
                <MessageSquare className="w-12 h-12 mb-3 opacity-25" />
                <p className="text-sm">اختر أحد أعضاء هيئة التدريس لبدء المحادثة</p>
              </div>
            )}
          </div>

          {/* Instructor sidebar list */}
          <div className="w-full md:w-72 bg-[#131622] border-r border-[#21263d] flex flex-col shrink-0">
            <div className="p-4 border-b border-[#21263d] font-black text-white text-sm shrink-0 text-right">أعضاء هيئة التدريس</div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {instructors.map(teacher => (
                <button key={teacher.id} onClick={() => setSelectedInstructor(teacher)}
                  className={`w-full text-right p-3 rounded-xl transition flex items-center justify-between cursor-pointer ${
                    selectedInstructor?.id === teacher.id ? 'bg-brand-primary/10 border border-brand-primary/30 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-[#090b10]/40'
                  }`}>
                  <ChevronLeft className={`w-4 h-4 opacity-50 ${selectedInstructor?.id === teacher.id ? 'text-brand-primary' : ''}`} />
                  <div className="text-right">
                    <h5 className="font-bold text-white text-sm">{teacher.full_name}</h5>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">{teacher.email}</p>
                  </div>
                </button>
              ))}
              {instructors.length === 0 && <p className="text-center text-slate-500 text-xs py-8">لا يوجد أساتذة متاحين</p>}
            </div>
          </div>
        </div>
      )}

      {/* CERTIFICATES Tab */}
      {currentTab === 'certificates' && (
        <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-4">
          <h3 className="text-white font-black text-lg">الشهادات والتقديرات الأكاديمية</h3>
          <p className="text-xs text-slate-400">عند استكمال متطلبات المقرر الدراسي وحصولك على الدرجات، سيقوم الأستاذ بإصدار شهادتك هنا.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.map(cert => (
              <div key={cert.id} className="bg-[#090b10] border-2 border-[#21263d] hover:border-brand-primary/50 transition-all rounded-2xl p-5 text-right space-y-4 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center mb-3">
                    <Award className="w-6 h-6 text-brand-primary" />
                  </div>
                  <h4 className="font-black text-white text-base">{(cert.course as any)?.title || 'مقرر دراسي'}</h4>
                  <p className="text-xs text-slate-500 font-mono mt-1">{(cert.course as any)?.code}</p>
                  <p className="text-xs text-[#20c997] font-bold mt-2">التقدير النهائي: {cert.grade ? `${cert.grade}%` : 'مكافئ'}</p>
                </div>

                <div className="pt-3 border-t border-[#21263d] flex items-center justify-between flex-row-reverse">
                  <button onClick={() => setActiveCertificate(cert)} className="text-brand-secondary hover:underline text-xs font-bold cursor-pointer">
                    عرض وثيقة الشهادة
                  </button>
                  <span className="text-[9px] text-slate-500 font-mono">{cert.certificate_code}</span>
                </div>
              </div>
            ))}
            {certificates.length === 0 && <p className="col-span-3 text-center text-slate-500 py-12 text-sm">لا توجد شهادات صادرة لك حتى الآن</p>}
          </div>
        </div>
      )}

      {/* SCHEDULE Tab */}
      {currentTab === 'schedule' && (
        <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-6">
          <div className="border-b border-[#21263d] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-2 flex-row-reverse text-right">
            <h3 className="text-white font-black text-lg">الجدول الدراسي الأسبوعي</h3>
            <p className="text-xs text-slate-400">مواعيد محاضراتك الأسبوعية للمقررات المسجلة حالياً</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].map(day => {
              // Find sections that have classes on this day
              const daySections = sections.filter(sec => sec.schedule_days?.includes(day));

              return (
                <div key={day} className="bg-[#090b10] border border-[#21263d] rounded-2xl p-4 space-y-3 text-right flex flex-col hover:border-slate-700 transition">
                  <div className="text-center font-bold text-sm text-brand-primary border-b border-[#21263d] pb-2">
                    {day}
                  </div>
                  <div className="flex-1 space-y-2">
                    {daySections.map(sec => (
                      <div key={sec.id} className="p-3 bg-[#131622] border border-[#21263d]/60 rounded-xl space-y-1">
                        <p className="font-extrabold text-white text-xs">{(sec.course as any)?.title}</p>
                        <p className="text-[10px] text-brand-secondary font-mono">{(sec.course as any)?.code} — شعبة {sec.section_number}</p>
                        <p className="text-[10px] text-slate-400">{(sec.instructor as any)?.full_name || 'أستاذ المادة'}</p>
                        <div className="flex items-center gap-1 mt-1 justify-end text-[9px] text-[#20c997] font-bold font-mono">
                          <span>{sec.schedule_time}</span>
                          <Clock className="w-3.5 h-3.5 text-[#20c997]" />
                        </div>
                      </div>
                    ))}
                    {daySections.length === 0 && (
                      <div className="text-center text-slate-600 text-xs py-8 italic">
                        لا توجد محاضرات
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PAYMENT Tab */}
      {currentTab === 'payment' && (
        <div className="space-y-6 text-right">
          <div className="glass-card p-6 md:p-8 space-y-6">
            <div className="border-b border-[#21263d] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-2 flex-row-reverse text-right">
              <h3 className="text-white font-black text-xl flex items-center gap-2 flex-row-reverse">
                <CreditCard className="w-6 h-6 text-brand-primary" />
                <span>إتمام عملية الدفع وتفعيل الباقة</span>
              </h3>
              <p className="text-xs text-slate-400">يرجى تحويل قيمة الباقة وإرفاق صورة التحويل بالأسفل ليتم تفعيل حسابك.</p>
            </div>

            {/* Plan summary & cost */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#090b10] border border-[#21263d] p-5 rounded-2xl space-y-2">
                <p className="text-xs text-slate-400">الباقة المختارة</p>
                <p className="text-lg font-black text-white">
                  {student.subscription_plan_id === 'plan-gold' 
                    ? 'الباقة الذهبية (شاملة + دعم)' 
                    : student.subscription_plan_id === 'plan-diamond' 
                      ? 'الباقة الماسية (دعم خاص)' 
                      : approvedRequest 
                        ? 'طلب تسجيل مخصص / درس خاص'
                        : 'الباقة الفضية (شاملة)'}
                </p>
              </div>
              <div className="bg-[#090b10] border border-[#21263d] p-5 rounded-2xl space-y-2">
                <p className="text-xs text-slate-400">قيمة الاشتراك</p>
                <p className="text-2xl font-black text-[#20c997] font-mono">
                  {finalPrice} ر.س
                </p>
              </div>
              <div className="bg-[#090b10] border border-[#21263d] p-5 rounded-2xl space-y-2 flex flex-col justify-center">
                <a
                  href={paymentSettings?.whatsapp_link || 'https://wa.me/966501234567'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-[#090b10] font-black rounded-xl text-center text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  💬 تواصل واتساب مع الإدارة
                </a>
              </div>
            </div>

            {/* Payment Methods Accounts */}
            <div className="bg-[#090b10] border border-[#21263d] p-6 rounded-2xl space-y-4">
              <h4 className="font-bold text-white text-base">حسابات وطرق التحويل المعتمدة:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {paymentSettings?.bank_name && (
                  <div className="bg-[#131622] p-4 rounded-xl border border-[#21263d] space-y-2 text-sm text-white">
                    <p className="font-bold text-brand-primary text-xs">🏦 التحويل البنكي المباشر</p>
                    <p><span className="text-slate-400">اسم البنك:</span> {paymentSettings.bank_name}</p>
                    <p><span className="text-slate-400">اسم الحساب:</span> {paymentSettings.account_holder}</p>
                    <p className="font-mono"><span className="text-slate-400">الحساب:</span> {paymentSettings.account_number}</p>
                    <p className="font-mono text-xs"><span className="text-slate-400">IBAN:</span> {paymentSettings.iban}</p>
                  </div>
                )}

                {paymentSettings?.binance_usdt_address && (
                  <div className="bg-[#131622] p-4 rounded-xl border border-[#21263d] space-y-2 text-sm text-white">
                    <p className="font-bold text-amber-500 text-xs">🪙 Binance USDT (TRC20)</p>
                    <p className="font-mono text-xs break-all"><span className="text-slate-400">العنوان:</span> {paymentSettings.binance_usdt_address}</p>
                    <p className="text-slate-400 text-xs">يرجى التأكد من اختيار شبكة Tron (TRC-20).</p>
                  </div>
                )}

                {paymentSettings?.ria_details && (
                  <div className="bg-[#131622] p-4 rounded-xl border border-[#21263d] space-y-2 text-sm text-white">
                    <p className="font-bold text-purple-400 text-xs">💸 تحويل عبر Ria Money Transfer</p>
                    <p className="text-xs leading-relaxed"><span className="text-slate-400">تفاصيل المستلم:</span> {paymentSettings.ria_details}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Message / Notice */}
            {paymentMessage && (
              <div className="bg-brand-warning/10 border border-brand-warning/30 text-brand-warning p-4 rounded-2xl flex items-center gap-3 text-sm">
                <Clock className="w-5 h-5 shrink-0" />
                <span className="font-semibold">{paymentMessage}</span>
              </div>
            )}

            {/* Submission Form */}
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <h4 className="font-bold text-white text-base">رفع بيانات وإيصال التحويل:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>طريقة التحويل المستخدمة *</label>
                  <select
                    value={selectedMethod}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className={inputClass}
                    required
                  >
                    {paymentSettings?.enabled_payment_methods?.map((m: string) => (
                      <option key={m} value={m}>
                        {m === 'bank_transfer' ? 'تحويل بنكي مباشر' : m === 'binance_usdt' ? 'Binance USDT' : m === 'ria' ? 'Ria Money Transfer' : m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>رقم العملية أو الحوالة (اختياري)</label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="مثال: TXN998822..."
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>ملاحظات إضافية</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="أكتب أي ملاحظة للإدارة بخصوص التحويل البنكي هنا..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>إرفاق صورة إيصال التحويل *</label>
                <div className="flex items-center gap-4 flex-row-reverse">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="hidden"
                    id="receipt-file-input"
                    required={!paymentMessage}
                  />
                  <label
                    htmlFor="receipt-file-input"
                    className="px-5 py-3 bg-[#131622] hover:bg-[#1f263e] border border-[#21263d] text-white text-xs font-bold rounded-xl cursor-pointer transition-all shrink-0"
                  >
                    📁 اختيار ملف الصورة
                  </label>
                  <div className="flex-1 text-slate-500 text-xs text-right truncate">
                    {receiptImage ? 'تم اختيار الصورة وتجهيزها للرفع' : 'لم يتم اختيار أي إيصال بعد'}
                  </div>
                </div>
                {receiptImage && (
                  <div className="mt-4 max-w-xs border border-[#21263d] rounded-xl overflow-hidden">
                    <img src={receiptImage} alt="Receipt preview" className="w-full max-h-48 object-cover" />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submittingPayment || !receiptImage}
                className="w-full py-4 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-sm rounded-xl cursor-pointer disabled:opacity-40 transition-all"
              >
                {submittingPayment ? 'جاري رفع الطلب والإيصال سحابياً...' : 'إرسال إيصال الدفع للمراجعة'}
              </button>
            </form>

            {/* Payments History Table */}
            {existingPayments.length > 0 && (
              <div className="bg-[#090b10] border border-[#21263d] p-6 rounded-2xl space-y-4 pt-6 mt-6">
                <h4 className="font-bold text-white text-base">سجل الدفعات السابقة:</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="border-b border-[#21263d] text-slate-400">
                        <th className="pb-3 text-right">رقم الفاتورة</th>
                        <th className="pb-3 text-right">طريقة الدفع</th>
                        <th className="pb-3 text-right">المبلغ</th>
                        <th className="pb-3 text-right">الحالة</th>
                        <th className="pb-3 text-right">تاريخ الطلب</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#21263d]/60 text-white">
                      {existingPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-[#131622]/40 transition">
                          <td className="py-3 font-mono text-xs">{p.invoice_number}</td>
                          <td className="py-3">
                            {p.payment_method === 'bank_transfer' ? 'تحويل بنكي' : p.payment_method === 'binance_usdt' ? 'Binance USDT' : p.payment_method === 'ria' ? 'Ria Transfer' : p.payment_method}
                          </td>
                          <td className="py-3 font-mono text-[#20c997] font-bold">{p.amount} ر.س</td>
                          <td className="py-3">
                            {p.status === 'approved' && <span className="text-emerald-400 font-bold">معتمد ✅</span>}
                            {p.status === 'pending' && <span className="text-amber-400 font-bold">قيد المراجعة ⏳</span>}
                            {p.status === 'rejected' && <span className="text-rose-400 font-bold">مرفوض ❌</span>}
                          </td>
                          <td className="py-3 text-xs text-slate-500 font-mono">
                            {new Date(p.created_at).toLocaleDateString('ar-SA')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==== MODALS ==== */}
      {/* Submit Assignment Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-[#0c0e18] border border-[#212739] w-full max-w-md p-6 space-y-4 rounded-3xl text-right shadow-2xl">
            <div className="flex items-center justify-between mb-2 flex-row-reverse">
              <h3 className="text-white font-black text-lg">تسليم الواجب الدراسي</h3>
              <button onClick={() => setShowSubmitModal(null)} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">✕</button>
            </div>
            <p className="text-xs text-brand-secondary font-bold">المقرر: {showSubmitModal.title}</p>
            <div>
              <label className={labelClass}>رابط ملف التسليم (PDF / Google Drive / URL) *</label>
              <input value={submitForm.file_url} onChange={e => setSubmitForm(f => ({ ...f, file_url: e.target.value }))} placeholder="https://..." className={inputClass + ' font-mono text-left'} />
            </div>
            <div>
              <label className={labelClass}>ملاحظات التسليم (اختياري)</label>
              <textarea value={submitForm.student_notes} onChange={e => setSubmitForm(f => ({ ...f, student_notes: e.target.value }))} rows={4} placeholder="اكتب ملاحظاتك للأستاذ هنا..." className={inputClass + ' resize-none'} />
            </div>
            <button onClick={handleSubmitAssignment} disabled={!submitForm.file_url} className="w-full py-3.5 mt-2 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-sm shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40">إرسال التسليم</button>
          </div>
        </div>
      )}

      {/* View Certificate Modal */}
      {activeCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-white text-[#111] w-full max-w-2xl p-12 rounded-3xl text-center space-y-8 shadow-2xl border-[16px] border-double border-[#d4af37] animate-slide-up">
            
            {/* Close */}
            <button onClick={() => setActiveCertificate(null)} className="absolute right-4 top-4 text-slate-400 hover:text-black p-2 rounded-lg bg-slate-100 transition-colors cursor-pointer">✕</button>

            {/* Design */}
            <div className="space-y-4">
              <div className="w-20 h-20 bg-gradient-to-tr from-[#c5a059] to-[#d4af37] flex items-center justify-center shadow-xl shadow-amber-700/20 rounded-full mx-auto">
                <Award className="w-11 h-11 text-white" />
              </div>
              <h1 className="text-3xl font-black tracking-widest text-[#9c7c38]">شهادة إتمام مقرر جامعي</h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">Kingdom of Saudi Arabia — LMS Academy</p>
            </div>

            <div className="space-y-6 pt-4">
              <p className="text-sm font-semibold text-slate-600">تشهد عمادة المنصة الأكاديمية والتدريب بأن الطالب:</p>
              <h2 className="text-3xl font-black text-black border-b-2 border-[#d4af37]/35 pb-2.5 max-w-sm mx-auto">{student.full_name}</h2>
              <p className="text-sm leading-relaxed max-w-md mx-auto text-slate-600">
                قد أكمل بنجاح واقتدار كافة المتطلبات الأكاديمية والعملية المقررة لمسار:
                <br />
                <span className="font-extrabold text-[#9c7c38] text-xl mt-2 inline-block">{(activeCertificate.course as any)?.title || 'المقرر الدراسي'} ({(activeCertificate.course as any)?.code})</span>
              </p>
              <p className="text-sm font-extrabold text-[#20c997] bg-emerald-500/5 py-1 px-4 rounded-full border border-emerald-500/10 inline-block">التقدير العام الممنوح: {activeCertificate.grade ? `${activeCertificate.grade}%` : 'مكافئ'}</p>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-8 border-t border-[#d4af37]/20 text-right text-xs text-slate-500 flex-row-reverse">
              <div>
                <p className="font-black text-slate-800 text-sm">عميد القبول والتسجيل:</p>
                <p className="font-mono mt-1 text-[10px] text-slate-400">LMS Academy Dean</p>
              </div>
              <div className="text-left">
                <p className="font-bold">تاريخ الإصدار: {new Date(activeCertificate.issued_at).toLocaleDateString('ar-SA')}</p>
                <p className="font-mono mt-1 text-[10px] text-slate-400">رمز التحقق: {activeCertificate.certificate_code}</p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
