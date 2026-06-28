import { useState, useEffect } from 'react';
import { 
  GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, 
  BookOpen, FileText, CheckSquare, Award, Video, MessageSquare, 
  Check, Star, Users, ArrowLeft, ShieldCheck
} from 'lucide-react';
import { lmsDb, type LMSUser, type LMSCourse, type LMSSubscriptionPlan } from '../../lib/lms_supabase';
import { db } from '../../lib/supabase';

interface LMSLandingProps {
  onLoginSuccess: (user: LMSUser) => void;
}

export default function LMSLanding({ onLoginSuccess }: LMSLandingProps) {
  // Navigation / Tab States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  
  // Courses List
  const [courses, setCourses] = useState<LMSCourse[]>([]);
  const [selectedRegCourseId, setSelectedRegCourseId] = useState<string>('');
  const [subscriptionPlans, setSubscriptionPlans] = useState<LMSSubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [pricingTab, setPricingTab] = useState<'plans' | 'courses'>('plans');

  // Site Configuration State
  const [siteConfig, setSiteConfig] = useState<any>(null);

  useEffect(() => {
    lmsDb.getCourses().then(setCourses).catch(console.error);
    lmsDb.getSiteConfig().then(setSiteConfig).catch(console.error);
    lmsDb.getSubscriptionPlans().then(setSubscriptionPlans).catch(console.error);
  }, []);

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginShowPass, setLoginShowPass] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register Form States
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regShowPass, setRegShowPass] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  // Custom special request state
  const [specialDetails, setSpecialDetails] = useState('');

  // Fallback stats icons mapped dynamically
  const getIcon = (idx: number) => {
    switch (idx) {
      case 0: return Users;
      case 1: return BookOpen;
      case 2: return ShieldCheck;
      default: return Award;
    }
  };

  const getIconColor = (idx: number) => {
    switch (idx) {
      case 0: return 'text-cyan-400 bg-cyan-400/10';
      case 1: return 'text-amber-400 bg-amber-400/10';
      case 2: return 'text-emerald-400 bg-emerald-400/10';
      default: return 'text-indigo-400 bg-indigo-400/10';
    }
  };

  // Features Data
  const features = [
    { title: 'محاضرات ومواد علمية رقمية', desc: 'استعراض مستندات المناهج والعروض التقديمية ومقاطع الفيديو التعليمية بجودة عالية.', icon: FileText, border: 'hover:border-cyan-500/50 hover:shadow-cyan-950/20' },
    { title: 'واجبات ومهام تفاعلية', desc: 'نظام متكامل لتسليم الواجبات المنزلية، وتلقي التقييمات والملاحظات من الأستاذ مباشرة.', icon: CheckSquare, border: 'hover:border-emerald-500/50 hover:shadow-emerald-950/20' },
    { title: 'اختبارات مؤقتة ذكية', desc: 'أداء الاختبارات الدورية بنظام محوسب ذكي مع احتساب الوقت تلقائياً وتصحيح فوري.', icon: Award, border: 'hover:border-amber-500/50 hover:shadow-amber-950/20' },
    { title: 'حلقات دراسية وبث مباشر', desc: 'قاعات محاضرات افتراضية متكاملة عبر Zoom وTeams للتفاعل الفوري مع الهيئة التدريسية.', icon: Video, border: 'hover:border-indigo-500/50 hover:shadow-indigo-950/20' },
    { title: 'مراسلة خاصة وتواصل سريع', desc: 'نظام محادثات فوري يسمح للطلاب بالتواصل المباشر مع أساتذة المقرر لطلب المساعدة.', icon: MessageSquare, border: 'hover:border-purple-500/50 hover:shadow-purple-950/20' },
    { title: 'شهادات ودرجات معتمدة', desc: 'استخراج كشوفات الدرجات وإصدار شهادات التفوق الأكاديمي الرقمية القابلة للطباعة بنقرة زر.', icon: GraduationCap, border: 'hover:border-rose-500/50 hover:shadow-rose-950/20' },
  ];

  // Actions
  const handleOpenAuth = (tab: 'login' | 'register', defaultCourseId?: string, defaultPlanId?: string) => {
    setAuthTab(tab);
    if (tab === 'login') {
      setLoginError('');
    } else {
      const isValidCourse = defaultCourseId && (defaultCourseId === 'special' || courses.some(c => c.id === defaultCourseId));
      setSelectedRegCourseId(isValidCourse ? defaultCourseId : '');
      setSelectedPlanId(defaultPlanId || '');
      setRegError('');
      setRegSuccess(false);
      setSpecialDetails('');
    }
    setShowAuthModal(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      let user;
      try {
        user = await lmsDb.loginUser(loginEmail, loginPassword);
      } catch (loginErr) {
        // Check if they are a pending new customer
        const newCustomers = await db.getNewCustomers();
        const pendingCustomer = newCustomers.find(
          c => c.username.toLowerCase() === loginEmail.toLowerCase()
        );
        
        if (pendingCustomer) {
          if (pendingCustomer.status === 'new' || pendingCustomer.status === 'pending') {
            throw new Error('حسابك قيد المراجعة والموافقة من قبل الإدارة حالياً. يرجى الانتظار لحين التفعيل وسداد الرسوم.');
          } else if (pendingCustomer.status === 'rejected') {
            throw new Error('تم رفض طلب التسجيل الخاص بك. يرجى التواصل مع إدارة المنصة.');
          }
        }
        throw loginErr;
      }

      if (user.status === 'pending') {
        throw new Error('حسابك قيد المراجعة والموافقة من قبل الإدارة حالياً. يرجى الانتظار لحين التفعيل وسداد الرسوم.');
      }
      if (user.status === 'rejected') {
        throw new Error('تم رفض طلب التسجيل الخاص بك. يرجى التواصل مع إدارة المنصة.');
      }
      onLoginSuccess(user);
    } catch (err: any) {
      setLoginError(err?.message || 'بيانات الدخول غير صحيحة، تحقق من الحساب وكلمة المرور.');
    } finally {
      setLoginLoading(false);
    }
  };  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess(false);
    setRegLoading(true);
    try {
      if (selectedRegCourseId === 'special' && !specialDetails.trim()) {
        throw new Error('يرجى كتابة تفاصيل موضوع أو درس التقوية المطلوب.');
      }

      // Save registration request in new_customers table
      await db.createNewCustomer({
        full_name: regFullName,
        university_name: 'LMS Student',
        username: regEmail,
        password: regPassword,
        phone: regPhone,
        receipt_file: '',
        plan_type: selectedPlanId ? 'premium' : 'basic',
        selected_plan_id: selectedPlanId || null,
        selected_course_id: selectedRegCourseId || null,
        special_details: selectedRegCourseId === 'special' ? specialDetails : null
      } as any);

      setRegSuccess(true);
      // Auto switch to login with prefilled email
      setTimeout(() => {
        setLoginEmail(regEmail);
        setAuthTab('login');
        setRegSuccess(false);
        // Clear forms
        setRegFullName('');
        setRegEmail('');
        setRegPassword('');
        setRegPhone('');
        setSelectedRegCourseId('');
        setSpecialDetails('');
      }, 3500);
    } catch (err: any) {
      setRegError(err?.message || 'فشل إنشاء الحساب، يرجى المحاولة لاحقاً.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-[#cbd5e1] font-sans antialiased overflow-x-hidden selection:bg-brand-primary selection:text-white relative">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] left-[-10%] w-[600px] h-[600px] rounded-full bg-brand-secondary/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#090b10]/80 border-b border-[#1b1f2d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between flex-row-reverse">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-secondary to-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <h1 className="text-lg font-black text-white leading-tight">بلاك بورد الأكاديمي</h1>
              <span className="text-xs font-semibold text-brand-primary tracking-widest uppercase">Smart LMS Platform</span>
            </div>
          </div>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium flex-row-reverse">
            <a href="#features" className="text-slate-400 hover:text-white transition">المميزات</a>
            <a href="#stats" className="text-slate-400 hover:text-white transition">إحصائيات المنصة</a>
            <a href="#pricing" className="text-slate-400 hover:text-white transition">خطط الاشتراك</a>
            <a href="#faq" className="text-slate-400 hover:text-white transition">الأسئلة الشائعة</a>
          </nav>

          {/* Auth Button */}
          <div className="flex items-center gap-3">
            <a 
              href="/"
              className="px-4 py-2.5 rounded-xl bg-[#131622] hover:bg-[#181d31] border border-[#22273b] hover:border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>🏠 العودة للبوابة الرئيسية</span>
            </a>
            <button 
              onClick={() => handleOpenAuth('login', 'student')}
              className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              تسجيل الدخول
            </button>
            <button 
              onClick={() => handleOpenAuth('register', 'student')}
              className="hidden sm:block px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-sm font-bold text-white shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/35 transition-all cursor-pointer"
            >
              اشترك الآن
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row-reverse items-center justify-between gap-12">
          {/* Hero Content */}
          <div className="w-full lg:w-1/2 text-right space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-current animate-pulse" />
              <span>الإصدار الأكاديمي المطور - Blackboard Ultra</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
              {siteConfig?.welcomeTitle || 'مستقبل التعليم الأكاديمي المطور'}
            </h2>
            <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-xl ml-auto">
              {siteConfig?.welcomeDesc || 'منصة رقمية متكاملة تمنح الطلاب والأساتذة بيئة تعليمية تفاعلية لإدارة المحاضرات، حل الواجبات، أداء الاختبارات المحوسبة، والتواصل الفوري بهوية بصرية رائعة.'}
            </p>
            <div className="pt-4 flex flex-wrap gap-4 justify-start flex-row-reverse">
              <button 
                onClick={() => handleOpenAuth('register', 'student')}
                className="px-8 py-4 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-base font-bold text-white shadow-xl shadow-brand-primary/30 hover:scale-[1.02] transition-all cursor-pointer"
              >
                ابدأ رحلتك التعليمية مجاناً
              </button>
              <a 
                href="#features"
                className="px-8 py-4 rounded-xl bg-[#131622] border border-[#22273b] hover:bg-[#181d31] hover:border-slate-700 text-base font-bold text-white transition-all cursor-pointer flex items-center gap-2"
              >
                <span>استكشف المميزات</span>
                <ArrowLeft className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Hero Interactive Widget */}
          <div className="w-full lg:w-1/2 flex justify-center">
            <div className="relative w-full max-w-lg glass-card border border-[#202537] bg-[#0e111a]/80 p-6 rounded-3xl shadow-2xl relative overflow-hidden group">
              {/* Decorative top bars */}
              <div className="flex items-center gap-2 mb-6 flex-row-reverse">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-500 mr-2 font-mono">lms.blackboard-ultra.edu</span>
              </div>
              
              <div className="space-y-4 text-right">
                <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-between flex-row-reverse">
                  <div className="flex items-center gap-3 flex-row-reverse">
                    <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center text-cyan-400">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">مقرر مقدمة في البرمجة</h4>
                      <p className="text-xs text-slate-500">الأستاذ: د. عبد الله محمد</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-cyan-400/10 text-cyan-400 text-xs font-bold">نشط</span>
                </div>

                <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-between flex-row-reverse">
                  <div className="flex items-center gap-3 flex-row-reverse">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-400">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">الاختبار القصير الأول (أساسيات)</h4>
                      <p className="text-xs text-slate-500">ينتهي غداً الساعة 11:59م</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-400 text-xs font-bold">30 دقيقة</span>
                </div>

                <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-between flex-row-reverse">
                  <div className="flex items-center gap-3 flex-row-reverse">
                    <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center text-emerald-400">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">تم رصد حضور اليوم بنجاح</h4>
                      <p className="text-xs text-slate-500">حالة الحضور: حاضر</p>
                    </div>
                  </div>
                  <span className="text-emerald-400 text-xs font-bold">100% حضور</span>
                </div>

                {/* Quick Register Trigger */}
                <div className="pt-2 text-center">
                  <button 
                    onClick={() => handleOpenAuth('register', 'student')}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-secondary to-brand-primary text-sm font-bold text-white hover:shadow-lg hover:scale-[1.01] transition-all cursor-pointer"
                  >
                    سجل حسابك التجريبي الآن واكتشف المزيد
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Statistics Section */}
      <section id="stats" className="py-16 bg-[#07090d]/60 border-y border-[#181c29]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {(siteConfig?.stats || [
              { label: 'طالب نشط', value: '+15,000' },
              { label: 'مقرر دراسي رقمي', value: '480+' },
              { label: 'نسبة الرضا والنجاح', value: '99.8%' },
              { label: 'شريك أكاديمي معتمد', value: '50+' }
            ]).map((stat: any, idx: number) => {
              const IconComp = getIcon(idx);
              const colorClass = getIconColor(idx);
              return (
                <div key={idx} className="p-6 bg-[#0f121d] rounded-2xl border border-[#1d2235] text-center flex flex-col items-center gap-3 hover:-translate-y-1 transition-all">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white font-mono">{stat.value}</h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h3 className="text-brand-primary font-bold text-sm uppercase tracking-widest">مميزات المنصة الأكاديمية</h3>
          <h2 className="text-3xl sm:text-4xl font-black text-white">كل ما تحتاجه لتجربة تعليم إلكتروني استثنائية</h2>
          <p className="text-slate-400 text-sm sm:text-base">
            تم تصميم نظام بلاك بورد المطور ليغطي كافة جوانب العملية الأكاديمية ويوفر أدوات قوية وسلسة للمعلمين والطلاب على حد سواء.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {(siteConfig?.features || features).map((f: any, idx: number) => {
            const fallbackFeat = features[idx] || features[0];
            const IconComp = fallbackFeat.icon;
            const borderClass = fallbackFeat.border;
            return (
              <div key={idx} className={`p-8 bg-[#0c0f18]/80 rounded-3xl border border-[#1b2031] text-right space-y-4 hover:-translate-y-1.5 transition-all duration-300 ${borderClass}`}>
                <div className="w-12 h-12 rounded-2xl bg-[#141927] border border-[#20273c] flex items-center justify-center text-brand-primary mr-auto lg:mr-0 ml-auto">
                  <IconComp className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-black text-white">{f.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Subscription Plans Section */}
      <section id="pricing" className="py-24 bg-[#07090d]/80 border-t border-[#181c29]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <h3 className="text-brand-primary font-bold text-sm uppercase tracking-widest">خطط الاشتراك والعضويات</h3>
            <h2 className="text-3xl sm:text-4xl font-black text-white">طرق مرنة للاشتراك والتعلم</h2>
            <p className="text-slate-400 text-sm sm:text-base">
              اختر خطة الاشتراك المناسبة لك للوصول إلى كافة المقررات والخدمات، أو اشترك في مقرر دراسي منفرد حسب احتياجك.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex justify-center mb-12">
            <div className="grid grid-cols-2 p-1 bg-[#0c0f18] border border-[#1b2031] rounded-2xl max-w-md w-full">
              <button
                onClick={() => setPricingTab('plans')}
                className={`py-3 px-6 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  pricingTab === 'plans' 
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                باقات العضوية الشاملة
              </button>
              <button
                onClick={() => setPricingTab('courses')}
                className={`py-3 px-6 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  pricingTab === 'courses' 
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                المقررات الدراسية المنفردة
              </button>
            </div>
          </div>

          {/* Tab Content: Plans */}
          {pricingTab === 'plans' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
              {subscriptionPlans.map(plan => (
                <div 
                  key={plan.id} 
                  className="p-8 rounded-3xl border border-slate-800 bg-[#0d101a]/70 hover:border-brand-primary/45 text-white flex flex-col justify-between text-right relative hover:scale-[1.02] transition-all shadow-xl group"
                >
                  <div className="space-y-6">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <h4 className="text-xl font-black text-white leading-snug">{plan.name}</h4>
                    </div>

                    <div className="flex items-baseline justify-start gap-1 flex-row-reverse border-b border-[#1c2235] pb-4">
                      <span className="text-3xl font-black text-emerald-400 font-mono">
                        {plan.price}
                      </span>
                      <span className="text-xs text-slate-500">ر.س / {plan.billing_cycle}</span>
                    </div>

                    <ul className="space-y-3.5 text-xs text-slate-300">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2 flex-row-reverse justify-start">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-8">
                    <button 
                      onClick={() => handleOpenAuth('register', undefined, plan.id)}
                      className="w-full py-3.5 rounded-xl bg-brand-primary text-white hover:bg-brand-primary/95 shadow-lg shadow-brand-primary/20 font-bold text-xs transition-all cursor-pointer"
                    >
                      اشترك الآن كطالب
                    </button>
                  </div>
                </div>
              ))}
              {subscriptionPlans.length === 0 && (
                <p className="col-span-3 text-center text-slate-500 py-12 text-sm">لا توجد باقات اشتراك مضافة حالياً.</p>
              )}
            </div>
          )}

          {/* Tab Content: Courses */}
          {pricingTab === 'courses' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
              {courses.map((course) => (
                <div 
                  key={course.id} 
                  className="p-6 rounded-3xl border border-slate-800 bg-[#0d101a]/70 hover:border-brand-primary/40 text-white flex flex-col justify-between text-right relative hover:scale-[1.02] transition-all shadow-xl"
                >
                  <div className="space-y-6">
                    <div>
                      <span className="bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider font-mono">
                        {course.code}
                      </span>
                      <h4 className="text-lg font-black text-white mt-3 leading-snug">{course.title}</h4>
                      <p className="text-xs text-slate-400 mt-2 min-h-[48px] leading-relaxed">{course.description || 'لا يوجد وصف مضاف لهذا المسار حالياً'}</p>
                    </div>

                    <div className="flex items-baseline justify-start gap-1 flex-row-reverse border-b border-[#1c2235] pb-4">
                      <span className="text-2xl font-black text-brand-primary">
                        {course.price !== undefined ? `${course.price} ر.س` : '0 ر.س'}
                      </span>
                      <span className="text-[10px] text-slate-500">رسوم الاشتراك بالمسار</span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-300">
                      <li className="flex items-center gap-2 flex-row-reverse justify-start">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>الوصول للمواد والملفات العلمية</span>
                      </li>
                      <li className="flex items-center gap-2 flex-row-reverse justify-start">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>تقديم الواجبات واجتياز الاختبارات</span>
                      </li>
                      <li className="flex items-center gap-2 flex-row-reverse justify-start">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>محادثة الأساتذة والمشاركة الحية</span>
                      </li>
                      <li className="flex items-center gap-2 flex-row-reverse justify-start">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>شهادة إنجاز ووثيقة تفوق أكاديمي</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6">
                    <button 
                      onClick={() => handleOpenAuth('register', course.id)}
                      className="w-full py-3 rounded-xl bg-brand-primary text-white hover:bg-brand-primary/95 shadow-md shadow-brand-primary/20 font-bold text-xs transition-all cursor-pointer"
                    >
                      اشترك الآن كطالب
                    </button>
                  </div>
                </div>
              ))}

              {/* Special request registration card */}
              <div className="p-6 rounded-3xl border border-dashed border-purple-500/50 bg-[#0f1322]/80 text-white flex flex-col justify-between text-right relative hover:scale-[1.02] transition-all shadow-xl">
                <div className="space-y-6">
                  <div>
                    <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider font-mono">
                      طلب مخصص
                    </span>
                    <h4 className="text-lg font-black text-white mt-3 leading-snug">طلب تسجيل خاص / درس معين</h4>
                    <p className="text-xs text-slate-400 mt-2 min-h-[48px] leading-relaxed">أترغب في دراسة أو تقوية موضوع خاص غير مدرج في المقررات؟ قدم طلب مخصص ليقوم المدير بمراجعته وتحديد السعر.</p>
                  </div>

                  <div className="flex items-baseline justify-start gap-1 flex-row-reverse border-b border-[#1c2235] pb-4">
                    <span className="text-2xl font-black text-purple-400">يحدد لاحقاً</span>
                    <span className="text-[10px] text-slate-500">حسب تفاصيل طلبك</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2 flex-row-reverse justify-start">
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>تحديد الموضوع والدرس المطلوب بدقة</span>
                    </li>
                    <li className="flex items-center gap-2 flex-row-reverse justify-start">
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>تحديد السعر والموافقة من الإدارة لاحقاً</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6">
                  <button 
                    onClick={() => handleOpenAuth('register', 'special')}
                    className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-950/20 font-bold text-xs transition-all cursor-pointer"
                  >
                    تقديم طلب مخصص
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faq" className="py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <h3 className="text-brand-primary font-bold text-sm uppercase tracking-widest">الأسئلة الشائعة</h3>
          <h2 className="text-3xl font-black text-white">هل لديك أي استفسارات؟</h2>
        </div>

        <div className="space-y-4">
          {[
            { q: 'هل يمكنني تسجيل حساب كطالب واستخدام المنصة مجاناً؟', a: 'نعم، المنصة مجانية بالكامل للطلاب. يمكنك التسجيل والوصول لجميع المحاضرات، حل الواجبات، وتقديم الاختبارات وإصدار الشهادات الأكاديمية مجاناً وبدون أي تكاليف.' },
            { q: 'كيف يعمل التخزين في المنصة بعد إلغاء Supabase؟', a: 'يتم حفظ جميع بياناتك ومحاضراتك وإجاباتك محلياً على جهازك باستخدام LocalStorage. هذا يعني أن المنصة تعمل فوراً دون الحاجة لقاعدة بيانات سحابية وتمنحك خصوصية وسرعة فائقة.' },
            { q: 'هل يدعم نظام الاختبارات حد وقت معين؟', a: 'نعم، يحتوي نظام الاختبارات على محرك توقيت ذكي (Countdown Timer). يبدأ الوقت فور بدء الطالب، ويتم سحب ورقة الاختبار وحفظ الإجابات تلقائياً فور انتهاء المهلة المحددة.' },
            { q: 'هل يمكن إصدار شهادات النجاح وطباعتها؟', a: 'بالتأكيد، بمجرد اجتياز الطالب للمقرر وحصوله على درجات النجاح، يتم توليد شهادة تفوق أكاديمية رقمية معتمدة برمز خاص بها، ويمكن طباعتها مباشرة أو حفظها كملف PDF.' }
          ].map((item, idx) => (
            <div key={idx} className="p-6 bg-[#0c0f18]/80 rounded-2xl border border-[#1b2031] text-right space-y-2">
              <h4 className="text-base font-bold text-white">{item.q}</h4>
              <p className="text-sm text-slate-400 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#05060a] border-t border-[#141824] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex justify-center items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-secondary to-brand-primary flex items-center justify-center text-white">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="font-black text-white text-base">بلاك بورد الأكاديمي</span>
          </div>
          <p className="text-xs text-slate-500">
            جميع الحقوق محفوظة © {new Date().getFullYear()} - منصة التعليم الإلكتروني الذكية
          </p>
        </div>
      </footer>

      {/* Unified Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg glass-card border border-[#212739] bg-[#0c0e18] p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
            {/* Close Button */}
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute left-4 top-4 p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-secondary to-brand-primary flex items-center justify-center shadow-xl shadow-brand-primary/25 mx-auto mb-3">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white">
                {authTab === 'login' ? 'تسجيل الدخول للمنصة' : 'إنشاء حساب جديد / اشتراك'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {authTab === 'login' ? 'أهلاً بك مجدداً! يرجى إدخال بياناتك للدخول' : 'انضم إلينا اليوم وابدأ تجربة تعليمية رائدة'}
              </p>
            </div>

            {/* Tab Selector */}
            <div className="grid grid-cols-2 p-1 bg-slate-900/60 rounded-xl border border-slate-800">
              <button
                onClick={() => setAuthTab('register')}
                className={`py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  authTab === 'register' ? 'bg-brand-primary text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                إنشاء حساب جديد
              </button>
              <button
                onClick={() => setAuthTab('login')}
                className={`py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  authTab === 'login' ? 'bg-brand-primary text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                تسجيل الدخول
              </button>
            </div>

            {/* ERROR / SUCCESS ALERTS */}
            {authTab === 'login' && loginError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3.5 rounded-xl flex items-center gap-3 text-sm text-right flex-row-reverse">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}
            {authTab === 'register' && regError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3.5 rounded-xl flex items-center gap-3 text-sm text-right flex-row-reverse">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{regError}</span>
              </div>
            )}
            {authTab === 'register' && regSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-xl flex items-center gap-3 text-sm text-right flex-row-reverse">
                <CheckCircle className="w-5 h-5 shrink-0 animate-bounce" />
                <span>تم إرسال طلب تسجيل حسابك بنجاح! الطلب الآن قيد المراجعة والموافقة من قبل الإدارة وسنتحقق منه فوراً.</span>
              </div>
            )}

            {/* TAB CONTENT: LOGIN */}
            {authTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4 text-right">

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      placeholder="example@lms.com"
                      className="w-full bg-[#121522] border border-[#21263d] rounded-xl pr-10 pl-4 py-3 text-white focus:outline-none focus:border-brand-primary text-right font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">كلمة المرور</label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                    <input
                      type={loginShowPass ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#121522] border border-[#21263d] rounded-xl pr-10 pl-10 py-3 text-white focus:outline-none focus:border-brand-primary text-right"
                    />
                    <button
                      type="button"
                      onClick={() => setLoginShowPass(v => !v)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {loginShowPass ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3.5 mt-2 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-sm shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loginLoading ? (
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    'دخول إلى المنصة'
                  )}
                </button>
              </form>
            )}

            {/* TAB CONTENT: REGISTER */}
            {authTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4 text-right max-h-[60vh] overflow-y-auto pr-1">
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">باقة الاشتراك المطلوبة</label>
                  <select
                    value={selectedPlanId}
                    onChange={e => setSelectedPlanId(e.target.value)}
                    className="w-full bg-[#121522] border border-[#21263d] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary text-right"
                  >
                    <option value="">-- بدون باقة (شراء مقرر فردي فقط) --</option>
                    {subscriptionPlans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} ({plan.price} ر.س / {plan.billing_cycle})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">المقرر الدراسي المراد الاشتراك فيه</label>
                  <select
                    value={selectedRegCourseId}
                    onChange={e => setSelectedRegCourseId(e.target.value)}
                    className="w-full bg-[#121522] border border-[#21263d] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary text-right"
                  >
                    <option value="">-- اختر مقرراً دراسياً للاشتراك (اختياري) --</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.title} ({course.code}) - {course.price !== undefined ? `${course.price} ر.س` : 'مجاني'}
                      </option>
                    ))}
                    <option value="special">-- طلب تسجيل خاص / موضوع مخصص (درس معين) --</option>
                  </select>
                </div>

                {selectedRegCourseId === 'special' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-purple-400">تفاصيل الموضوع أو الدرس المطلوب تقويتك فيه *</label>
                    <textarea
                      required
                      value={specialDetails}
                      onChange={e => setSpecialDetails(e.target.value)}
                      rows={3}
                      placeholder="مثال: أريد تقوية في البرمجة الكائنية OOP أو القواعد الإملائية الإنجليزية..."
                      className="w-full bg-[#121522] border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 text-right resize-none text-xs"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">الاسم الكامل</label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={e => setRegFullName(e.target.value)}
                    placeholder="مثال: أحمد عبد الله العتيبي"
                    className="w-full bg-[#121522] border border-[#21263d] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary text-right"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">البريد الإلكتروني</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#121522] border border-[#21263d] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary text-right font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">رقم الهاتف (اختياري)</label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="0500000000"
                    className="w-full bg-[#121522] border border-[#21263d] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary text-right font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">كلمة المرور</label>
                  <div className="relative">
                    <input
                      type={regShowPass ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#121522] border border-[#21263d] rounded-xl pr-4 pl-10 py-3 text-white focus:outline-none focus:border-brand-primary text-right"
                    />
                    <button
                      type="button"
                      onClick={() => setRegShowPass(v => !v)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {regShowPass ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                {/* Simulated payment detail plan card */}
                <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 text-right flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between flex-row-reverse">
                    <span className="text-slate-400">نوع الحساب:</span>
                    <span className="font-bold text-brand-primary">حساب طالب جامعي (Student)</span>
                  </div>
                  {selectedPlanId && (
                    <div className="flex items-center justify-between flex-row-reverse">
                      <span className="text-slate-400">رسوم العضوية للباقة:</span>
                      <span className="font-bold text-emerald-400">
                        {subscriptionPlans.find(p => p.id === selectedPlanId)?.price || 0} ر.س / {subscriptionPlans.find(p => p.id === selectedPlanId)?.billing_cycle}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between flex-row-reverse">
                    <span className="text-slate-400">تكلفة الاشتراك للمقرر:</span>
                    <span className="font-bold text-emerald-400">
                      {selectedRegCourseId === 'special' ? 'يحدد السعر لاحقاً من قبل المدير' :
                       selectedRegCourseId ? `${courses.find(c => c.id === selectedRegCourseId)?.price || 0} ر.س` :
                       '0 ر.س'}
                    </span>
                  </div>
                  {(selectedRegCourseId || selectedPlanId) && (
                    <div className="flex items-center justify-between flex-row-reverse pt-2 border-t border-slate-800">
                      <span className="text-slate-400">الاشتراك المختار:</span>
                      <span className="font-bold text-white">
                        {selectedPlanId ? subscriptionPlans.find(p => p.id === selectedPlanId)?.name : ''}
                        {selectedPlanId && selectedRegCourseId ? ' + ' : ''}
                        {selectedRegCourseId === 'special' ? 'طلب تسجيل خاص' :
                         (courses.find(c => c.id === selectedRegCourseId)?.title || '')}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-3.5 mt-2 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-sm shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {regLoading ? (
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    'إنشاء الحساب والاشتراك الآن'
                  )}
                </button>
              </form>
            )}

            <p className="text-center text-[10px] text-slate-500 border-t border-slate-900 pt-3">
              بالتسجيل في المنصة الأكاديمية، فإنك توافق على شروط الخدمة وسياسة الخصوصية الخاصة بنا.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
