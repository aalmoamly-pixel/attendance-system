import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  Video, 
  MessageSquare, 
  Bell, 
  Award, 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard, 
  FileText, 
  CheckSquare, 
  HelpCircle, 
  ClipboardList, 
  Building2, 
  ChevronLeft,
  GraduationCap,
  CreditCard
} from 'lucide-react';


interface LMSLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: 'admin' | 'instructor' | 'student';
  userName: string;
  onLogout: () => void;
  subscriptionStatus?: string;
}

export default function LMSLayout({ children, activeTab, setActiveTab, role, userName, onLogout, subscriptionStatus }: LMSLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Platform identity CMS integration
  const [platformName, setPlatformName] = useState('بلاك بورد الأكاديمي');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('lms_site_config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        if (config.platformName) setPlatformName(config.platformName);
        if (config.logoUrl) setLogoUrl(config.logoUrl);
        if (config.faviconUrl) {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
          }
          link.href = config.faviconUrl;
        }
      } catch (e) {
        console.error('[LMSLayout] Error loading identity from site config:', e);
      }
    }
  }, []);

  const getMenuItems = () => {
    switch (role) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'لوحة التحكم العامة', icon: LayoutDashboard },
          { id: 'departments', label: 'إدارة الأقسام الكليات', icon: Building2 },
          { id: 'courses', label: 'إدارة المقررات الدراسية', icon: BookOpen },
          { id: 'sections', label: 'إدارة الشعب الدراسية', icon: ClipboardList },
          { id: 'users', label: 'إدارة المستخدمين والصلاحيات', icon: Users },
        ];
      case 'instructor':
        return [
          { id: 'dashboard', label: 'لوحة تحكم الأستاذ', icon: LayoutDashboard },
          { id: 'sections', label: 'شُعبي الدراسية', icon: ClipboardList },
          { id: 'materials', label: 'رفع المحاضرات والمواد', icon: FileText },
          { id: 'assignments', label: 'الواجبات والتصحيح', icon: CheckSquare },
          { id: 'questions', label: 'بنك الأسئلة', icon: HelpCircle },
          { id: 'exams', label: 'الاختبارات الإلكترونية', icon: Award },
          { id: 'attendance', label: 'رصد الحضور والغياب', icon: ClipboardList },
          { id: 'meetings', label: 'الاجتماعات والمحاضرات الحية', icon: Video },
          { id: 'messages', label: 'الرسائل الداخلية', icon: MessageSquare },
          { id: 'announcements', label: 'الإعلانات الأكاديمية', icon: Bell },
        ];
      case 'student':
        if (subscriptionStatus !== 'active') {
          return [
            { id: 'dashboard', label: 'لوحة تحكم الطالب', icon: LayoutDashboard },
            { id: 'payment', label: 'الدفع والاشتراك', icon: CreditCard },
          ];
        }
        return [
          { id: 'dashboard', label: 'لوحة تحكم الطالب', icon: LayoutDashboard },
          { id: 'enrollment', label: 'تسجيل المقررات', icon: BookOpen },
          { id: 'materials', label: 'المحاضرات والمواد العلمية', icon: FileText },
          { id: 'assignments', label: 'الواجبات والمهام', icon: CheckSquare },
          { id: 'exams', label: 'الاختبارات الإلكترونية', icon: Award },
          { id: 'attendance', label: 'سجل الحضور والغياب', icon: ClipboardList },
          { id: 'meetings', label: 'المحاضرات المباشرة', icon: Video },
          { id: 'messages', label: 'مراسلة الأساتذة', icon: MessageSquare },
          { id: 'certificates', label: 'الشهادات والدرجات', icon: Award },
        ];
    }
  };

  const menuItems = getMenuItems();



  const Sidebar = () => (
    <div className="flex flex-col w-72 bg-[#0d0f17] border-l border-[#1c2032] h-screen overflow-hidden text-right">
      {/* Brand Header */}
      <Link to="/" className="p-6 border-b border-[#1c2032] flex items-center gap-3 shrink-0 hover:opacity-90 transition-opacity">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-11 h-11 object-contain rounded-xl shadow-lg transform hover:scale-105 transition-all" />
        ) : (
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-secondary to-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20 transform hover:scale-105 transition-all">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
        )}
        <div>
          <h1 className="font-black text-base text-white leading-tight">{platformName}</h1>
          <span className="text-[10px] font-bold text-brand-primary tracking-wider block">BLACKBOARD ULTRA</span>
        </div>
      </Link>

      {/* Role Badge */}
      <div className="px-6 py-4 shrink-0">
        <div className="bg-[#151928] border border-[#232a43] text-brand-primary text-xs font-bold px-3 py-2.5 rounded-xl flex items-center justify-between">
          <span className="text-slate-400">الدور:</span>
          <span>
            {role === 'admin' ? 'مدير النظام' : role === 'instructor' ? 'عضو هيئة التدريس' : 'طالب جامعي'}
          </span>
        </div>
      </div>

      {/* Menu List */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {/* Fixed Return to Home Page button */}
        <Link 
          to="/"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-[#121626] font-medium transition-all mb-2 border border-dashed border-[#232a43] hover:border-brand-primary/40 bg-[#0d0f17]/40"
        >
          <span>🏠</span>
          <span>الصفحة الرئيسية</span>
        </Link>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group cursor-pointer ${
                isActive 
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/15 font-bold scale-[1.01] border-r-4 border-cyan-400' 
                  : 'text-slate-400 hover:text-white hover:bg-[#121626] font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white scale-110' : 'text-slate-500 group-hover:text-white'}`} />
                <span>{item.label}</span>
              </div>
              <ChevronLeft className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-all ${isActive ? 'opacity-100' : ''}`} />
            </button>
          );
        })}
      </nav>

      {/* Action Buttons */}
      <div className="p-4 border-t border-[#1c2032] space-y-2 shrink-0">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition border border-rose-500/25 text-xs font-bold cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل خروج من LMS</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#090b10] text-[#cbd5e1] font-sans flex flex-row">
      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed right-0 top-0 z-50 h-full md:hidden transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <Sidebar />
        <button 
          onClick={() => setMobileOpen(false)}
          className="absolute -left-12 top-4 bg-[#0d0f17] p-2.5 rounded-xl border border-[#1c2032] text-white cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto bg-[#090b10] p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#1c2032]">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2.5 rounded-xl bg-[#0d0f17] border border-[#1c2032] hover:bg-[#121626] text-white transition cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-right">
              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2 font-medium justify-start flex-row-reverse text-right">
                <Link to="/" className="hover:text-brand-primary transition-colors">الرئيسية</Link>
                <span>/</span>
                <span className="text-slate-300">{role === 'admin' ? 'لوحة الإدارة' : 'منصة التعلم LMS'}</span>
                {activeTab !== 'dashboard' && (
                  <>
                    <span>/</span>
                    <span className="text-brand-primary">{menuItems.find(i => i.id === activeTab)?.label}</span>
                  </>
                )}
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white">
                {menuItems.find(i => i.id === activeTab)?.label || 'المنصة التعليمية'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                نظام إدارة التعلم الذكي Blackboard Ultra المطور.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-right flex-row-reverse">
            <div className="w-10 h-10 rounded-xl bg-[#121626] border border-[#20273f] flex items-center justify-center text-brand-primary font-bold text-sm">
              {userName ? userName.substring(0, 2) : 'أك'}
            </div>
            <div>
              <p className="text-[10px] text-slate-500">مرحباً بك مجدداً</p>
              <p className="text-sm font-black text-white">{userName}</p>
            </div>
          </div>
        </div>

        {/* Render child components */}
        <div className="flex-1 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
