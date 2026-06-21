import { useState, useEffect } from 'react';
import { 
  Building2, BookOpen, Users, ClipboardList, Plus, 
  CheckCircle, LayoutDashboard, GraduationCap, UserPlus,
  Edit, Trash2, ShieldCheck
} from 'lucide-react';
import { lmsDb, type LMSUser, type LMSDepartment, type LMSCourse, type LMSSection, type LMSSpecialRequest, type LMSSubscriptionPlan } from '../../lib/lms_supabase';

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
  const [planForm, setPlanForm] = useState({ name: '', price: '', billing_cycle: 'شهري', features: '' });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [depts, crs, sects, usrs, reqs, sConf, sPlans] = await Promise.all([
        lmsDb.getDepartments(),
        lmsDb.getCourses(),
        lmsDb.getSections(),
        lmsDb.getUsers(),
        lmsDb.getSpecialRequests(),
        lmsDb.getSiteConfig(),
        lmsDb.getSubscriptionPlans()
      ]);
      setDepartments(depts);
      setCourses(crs);
      setSections(sects);
      setUsers(usrs);
      setSpecialRequests(reqs);
      setSiteConfig(sConf);
      setSubscriptionPlans(sPlans);
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
        await lmsDb.updateSubscriptionPlan(editPlanId, planForm.name, priceVal, planForm.billing_cycle, featArr);
        showToast('تم تحديث باقة الاشتراك بنجاح');
      } else {
        await lmsDb.createSubscriptionPlan(planForm.name, priceVal, planForm.billing_cycle, featArr);
        showToast('تم إنشاء باقة الاشتراك بنجاح');
      }
      setShowPlanModal(false);
      setEditPlanId(null);
      setPlanForm({ name: '', price: '', billing_cycle: 'شهري', features: '' });
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
      features: p.features.join('\n')
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

      {/* Subscription Plans Tab */}
      {activeTab === 'plans' && (
        <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between flex-row-reverse">
            <h3 className="text-white font-black text-lg">باقات الاشتراك المتاحة ({subscriptionPlans.length})</h3>
            <button 
              onClick={() => {
                setEditPlanId(null);
                setPlanForm({ name: '', price: '', billing_cycle: 'شهري', features: '' });
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
                  <h4 className="font-black text-white text-lg">{plan.name}</h4>
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

      {/* Site settings Tab */}
      {activeTab === 'site_settings' && siteConfig && (
        <div className="bg-[#131622] border border-[#21263d] p-6 rounded-3xl space-y-6">
          <div className="flex items-center justify-between flex-row-reverse border-b border-[#21263d] pb-4">
            <h3 className="text-white font-black text-lg">إدارة وتعديل محتوى الصفحة الرئيسية للموقع</h3>
            <button
              onClick={handleSaveSiteConfig}
              className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-sm font-bold text-white shadow shadow-brand-primary/25 transition cursor-pointer"
            >
              حفظ التغييرات
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 text-right">
            {/* Header Content */}
            <div className="space-y-4">
              <h4 className="text-brand-primary font-black text-sm text-right border-r-2 border-brand-primary pr-2">القسم الترحيبي (Hero Section)</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className={labelClass}>عنوان الترحيب الرئيسي</label>
                  <input
                    type="text"
                    value={siteConfig.welcomeTitle || ''}
                    onChange={e => setSiteConfig({ ...siteConfig, welcomeTitle: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>نص الوصف الترحيبي</label>
                  <textarea
                    rows={3}
                    value={siteConfig.welcomeDesc || ''}
                    onChange={e => setSiteConfig({ ...siteConfig, welcomeDesc: e.target.value })}
                    className={inputClass + ' resize-none'}
                  />
                </div>
              </div>
            </div>

            {/* Statistics Content */}
            <div className="space-y-4 pt-4 border-t border-[#21263d]">
              <h4 className="text-brand-primary font-black text-sm text-right border-r-2 border-brand-primary pr-2">إحصائيات الموقع (Statistics)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {siteConfig.stats?.map((stat: any, idx: number) => (
                  <div key={idx} className="bg-[#090b10] border border-[#21263d] p-4 rounded-2xl space-y-2">
                    <div className="text-xs text-slate-500 font-bold text-right">الإحصائية {idx + 1}</div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">اسم المؤشر</label>
                      <input
                        type="text"
                        value={stat.label}
                        onChange={e => {
                          const newStats = [...siteConfig.stats];
                          newStats[idx].label = e.target.value;
                          setSiteConfig({ ...siteConfig, stats: newStats });
                        }}
                        className={inputClass + ' py-2 text-xs'}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">القيمة المعروضة</label>
                      <input
                        type="text"
                        value={stat.value}
                        onChange={e => {
                          const newStats = [...siteConfig.stats];
                          newStats[idx].value = e.target.value;
                          setSiteConfig({ ...siteConfig, stats: newStats });
                        }}
                        className={inputClass + ' py-2 font-mono text-left text-xs'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Features Content */}
            <div className="space-y-4 pt-4 border-t border-[#21263d]">
              <h4 className="text-brand-primary font-black text-sm text-right border-r-2 border-brand-primary pr-2">مميزات المنصة (Core Features)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {siteConfig.features?.map((feat: any, idx: number) => (
                  <div key={idx} className="bg-[#090b10] border border-[#21263d] p-4 rounded-2xl space-y-2">
                    <div className="text-xs text-slate-500 font-bold text-right">الميزة {idx + 1}</div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">عنوان الميزة</label>
                      <input
                        type="text"
                        value={feat.title}
                        onChange={e => {
                          const newFeats = [...siteConfig.features];
                          newFeats[idx].title = e.target.value;
                          setSiteConfig({ ...siteConfig, features: newFeats });
                        }}
                        className={inputClass + ' py-2 text-xs'}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">شرح الميزة</label>
                      <textarea
                        rows={2}
                        value={feat.desc}
                        onChange={e => {
                          const newFeats = [...siteConfig.features];
                          newFeats[idx].desc = e.target.value;
                          setSiteConfig({ ...siteConfig, features: newFeats });
                        }}
                        className={inputClass + ' py-2 text-xs resize-none'}
                      />
                    </div>
                  </div>
                ))}
              </div>
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
              <button onClick={() => { setShowPlanModal(false); setEditPlanId(null); setPlanForm({ name: '', price: '', billing_cycle: 'شهري', features: '' }); }} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">✕</button>
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
