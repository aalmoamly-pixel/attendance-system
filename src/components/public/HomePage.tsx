import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  ClipboardList, 
  Users, 
  Award, 
  ShieldCheck, 
  School, 
  LogIn,
  Check,
  HelpCircle,
  Sparkles,
  CreditCard,
  X,
  Upload,
  AlertCircle,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import PublicLayout from './PublicLayout';
import { lmsDb, type LMSSubscriptionPlan } from '../../lib/lms_supabase';
import { useCMS } from '../../contexts/CMSContext';
import { db } from '../../lib/supabase';

export default function HomePage() {
  const { cmsData } = useCMS();
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<LMSSubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Pricing tab state
  const [pricingTab, setPricingTab] = useState<'lms' | 'attendance'>('lms');

  // Attendance Subscription Modal States
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | null>(null);
  const [selectedPlanName, setSelectedPlanName] = useState('');
  
  // Attendance Form fields
  const [fullName, setFullName] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptFileName, setReceiptFileName] = useState('');
  
  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [config, plans] = await Promise.all([
          lmsDb.getSiteConfig(),
          lmsDb.getSubscriptionPlans()
        ]);
        setSiteConfig(config);
        setSubscriptionPlans(plans);
      } catch (err) {
        console.error('[HomePage] Error loading CMS data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Helper to resolve icon components dynamically
  const getIconComponent = (idx: number) => {
    switch (idx % 6) {
      case 0: return BookOpen;
      case 1: return ClipboardList;
      case 2: return Award;
      case 3: return Users;
      case 4: return ShieldCheck;
      default: return School;
    }
  };

  const getIconColor = (idx: number) => {
    switch (idx % 4) {
      case 0: return 'text-cyan-400 bg-cyan-400/10 border-cyan-500/20';
      case 1: return 'text-purple-400 bg-purple-400/10 border-purple-500/20';
      case 2: return 'text-amber-400 bg-amber-400/10 border-amber-500/20';
      default: return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
    }
  };

  const handleOpenSubscribeAttendance = (plan: any) => {
    let planType: 'basic' | 'premium' = 'basic';
    if (plan.id === 2 || plan.price === '599') {
      planType = 'premium';
    }
    setSelectedPlan(planType);
    setSelectedPlanName(plan.name);
    
    // Reset form
    setFullName('');
    setUniversityName('');
    setUsername('');
    setPassword('');
    setPhone('');
    setReceiptFile(null);
    setReceiptFileName('');
    setErrorMsg('');
    setSuccess(false);
    
    setAttendanceModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      alert("حجم الملف يجب ألا يتجاوز 10 ميجابايت");
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert("الملفات المسموح بها هي صور JPG/PNG أو ملفات PDF فقط");
      return;
    }
    
    setReceiptFile(file);
    setReceiptFileName(file.name);
  };

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile) {
      setErrorMsg("يرجى إرفاق إيصال الدفع");
      return;
    }
    setSubmitting(true);
    setErrorMsg('');

    try {
      const receiptUrl = await db.uploadReceipt(receiptFile);
      await db.createNewCustomer({
        full_name: fullName,
        university_name: universityName,
        username,
        password,
        phone,
        plan_type: selectedPlan as any,
        receipt_file: receiptUrl,
      });
      setSuccess(true);
    } catch (err: any) {
      console.error('[HomePage] Submit error:', err);
      setErrorMsg(`حدث خطأ أثناء إرسال الطلب: ${err?.message || 'يرجى المحاولة مرة أخرى'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !siteConfig) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full" />
        </div>
      </PublicLayout>
    );
  }

  // WhatsApp helper
  const whatsappNumber = cmsData?.contact?.whatsapp?.replace(/\D/g, '') || '966501234567';
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`مرحباً إدارة المنصة، أرغب في الحصول على بيانات التحويل والحساب البنكي للاشتراك في (${selectedPlanName || 'الخطة'}).`)}`;

  // ================= RENDER SECTIONS =================

  // 1. Hero Section
  const renderHero = () => (
    <section key="hero" id="hero" className="text-center py-20 lg:py-32 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-10 left-10 w-[300px] h-[300px] rounded-full bg-brand-secondary/5 blur-[100px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 border border-brand-primary/30 text-brand-primary text-xs font-black uppercase tracking-wider mx-auto">
          {siteConfig.logoUrl ? (
            <img src={siteConfig.logoUrl} alt="Logo" className="w-4 h-4 object-contain" />
          ) : (
            <School className="w-4 h-4" />
          )}
          <span>{siteConfig.platformName}</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight font-sans">
          {siteConfig.welcomeTitle}
        </h1>
        <p className="text-lg md:text-xl text-dark-muted max-w-4xl mx-auto leading-relaxed">
          {siteConfig.welcomeDesc}
        </p>
        
        {/* Portal Entry Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          {siteConfig.heroButtons?.map((btn: any, idx: number) => (
            <Link
              key={idx}
              to={btn.href}
              className={`w-full sm:w-auto text-base px-8 py-4 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all cursor-pointer rounded-xl font-bold ${
                btn.isPrimary 
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25 hover:bg-brand-primary/95' 
                  : 'bg-slate-900 border border-brand-primary/50 text-brand-primary hover:bg-brand-primary/10'
              }`}
            >
              {btn.href.includes('lms') ? <BookOpen className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
              <span>{btn.label}</span>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Banner/Preview Image */}
      {siteConfig.bannerImage && (
        <div className="mt-16 max-w-[1350px] mx-auto px-4 relative z-10">
          <div className="rounded-3xl border border-dark-border/80 p-2 bg-[#0c0f18]/60 backdrop-blur-md shadow-2xl shadow-brand-primary/5">
            <img 
              src={siteConfig.bannerImage} 
              alt="Platform Dashboard Preview" 
              className="w-full h-auto rounded-2xl object-cover border border-dark-border/40 shadow-inner max-h-[650px]" 
            />
          </div>
        </div>
      )}
    </section>
  );

  // 2. Services / Portals Section
  const renderServices = () => (
    <section key="services" id="services" className="py-20 border-t border-dark-border/60">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <h3 className="text-brand-primary font-bold text-sm uppercase tracking-widest">بوابات المنصة الأساسية</h3>
        <h2 className="text-3xl md:text-4xl font-black text-white">الولوج للأنظمة التعليمية</h2>
        <p className="text-dark-muted text-sm md:text-base">
          اختر البوابة التعليمية المناسبة لبدء مهامك. نوفر نظامين متكاملين لتلبية متطلباتك الأكاديمية.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-[1450px] mx-auto items-stretch">
        {/* Attendance Portal Card */}
        {siteConfig.portals?.attendance && (
          <div className="glass-card p-8 hover:border-brand-primary/50 transition-all duration-300 flex flex-col justify-between text-right group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 blur-3xl pointer-events-none rounded-full" />
            <div className="space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
                <ClipboardList className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-white">{siteConfig.portals.attendance.name}</h3>
              <p className="text-sm text-dark-muted leading-relaxed">
                {siteConfig.portals.attendance.desc}
              </p>
              
              {/* Features List */}
              <div className="space-y-3 pt-2 border-t border-dark-border/40">
                {(siteConfig.attendanceFeatures || []).map((feat: any, i: number) => (
                  <div key={i} className="flex items-center gap-2.5 flex-row-reverse text-right text-xs text-dark-muted">
                    <Check className="w-4 h-4 text-brand-primary shrink-0" />
                    <span>{feat.title}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-8">
              <Link 
                to={siteConfig.portals.attendance.link} 
                className="w-full py-3.5 rounded-xl bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/40 text-brand-primary font-bold text-sm text-center block transition-all hover:scale-[1.01]"
              >
                دخول {siteConfig.portals.attendance.name}
              </Link>
            </div>
          </div>
        )}

        {/* LMS Portal Card */}
        {siteConfig.portals?.lms && (
          <div className="glass-card p-8 hover:border-brand-secondary/50 transition-all duration-300 flex flex-col justify-between text-right group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-secondary/5 blur-3xl pointer-events-none rounded-full" />
            <div className="space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-brand-secondary/10 border border-brand-secondary/20 flex items-center justify-center text-brand-secondary group-hover:scale-110 transition-transform">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-white">{siteConfig.portals.lms.name}</h3>
              <p className="text-sm text-dark-muted leading-relaxed">
                {siteConfig.portals.lms.desc}
              </p>
              
              {/* Features List */}
              <div className="space-y-3 pt-2 border-t border-dark-border/40">
                {(siteConfig.lmsFeatures || []).map((feat: any, i: number) => (
                  <div key={i} className="flex items-center gap-2.5 flex-row-reverse text-right text-xs text-dark-muted">
                    <Check className="w-4 h-4 text-brand-secondary shrink-0" />
                    <span>{feat.title}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-8">
              <Link 
                to={siteConfig.portals.lms.link} 
                className="w-full py-3.5 rounded-xl bg-brand-primary text-white hover:bg-brand-primary/95 font-bold text-sm text-center block transition-all hover:scale-[1.01] shadow-lg shadow-brand-primary/20"
              >
                دخول {siteConfig.portals.lms.name}
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );

  // 3. Statistics Section
  const renderStats = () => (
    <section key="stats" id="stats" className="py-20 border-t border-dark-border/60 bg-gradient-to-b from-transparent to-brand-primary/5">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {(siteConfig.stats || []).map((stat: any, idx: number) => {
            const colors = getIconColor(idx);
            return (
              <div key={idx} className="p-8 md:p-10 glass-card text-center flex flex-col items-center gap-4 hover:-translate-y-1.5 transition-all duration-300 shadow-xl border-dark-border/40">
                <h3 className={`text-4xl md:text-5xl font-black bg-gradient-to-r ${colors.includes('cyan') ? 'from-cyan-400 to-blue-500' : colors.includes('purple') ? 'from-purple-500 to-pink-500' : colors.includes('amber') ? 'from-amber-400 to-orange-500' : 'from-emerald-400 to-teal-500'} bg-clip-text text-transparent font-mono`}>
                  {stat.value}
                </h3>
                <p className="text-xs md:text-sm text-dark-muted font-bold">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );

  // 4. Unified Auto-Role Login Info Section (With dynamic text configuration)
  const renderUnifiedLogin = () => (
    <section key="unified-login" id="unified-login" className="py-20 border-t border-dark-border/60 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-brand-secondary/5 blur-[100px] pointer-events-none" />
      
      <div className="max-w-5xl mx-auto px-4 text-center space-y-8 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary mx-auto">
          <LogIn className="w-8 h-8" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-black text-white">{siteConfig.unifiedLoginTitle || 'بوابة دخول موحدة وذكية'}</h2>
          <p className="text-dark-muted text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            {siteConfig.unifiedLoginDesc || 'سواء كنت طالباً، معلماً، أو مديراً للنظام، بوابتنا الذكية تتعرف على هويتك وصلاحياتك وتوجهك إلى لوحة التحكم الخاصة بك تلقائياً عند تسجيل الدخول دون الحاجة لتحديد دورك مسبقاً.'}
          </p>
        </div>

        <div className="p-8 md:p-12 rounded-3xl border border-dark-border/60 bg-[#0d101a]/70 max-w-3xl mx-auto space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/60 text-center">
              <span className="text-cyan-400 font-bold text-sm block mb-1">حساب الطالب</span>
              <span className="text-slate-500 text-xs">تحضير ومقررات واختبارات</span>
            </div>
            <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/60 text-center">
              <span className="text-purple-400 font-bold text-sm block mb-1">حساب المعلم</span>
              <span className="text-slate-500 text-xs">رصد الحضور وإدارة الدرجات</span>
            </div>
            <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/60 text-center">
              <span className="text-emerald-400 font-bold text-sm block mb-1">حساب الإدارة</span>
              <span className="text-slate-500 text-xs">إشراف عام وتحكم بالمحتوى</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/login"
              className="px-8 py-3.5 rounded-xl bg-brand-primary text-white hover:bg-brand-primary/95 font-bold text-sm text-center shadow-lg shadow-brand-primary/25 hover:scale-[1.01] transition-all"
            >
              {siteConfig.unifiedLoginBtnAttendance || 'تسجيل الدخول الموحد (نظام التحضير)'}
            </Link>
            <Link 
              to="/lms"
              className="px-8 py-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold text-sm text-center hover:bg-slate-800 transition-all"
            >
              {siteConfig.unifiedLoginBtnLms || 'تسجيل الدخول الموحد (منصة LMS)'}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );

  // 5. Features Section
  const renderFeatures = () => (
    <section key="features" id="features" className="py-24 max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8 border-t border-dark-border/60">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <h3 className="text-brand-primary font-bold text-sm uppercase tracking-widest">مميزات المنصة التعليمية</h3>
        <h2 className="text-3xl sm:text-4xl font-black text-white">كل ما تحتاجه لتجربة تعليم إلكتروني استثنائية</h2>
        <p className="text-slate-400 text-sm sm:text-base">
          تم تصميم أنظمتنا المتكاملة لتغطية كافة جوانب العملية الأكاديمية وتقديم أدوات قوية وسلسة للمعلمين والطلاب.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
        {(siteConfig.platformFeatures || []).map((f: any, idx: number) => {
          const IconComp = getIconComponent(idx);
          const colors = getIconColor(idx);
          return (
            <div key={idx} className="p-10 bg-[#0c0f18]/80 rounded-3xl border border-[#1b2031] text-right space-y-5 hover:-translate-y-2 transition-all duration-300 hover:border-brand-primary/40 shadow-xl">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-auto lg:mr-0 ml-auto border ${colors}`}>
                <IconComp className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-white">{f.title}</h4>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );

  // 6. Pricing / Plans Section with both Attendance and LMS tabs
  const renderPricing = () => (
    <section key="pricing" id="pricing" className="py-24 bg-[#07090d]/80 border-t border-[#181c29]">
      <div className="max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <h3 className="text-brand-primary font-bold text-sm uppercase tracking-widest">خطط الاشتراك والعضويات</h3>
          <h2 className="text-3xl sm:text-4xl font-black text-white">طرق مرنة للاشتراك والتعلم</h2>
          <p className="text-slate-400 text-sm sm:text-base">
            اختر الخطة المناسبة للاشتراك في منصة التحضير الأكاديمي أو باقات التعلم الإلكتروني LMS.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex justify-center mb-12">
          <div className="grid grid-cols-2 p-1 bg-[#0c0f18] border border-[#1b2031] rounded-2xl max-w-md w-full" dir="rtl">
            <button
              onClick={() => setPricingTab('lms')}
              className={`py-3 px-6 rounded-xl text-xs font-black transition-all cursor-pointer ${
                pricingTab === 'lms' 
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              باقات منصة التعلم LMS
            </button>
            <button
              onClick={() => setPricingTab('attendance')}
              className={`py-3 px-6 rounded-xl text-xs font-black transition-all cursor-pointer ${
                pricingTab === 'attendance' 
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              اشتراك نظام التحضير الأكاديمي
            </button>
          </div>
        </div>

        {/* Tab Content: LMS Plans */}
        {pricingTab === 'lms' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 max-w-[1400px] mx-auto items-stretch">
            {subscriptionPlans.filter(p => p.visible !== false).map(plan => (
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
                  <Link 
                    to="/lms"
                    className="w-full py-3.5 rounded-xl bg-brand-primary text-white hover:bg-brand-primary/95 shadow-lg shadow-brand-primary/20 font-bold text-xs text-center block transition-all cursor-pointer"
                  >
                    اشترك الآن عبر منصة LMS
                  </Link>
                </div>
              </div>
            ))}
            {subscriptionPlans.length === 0 && (
              <p className="col-span-3 text-center text-slate-500 py-12 text-sm">لا توجد باقات اشتراك معروضة حالياً.</p>
            )}
          </div>
        )}

        {/* Tab Content: Attendance Plans (Restoring the original subscription system) */}
        {pricingTab === 'attendance' && cmsData?.pricing?.plans && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 max-w-[1400px] mx-auto items-stretch" dir="rtl">
            {cmsData.pricing.plans.map((plan) => (
              <div 
                key={plan.id} 
                className={`glass-card p-8 rounded-3xl border border-slate-800 bg-[#0d101a]/70 hover:border-brand-primary/40 text-white flex flex-col justify-between text-right relative hover:scale-[1.02] transition-all shadow-xl ${
                  plan.popular ? 'border-brand-primary shadow-xl shadow-brand-primary/10 scale-[1.02]' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-6 py-1 rounded-full text-xs font-bold">
                    الأكثر شيوعاً
                  </div>
                )}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-start gap-1 flex-row-reverse pb-4 border-b border-[#1c2235]">
                      <span className="text-3xl font-black text-brand-primary font-mono">{plan.price}</span>
                      <span className="text-xs text-slate-500">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3 flex-row-reverse justify-start">
                        <Check className="w-5 h-5 text-brand-success flex-shrink-0" />
                        <span className="text-sm text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {plan.price === 'مخصصة' ? (
                  <Link 
                    to="/contact" 
                    className="w-full py-3 rounded-xl bg-[#131622] border border-[#21263d] text-slate-300 text-sm font-bold text-center block hover:bg-slate-800 transition"
                  >
                    اتصل بنا
                  </Link>
                ) : (
                  <button 
                    onClick={() => handleOpenSubscribeAttendance(plan)}
                    className={`w-full py-3.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                      plan.popular ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/40 text-brand-primary'
                    }`}
                  >
                    اشترك الآن
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );

  // 7. FAQ Section
  const renderFAQ = () => (
    <section key="faq" id="faq" className="py-24 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 border-t border-dark-border/60">
      <div className="text-center mb-16 space-y-4">
        <h3 className="text-brand-primary font-bold text-sm uppercase tracking-widest">الأسئلة الشائعة</h3>
        <h2 className="text-3xl font-black text-white">هل لديك أي استفسارات؟</h2>
      </div>

      <div className="space-y-4">
        {(siteConfig.faqs || []).map((item: any, idx: number) => (
          <div key={idx} className="p-6 bg-[#0c0f18]/80 rounded-2xl border border-[#1b2031] text-right space-y-2 hover:border-slate-700 transition-all duration-300">
            <h4 className="text-base font-bold text-white flex items-center justify-start gap-2 flex-row-reverse">
              <HelpCircle className="w-5 h-5 text-brand-primary shrink-0" />
              <span>{item.q}</span>
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed pr-7">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );

  // Dynamic section router
  const renderSectionById = (sectionId: string) => {
    if (siteConfig.sectionVisibility?.[sectionId] === false) return null;
    
    switch (sectionId) {
      case 'hero':
        return renderHero();
      case 'services':
        return renderServices();
      case 'stats':
        return renderStats();
      case 'features':
        return renderFeatures();
      case 'pricing':
        return renderPricing();
      case 'faq':
        return renderFAQ();
      default:
        return null;
    }
  };

  // Sections Order
  const orderedSections = siteConfig.sectionOrder || ['hero', 'services', 'stats', 'features', 'pricing', 'faq'];
  
  // Add unified login after portals
  const finalSectionFlow = [...orderedSections];
  const servicesIndex = finalSectionFlow.indexOf('services');
  if (servicesIndex !== -1 && !finalSectionFlow.includes('unified-login')) {
    finalSectionFlow.splice(servicesIndex + 1, 0, 'unified-login');
  }

  return (
    <PublicLayout>
      <div className="max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 text-right" dir="rtl">
        {finalSectionFlow.map(secId => {
          if (secId === 'unified-login') {
            return renderUnifiedLogin();
          }
          return renderSectionById(secId);
        })}
      </div>

      {/* RESTORED: Attendance Subscription Modal exactly as it was in PricingPage */}
      {attendanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !submitting && setAttendanceModalOpen(false)} />
          <div className="relative glass-card border border-[#212739] bg-[#0c0e18] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 rounded-3xl shadow-2xl space-y-6 z-10 animate-slide-up">
            
            <div className="flex items-center justify-between pb-4 mb-2 border-b border-dark-border flex-row-reverse">
              <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 flex-row-reverse">
                <CreditCard className="w-6 h-6 text-brand-primary" />
                <span>طلب اشتراك جديد - {selectedPlanName}</span>
              </h2>
              <button
                onClick={() => setAttendanceModalOpen(false)}
                disabled={submitting}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {success ? (
              <div className="text-center py-10 space-y-6">
                <div className="w-20 h-20 bg-brand-success/20 text-brand-success rounded-full flex items-center justify-center mx-auto shadow-lg border border-brand-success/35">
                  <Check className="w-10 h-10 animate-bounce text-emerald-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">تم إرسال الطلب بنجاح!</h2>
                  <p className="text-brand-success bg-[#20c997]/10 border border-[#20c997]/20 p-4 rounded-xl max-w-md mx-auto leading-relaxed text-sm">
                    تم استلام طلبك بنجاح، وسيتم مراجعته من قبل الإدارة وتفعيل حسابك بعد مطابقة إيصال السداد.
                  </p>
                </div>
                <button
                  onClick={() => setAttendanceModalOpen(false)}
                  className="btn-primary px-8 py-3 rounded-xl"
                >
                  حسناً
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitAttendance} className="space-y-6 text-right">
                
                {/* Note Banner */}
                <div className="bg-brand-primary/10 border border-brand-primary/30 p-4 rounded-xl flex items-start gap-3 flex-row-reverse text-right">
                  <AlertCircle className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-white leading-relaxed">
                    قبل رفع الإيصال يجب التواصل عبر الواتساب للحصول على رقم الحساب أو بيانات التحويل، ثم إرفاق إيصال السداد داخل النموذج.
                  </p>
                </div>

                {/* WhatsApp button */}
                <div className="text-center">
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand-success hover:bg-brand-success/90 text-white font-bold rounded-xl transition shadow-lg shadow-brand-success/10 cursor-pointer text-xs"
                  >
                    <MessageSquare className="w-5 h-5" />
                    التواصل عبر واتساب للحصول على بيانات الدفع
                  </a>
                </div>

                {errorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl flex items-center gap-2 text-sm text-right flex-row-reverse">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400">الاسم الرباعي *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="أدخل اسمك الكامل"
                      className="w-full bg-[#121522] border border-[#21263d] rounded-xl p-3 text-white focus:outline-none focus:border-brand-primary text-right text-xs"
                    />
                  </div>

                  {/* University Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400">اسم الجامعة *</label>
                    <input
                      type="text"
                      required
                      value={universityName}
                      onChange={(e) => setUniversityName(e.target.value)}
                      placeholder="اسم الجامعة أو المعهد"
                      className="w-full bg-[#121522] border border-[#21263d] rounded-xl p-3 text-white focus:outline-none focus:border-brand-primary text-right text-xs"
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400">اسم المستخدم في منصة الجامعة *</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="مثال: الرقم الجامعي أو اسم المستخدم بالمنصة"
                      className="w-full bg-[#121522] border border-[#21263d] rounded-xl p-3 text-white focus:outline-none focus:border-brand-primary font-mono text-left text-xs"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">المقصود هو بيانات الدخول الخاصة بمنصة الجامعة التعليمية وليس بيانات النظام</p>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400">كلمة مرور منصة الجامعة *</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="أدخل كلمة مرور منصة الجامعة"
                      className="w-full bg-[#121522] border border-[#21263d] rounded-xl p-3 text-white focus:outline-none focus:border-brand-primary text-right text-xs"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">المقصود هو بيانات الدخول الخاصة بمنصة الجامعة التعليمية وليس بيانات النظام</p>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400">رقم الجوال *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="مثال: 0501234567"
                      className="w-full bg-[#121522] border border-[#21263d] rounded-xl p-3 text-white focus:outline-none focus:border-brand-primary font-mono text-left text-xs"
                    />
                  </div>
                </div>

                {/* Receipt File */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">رفع إيصال السداد (صورة أو PDF) *</label>
                  <div className="p-6 border border-dashed border-[#21263d] rounded-xl text-center bg-slate-950/20 relative">
                    <input
                      type="file"
                      required
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <Upload className="w-8 h-8 mx-auto mb-2 text-brand-primary" />
                    {receiptFileName ? (
                      <p className="text-white text-sm font-semibold">{receiptFileName}</p>
                    ) : (
                      <>
                        <p className="text-white text-xs font-bold">انقر أو اسحب الملف هنا لرفعه</p>
                        <p className="text-[10px] text-slate-500 mt-1">الحد الأقصى للملف: 10MB (JPG, PNG, PDF)</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 flex-row-reverse">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 btn-primary py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer text-xs font-bold"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جاري إرسال الطلب...</span>
                      </>
                    ) : (
                      <span>إرسال الطلب</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceModalOpen(false)}
                    disabled={submitting}
                    className="px-6 py-3 border border-dark-border rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition text-xs font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}
    </PublicLayout>
  );
}
