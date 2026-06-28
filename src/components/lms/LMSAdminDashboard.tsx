import { useState, useEffect } from 'react';
import { 
  Building2, BookOpen, Users, ClipboardList, Plus, 
  CheckCircle, LayoutDashboard, GraduationCap, UserPlus,
  Edit, Trash2, ShieldCheck
} from 'lucide-react';
import { lmsDb, type LMSUser, type LMSDepartment, type LMSCourse, type LMSSection, type LMSSpecialRequest, type LMSSubscriptionPlan } from '../../lib/lms_supabase';
import { db } from '../../lib/supabase';

export default function LMSAdminDashboard({ adminUser: _adminUser, activeTab: propActiveTab }: { adminUser: LMSUser, activeTab?: string }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'departments' | 'courses' | 'sections' | 'users' | 'approvals' | 'site_settings' | 'plans'>('overview');

  useEffect(() => {
    if (propActiveTab) {
      const mapped = propActiveTab === 'dashboard' ? 'overview' : propActiveTab;
      setActiveTab(mapped as any);
    }
  }, [propActiveTab]);

  const [departments, setDepartments] = useState<LMSDepartment[]>([]);
  const [courses, setCourses] = useState<LMSCourse[]>([]);
  const [sections, setSections] = useState<LMSSection[]>([]);
  const [users, setUsers] = useState<LMSUser[]>([]);
  
  // Custom states for approvals, pricing, and site config
  const [specialRequests, setSpecialRequests] = useState<LMSSpecialRequest[]>([]);
  const [customPrices, setCustomPrices] = useState<Record<string, string>>({});
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<LMSSubscriptionPlan[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Modal state
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Editing states
  const [editDeptId, setEditDeptId] = useState<string | null>(null);
  const [editCourseId, setEditCourseId] = useState<string | null>(null);
  const [editSectionId, setEditSectionId] = useState<string | null>(null);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editPlanId, setEditPlanId] = useState<string | null>(null);

  // Form state
  const [deptForm, setDeptForm] = useState({ name: '', description: '' });
  const [courseForm, setCourseForm] = useState({ code: '', title: '', description: '', department_id: '', price: '' });
  const [sectionForm, setSectionForm] = useState({ course_id: '', instructor_id: '', section_number: '', semester: '', capacity: '30', schedule_days: [] as string[], schedule_time: '' });
  const [userForm, setUserForm] = useState({ email: '', password_hash: '', full_name: '', phone: '', role: 'student' as LMSUser['role'], subscription_plan_id: '' });
  const [planForm, setPlanForm] = useState({ name: '', price: '', billing_cycle: 'شهري', features: '', visible: true });

  // CMS Editor States
  const [cmsSubTab, setCmsSubTab] = useState<'homepage' | 'platform_identity' | 'portals' | 'media' | 'features' | 'stats' | 'faqs' | 'navbar'>('homepage');
  const [newFaq, setNewFaq] = useState({ q: '', a: '' });
  const [editingFaqIdx, setEditingFaqIdx] = useState<number | null>(null);
  const [newFeature, setNewFeature] = useState({ title: '', desc: '', type: 'platform' as 'platform' | 'lms' | 'attendance' });
  const [editingFeatureIdx, setEditingFeatureIdx] = useState<{ idx: number; type: 'platform' | 'lms' | 'attendance' } | null>(null);
  const [newStat, setNewStat] = useState({ label: '', value: '', color: 'from-cyan-400 to-blue-500' });
  const [editingStatIdx, setEditingStatIdx] = useState<number | null>(null);
  const [newNavLink, setNewNavLink] = useState({ label: '', href: '' });
  const [editingNavLinkIdx, setEditingNavLinkIdx] = useState<number | null>(null);
  const [newMediaUrl, setNewMediaUrl] = useState({ name: '', url: '' });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [depts, crs, sects, usrs, reqs, sConf, sPlans, paymentsList] = await Promise.all([
        lmsDb.getDepartments(),
        lmsDb.getCourses(),
        lmsDb.getSections(),
        lmsDb.getUsers(),
        lmsDb.getSpecialRequests(),
        lmsDb.getSiteConfig(),
        lmsDb.getSubscriptionPlans(),
        db.getPayments()
      ]);
      setDepartments(depts);
      setCourses(crs);
      setSections(sects);
      setUsers(usrs);
      setSpecialRequests(reqs);
      setSiteConfig(sConf);
      setSubscriptionPlans(sPlans);
      setPayments(paymentsList.filter((p: any) => p.lms_user_id !== null));
    } catch (err) {
      console.error('[LMSAdmin] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleCreateDept = async () => {
    try {
      if (editDeptId) {
        await lmsDb.updateDepartment(editDeptId, deptForm.name, deptForm.description);
        showToast('تم تحديث القسم بنجاح');
      } else {
        await lmsDb.createDepartment(deptForm.name, deptForm.description);
        showToast('تم إنشاء القسم بنجاح');
      }
      setShowDeptModal(false);
      setEditDeptId(null);
      setDeptForm({ name: '', description: '' });
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteDept = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القسم؟ سيتم إلغاء ربط جميع المقررات التابعة له.')) return;
    try {
      await lmsDb.deleteDepartment(id);
      await loadAll();
      showToast('تم حذف القسم بنجاح');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openEditDept = (dept: LMSDepartment) => {
    setEditDeptId(dept.id);
    setDeptForm({ name: dept.name, description: dept.description || '' });
    setShowDeptModal(true);
  };

  const handleCreateCourse = async () => {
    try {
      const coursePrice = courseForm.price ? parseFloat(courseForm.price) : 0;
      if (editCourseId) {
        await lmsDb.updateCourse(editCourseId, courseForm.code, courseForm.title, courseForm.description, courseForm.department_id || undefined, coursePrice);
        showToast('تم تحديث المقرر بنجاح');
      } else {
        await lmsDb.createCourse(courseForm.code, courseForm.title, courseForm.description, courseForm.department_id || undefined, coursePrice);
        showToast('تم إنشاء المقرر بنجاح');
      }
      setShowCourseModal(false);
      setEditCourseId(null);
      setCourseForm({ code: '', title: '', description: '', department_id: '', price: '' });
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المقرر؟ سيتم حذف جميع الشعب الدراسية التابعة له.')) return;
    try {
      await lmsDb.deleteCourse(id);
      await loadAll();
      showToast('تم حذف المقرر بنجاح');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openEditCourse = (course: LMSCourse) => {
    setEditCourseId(course.id);
    setCourseForm({
      code: course.code,
      title: course.title,
      description: course.description || '',
      department_id: course.department_id || '',
      price: course.price !== undefined ? course.price.toString() : ''
    });
    setShowCourseModal(true);
  };

  const handleCreateSection = async () => {
    try {
      if (editSectionId) {
        await lmsDb.updateSection(
          editSectionId,
          sectionForm.course_id,
          sectionForm.instructor_id || null,
          sectionForm.section_number,
          sectionForm.semester,
          parseInt(sectionForm.capacity),
          sectionForm.schedule_days,
          sectionForm.schedule_time
        );
        showToast('تم تحديث الشعبة بنجاح');
      } else {
        await lmsDb.createSection(
          sectionForm.course_id, 
          sectionForm.instructor_id || null,
          sectionForm.section_number,
          sectionForm.semester,
          parseInt(sectionForm.capacity),
          sectionForm.schedule_days,
          sectionForm.schedule_time
        );
        showToast('تم إنشاء الشعبة بنجاح');
      }
      setShowSectionModal(false);
      setEditSectionId(null);
      setSectionForm({ course_id: '', instructor_id: '', section_number: '', semester: '', capacity: '30', schedule_days: [], schedule_time: '' });
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الشعبة؟')) return;
    try {
      await lmsDb.deleteSection(id);
      await loadAll();
      showToast('تم حذف الشعبة بنجاح');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openEditSection = (sec: LMSSection) => {
    setEditSectionId(sec.id);
    setSectionForm({
      course_id: sec.course_id,
      instructor_id: sec.instructor_id || '',
      section_number: sec.section_number,
      semester: sec.semester,
      capacity: sec.capacity.toString(),
      schedule_days: sec.schedule_days || [],
      schedule_time: sec.schedule_time || ''
    });
    setShowSectionModal(true);
  };

  const handleCreateUser = async () => {
    try {
      if (editUserId) {
        await lmsDb.updateUser(editUserId, userForm.email, userForm.full_name, userForm.role, userForm.phone || undefined, 'active', userForm.password_hash || undefined, userForm.subscription_plan_id || undefined);
        showToast('تم تحديث حساب المستخدم بنجاح');
      } else {
        await lmsDb.registerUser(userForm.email, userForm.password_hash, userForm.full_name, userForm.role, userForm.phone, 'active', userForm.subscription_plan_id || undefined);
        showToast('تم إنشاء حساب المستخدم وتفعيله بنجاح');
      }
      setShowUserModal(false);
      setEditUserId(null);
      setUserForm({ email: '', password_hash: '', full_name: '', phone: '', role: 'student', subscription_plan_id: '' });
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    try {
      await lmsDb.deleteUser(id);
      await loadAll();
      showToast('تم حذف المستخدم بنجاح');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openEditUser = (u: LMSUser) => {
    setEditUserId(u.id);
    setUserForm({
      email: u.email,
      password_hash: '',
      full_name: u.full_name,
      phone: u.phone || '',
      role: u.role,
      subscription_plan_id: u.subscription_plan_id || ''
    });
    setShowUserModal(true);
  };

  const handleCreateOrUpdatePlan = async () => {
    try {
      const featArr = planForm.features.split('\n').map((f: string) => f.trim()).filter(Boolean);
      const priceVal = parseFloat(planForm.price) || 0;
      if (editPlanId) {
        await lmsDb.updateSubscriptionPlan(editPlanId, planForm.name, priceVal, planForm.billing_cycle, featArr, planForm.visible);
        showToast('تم تحديث باقة الاشتراك بنجاح');
      } else {
        await lmsDb.createSubscriptionPlan(planForm.name, priceVal, planForm.billing_cycle, featArr, planForm.visible);
        showToast('تم إنشاء باقة الاشتراك بنجاح');
      }
      setShowPlanModal(false);
      setEditPlanId(null);
      setPlanForm({ name: '', price: '', billing_cycle: 'شهري', features: '', visible: true });
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;
    try {
      await lmsDb.deleteSubscriptionPlan(id);
      await loadAll();
      showToast('تم حذف الباقة بنجاح');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openEditPlan = (p: any) => {
    setEditPlanId(p.id);
    setPlanForm({
      name: p.name,
      price: p.price.toString(),
      billing_cycle: p.billing_cycle,
      features: p.features.join('\n'),
      visible: p.visible !== false
    });
    setShowPlanModal(true);
  };

  // Approvals & Site Config logic
  const handleApproveUser = async (userId: string) => {
    try {
      await lmsDb.updateUserStatus(userId, 'active');
      await loadAll();
      showToast('تم تفعيل وقبول حساب الطالب بنجاح');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      await lmsDb.updateUserStatus(userId, 'rejected');
      await loadAll();
      showToast('تم رفض الحساب وإخطار الطالب');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApprovePayment = async (payment: any) => {
    if (!confirm('هل أنت متأكد من قبول إيصال الدفع وتفعيل اشتراك الطالب؟')) return;
    try {
      setLoading(true);
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + 30);
      
      await db.updatePayment(payment.id, {
        status: 'approved',
        approved_at: today.toISOString(),
        approved_by: 1,
        subscription_start: today.toISOString().split('T')[0],
        subscription_end: endDate.toISOString().split('T')[0]
      });

      await lmsDb.updateUserSubscription(
        payment.lms_user_id,
        'active',
        payment.plan_id
      );

      try {
        await db.sendNotification({
          student_id: 0,
          sender_id: 1,
          sender_role: 'admin',
          message: `تم اعتماد إيصال الدفع وتفعيل اشتراكك بنجاح! شكراً لك.`,
          is_read: false
        });
      } catch (e) {
        console.error(e);
      }

      showToast('تم قبول الدفعة وتفعيل اشتراك الطالب بنجاح');
      await loadAll();
    } catch (err: any) {
      console.error(err);
      alert('فشل قبول الدفعة: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectPayment = async (payment: any) => {
    const reason = prompt('يرجى إدخال سبب رفض الإيصال:');
    if (reason === null) return;
    if (!reason.trim()) {
      alert('يجب كتابة سبب الرفض ليظهر للطالب.');
      return;
    }
    
    try {
      setLoading(true);
      await db.updatePayment(payment.id, {
        status: 'rejected',
        admin_notes: reason
      });

      await lmsDb.updateUserSubscription(
        payment.lms_user_id,
        'pending_payment',
        payment.plan_id
      );

      showToast('تم رفض الإيصال وتسجيل السبب');
      await loadAll();
    } catch (err: any) {
      console.error(err);
      alert('فشل رفض الدفعة: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSpecialRequest = async (reqId: string) => {
    const priceStr = customPrices[reqId];
    if (!priceStr || isNaN(parseFloat(priceStr))) {
      alert('يرجى تحديد سعر مناسب أولاً بالريال السعودي.');
      return;
    }
    try {
      await lmsDb.updateSpecialRequest(reqId, 'approved', parseFloat(priceStr));
      await loadAll();
      showToast('تمت الموافقة وتحديد سعر الدرس الخاص');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRejectSpecialRequest = async (reqId: string) => {
    try {
      await lmsDb.updateSpecialRequest(reqId, 'rejected');
      await loadAll();
      showToast('تم رفض طلب الدرس الخاص');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveSiteConfig = async () => {
    try {
      await lmsDb.updateSiteConfig(siteConfig);
      await loadAll();
      showToast('تم حفظ إعدادات الموقع وتحديث الواجهة بنجاح');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const stats = [
    { label: 'إجمالي الأقسام', value: departments.length, icon: Building2, color: 'text-brand-primary bg-brand-primary/10' },
    { label: 'إجمالي المقررات', value: courses.length, icon: BookOpen, color: 'text-brand-secondary bg-brand-secondary/10' },
    { label: 'إجمالي الشعب', value: sections.length, icon: ClipboardList, color: 'text-brand-warning bg-brand-warning/10' },
    { label: 'إجمالي المستخدمين', value: users.length, icon: Users, color: 'text-brand-success bg-brand-success/10' },
    { label: 'أعضاء التدريس', value: users.filter((u: LMSUser) => u.role === 'instructor').length, icon: GraduationCap, color: 'text-purple-400 bg-purple-400/10' },
    { label: 'الطلاب المسجلون', value: users.filter((u: LMSUser) => u.role === 'student').length, icon: UserPlus, color: 'text-teal-400 bg-teal-400/10' },
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
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#20c997] text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold animate-slide-up border border-[#20c997]/25">
          <CheckCircle className="w-5 h-5" /> {toast}
        </div>
      )}

      {/* Tab Pills */}
      <div className="flex flex-wrap gap-2 flex-row-reverse justify-start">
        {[
          { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
          { id: 'departments', label: 'الأقسام والكليات', icon: Building2 },
          { id: 'courses', label: 'المقررات الدراسية', icon: BookOpen },
          { id: 'sections', label: 'الشعب الدراسية', icon: ClipboardList },
          { id: 'users', label: 'المستخدمون', icon: Users },
          { 
            id: 'approvals', 
            label: 'طلبات التسجيل والموافقات', 
            icon: CheckCircle, 
            badge: users.filter((u: LMSUser) => u.role === 'student' && u.status === 'pending').length + specialRequests.filter((r: LMSSpecialRequest) => r.status === 'pending').length 
          },
          { 
            id: 'payments', 
            label: 'طلبات الدفع', 
            icon: ClipboardList, 
            badge: payments.filter((p: any) => p.status === 'pending').length 
          },
          { id: 'plans', label: 'باقات الاشتراك', icon: ShieldCheck },
          { id: 'site_settings', label: 'إدارة الموقع', icon: LayoutDashboard },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer relative ${
              activeTab === tab.id 
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                : 'bg-[#131622] border border-[#21263d] text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="absolute -top-1.5 -left-1.5 px-2 py-0.5 rounded-full bg-rose-500 text-[10px] text-white font-black animate-pulse">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="bg-[#131622] border border-[#21263d] p-5 flex flex-col items-center gap-3 text-center rounded-2xl hover:border-brand-primary/40 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-3xl font-black text-white font-mono">{stat.value}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Sections */}
          <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl">
            <h3 className="text-white font-black text-lg mb-4 text-right">الشعب الدراسية الأخيرة</h3>
            <div className="space-y-3">
              {sections.slice(0, 5).map((sec: LMSSection) => (
                <div key={sec.id} className="flex items-center justify-between p-3.5 bg-[#090b10] rounded-xl border border-[#21263d] flex-row-reverse text-right">
                  <div className="text-right">
                    <p className="font-bold text-white text-sm">{(sec.course as any)?.title || sec.course_id}</p>
                    <p className="text-xs text-slate-400 mt-0.5">الشعبة {sec.section_number} — الأستاذ: {(sec.instructor as any)?.full_name || 'غير محدد'}</p>
                  </div>
                  <div className="text-xs text-brand-primary font-bold font-mono">{sec.semester}</div>
                </div>
              ))}
              {sections.length === 0 && <p className="text-center text-slate-500 py-6 text-sm">لا توجد شعب مسجلة بعد</p>}
            </div>
          </div>
        </div>
      )}

      {/* Departments Tab */}
      {activeTab === 'departments' && (
        <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between flex-row-reverse">
            <h3 className="text-white font-black text-lg">الأقسام والكليات ({departments.length})</h3>
            <button 
              onClick={() => {
                setEditDeptId(null);
                setDeptForm({ name: '', description: '' });
                setShowDeptModal(true);
              }} 
              className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-sm font-bold text-white shadow shadow-brand-primary/20 hover:scale-[1.01] transition-all flex items-center gap-2 cursor-pointer flex-row-reverse"
            >
              <Plus className="w-4 h-4" /> <span>إضافة قسم جديد</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept: LMSDepartment) => (
              <div key={dept.id} className="bg-[#090b10] border border-[#21263d] rounded-2xl p-5 text-right flex flex-col justify-between hover:border-slate-700 transition relative group">
                <div className="absolute top-4 left-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditDept(dept)} className="p-1.5 rounded-lg bg-[#131622] hover:bg-[#1f263d] text-brand-secondary border border-[#21263d] cursor-pointer" title="تعديل">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteDept(dept.id)} className="p-1.5 rounded-lg bg-[#131622] hover:bg-rose-950 text-rose-400 border border-[#21263d] cursor-pointer" title="حذف">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mb-3">
                    <Building2 className="w-5 h-5 text-brand-primary" />
                  </div>
                  <h4 className="font-black text-white text-base">{dept.name}</h4>
                  {dept.description && <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{dept.description}</p>}
                </div>
                <div className="mt-4 pt-3 border-t border-[#21263d]/50 space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase">المقررات والمواد التابعة للقسم:</p>
                  <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
                    {courses.filter((c: LMSCourse) => c.department_id === dept.id).map(course => (
                      <div key={course.id} className="text-xs text-slate-300 bg-[#131622]/40 p-2 rounded-xl border border-[#21263d]/30 flex justify-between items-center flex-row-reverse text-right">
                        <span className="font-bold text-slate-200">{course.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({course.code})</span>
                      </div>
                    ))}
                    {courses.filter((c: LMSCourse) => c.department_id === dept.id).length === 0 && (
                      <p className="text-[10px] text-slate-600 italic">لا توجد مقررات مضافة بعد في هذا القسم</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-[#21263d]/50 font-bold">{courses.filter((c: LMSCourse) => c.department_id === dept.id).length} مقرر معتمد</p>
              </div>
            ))}
            {departments.length === 0 && <p className="col-span-3 text-center text-slate-500 py-12 text-sm">لا توجد أقسام مسجلة. أضف قسماً جديداً.</p>}
          </div>
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between flex-row-reverse">
            <h3 className="text-white font-black text-lg">المقررات الدراسية ({courses.length})</h3>
            <button 
              onClick={() => {
                setEditCourseId(null);
                setCourseForm({ code: '', title: '', description: '', department_id: '', price: '' });
                setShowCourseModal(true);
              }} 
              className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-sm font-bold text-white shadow shadow-brand-primary/20 hover:scale-[1.01] transition-all flex items-center gap-2 cursor-pointer flex-row-reverse"
            >
              <Plus className="w-4 h-4" /> <span>إضافة مقرر جديد</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-[#21263d] text-slate-400">
                  <th className="p-3 font-bold text-right">كود المقرر</th>
                  <th className="p-3 font-bold text-right">اسم المقرر</th>
                  <th className="p-3 font-bold text-right">القسم الأكاديمي</th>
                  <th className="p-3 font-bold text-right">الشعب الدراسية</th>
                  <th className="p-3 font-bold text-right">المدرس / المحاضر</th>
                  <th className="p-3 font-bold text-right">سعر الاشتراك</th>
                  <th className="p-3 font-bold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course: LMSCourse) => {
                  const courseSections = sections.filter((s: LMSSection) => s.course_id === course.id);
                  const instructors = Array.from(new Set(courseSections.map((s: LMSSection) => (s.instructor as any)?.full_name).filter(Boolean)));
                  return (
                    <tr key={course.id} className="border-b border-[#21263d]/40 hover:bg-[#121626]/30 transition">
                      <td className="p-3 font-mono text-brand-secondary font-bold text-sm">{course.code}</td>
                      <td className="p-3 text-white font-bold text-sm">{course.title}</td>
                      <td className="p-3 text-slate-400 text-sm">{departments.find((d: LMSDepartment) => d.id === course.department_id)?.name || '—'}</td>
                      <td className="p-3 text-slate-400 text-sm">{courseSections.length} شعبة</td>
                      <td className="p-3 text-slate-300 text-sm">
                        {instructors.length > 0 ? instructors.join('، ') : <span className="text-slate-600 italic">غير مسند</span>}
                      </td>
                      <td className="p-3 text-emerald-400 font-bold text-sm font-mono">{course.price !== undefined ? `${course.price} ر.س` : '0 ر.س (مجاني)'}</td>
                      <td className="p-3 text-center flex items-center justify-center gap-1.5">
                        <button onClick={() => openEditCourse(course)} className="p-1 rounded-lg bg-[#090b10] hover:bg-[#1a1f32] text-brand-secondary border border-[#21263d] cursor-pointer" title="تعديل">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteCourse(course.id)} className="p-1 rounded-lg bg-[#090b10] hover:bg-rose-950 text-rose-400 border border-[#21263d] cursor-pointer" title="حذف">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {courses.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-slate-500 p-8 text-sm">لا توجد مقررات مسجلة.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sections Tab */}
      {activeTab === 'sections' && (
        <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between flex-row-reverse">
            <h3 className="text-white font-black text-lg">الشعب الدراسية ({sections.length})</h3>
            <button 
              onClick={() => {
                setEditSectionId(null);
                setSectionForm({ course_id: '', instructor_id: '', section_number: '', semester: '', capacity: '30', schedule_days: [] as string[], schedule_time: '' });
                setShowSectionModal(true);
              }} 
              className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-sm font-bold text-white shadow shadow-brand-primary/20 hover:scale-[1.01] transition-all flex items-center gap-2 cursor-pointer flex-row-reverse"
            >
              <Plus className="w-4 h-4" /> <span>إضافة شعبة جديدة</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-[#21263d] text-slate-400">
                  <th className="p-3 font-bold text-right">المقرر</th>
                  <th className="p-3 font-bold text-right">الشعبة</th>
                  <th className="p-3 font-bold text-right">الأستاذ</th>
                  <th className="p-3 font-bold text-right">الفصل الدراسي</th>
                  <th className="p-3 font-bold text-right">مواعيد المحاضرات</th>
                  <th className="p-3 font-bold text-right">الطاقة الاستيعابية</th>
                  <th className="p-3 font-bold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((sec: LMSSection) => (
                  <tr key={sec.id} className="border-b border-[#21263d]/40 hover:bg-[#121626]/30 transition">
                    <td className="p-3 text-white font-bold text-sm">{(sec.course as any)?.title || '—'}</td>
                    <td className="p-3 text-brand-secondary font-mono font-black text-sm">{sec.section_number}</td>
                    <td className="p-3 text-slate-400 text-sm">{(sec.instructor as any)?.full_name || 'غير محدد'}</td>
                    <td className="p-3 text-slate-400 text-sm">{sec.semester}</td>
                    <td className="p-3 text-brand-primary text-xs font-bold">
                      {sec.schedule_days && sec.schedule_time 
                        ? `${sec.schedule_days.join(' - ')} (${sec.schedule_time})` 
                        : <span className="text-slate-600 italic">لم يحدد بعد</span>
                      }
                    </td>
                    <td className="p-3 text-slate-400 text-sm font-mono">{sec.capacity} طالب</td>
                    <td className="p-3 text-center flex items-center justify-center gap-1.5">
                      <button onClick={() => openEditSection(sec)} className="p-1 rounded-lg bg-[#090b10] hover:bg-[#1a1f32] text-brand-secondary border border-[#21263d] cursor-pointer" title="تعديل">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteSection(sec.id)} className="p-1 rounded-lg bg-[#090b10] hover:bg-rose-950 text-rose-400 border border-[#21263d] cursor-pointer" title="حذف">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {sections.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-slate-500 p-8 text-sm">لا توجد شعب مسجلة.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between flex-row-reverse">
            <h3 className="text-white font-black text-lg">المستخدمون ({users.length})</h3>
            <button 
              onClick={() => {
                setEditUserId(null);
                setUserForm({ email: '', password_hash: '', full_name: '', phone: '', role: 'student', subscription_plan_id: '' });
                setShowUserModal(true);
              }} 
              className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-sm font-bold text-white shadow shadow-brand-primary/20 hover:scale-[1.01] transition-all flex items-center gap-2 cursor-pointer flex-row-reverse"
            >
              <Plus className="w-4 h-4" /> <span>إضافة مستخدم جديد</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
               <thead>
                <tr className="border-b border-[#21263d] text-slate-400">
                  <th className="p-3 font-bold text-right">الاسم الكامل</th>
                  <th className="p-3 font-bold text-right">البريد الإلكتروني</th>
                  <th className="p-3 font-bold text-right">الدور</th>
                  <th className="p-3 font-bold text-right">الباقة النشطة</th>
                  <th className="p-3 font-bold text-right">تاريخ التسجيل</th>
                  <th className="p-3 font-bold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: LMSUser) => (
                  <tr key={user.id} className="border-b border-[#21263d]/40 hover:bg-[#121626]/30 transition">
                    <td className="p-3 text-white font-bold text-sm">{user.full_name}</td>
                    <td className="p-3 font-mono text-brand-secondary text-sm">{user.email}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${
                        user.role === 'admin' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                        user.role === 'instructor' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' :
                        'bg-[#20c997]/10 border-[#20c997]/20 text-[#20c997]'
                      }`}>
                        {user.role === 'admin' ? 'مدير' : user.role === 'instructor' ? 'أستاذ' : 'طالب'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 text-sm">
                      {user.role === 'student' ? (
                        subscriptionPlans.find((p: LMSSubscriptionPlan) => p.id === user.subscription_plan_id)?.name || <span className="text-slate-600 italic">لا توجد باقة</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-500 text-xs font-mono">{new Date(user.created_at).toLocaleDateString('ar-SA')}</td>
                    <td className="p-3 text-center flex items-center justify-center gap-1.5">
                      <button onClick={() => openEditUser(user)} className="p-1 rounded-lg bg-[#090b10] hover:bg-[#1a1f32] text-brand-secondary border border-[#21263d] cursor-pointer" title="تعديل">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteUser(user.id)} className="p-1 rounded-lg bg-[#090b10] hover:bg-rose-950 text-rose-400 border border-[#21263d] cursor-pointer" title="حذف">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-slate-500 p-8 text-sm">لا يوجد مستخدمون مسجلون.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approvals Tab */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          {/* Table 1: Standard Course Registrations */}
          <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-4">
            <h3 className="text-white font-black text-lg">طلبات تسجيل الطلاب الجدد للمقررات ({users.filter((u: LMSUser) => u.role === 'student' && u.status === 'pending').length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-[#21263d] text-slate-400">
                    <th className="p-3 font-bold text-right">اسم الطالب</th>
                    <th className="p-3 font-bold text-right">البريد الإلكتروني</th>
                    <th className="p-3 font-bold text-right">الهاتف</th>
                    <th className="p-3 font-bold text-right">تاريخ التسجيل</th>
                    <th className="p-3 font-bold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter((u: LMSUser) => u.role === 'student' && u.status === 'pending').map(student => (
                    <tr key={student.id} className="border-b border-[#21263d]/40 hover:bg-[#121626]/30 transition">
                      <td className="p-3 text-white font-bold text-sm">{student.full_name}</td>
                      <td className="p-3 font-mono text-slate-400 text-sm">{student.email}</td>
                      <td className="p-3 font-mono text-slate-400 text-sm">{student.phone || '—'}</td>
                      <td className="p-3 text-slate-500 text-xs font-mono">{new Date(student.created_at).toLocaleDateString('ar-SA')}</td>
                      <td className="p-3 text-center flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleApproveUser(student.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                        >
                          موافقة وتفعيل
                        </button>
                        <button
                          onClick={() => handleRejectUser(student.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
                        >
                          رفض الطلب
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.filter((u: LMSUser) => u.role === 'student' && u.status === 'pending').length === 0 && (
                    <tr><td colSpan={5} className="text-center text-slate-500 p-8 text-sm">لا توجد طلبات تسجيل طلاب معلقة حالياً.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Special requests */}
          <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-4">
            <h3 className="text-white font-black text-lg">طلبات الدروس الخاصة والموضوعات المخصصة ({specialRequests.filter((r: LMSSpecialRequest) => r.status === 'pending').length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-[#21263d] text-slate-400">
                    <th className="p-3 font-bold text-right">اسم الطالب</th>
                    <th className="p-3 font-bold text-right">الموضوع / التفاصيل المطلوبة</th>
                    <th className="p-3 font-bold text-right">الاتصال</th>
                    <th className="p-3 font-bold text-right">تحديد السعر (ر.س)</th>
                    <th className="p-3 font-bold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {specialRequests.filter((r: LMSSpecialRequest) => r.status === 'pending').map(req => (
                    <tr key={req.id} className="border-b border-[#21263d]/40 hover:bg-[#121626]/30 transition">
                      <td className="p-3 text-white font-bold text-sm">
                        <div>{req.student_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{req.student_email}</div>
                      </td>
                      <td className="p-3 text-slate-300 text-sm max-w-xs whitespace-pre-wrap leading-relaxed">{req.details}</td>
                      <td className="p-3 font-mono text-slate-400 text-sm">{req.student_phone || '—'}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          placeholder="أدخل السعر..."
                          value={customPrices[req.id] || ''}
                          onChange={e => setCustomPrices((prev: any) => ({ ...prev, [req.id]: e.target.value }))}
                          className="w-24 bg-[#090b10] border border-[#21263d] rounded-lg p-2 text-white font-mono text-center text-xs focus:outline-none focus:border-brand-primary"
                        />
                      </td>
                      <td className="p-3 text-center flex items-center justify-center gap-2 mt-1">
                        <button
                          onClick={() => handleApproveSpecialRequest(req.id)}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition cursor-pointer"
                        >
                          موافقة وتحديد السعر
                        </button>
                        <button
                          onClick={() => handleRejectSpecialRequest(req.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
                        >
                          رفض الطلب
                        </button>
                      </td>
                    </tr>
                  ))}
                  {specialRequests.filter((r: LMSSpecialRequest) => r.status === 'pending').length === 0 && (
                    <tr><td colSpan={5} className="text-center text-slate-500 p-8 text-sm">لا توجد طلبات دروس خاصة معلقة حالياً.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payments Review Tab */}
      {activeTab === 'payments' && (
        <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-4">
          <h3 className="text-white font-black text-lg text-right">طلبات دفع الاشتراكات والرسوم ({payments.filter(p => p.status === 'pending').length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-[#21263d] text-slate-400">
                  <th className="p-3 font-bold text-right">الطالب</th>
                  <th className="p-3 font-bold text-right">رقم الجوال</th>
                  <th className="p-3 font-bold text-right">الباقة / التفاصيل</th>
                  <th className="p-3 font-bold text-right">المبلغ</th>
                  <th className="p-3 font-bold text-right">الإيصال</th>
                  <th className="p-3 font-bold text-right">تاريخ الإرسال</th>
                  <th className="p-3 font-bold text-right">الحالة</th>
                  <th className="p-3 font-bold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p: any) => {
                  const studentUser = users.find(u => u.id === p.lms_user_id);
                  const studentName = studentUser ? studentUser.full_name : 'طالب غير معروف';
                  const studentPhone = studentUser ? (studentUser.phone || '—') : '—';
                  
                  return (
                    <tr key={p.id} className="border-b border-[#21263d]/40 hover:bg-[#121626]/30 transition">
                      <td className="p-3 text-white font-bold text-sm">{studentName}</td>
                      <td className="p-3 font-mono text-slate-400 text-sm">{studentPhone}</td>
                      <td className="p-3 text-slate-300 text-sm">
                        {p.plan_id === 'plan-gold' 
                          ? 'الباقة الذهبية' 
                          : p.plan_id === 'plan-diamond' 
                            ? 'الباقة الماسية' 
                            : p.plan_id === 'plan-silver' 
                              ? 'الباقة الفضية'
                              : 'طلب خاص / مخصص'}
                      </td>
                      <td className="p-3 text-emerald-400 font-bold text-sm font-mono">{p.amount} ر.س</td>
                      <td className="p-3">
                        {p.receipt_image ? (
                          <a href={p.receipt_image} target="_blank" rel="noreferrer" className="text-brand-primary hover:underline font-bold flex items-center gap-1 justify-end">
                            👁️ عرض الإيصال
                          </a>
                        ) : 'لا يوجد'}
                      </td>
                      <td className="p-3 text-slate-500 text-xs font-mono">{new Date(p.created_at).toLocaleDateString('ar-SA')}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${
                          p.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          p.status === 'pending' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse' :
                          'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}>
                          {p.status === 'approved' ? 'مقبول' : p.status === 'pending' ? 'معلق' : 'مرفوض'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {p.status === 'pending' && (
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={() => handleApprovePayment(p)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                            >
                              قبول وتفعيل
                            </button>
                            <button
                              onClick={() => handleRejectPayment(p)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
                            >
                              رفض الدفع
                            </button>
                          </div>
                        )}
                        {p.status !== 'pending' && p.admin_notes && (
                          <span className="text-slate-500 italic text-xs">{p.admin_notes}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {payments.length === 0 && (
                  <tr><td colSpan={8} className="text-center text-slate-500 p-8 text-sm">لا توجد طلبات دفع مسجلة.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subscription Plans Tab */}
      {activeTab === 'plans' && (
        <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between flex-row-reverse">
            <h3 className="text-white font-black text-lg">باقات الاشتراك المتاحة ({subscriptionPlans.length})</h3>
            <button 
              onClick={() => {
                setEditPlanId(null);
                setPlanForm({ name: '', price: '', billing_cycle: 'شهري', features: '', visible: true });
                setShowPlanModal(true);
              }} 
              className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-sm font-bold text-white shadow shadow-brand-primary/20 hover:scale-[1.01] transition-all flex items-center gap-2 cursor-pointer flex-row-reverse"
            >
              <Plus className="w-4 h-4" /> <span>إضافة باقة جديدة</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-right">
            {subscriptionPlans.map((plan: LMSSubscriptionPlan) => (
              <div key={plan.id} className="bg-[#090b10] border border-[#21263d] rounded-2xl p-6 text-right flex flex-col justify-between hover:border-slate-700 transition relative group">
                <div className="absolute top-4 left-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditPlan(plan)} className="p-1.5 rounded-lg bg-[#131622] hover:bg-[#1f263d] text-brand-secondary border border-[#21263d] cursor-pointer" title="تعديل">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeletePlan(plan.id)} className="p-1.5 rounded-lg bg-[#131622] hover:bg-rose-950 text-rose-400 border border-[#21263d] cursor-pointer" title="حذف">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex items-center justify-between flex-row-reverse mb-2">
                    <h4 className="font-black text-white text-lg">{plan.name}</h4>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black border ${
                      plan.visible !== false 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                    }`}>
                      {plan.visible !== false ? 'مرئية بالرئيسية' : 'مخفية'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 flex-row-reverse text-right mt-2 mb-4">
                    <span className="text-2xl font-black text-emerald-400 font-mono">{plan.price}</span>
                    <span className="text-xs text-slate-400 font-bold">ر.س / {plan.billing_cycle}</span>
                  </div>
                  <div className="space-y-2.5 border-t border-[#21263d]/50 pt-4">
                    {plan.features.map((feat: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 flex-row-reverse text-right text-xs text-slate-300">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 animate-pulse" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 pt-3 border-t border-[#21263d]/50 flex gap-2">
                  <button 
                    onClick={() => openEditPlan(plan)} 
                    className="flex-1 py-2.5 rounded-xl bg-[#131622] hover:bg-[#1e233b] border border-[#21263d] text-xs font-bold text-slate-200 transition cursor-pointer"
                  >
                    تعديل الباقة
                  </button>
                  <button 
                    onClick={() => handleDeletePlan(plan.id)} 
                    className="py-2.5 px-3.5 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 text-xs font-bold text-rose-400 transition cursor-pointer"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
            {subscriptionPlans.length === 0 && (
              <p className="col-span-3 text-center text-slate-500 py-12 text-sm">لا توجد باقات اشتراك مضافة. أضف باقة جديدة.</p>
            )}
          </div>
        </div>
      )}

      {/* Site settings Tab (Complete Dynamic CMS Panel) */}
      {activeTab === 'site_settings' && siteConfig && (
        <div className="bg-[#131622] border border-[#21263d] p-6 sm:p-8 rounded-3xl space-y-6" dir="rtl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#21263d] pb-5">
            <div className="text-right">
              <h3 className="text-white font-black text-xl">لوحة التحكم بإدارة محتوى الموقع (CMS)</h3>
              <p className="text-xs text-slate-400 mt-1">قم بتعديل وتحديث كامل نصوص وصور وأقسام الصفحة الرئيسية والقائمة العلوية فورياً بدون تعديل كود.</p>
            </div>
            <button
              onClick={handleSaveSiteConfig}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-sm font-bold text-white shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/35 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>حفظ كافة التغييرات ونشرها</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
            {/* CMS Sidebar Navigation */}
            <div className="lg:col-span-1 flex flex-col gap-1.5 bg-[#090b10] border border-[#21263d] p-4 rounded-2xl h-fit">
              <span className="text-[10px] font-black text-slate-500 uppercase px-3 pb-2 border-b border-[#21263d]/40 mb-2 block">أقسام إدارة المحتوى</span>
              {[
                { id: 'homepage', label: 'الرئيسية وترتيب الأقسام' },
                { id: 'platform_identity', label: 'هوية المنصة والاتصال' },
                { id: 'portals', label: 'بوابات النظامين' },
                { id: 'media', label: 'مكتبة الوسائط' },
                { id: 'features', label: 'إدارة المميزات' },
                { id: 'stats', label: 'إحصائيات الموقع' },
                { id: 'faqs', label: 'الأسئلة الشائعة FAQ' },
                { id: 'navbar', label: 'أزرار القائمة العلوية' },
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setCmsSubTab(sub.id as any)}
                  className={`w-full text-right px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    cmsSubTab === sub.id
                      ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <span>{sub.label}</span>
                  {cmsSubTab === sub.id && <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />}
                </button>
              ))}
            </div>

            {/* CMS Workspace Content Area */}
            <div className="lg:col-span-3 bg-[#0c0e18]/40 border border-[#202537] p-6 rounded-2xl space-y-6">

              {/* Platform Identity & Contact Section */}
              {cmsSubTab === 'platform_identity' && (
                <div className="space-y-6">
                  <h4 className="text-white font-black text-base border-r-2 border-brand-primary pr-2 mb-4">هوية المنصة ومعلومات التواصل</h4>
                  
                  {/* Part 1: Core Branding */}
                  <div className="bg-[#090b10] border border-[#21263d] p-5 rounded-2xl space-y-4">
                    <div className="text-brand-primary font-bold text-sm pb-1.5 border-b border-[#21263d]/40">شعار المنصة والهوية البصرية</div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className={labelClass}>اسم المنصة (Platform Name)</label>
                        <input
                          type="text"
                          value={siteConfig.platformName || ''}
                          onChange={e => setSiteConfig({ ...siteConfig, platformName: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>رابط شعار المنصة (Logo Image URL)</label>
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={siteConfig.logoUrl || ''}
                              onChange={e => setSiteConfig({ ...siteConfig, logoUrl: e.target.value })}
                              className={inputClass + ' font-mono text-left flex-1'}
                              placeholder="رابط الشعار المباشر"
                            />
                            {siteConfig.logoUrl && (
                              <div className="w-12 h-12 rounded-xl border border-[#21263d] overflow-hidden bg-slate-950 flex items-center justify-center shrink-0">
                                <img src={siteConfig.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2 max-h-[100px] overflow-y-auto bg-slate-950/40 p-2 rounded-xl border border-[#21263d]/60">
                            <span className="text-[10px] text-slate-500 font-bold block w-full">اختر من مكتبة الوسائط:</span>
                            {siteConfig.mediaLibrary?.map((m: any) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => setSiteConfig({ ...siteConfig, logoUrl: m.url })}
                                className="w-10 h-10 rounded border border-[#21263d] hover:border-brand-primary overflow-hidden cursor-pointer shrink-0"
                              >
                                <img src={m.url} alt="" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className={labelClass}>رابط أيقونة المتصفح (Favicon URL)</label>
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={siteConfig.faviconUrl || ''}
                              onChange={e => setSiteConfig({ ...siteConfig, faviconUrl: e.target.value })}
                              className={inputClass + ' font-mono text-left flex-1'}
                              placeholder="رابط أيقونة Favicon"
                            />
                            {siteConfig.faviconUrl && (
                              <div className="w-12 h-12 rounded-xl border border-[#21263d] overflow-hidden bg-slate-950 flex items-center justify-center shrink-0">
                                <img src={siteConfig.faviconUrl} alt="Favicon Preview" className="w-6 h-6 object-contain" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2 max-h-[100px] overflow-y-auto bg-slate-950/40 p-2 rounded-xl border border-[#21263d]/60">
                            <span className="text-[10px] text-slate-500 font-bold block w-full">اختر من مكتبة الوسائط:</span>
                            {siteConfig.mediaLibrary?.map((m: any) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => setSiteConfig({ ...siteConfig, faviconUrl: m.url })}
                                className="w-10 h-10 rounded border border-[#21263d] hover:border-brand-primary overflow-hidden cursor-pointer shrink-0"
                              >
                                <img src={m.url} alt="" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Part 2: Contact & Support */}
                  <div className="bg-[#090b10] border border-[#21263d] p-5 rounded-2xl space-y-4">
                    <div className="text-brand-secondary font-bold text-sm pb-1.5 border-b border-[#21263d]/40">بيانات التواصل والدعم الفني</div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>رقم الهاتف</label>
                        <input
                          type="text"
                          value={siteConfig.contactPhone || ''}
                          onChange={e => setSiteConfig({ ...siteConfig, contactPhone: e.target.value })}
                          className={inputClass + ' font-mono text-left'}
                          placeholder="مثال: 0501234567"
                        />
                      </div>
                      
                      <div>
                        <label className={labelClass}>البريد الإلكتروني</label>
                        <input
                          type="email"
                          value={siteConfig.contactEmail || ''}
                          onChange={e => setSiteConfig({ ...siteConfig, contactEmail: e.target.value })}
                          className={inputClass + ' font-mono text-left'}
                          placeholder="example@domain.com"
                        />
                      </div>

                      <div>
                        <label className={labelClass}>العنوان الجغرافي للمؤسسة</label>
                        <input
                          type="text"
                          value={siteConfig.contactAddress || ''}
                          onChange={e => setSiteConfig({ ...siteConfig, contactAddress: e.target.value })}
                          className={inputClass}
                          placeholder="الرياض، المملكة العربية السعودية"
                        />
                      </div>

                      <div>
                        <label className={labelClass}>رابط المحادثة المباشرة للواتساب (WhatsApp Link)</label>
                        <input
                          type="text"
                          value={siteConfig.whatsappLink || ''}
                          onChange={e => setSiteConfig({ ...siteConfig, whatsappLink: e.target.value })}
                          className={inputClass + ' font-mono text-left'}
                          placeholder="https://wa.me/..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Part 3: Social Links */}
                  <div className="bg-[#090b10] border border-[#21263d] p-5 rounded-2xl space-y-4">
                    <div className="text-purple-400 font-bold text-sm pb-1.5 border-b border-[#21263d]/40">روابط صفحات شبكات التواصل الاجتماعي</div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>صفحة فيسبوك (Facebook URL)</label>
                        <input
                          type="text"
                          value={siteConfig.socialFacebook || ''}
                          onChange={e => setSiteConfig({ ...siteConfig, socialFacebook: e.target.value })}
                          className={inputClass + ' font-mono text-left'}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>حساب تويتر / إكس (Twitter/X URL)</label>
                        <input
                          type="text"
                          value={siteConfig.socialTwitter || ''}
                          onChange={e => setSiteConfig({ ...siteConfig, socialTwitter: e.target.value })}
                          className={inputClass + ' font-mono text-left'}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>حساب إنستغرام (Instagram URL)</label>
                        <input
                          type="text"
                          value={siteConfig.socialInstagram || ''}
                          onChange={e => setSiteConfig({ ...siteConfig, socialInstagram: e.target.value })}
                          className={inputClass + ' font-mono text-left'}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>صفحة لينكد إن (LinkedIn URL)</label>
                        <input
                          type="text"
                          value={siteConfig.socialLinkedin || ''}
                          onChange={e => setSiteConfig({ ...siteConfig, socialLinkedin: e.target.value })}
                          className={inputClass + ' font-mono text-left'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Part 4: Unified Login Gateway Copy */}
                  <div className="bg-[#090b10] border border-[#21263d] p-5 rounded-2xl space-y-4">
                    <div className="text-amber-400 font-bold text-sm pb-1.5 border-b border-[#21263d]/40">نصوص وإعدادات بوابة الدخول الموحد</div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className={labelClass}>عنوان قسم الدخول الموحد (Login Title)</label>
                        <input
                          type="text"
                          value={siteConfig.unifiedLoginTitle || ''}
                          onChange={e => setSiteConfig({ ...siteConfig, unifiedLoginTitle: e.target.value })}
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>الوصف التفصيلي لقسم الدخول الموحد (Login Description)</label>
                        <textarea
                          rows={3}
                          value={siteConfig.unifiedLoginDesc || ''}
                          onChange={e => setSiteConfig({ ...siteConfig, unifiedLoginDesc: e.target.value })}
                          className={inputClass + ' resize-none'}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>نص زر دخول نظام التحضير</label>
                          <input
                            type="text"
                            value={siteConfig.unifiedLoginBtnAttendance || ''}
                            onChange={e => setSiteConfig({ ...siteConfig, unifiedLoginBtnAttendance: e.target.value })}
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>نص زر دخول منصة LMS</label>
                          <input
                            type="text"
                            value={siteConfig.unifiedLoginBtnLms || ''}
                            onChange={e => setSiteConfig({ ...siteConfig, unifiedLoginBtnLms: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 1. HOMEPAGE & SECTIONS ORDER SECTION */}
              {cmsSubTab === 'homepage' && (
                <div className="space-y-6">
                  <h4 className="text-white font-black text-base border-r-2 border-brand-primary pr-2 mb-4">القسم الترحيبي والتخطيط (Hero & Layout)</h4>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className={labelClass}>عنوان الترحيب الرئيسي (Hero Title)</label>
                      <input
                        type="text"
                        value={siteConfig.welcomeTitle || ''}
                        onChange={e => setSiteConfig({ ...siteConfig, welcomeTitle: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>وصف الترحيب الفرعي (Hero Description)</label>
                      <textarea
                        rows={3}
                        value={siteConfig.welcomeDesc || ''}
                        onChange={e => setSiteConfig({ ...siteConfig, welcomeDesc: e.target.value })}
                        className={inputClass + ' resize-none'}
                      />
                    </div>
                    
                    {/* Image Fields with Library Picker */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>رابط صورة البانر (Banner Image URL)</label>
                        <input
                          type="text"
                          value={siteConfig.bannerImage || ''}
                          onChange={e => setSiteConfig({ ...siteConfig, bannerImage: e.target.value })}
                          className={inputClass + ' font-mono text-left'}
                        />
                        <div className="flex flex-wrap gap-1.5 mt-2 max-h-[100px] overflow-y-auto bg-slate-950/40 p-2 rounded-xl border border-[#21263d]/60">
                          <span className="text-[10px] text-slate-500 font-bold block w-full">اختر من مكتبة الوسائط:</span>
                          {siteConfig.mediaLibrary?.map((m: any) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setSiteConfig({ ...siteConfig, bannerImage: m.url })}
                              className="w-10 h-10 rounded border border-[#21263d] hover:border-brand-primary overflow-hidden cursor-pointer shrink-0"
                            >
                              <img src={m.url} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>رابط صورة الخلفية (Background Image URL - اختياري)</label>
                        <input
                          type="text"
                          value={siteConfig.backgroundImage || ''}
                          onChange={e => setSiteConfig({ ...siteConfig, backgroundImage: e.target.value })}
                          className={inputClass + ' font-mono text-left'}
                        />
                        <div className="flex flex-wrap gap-1.5 mt-2 max-h-[100px] overflow-y-auto bg-slate-950/40 p-2 rounded-xl border border-[#21263d]/60">
                          <span className="text-[10px] text-slate-500 font-bold block w-full">اختر من مكتبة الوسائط:</span>
                          {siteConfig.mediaLibrary?.map((m: any) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setSiteConfig({ ...siteConfig, backgroundImage: m.url })}
                              className="w-10 h-10 rounded border border-[#21263d] hover:border-brand-primary overflow-hidden cursor-pointer shrink-0"
                            >
                              <img src={m.url} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section ordering list */}
                  <div className="pt-4 border-t border-[#21263d] space-y-3">
                    <h5 className="text-white font-bold text-sm">ترتيب أقسام الصفحة الرئيسية وإخفائها/إظهارها:</h5>
                    <p className="text-slate-400 text-[11px]">رتب أقسام موقعك الرئيسية بالسحب والإفلات أو باستخدام أزرار الترتيب، أو قم بإخفاء أي قسم بضغطة زر.</p>
                    <div className="space-y-2 max-w-xl">
                      {(siteConfig.sectionOrder || ['hero', 'services', 'stats', 'features', 'pricing', 'faq']).map((secId: string, idx: number, arr: string[]) => {
                        const isVisible = siteConfig.sectionVisibility?.[secId] !== false;
                        const secLabel = 
                          secId === 'hero' ? 'القسم الترحيبي (Hero Section)' :
                          secId === 'services' ? 'بطاقات الأنظمة والبوابات (Services)' :
                          secId === 'stats' ? 'لوحة الأرقام والإحصائيات (Stats)' :
                          secId === 'features' ? 'مزايا المنصة الأكاديمية (Features)' :
                          secId === 'pricing' ? 'باقات خطط الاشتراك (Pricing)' :
                          'الأسئلة الشائعة للجمهور (FAQ)';
                        return (
                          <div key={secId} className="flex items-center justify-between p-3.5 bg-[#090b10] border border-[#21263d] rounded-xl flex-row-reverse text-right">
                            <div className="flex items-center gap-3 flex-row-reverse">
                              <span className="text-slate-500 text-xs font-bold font-mono">#{idx + 1}</span>
                              <span className="text-white font-bold text-xs">{secLabel}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Order buttons */}
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => {
                                  const order = [...siteConfig.sectionOrder];
                                  const temp = order[idx];
                                  order[idx] = order[idx - 1];
                                  order[idx - 1] = temp;
                                  setSiteConfig({ ...siteConfig, sectionOrder: order });
                                }}
                                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                                title="نقل للأعلى"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={idx === arr.length - 1}
                                onClick={() => {
                                  const order = [...siteConfig.sectionOrder];
                                  const temp = order[idx];
                                  order[idx] = order[idx + 1];
                                  order[idx + 1] = temp;
                                  setSiteConfig({ ...siteConfig, sectionOrder: order });
                                }}
                                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                                title="نقل للأسفل"
                              >
                                ▼
                              </button>
                              
                              {/* Visibility Toggle */}
                              <button
                                type="button"
                                onClick={() => {
                                  const vis = { ...(siteConfig.sectionVisibility || {}) };
                                  vis[secId] = isVisible ? false : true;
                                  setSiteConfig({ ...siteConfig, sectionVisibility: vis });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                                  isVisible 
                                    ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400' 
                                    : 'bg-rose-500/10 border border-rose-500/25 text-rose-400'
                                }`}
                              >
                                {isVisible ? 'مرئي في الصفحة' : 'مخفي'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. PORTALS (Attendance & LMS Systems Editor) */}
              {cmsSubTab === 'portals' && siteConfig.portals && (
                <div className="space-y-6">
                  <h4 className="text-white font-black text-base border-r-2 border-brand-primary pr-2 mb-4">إدارة بوابات النظامين الأساسيين</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Attendance portal editor */}
                    <div className="bg-[#090b10] border border-[#21263d] p-5 rounded-2xl space-y-4 text-right">
                      <div className="text-brand-primary font-bold text-sm pb-2 border-b border-[#21263d]/50">1- نظام التحضير الأكاديمي</div>
                      <div>
                        <label className={labelClass}>اسم النظام</label>
                        <input
                          type="text"
                          value={siteConfig.portals.attendance.name}
                          onChange={e => {
                            const p = { ...siteConfig.portals };
                            p.attendance.name = e.target.value;
                            setSiteConfig({ ...siteConfig, portals: p });
                          }}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>وصف النظام</label>
                        <textarea
                          rows={3}
                          value={siteConfig.portals.attendance.desc}
                          onChange={e => {
                            const p = { ...siteConfig.portals };
                            p.attendance.desc = e.target.value;
                            setSiteConfig({ ...siteConfig, portals: p });
                          }}
                          className={inputClass + ' resize-none'}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>رابط التوجيه (Link)</label>
                        <input
                          type="text"
                          value={siteConfig.portals.attendance.link}
                          onChange={e => {
                            const p = { ...siteConfig.portals };
                            p.attendance.link = e.target.value;
                            setSiteConfig({ ...siteConfig, portals: p });
                          }}
                          className={inputClass + ' font-mono text-left'}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>صورة الغلاف للبوابة</label>
                        <input
                          type="text"
                          value={siteConfig.portals.attendance.image}
                          onChange={e => {
                            const p = { ...siteConfig.portals };
                            p.attendance.image = e.target.value;
                            setSiteConfig({ ...siteConfig, portals: p });
                          }}
                          className={inputClass + ' font-mono text-left'}
                        />
                        <div className="flex flex-wrap gap-1.5 mt-2 max-h-[80px] overflow-y-auto bg-slate-955/40 p-1.5 rounded-lg">
                          {siteConfig.mediaLibrary?.map((m: any) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                const p = { ...siteConfig.portals };
                                p.attendance.image = m.url;
                                setSiteConfig({ ...siteConfig, portals: p });
                              }}
                              className="w-8 h-8 rounded border border-[#21263d] overflow-hidden cursor-pointer shrink-0"
                            >
                              <img src={m.url} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* LMS Portal Editor */}
                    <div className="bg-[#090b10] border border-[#21263d] p-5 rounded-2xl space-y-4 text-right">
                      <div className="text-brand-secondary font-bold text-sm pb-2 border-b border-[#21263d]/50">2- منصة التعلم الإلكتروني LMS</div>
                      <div>
                        <label className={labelClass}>اسم المنصة</label>
                        <input
                          type="text"
                          value={siteConfig.portals.lms.name}
                          onChange={e => {
                            const p = { ...siteConfig.portals };
                            p.lms.name = e.target.value;
                            setSiteConfig({ ...siteConfig, portals: p });
                          }}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>وصف المنصة</label>
                        <textarea
                          rows={3}
                          value={siteConfig.portals.lms.desc}
                          onChange={e => {
                            const p = { ...siteConfig.portals };
                            p.lms.desc = e.target.value;
                            setSiteConfig({ ...siteConfig, portals: p });
                          }}
                          className={inputClass + ' resize-none'}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>رابط التوجيه (Link)</label>
                        <input
                          type="text"
                          value={siteConfig.portals.lms.link}
                          onChange={e => {
                            const p = { ...siteConfig.portals };
                            p.lms.link = e.target.value;
                            setSiteConfig({ ...siteConfig, portals: p });
                          }}
                          className={inputClass + ' font-mono text-left'}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>صورة الغلاف للبوابة</label>
                        <input
                          type="text"
                          value={siteConfig.portals.lms.image}
                          onChange={e => {
                            const p = { ...siteConfig.portals };
                            p.lms.image = e.target.value;
                            setSiteConfig({ ...siteConfig, portals: p });
                          }}
                          className={inputClass + ' font-mono text-left'}
                        />
                        <div className="flex flex-wrap gap-1.5 mt-2 max-h-[80px] overflow-y-auto bg-slate-955/40 p-1.5 rounded-lg">
                          {siteConfig.mediaLibrary?.map((m: any) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                const p = { ...siteConfig.portals };
                                p.lms.image = m.url;
                                setSiteConfig({ ...siteConfig, portals: p });
                              }}
                              className="w-8 h-8 rounded border border-[#21263d] overflow-hidden cursor-pointer shrink-0"
                            >
                              <img src={m.url} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. MEDIA LIBRARY (Upload, Delete, Simulate Upload) */}
              {cmsSubTab === 'media' && (
                <div className="space-y-6">
                  <h4 className="text-white font-black text-base border-r-2 border-brand-primary pr-2 mb-4">مكتبة الوسائط الرقمية (Media Library)</h4>
                  
                  {/* Upload Form */}
                  <div className="bg-[#090b10] border border-[#21263d] p-5 rounded-2xl space-y-4">
                    <div className="text-white font-bold text-sm">إضافة وسائط وصور جديدة للمكتبة:</div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>اسم الصورة / الكود التوضيحي</label>
                        <input
                          type="text"
                          placeholder="مثال: صورة غلاف نظام التحضير"
                          value={newMediaUrl.name}
                          onChange={e => setNewMediaUrl({ ...newMediaUrl, name: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>رابط الصورة المباشر (URL)</label>
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/..."
                          value={newMediaUrl.url}
                          onChange={e => setNewMediaUrl({ ...newMediaUrl, url: e.target.value })}
                          className={inputClass + ' font-mono text-left'}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!newMediaUrl.name || !newMediaUrl.url) {
                            alert('يرجى كتابة اسم الصورة ورابطها أولاً');
                            return;
                          }
                          const updated = [...(siteConfig.mediaLibrary || [])];
                          updated.push({
                            id: `med-${Math.random().toString(36).substring(2, 9)}`,
                            name: newMediaUrl.name,
                            url: newMediaUrl.url
                          });
                          setSiteConfig({ ...siteConfig, mediaLibrary: updated });
                          setNewMediaUrl({ name: '', url: '' });
                          showToast('تمت إضافة الصورة إلى مكتبة الوسائط بنجاح');
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:scale-[1.01] transition-all cursor-pointer"
                      >
                        إضافة بالرابط
                      </button>
                      
                      <div className="w-full sm:w-auto relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const base64 = reader.result as string;
                              const updated = [...(siteConfig.mediaLibrary || [])];
                              updated.push({
                                id: `med-${Math.random().toString(36).substring(2, 9)}`,
                                name: file.name.substring(0, 25) || 'صورة مرفوعة',
                                url: base64
                              });
                              setSiteConfig({ ...siteConfig, mediaLibrary: updated });
                              showToast('تم رفع الصورة محلياً وحفظها بنجاح');
                            };
                            reader.readAsDataURL(file);
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <button
                          type="button"
                          className="w-full px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          📁 رفع ملف صورة من جهازك محلياً
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Media Grid */}
                  <div className="space-y-3">
                    <h5 className="text-white font-bold text-sm">الصور المرفوعة والمتاحة بالمكتبة:</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {siteConfig.mediaLibrary?.map((media: any, idx: number) => (
                        <div key={media.id || idx} className="bg-[#090b10] border border-[#21263d] rounded-xl overflow-hidden p-2 space-y-2 group relative">
                          <div className="w-full h-28 rounded-lg overflow-hidden bg-slate-950 relative">
                            <img src={media.url} alt={media.name} className="w-full h-full object-cover" />
                            {/* Copy URL overlay on hover */}
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(media.url);
                                showToast('تم نسخ رابط الصورة إلى الحافظة');
                              }}
                              className="absolute inset-0 bg-black/70 flex items-center justify-center text-[10px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              📋 نسخ الرابط
                            </button>
                          </div>
                          <div className="text-right">
                            <div className="text-[11px] font-bold text-white truncate">{media.name}</div>
                            <div className="text-[9px] text-slate-500 font-mono truncate">{media.url.startsWith('data:') ? 'مرفوعة محلياً (Base64)' : media.url}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (!confirm(`هل تريد حذف الصورة "${media.name}" من مكتبة الوسائط؟`)) return;
                              const updated = siteConfig.mediaLibrary.filter((m: any) => m.id !== media.id);
                              setSiteConfig({ ...siteConfig, mediaLibrary: updated });
                              showToast('تم حذف الصورة من مكتبة الوسائط');
                            }}
                            className="w-full py-1.5 rounded bg-rose-950/40 hover:bg-rose-950 text-[10px] text-rose-400 font-bold border border-rose-900/30 transition cursor-pointer"
                          >
                            حذف الصورة
                          </button>
                        </div>
                      ))}
                      {(!siteConfig.mediaLibrary || siteConfig.mediaLibrary.length === 0) && (
                        <p className="col-span-4 text-center text-slate-600 py-12 text-xs italic">مكتبة الوسائط فارغة. أضف أو ارفع بعض الصور.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. FEATURES CRUD (Platform, LMS, Attendance Features) */}
              {cmsSubTab === 'features' && (
                <div className="space-y-6">
                  <h4 className="text-white font-black text-base border-r-2 border-brand-primary pr-2 mb-4">إدارة مميزات المنصة والأنظمة (Features CRUD)</h4>
                  
                  {/* Form to add/edit feature */}
                  <div className="bg-[#090b10] border border-[#21263d] p-5 rounded-2xl space-y-4">
                    <div className="text-white font-bold text-sm">
                      {editingFeatureIdx ? 'تعديل الميزة المحددة:' : 'إضافة ميزة جديدة لموقعك:'}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>مكان العرض (القسم التابع له)</label>
                        <select
                          value={newFeature.type}
                          onChange={e => setNewFeature({ ...newFeature, type: e.target.value as any })}
                          className={inputClass + ' bg-[#090b10]'}
                        >
                          <option value="platform">مميزات المنصة العامة (Homepage Features)</option>
                          <option value="attendance">مميزات وعناصر نظام التحضير الأكاديمي</option>
                          <option value="lms">مميزات وعناصر منصة التعلم LMS</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>عنوان الميزة (Feature Title)</label>
                        <input
                          type="text"
                          placeholder="مثال: رصد الحضور اليومي"
                          value={newFeature.title}
                          onChange={e => setNewFeature({ ...newFeature, title: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>شرح وتفاصيل الميزة</label>
                      <textarea
                        rows={2}
                        placeholder="اكتب تفاصيل الميزة والخدمة هنا باختصار..."
                        value={newFeature.desc}
                        onChange={e => setNewFeature({ ...newFeature, desc: e.target.value })}
                        className={inputClass + ' resize-none'}
                      />
                    </div>
                    <div className="flex gap-2 justify-start">
                      <button
                        type="button"
                        onClick={() => {
                          if (!newFeature.title || !newFeature.desc) {
                            alert('يرجى ملء كافة حقول الميزة');
                            return;
                          }
                          const config = { ...siteConfig };
                          const targetKey = 
                            newFeature.type === 'platform' ? 'platformFeatures' :
                            newFeature.type === 'attendance' ? 'attendanceFeatures' :
                            'lmsFeatures';
                          
                          if (!config[targetKey]) config[targetKey] = [];

                          if (editingFeatureIdx) {
                            // Update
                            config[targetKey][editingFeatureIdx.idx] = { title: newFeature.title, desc: newFeature.desc };
                            showToast('تم تحديث الميزة بنجاح');
                            setEditingFeatureIdx(null);
                          } else {
                            // Add new
                            config[targetKey].push({ title: newFeature.title, desc: newFeature.desc });
                            showToast('تمت إضافة الميزة الجديدة بنجاح');
                          }

                          setNewFeature({ title: '', desc: '', type: 'platform' });
                          setSiteConfig(config);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:scale-[1.01] transition-all cursor-pointer"
                      >
                        {editingFeatureIdx ? 'حفظ التحديث' : 'إضافة الميزة'}
                      </button>
                      {editingFeatureIdx && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFeatureIdx(null);
                            setNewFeature({ title: '', desc: '', type: 'platform' });
                          }}
                          className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold hover:text-white transition cursor-pointer"
                        >
                          إلغاء التعديل
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Lists of features by system */}
                  {['platform', 'attendance', 'lms'].map(sysType => {
                    const targetKey = 
                      sysType === 'platform' ? 'platformFeatures' :
                      sysType === 'attendance' ? 'attendanceFeatures' :
                      'lmsFeatures';
                    const list = siteConfig[targetKey] || [];
                    const titleStr = 
                      sysType === 'platform' ? 'مميزات المنصة الرئيسية العامة' :
                      sysType === 'attendance' ? 'مميزات نظام التحضير الأكاديمي' :
                      'مميزات منصة التعلم LMS';
                    
                    return (
                      <div key={sysType} className="space-y-2 border-t border-[#21263d]/50 pt-4">
                        <h5 className="text-white font-bold text-xs flex items-center justify-start gap-1.5 flex-row-reverse">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                          <span>{titleStr} ({list.length}):</span>
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {list.map((f: any, idx: number) => (
                            <div key={idx} className="bg-[#090b10] border border-[#21263d] rounded-xl p-3.5 flex items-start justify-between flex-row-reverse text-right relative group">
                              <div className="text-right space-y-1 pr-1.5 max-w-[80%]">
                                <div className="text-xs font-black text-white">{f.title}</div>
                                <div className="text-[10px] text-slate-400 leading-relaxed">{f.desc}</div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingFeatureIdx({ idx, type: sysType as any });
                                    setNewFeature({ title: f.title, desc: f.desc, type: sysType as any });
                                  }}
                                  className="p-1 rounded bg-[#131622] text-brand-secondary border border-[#21263d] cursor-pointer"
                                  title="تعديل الميزة"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!confirm('هل تريد حذف هذه الميزة؟')) return;
                                    const config = { ...siteConfig };
                                    config[targetKey] = config[targetKey].filter((_: any, i: number) => i !== idx);
                                    setSiteConfig(config);
                                    showToast('تم حذف الميزة بنجاح');
                                  }}
                                  className="p-1 rounded bg-[#131622] text-rose-400 border border-[#21263d] cursor-pointer"
                                  title="حذف الميزة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {list.length === 0 && (
                            <p className="col-span-2 text-slate-600 text-xs italic py-2 text-right">لا توجد مميزات مضافة لهذا القسم حالياً.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 5. STATS EDITOR */}
              {cmsSubTab === 'stats' && (
                <div className="space-y-6">
                  <h4 className="text-white font-black text-base border-r-2 border-brand-primary pr-2 mb-4">إدارة إحصائيات وأرقام المنصة</h4>
                  
                  {/* Add/edit form */}
                  <div className="bg-[#090b10] border border-[#21263d] p-5 rounded-2xl space-y-4">
                    <div className="text-white font-bold text-sm">
                      {editingStatIdx !== null ? 'تعديل المؤشر الإحصائي:' : 'إضافة مؤشر إحصائي جديد للموقع:'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className={labelClass}>اسم المؤشر الإحصائي</label>
                        <input
                          type="text"
                          placeholder="مثال: عدد الطلاب"
                          value={newStat.label}
                          onChange={e => setNewStat({ ...newStat, label: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>القيمة الرقمية المعروضة</label>
                        <input
                          type="text"
                          placeholder="مثال: +15,000"
                          value={newStat.value}
                          onChange={e => setNewStat({ ...newStat, value: e.target.value })}
                          className={inputClass + ' font-mono text-left'}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>مظهر التدرج اللوني</label>
                        <select
                          value={newStat.color}
                          onChange={e => setNewStat({ ...newStat, color: e.target.value })}
                          className={inputClass + ' bg-[#090b10]'}
                        >
                          <option value="from-cyan-400 to-blue-500">سماوي / أزرق</option>
                          <option value="from-purple-500 to-pink-500">بنفسجي / وردي</option>
                          <option value="from-amber-400 to-orange-500">برتقالي / أصفر</option>
                          <option value="from-emerald-400 to-teal-500">أخضر / تركواز</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-start">
                      <button
                        type="button"
                        onClick={() => {
                          if (!newStat.label || !newStat.value) {
                            alert('يرجى ملء اسم وقيمة الإحصائية');
                            return;
                          }
                          const config = { ...siteConfig };
                          if (!config.stats) config.stats = [];

                          if (editingStatIdx !== null) {
                            config.stats[editingStatIdx] = newStat;
                            showToast('تم تحديث الإحصائية بنجاح');
                            setEditingStatIdx(null);
                          } else {
                            config.stats.push(newStat);
                            showToast('تمت إضافة الإحصائية بنجاح');
                          }

                          setNewStat({ label: '', value: '', color: 'from-cyan-400 to-blue-500' });
                          setSiteConfig(config);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:scale-[1.01] transition-all cursor-pointer"
                      >
                        {editingStatIdx !== null ? 'حفظ التحديث' : 'إضافة المؤشر'}
                      </button>
                      {editingStatIdx !== null && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStatIdx(null);
                            setNewStat({ label: '', value: '', color: 'from-cyan-400 to-blue-500' });
                          }}
                          className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold hover:text-white transition cursor-pointer"
                        >
                          إلغاء التعديل
                        </button>
                      )}
                    </div>
                  </div>

                  {/* List of statistics */}
                  <div className="space-y-2">
                    <h5 className="text-white font-bold text-sm">المؤشرات الحالية بالصفحة الرئيسية:</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {siteConfig.stats?.map((s: any, idx: number) => (
                        <div key={idx} className="bg-[#090b10] border border-[#21263d] rounded-2xl p-4 flex items-center justify-between flex-row-reverse text-right relative group">
                          <div className="text-right">
                            <div className={`text-xl font-black bg-gradient-to-r ${s.color} bg-clip-text text-transparent font-mono`}>{s.value}</div>
                            <div className="text-xs text-slate-400 mt-0.5 font-bold">{s.label}</div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStatIdx(idx);
                                setNewStat(s);
                              }}
                              className="p-1.5 rounded bg-[#131622] text-brand-secondary border border-[#21263d] cursor-pointer"
                              title="تعديل الإحصائية"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!confirm('هل تريد حذف هذه الإحصائية؟')) return;
                                const config = { ...siteConfig };
                                config.stats = config.stats.filter((_: any, i: number) => i !== idx);
                                setSiteConfig(config);
                                showToast('تم حذف الإحصائية');
                              }}
                              className="p-1.5 rounded bg-[#131622] text-rose-400 border border-[#21263d] cursor-pointer"
                              title="حذف الإحصائية"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. FAQ CRUD SECTION */}
              {cmsSubTab === 'faqs' && (
                <div className="space-y-6">
                  <h4 className="text-white font-black text-base border-r-2 border-brand-primary pr-2 mb-4">إدارة الأسئلة الشائعة للجمهور (FAQ CRUD)</h4>
                  
                  {/* FAQ Form */}
                  <div className="bg-[#090b10] border border-[#21263d] p-5 rounded-2xl space-y-4">
                    <div className="text-white font-bold text-sm">
                      {editingFaqIdx !== null ? 'تعديل السؤال الشائع المحدد:' : 'إضافة سؤال وجواب جديد للموقع:'}
                    </div>
                    <div>
                      <label className={labelClass}>صيغة السؤال الشائع *</label>
                      <input
                        type="text"
                        placeholder="مثال: هل المنصة مجانية للطلاب؟"
                        value={newFaq.q}
                        onChange={e => setNewFaq({ ...newFaq, q: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>إجابة السؤال بالتفصيل *</label>
                      <textarea
                        rows={3}
                        placeholder="اكتب الإجابة المفصلة التي ستظهر للمستخدم هنا..."
                        value={newFaq.a}
                        onChange={e => setNewFaq({ ...newFaq, a: e.target.value })}
                        className={inputClass + ' resize-none'}
                      />
                    </div>
                    <div className="flex gap-2 justify-start">
                      <button
                        type="button"
                        onClick={() => {
                          if (!newFaq.q || !newFaq.a) {
                            alert('يرجى كتابة السؤال والجواب معاً');
                            return;
                          }
                          const config = { ...siteConfig };
                          if (!config.faqs) config.faqs = [];

                          if (editingFaqIdx !== null) {
                            config.faqs[editingFaqIdx] = newFaq;
                            showToast('تم تحديث السؤال بنجاح');
                            setEditingFaqIdx(null);
                          } else {
                            config.faqs.push(newFaq);
                            showToast('تمت إضافة السؤال بنجاح');
                          }

                          setNewFaq({ q: '', a: '' });
                          setSiteConfig(config);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:scale-[1.01] transition-all cursor-pointer"
                      >
                        {editingFaqIdx !== null ? 'حفظ التحديث' : 'إضافة السؤال'}
                      </button>
                      {editingFaqIdx !== null && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFaqIdx(null);
                            setNewFaq({ q: '', a: '' });
                          }}
                          className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold hover:text-white transition cursor-pointer"
                        >
                          إلغاء التعديل
                        </button>
                      )}
                    </div>
                  </div>

                  {/* FAQs List */}
                  <div className="space-y-3">
                    <h5 className="text-white font-bold text-sm">الأسئلة الحالية المعروضة بالموقع ({siteConfig.faqs?.length || 0}):</h5>
                    <div className="space-y-3">
                      {siteConfig.faqs?.map((faq: any, idx: number) => (
                        <div key={idx} className="bg-[#090b10] border border-[#21263d] p-5 rounded-2xl flex items-start justify-between flex-row-reverse text-right relative group">
                          <div className="text-right space-y-1.5 pr-2 max-w-[85%]">
                            <div className="text-xs font-black text-white flex items-center gap-1.5 flex-row-reverse text-right">
                              <span className="text-brand-primary">Q:</span>
                              <span>{faq.q}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 leading-relaxed pr-5">{faq.a}</div>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingFaqIdx(idx);
                                setNewFaq(faq);
                              }}
                              className="p-1.5 rounded bg-[#131622] text-brand-secondary border border-[#21263d] cursor-pointer"
                              title="تعديل السؤال"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!confirm('هل تريد حذف هذا السؤال الشائع؟')) return;
                                const config = { ...siteConfig };
                                config.faqs = config.faqs.filter((_: any, i: number) => i !== idx);
                                setSiteConfig(config);
                                showToast('تم حذف السؤال الشائع بنجاح');
                              }}
                              className="p-1.5 rounded bg-[#131622] text-rose-400 border border-[#21263d] cursor-pointer"
                              title="حذف السؤال"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {(!siteConfig.faqs || siteConfig.faqs.length === 0) && (
                        <p className="text-slate-600 text-xs italic py-6 text-center">لا توجد أسئلة شائعة مضافة بعد.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 7. NAVBAR LINKS CRUD & REORDER */}
              {cmsSubTab === 'navbar' && (
                <div className="space-y-6">
                  <h4 className="text-white font-black text-base border-r-2 border-brand-primary pr-2 mb-4">إدارة أزرار وقائمة التنقل العلوية (Navbar Links)</h4>
                  
                  {/* Form */}
                  <div className="bg-[#090b10] border border-[#21263d] p-5 rounded-2xl space-y-4">
                    <div className="text-white font-bold text-sm">
                      {editingNavLinkIdx !== null ? 'تعديل زر التنقل المحدد:' : 'إضافة زر تنقل جديد بالقائمة:'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>اسم الزر (Label)</label>
                        <input
                          type="text"
                          placeholder="مثال: الخدمات"
                          value={newNavLink.label}
                          onChange={e => setNewNavLink({ ...newNavLink, label: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>الرابط الموجه له (URL/Anchor)</label>
                        <input
                          type="text"
                          placeholder="مثال: #services أو /about"
                          value={newNavLink.href}
                          onChange={e => setNewNavLink({ ...newNavLink, href: e.target.value })}
                          className={inputClass + ' font-mono text-left'}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-start">
                      <button
                        type="button"
                        onClick={() => {
                          if (!newNavLink.label || !newNavLink.href) {
                            alert('يرجى ملء اسم ورابط زر التنقل');
                            return;
                          }
                          const config = { ...siteConfig };
                          if (!config.navbarLinks) config.navbarLinks = [];

                          if (editingNavLinkIdx !== null) {
                            config.navbarLinks[editingNavLinkIdx] = { 
                              id: config.navbarLinks[editingNavLinkIdx].id || `nav-${Math.random().toString(36).substring(2, 9)}`,
                              ...newNavLink 
                            };
                            showToast('تم تحديث زر التنقل بالقائمة');
                            setEditingNavLinkIdx(null);
                          } else {
                            config.navbarLinks.push({
                              id: `nav-${Math.random().toString(36).substring(2, 9)}`,
                              ...newNavLink
                            });
                            showToast('تمت إضافة زر التنقل بنجاح للقائمة');
                          }

                          setNewNavLink({ label: '', href: '' });
                          setSiteConfig(config);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:scale-[1.01] transition-all cursor-pointer"
                      >
                        {editingNavLinkIdx !== null ? 'حفظ التحديث' : 'إضافة للقائمة'}
                      </button>
                      {editingNavLinkIdx !== null && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNavLinkIdx(null);
                            setNewNavLink({ label: '', href: '' });
                          }}
                          className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold hover:text-white transition cursor-pointer"
                        >
                          إلغاء التعديل
                        </button>
                      )}
                    </div>
                  </div>

                  {/* List & Reorder */}
                  <div className="space-y-2">
                    <h5 className="text-white font-bold text-sm">الأزرار الحالية في القائمة العلوية:</h5>
                    <div className="space-y-2 max-w-lg">
                      {siteConfig.navbarLinks?.map((link: any, idx: number, arr: any[]) => (
                        <div key={link.id || idx} className="bg-[#090b10] border border-[#21263d] rounded-xl p-3.5 flex items-center justify-between flex-row-reverse text-right relative group">
                          <div className="flex items-center gap-4 flex-row-reverse">
                            <span className="text-slate-500 font-mono text-xs font-bold">#{idx + 1}</span>
                            <div>
                              <span className="text-white font-bold text-xs block">{link.label}</span>
                              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{link.href}</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {/* Up / Down reorder */}
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => {
                                const links = [...siteConfig.navbarLinks];
                                const temp = links[idx];
                                links[idx] = links[idx - 1];
                                links[idx - 1] = temp;
                                setSiteConfig({ ...siteConfig, navbarLinks: links });
                              }}
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                              title="نقل للأعلى"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              disabled={idx === arr.length - 1}
                              onClick={() => {
                                const links = [...siteConfig.navbarLinks];
                                const temp = links[idx];
                                links[idx] = links[idx + 1];
                                links[idx + 1] = temp;
                                setSiteConfig({ ...siteConfig, navbarLinks: links });
                              }}
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                              title="نقل للأسفل"
                            >
                              ▼
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingNavLinkIdx(idx);
                                setNewNavLink({ label: link.label, href: link.href });
                              }}
                              className="p-1.5 rounded-lg bg-slate-900 text-brand-secondary border border-[#21263d] cursor-pointer"
                              title="تعديل"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!confirm(`هل تريد حذف زر "${link.label}" من القائمة؟`)) return;
                                const config = { ...siteConfig };
                                config.navbarLinks = config.navbarLinks.filter((_: any, i: number) => i !== idx);
                                setSiteConfig(config);
                                showToast('تم حذف الزر من القائمة');
                              }}
                              className="p-1.5 rounded-lg bg-slate-900 text-rose-400 border border-[#21263d] cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {(!siteConfig.navbarLinks || siteConfig.navbarLinks.length === 0) && (
                        <p className="text-slate-600 text-xs italic py-6 text-center">لا توجد أزرار تنقل بالقائمة مضافة.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ==== MODALS ==== */}
      {/* Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-[#0c0e18] border border-[#212739] w-full max-w-md p-6 space-y-4 rounded-3xl text-right shadow-2xl">
            <div className="flex items-center justify-between mb-2 flex-row-reverse">
              <h3 className="text-white font-black text-lg">{editDeptId ? 'تعديل القسم الأكاديمي' : 'إضافة قسم أكاديمي جديد'}</h3>
              <button onClick={() => { setShowDeptModal(false); setEditDeptId(null); setDeptForm({ name: '', description: '' }); }} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">✕</button>
            </div>
            <div><label className={labelClass}>اسم القسم *</label><input value={deptForm.name} onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} placeholder="مثال: علوم الحاسب والمعلومات" className={inputClass} /></div>
            <div><label className={labelClass}>الوصف (اختياري)</label><textarea value={deptForm.description} onChange={e => setDeptForm({ ...deptForm, description: e.target.value })} rows={3} className={inputClass + ' resize-none'} /></div>
            <button onClick={handleCreateDept} disabled={!deptForm.name} className="w-full py-3.5 mt-2 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-sm shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40">
              {editDeptId ? 'حفظ التعديلات' : 'إنشاء القسم'}
            </button>
          </div>
        </div>
      )}

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-[#0c0e18] border border-[#212739] w-full max-w-md p-6 space-y-4 rounded-3xl text-right shadow-2xl">
            <div className="flex items-center justify-between mb-2 flex-row-reverse">
              <h3 className="text-white font-black text-lg">{editCourseId ? 'تعديل المقرر الدراسي' : 'إضافة مقرر دراسي جديد'}</h3>
              <button onClick={() => { setShowCourseModal(false); setEditCourseId(null); setCourseForm({ code: '', title: '', description: '', department_id: '', price: '' }); }} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>القسم الأكاديمي</label>
                <select value={courseForm.department_id} onChange={e => setCourseForm({ ...courseForm, department_id: e.target.value })} className={inputClass + ' bg-[#0c0e18]'}>
                  <option value="">— بدون قسم —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div><label className={labelClass}>كود المقرر *</label><input value={courseForm.code} onChange={e => setCourseForm({ ...courseForm, code: e.target.value })} placeholder="CS101" className={inputClass + ' font-mono text-left'} /></div>
            </div>
            <div><label className={labelClass}>اسم المقرر *</label><input value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} placeholder="مقدمة في علوم البرمجة (بايثون)" className={inputClass} /></div>
            <div className="grid grid-cols-1 gap-3">
              <div><label className={labelClass}>سعر المقرر (ر.س) *</label><input type="number" value={courseForm.price} onChange={e => setCourseForm({ ...courseForm, price: e.target.value })} placeholder="مثال: 250" className={inputClass + ' font-mono text-left'} /></div>
            </div>
            <div><label className={labelClass}>الوصف</label><textarea value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} rows={2} className={inputClass + ' resize-none'} /></div>
            <button onClick={handleCreateCourse} disabled={!courseForm.code || !courseForm.title || !courseForm.price} className="w-full py-3.5 mt-2 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-sm shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40">
              {editCourseId ? 'حفظ التعديلات' : 'إنشاء المقرر'}
            </button>
          </div>
        </div>
      )}

      {/* Section Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-[#0c0e18] border border-[#212739] w-full max-w-md p-6 space-y-4 rounded-3xl text-right shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-2 flex-row-reverse">
              <h3 className="text-white font-black text-lg">{editSectionId ? 'تعديل الشعبة الدراسية' : 'إضافة شعبة دراسية'}</h3>
              <button onClick={() => { setShowSectionModal(false); setEditSectionId(null); setSectionForm({ course_id: '', instructor_id: '', section_number: '', semester: '', capacity: '30', schedule_days: [], schedule_time: '' }); }} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">✕</button>
            </div>
            <div><label className={labelClass}>المقرر الدراسي *</label>
              <select value={sectionForm.course_id} onChange={e => setSectionForm({ ...sectionForm, course_id: e.target.value })} className={inputClass + ' bg-[#0c0e18]'}>
                <option value="">— اختر المقرر —</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.code})</option>)}
              </select>
            </div>
            <div><label className={labelClass}>عضو هيئة التدريس</label>
              <select value={sectionForm.instructor_id} onChange={e => setSectionForm({ ...sectionForm, instructor_id: e.target.value })} className={inputClass + ' bg-[#0c0e18]'}>
                <option value="">— بدون أستاذ —</option>
                {users.filter((u: LMSUser) => u.role === 'instructor').map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>أيام الدراسة المحاضرات *</label>
              <div className="flex flex-wrap gap-2 flex-row-reverse justify-start mb-2">
                {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].map(day => {
                  const isChecked = sectionForm.schedule_days.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const nextDays = isChecked 
                          ? sectionForm.schedule_days.filter(d => d !== day)
                          : [...sectionForm.schedule_days, day];
                        setSectionForm({ ...sectionForm, schedule_days: nextDays });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        isChecked 
                          ? 'bg-brand-primary border-brand-primary text-white' 
                          : 'bg-[#121522] border-[#21263d] text-slate-400 hover:text-white'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className={labelClass}>توقيت المحاضرة (مثال: 09:00 - 10:30) *</label>
              <input 
                value={sectionForm.schedule_time} 
                onChange={e => setSectionForm({ ...sectionForm, schedule_time: e.target.value })} 
                placeholder="10:00 - 11:30" 
                className={inputClass + ' font-mono text-left'} 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>السعة</label><input type="number" value={sectionForm.capacity} onChange={e => setSectionForm({ ...sectionForm, capacity: e.target.value })} className={inputClass + ' font-mono text-left'} /></div>
              <div><label className={labelClass}>رقم الشعبة *</label><input value={sectionForm.section_number} onChange={e => setSectionForm({ ...sectionForm, section_number: e.target.value })} placeholder="01" className={inputClass + ' font-mono text-left'} /></div>
            </div>
            <div><label className={labelClass}>الفصل الدراسي *</label><input value={sectionForm.semester} onChange={e => setSectionForm({ ...sectionForm, semester: e.target.value })} placeholder="Fall 2026" className={inputClass + ' font-mono text-left'} /></div>
            <button onClick={handleCreateSection} disabled={!sectionForm.course_id || !sectionForm.section_number || !sectionForm.semester || sectionForm.schedule_days.length === 0 || !sectionForm.schedule_time} className="w-full py-3.5 mt-2 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-sm shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40">
              {editSectionId ? 'حفظ التعديلات' : 'إنشاء الشعبة'}
            </button>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-[#0c0e18] border border-[#212739] w-full max-w-md p-6 space-y-4 rounded-3xl text-right shadow-2xl">
            <div className="flex items-center justify-between mb-2 flex-row-reverse">
              <h3 className="text-white font-black text-lg">{editUserId ? 'تعديل حساب المستخدم' : 'إضافة مستخدم جديد'}</h3>
              <button onClick={() => { setShowUserModal(false); setEditUserId(null); setUserForm({ email: '', password_hash: '', full_name: '', phone: '', role: 'student', subscription_plan_id: '' }); }} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">✕</button>
            </div>
            <div><label className={labelClass}>الاسم الكامل *</label><input value={userForm.full_name} onChange={e => setUserForm({ ...userForm, full_name: e.target.value })} placeholder="أحمد خالد العتيبي" className={inputClass} /></div>
            <div><label className={labelClass}>البريد الإلكتروني *</label><input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} placeholder="user@university.edu" className={inputClass + ' font-mono text-left'} /></div>
            <div>
              <label className={labelClass}>
                {editUserId ? 'كلمة المرور الجديدة (اتركه فارغاً للإبقاء على الحالية)' : 'كلمة المرور *'}
              </label>
              <input 
                type="password" 
                value={userForm.password_hash} 
                onChange={e => setUserForm({ ...userForm, password_hash: e.target.value })} 
                placeholder={editUserId ? 'اتركه فارغاً لعدم التغيير...' : '••••••••'} 
                className={inputClass} 
              />
            </div>
            <div><label className={labelClass}>رقم الجوال (اختياري)</label><input value={userForm.phone} onChange={e => setUserForm({ ...userForm, phone: e.target.value })} placeholder="05XXXXXXXX" className={inputClass + ' font-mono text-left'} /></div>
            <div><label className={labelClass}>الدور الأكاديمي *</label>
              <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value as LMSUser['role'] })} className={inputClass + ' bg-[#0c0e18]'}>
                <option value="student">طالب جامعي</option>
                <option value="instructor">عضو هيئة تدريس (أستاذ)</option>
                <option value="admin">مدير النظام</option>
              </select>
            </div>
            {userForm.role === 'student' && (
              <div>
                <label className={labelClass}>باقة الاشتراك</label>
                <select 
                  value={userForm.subscription_plan_id} 
                  onChange={e => setUserForm({ ...userForm, subscription_plan_id: e.target.value })} 
                  className={inputClass + ' bg-[#0c0e18]'}
                >
                  <option value="">— بدون باقة نشطة —</option>
                  {subscriptionPlans.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.price} ر.س / {p.billing_cycle})</option>
                  ))}
                </select>
              </div>
            )}
            <button 
              onClick={handleCreateUser} 
              disabled={!userForm.email || !userForm.full_name || (!editUserId && !userForm.password_hash)} 
              className="w-full py-3.5 mt-2 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-sm shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {editUserId ? 'حفظ التعديلات' : 'إنشاء المستخدم'}
            </button>
          </div>
        </div>
      )}

      {/* Subscription Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-[#0c0e18] border border-[#212739] w-full max-w-md p-6 space-y-4 rounded-3xl text-right shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-2 flex-row-reverse">
              <h3 className="text-white font-black text-lg">{editPlanId ? 'تعديل باقة الاشتراك' : 'إضافة باقة اشتراك جديدة'}</h3>
              <button onClick={() => { setShowPlanModal(false); setEditPlanId(null); setPlanForm({ name: '', price: '', billing_cycle: 'شهري', features: '', visible: true }); }} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">✕</button>
            </div>
            <div>
              <label className={labelClass}>اسم الباقة *</label>
              <input 
                value={planForm.name} 
                onChange={e => setPlanForm({ ...planForm, name: e.target.value })} 
                placeholder="مثال: الباقة الفضية" 
                className={inputClass} 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>دورة الفوترة *</label>
                <select 
                  value={planForm.billing_cycle} 
                  onChange={e => setPlanForm({ ...planForm, billing_cycle: e.target.value })} 
                  className={inputClass + ' bg-[#0c0e18]'}
                >
                  <option value="شهري">شهري</option>
                  <option value="فصلي">فصلي</option>
                  <option value="سنوي">سنوي</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>سعر الباقة (ر.س) *</label>
                <input 
                  type="number" 
                  value={planForm.price} 
                  onChange={e => setPlanForm({ ...planForm, price: e.target.value })} 
                  placeholder="مثال: 150" 
                  className={inputClass + ' font-mono text-left'} 
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>مميزات الباقة (ميزة في كل سطر) *</label>
              <textarea 
                value={planForm.features} 
                onChange={e => setPlanForm({ ...planForm, features: e.target.value })} 
                placeholder="الوصول لكافة المحاضرات&#10;حل الاختبارات&#10;شات ومراسلة مع الأساتذة" 
                rows={4} 
                className={inputClass + ' resize-none'} 
              />
            </div>
            {/* Checkbox for Visibility */}
            <div className="flex items-center gap-2.5 flex-row-reverse justify-start pb-2">
              <input 
                type="checkbox" 
                id="plan-visible"
                checked={planForm.visible}
                onChange={e => setPlanForm({ ...planForm, visible: e.target.checked })}
                className="w-4 h-4 accent-brand-primary rounded border-slate-700 bg-slate-900 cursor-pointer"
              />
              <label htmlFor="plan-visible" className="text-xs font-bold text-slate-300 cursor-pointer select-none">
                عرض ونشر هذه الباقة في الصفحة الرئيسية
              </label>
            </div>
            <button 
              onClick={handleCreateOrUpdatePlan} 
              disabled={!planForm.name || !planForm.price || !planForm.features} 
              className="w-full py-3.5 mt-2 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-sm shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {editPlanId ? 'حفظ التعديلات' : 'إنشاء الباقة'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
