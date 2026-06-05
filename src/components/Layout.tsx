import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  CalendarCheck, 
  BarChart3,
  Sparkles, 
  Database, 
  Bell, 
  Info,
  FileSpreadsheet,
  LogOut,
  Menu,
  X,
  DollarSign,
  Settings,
  TrendingUp,
  Globe,
  ChevronsDown,
  ChevronsUp,
  AlertTriangle
} from 'lucide-react';
import { supabase, db } from '../lib/supabase';
import { getAuthState, logout, isDemoMode } from '../lib/auth';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  setActivePage: (page: string) => void;
  onLogout?: () => void;
}

export default function Layout({ children, activePage, setActivePage, onLogout }: LayoutProps) {
  const [authState] = useState(getAuthState());
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cmsMenuOpen, setCmsMenuOpen] = useState(false);
  const isSupabaseLive = !!supabase;

  const cmsMenuItems = [
    { id: 'cms-general', label: 'الإعدادات العامة', show: true },
    { id: 'cms-homepage', label: 'الصفحة الرئيسية', show: true },
    { id: 'cms-about', label: 'صفحة من نحن', show: true },
    { id: 'cms-services', label: 'صفحة الخدمات', show: true },
    { id: 'cms-pricing', label: 'صفحة الأسعار', show: true },
    { id: 'cms-contact', label: 'صفحة التواصل', show: true },
    { id: 'cms-footer', label: 'الفوتر', show: true },
  ].filter(item => item.show);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [authState]);

  const loadUnreadCount = async () => {
    try {
      const notifications = await db.getNotifications();
      let count = 0;
      const isAdmin = authState.role === 'admin';
      const currentUserId = authState.user?.student_id;
      
      if (isAdmin) {
        count = notifications.filter(n => n.sender_role === 'student' && !n.is_read).length;
      } else if (currentUserId) {
        count = notifications.filter(n => n.student_id === currentUserId && n.sender_role === 'admin' && !n.is_read).length;
      }
      
      setUnreadCount(count);
    } catch (err) {
      console.error('[Layout] Error loading unread count:', err);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
      window.location.reload();
    }
  };

  const isAdmin = authState.role === 'admin';
  
  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, show: true },
    { id: 'students', label: 'إدارة الطلاب', icon: Users, show: isAdmin },
    { id: 'subjects', label: 'المواد الدراسية', icon: BookOpen, show: isAdmin },
    { id: 'attendance', label: 'رصد الحضور', icon: CalendarCheck, show: isAdmin },
    { id: 'attendance-report', label: 'تقارير الحضور', icon: BarChart3, show: isAdmin },
    { id: 'payments', label: isAdmin ? 'إدارة المدفوعات' : 'المدفوعات', icon: DollarSign, show: true },
    { id: 'student-fees', label: 'رسوم الطلاب', icon: DollarSign, show: isAdmin },
    { id: 'payment-settings', label: 'إعدادات المدفوعات', icon: Settings, show: isAdmin },
    { id: 'financial-reports', label: 'التقارير المالية', icon: TrendingUp, show: isAdmin },
    { id: 'notifications', label: 'الرسائل والإشعارات', icon: Bell, notificationBadge: unreadCount > 0 ? String(unreadCount) : null, show: true },
    { id: 'schedule-import', label: 'استيراد الجداول', icon: FileSpreadsheet, show: isAdmin },
    { id: 'import', label: 'الاستيراد الذكي', icon: Sparkles, badge: 'AI', show: isAdmin },
    { id: 'cms', label: 'إدارة الموقع', icon: Globe, show: isAdmin, isDropdown: true },
    { id: 'cms-partners', label: '🤝 شركاء الدفع', icon: Globe, show: isAdmin },
  ].filter(item => item.show);

  const SidebarContent = () => (
    <aside className="flex flex-col w-72 bg-dark-card border-l border-dark-border/40 min-h-screen">
      {/* Brand Logo Header */}
      <div className="p-6 border-b border-dark-border/40 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center shadow-xl shadow-brand-primary/30 transform hover:scale-105 transition-all shrink-0">
          <Sparkles className="w-6 h-6 text-white animate-pulse" />
        </div>
        <div>
          <h1 className="font-black text-lg tracking-wide text-white">حضورك الذكي</h1>
          <span className="text-xs font-semibold text-brand-secondary">Smart Attendance AI</span>
        </div>
      </div>

      {/* Database Status Tag */}
      <div className="px-6 py-3">
        <div className={`flex items-center justify-between px-3 py-2 rounded-xl border text-[11px] font-medium transition-all ${
          isSupabaseLive 
            ? 'bg-brand-success/10 border-brand-success/20 text-brand-success' 
            : 'bg-brand-warning/10 border-brand-warning/20 text-brand-warning'
        }`}>
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" />
            <span>{isSupabaseLive ? 'قاعدة بيانات سحابية متصلة' : 'قاعدة بيانات محلية نشطة'}</span>
          </div>
          <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseLive ? 'bg-brand-success animate-ping' : 'bg-brand-warning animate-pulse'}`} />
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id || activePage.startsWith('cms-') && item.id === 'cms';

          if (item.isDropdown) {
            return (
              <div key={item.id}>
                <button
                  onClick={() => setCmsMenuOpen(!cmsMenuOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                    isActive 
                      ? 'bg-gradient-to-l from-brand-primary to-brand-primary/80 text-white shadow-lg shadow-brand-primary/30 font-bold scale-[1.02]' 
                      : 'text-dark-muted hover:text-white hover:bg-dark-hover/70 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110 text-white' : 'group-hover:scale-110 group-hover:text-white'}`} />
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {cmsMenuOpen ? <ChevronsUp className="w-4 h-4" /> : <ChevronsDown className="w-4 h-4" />}
                  </div>
                </button>
                {cmsMenuOpen && (
                  <div className="pr-4 pb-2">
                    {cmsMenuItems.map((subItem) => {
                      const isSubActive = activePage === subItem.id;
                      return (
                        <button
                          key={subItem.id}
                          onClick={() => {
                            setActivePage(subItem.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full text-right flex items-center px-4 py-2.5 rounded-xl transition-all duration-300 text-sm ${
                            isSubActive 
                              ? 'bg-brand-primary/20 text-white font-bold border-r-2 border-brand-primary' 
                              : 'text-dark-muted hover:text-white hover:bg-dark-hover/70'
                          }`}
                        >
                          <span>{subItem.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                setActivePage(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-gradient-to-l from-brand-primary to-brand-primary/80 text-white shadow-lg shadow-brand-primary/30 font-bold scale-[1.02]' 
                  : 'text-dark-muted hover:text-white hover:bg-dark-hover/70 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110 text-white' : 'group-hover:scale-110 group-hover:text-white'}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.badge && (
                  <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md ${
                    isActive 
                      ? 'bg-white text-brand-primary' 
                      : 'bg-brand-secondary/20 text-brand-secondary'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {item.notificationBadge && (
                  <span className="bg-brand-danger text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                    {item.notificationBadge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-dark-border/40">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-dark-hover hover:bg-brand-danger/20 text-dark-muted hover:text-brand-danger transition-all border border-dark-border/60"
        >
          <LogOut className="w-5 h-5" />
          <span>تسجيل الخروج</span>
        </button>
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-dark-bg/30">
        <div className="flex items-start gap-2.5 text-xs text-dark-muted">
          <Info className="w-4 h-4 text-brand-secondary shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            هذا النظام متكامل وذكي يدعم الاستيراد المباشر للجداول عبر ملفات الإكسل وصور الجداول.
          </p>
        </div>
      </div>
    </aside>
  );

  const demoMode = isDemoMode();

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text font-sans flex flex-row">
      {demoMode && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-brand-warning/20 to-brand-danger/20 border-b border-brand-warning/30 py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
            <AlertTriangle className="w-5 h-5 text-brand-warning" />
            <span className="text-white font-semibold text-sm">
              وضع تجريبي - البيانات المعروضة لأغراض العرض فقط ولا يتم حفظ أي تعديلات
            </span>
          </div>
        </div>
      )}
      
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar (Drawer) */}
      <div className={`fixed right-0 top-0 z-50 h-full md:hidden transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <SidebarContent />
        <button 
          onClick={() => setMobileMenuOpen(false)}
          className="absolute -left-12 top-4 bg-dark-card p-2 rounded-xl border border-dark-border/40"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <SidebarContent />
      </div>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-h-screen overflow-y-auto bg-dark-bg p-4 md:p-8 relative ${demoMode ? 'pt-16' : ''}`}>
        {/* Top Navbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-dark-border/20">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2.5 rounded-xl bg-dark-card border border-dark-border/40 hover:bg-dark-hover cursor-pointer transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white">
                {menuItems.find(i => i.id === activePage)?.label}
              </h2>
              <p className="text-xs md:text-sm text-dark-muted mt-1">
                نظام إدارة الحضور والغياب الذكية والقائمة على الذكاء الاصطناعي للمؤسسات الأكاديمية.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Notification Alert */}
            <button 
              onClick={() => setActivePage('notifications')}
              className="relative p-2.5 rounded-xl bg-dark-card border border-dark-border/40 hover:bg-dark-hover cursor-pointer transition-all"
            >
              <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-brand-primary' : 'text-dark-muted hover:text-white'} transition-colors`} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-brand-danger text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            <div className="text-left md:text-right hidden sm:block">
              <p className="text-xs text-dark-muted truncate">أهلاً بك، {authState.user?.full_name || 'المشرف الأكاديمي'}</p>
              <p className="text-xs font-bold text-white truncate">التاريخ: {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* Dynamic page contents */}
        <div className="flex-1 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
