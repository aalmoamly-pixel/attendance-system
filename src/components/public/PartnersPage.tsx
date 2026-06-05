import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicLayout from './PublicLayout';
import { useCMS } from '../../contexts/CMSContext';
import { ShieldCheck, CreditCard, CheckCircle } from 'lucide-react';

export default function PartnersPage() {
  const { cmsData, loading } = useCMS();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && cmsData && !cmsData.partners.isActive) {
      navigate('/');
    }
  }, [loading, cmsData, navigate]);

  if (loading || !cmsData) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full"></div>
        </div>
      </PublicLayout>
    );
  }

  const data = cmsData.partners;

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <section className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{data.pageTitle}</h1>
          <p className="text-xl text-dark-muted max-w-3xl mx-auto">{data.pageSubtitle}</p>
        </section>

        {/* About Section */}
        <section className="glass-card p-10 mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">نبذة عن المنصة</h2>
          <p className="text-dark-muted text-lg leading-relaxed">{data.aboutUs}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <div className="text-center p-6 bg-dark-bg/50 rounded-xl border border-dark-border">
              <div className="text-4xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent mb-2">
                {data.totalStudents}
              </div>
              <div className="text-dark-muted">طالب</div>
            </div>
            <div className="text-center p-6 bg-dark-bg/50 rounded-xl border border-dark-border">
              <div className="text-4xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent mb-2">
                {data.activeUsers}
              </div>
              <div className="text-dark-muted">مستخدم نشط</div>
            </div>
            <div className="text-center p-6 bg-dark-bg/50 rounded-xl border border-dark-border">
              <div className="text-4xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent mb-2">
                {data.avgMonthlyTransactions}
              </div>
              <div className="text-dark-muted">عملية شهرياً</div>
            </div>
          </div>
        </section>

        {/* Current Payment Methods */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">طرق الدفع الحالية</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {data.currentPaymentMethods.map((method, index) => (
              <div key={index} className="glass-card p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-brand-primary" />
                </div>
                <div className="text-white font-semibold">{method}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Platform Features */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">مميزات المنصة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.platformFeatures.map((feature) => (
              <div key={feature.id} className="glass-card p-8 hover:border-brand-primary/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center text-brand-primary mb-6">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-dark-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Dashboard Stats */}
        <section className="glass-card p-10 mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">لوحة الإحصائيات</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="p-6 bg-dark-bg/50 rounded-xl border border-dark-border text-center">
              <div className="text-2xl font-bold text-white mb-2">{data.dashboardStats.studentsCount}</div>
              <div className="text-dark-muted text-sm">عدد الطلاب</div>
            </div>
            <div className="p-6 bg-dark-bg/50 rounded-xl border border-dark-border text-center">
              <div className="text-2xl font-bold text-white mb-2">{data.dashboardStats.paymentsCount}</div>
              <div className="text-dark-muted text-sm">عدد المدفوعات</div>
            </div>
            <div className="p-6 bg-dark-bg/50 rounded-xl border border-dark-border text-center">
              <div className="text-2xl font-bold text-white mb-2">{data.dashboardStats.totalRevenue}</div>
              <div className="text-dark-muted text-sm">إجمالي الرسوم</div>
            </div>
            <div className="p-6 bg-dark-bg/50 rounded-xl border border-dark-border text-center">
              <div className="text-2xl font-bold text-white mb-2">{data.dashboardStats.pendingCount}</div>
              <div className="text-dark-muted text-sm">عمليات معلقة</div>
            </div>
            <div className="p-6 bg-dark-bg/50 rounded-xl border border-dark-border text-center">
              <div className="text-2xl font-bold text-white mb-2">{data.dashboardStats.paymentRate}</div>
              <div className="text-dark-muted text-sm">نسبة السداد</div>
            </div>
          </div>
        </section>

        {/* Screenshots Gallery */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">معرض الصور</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.screenshots.map((screenshot) => (
              <div key={screenshot.id} className="glass-card overflow-hidden">
                <img 
                  src={screenshot.imageUrl} 
                  alt={screenshot.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-2">{screenshot.title}</h3>
                  <p className="text-dark-muted text-sm">{screenshot.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Integration Ready Section */}
        <section className="glass-card p-10 mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-3">{data.integrationReadyTitle}</h2>
            <p className="text-dark-muted text-lg">{data.integrationReadyDescription}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {data.integrationMethods.map((method) => (
              <div key={method.id} className="p-4 bg-dark-bg/50 rounded-xl border border-dark-border text-center">
                <div className="text-white font-semibold">{method.name}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Security Section */}
        <section className="glass-card p-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-brand-success/20 flex items-center justify-center text-brand-success">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">{data.securityTitle}</h2>
            <p className="text-dark-muted text-lg">{data.securityDescription}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.securityFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-dark-bg/50 rounded-xl border border-dark-border">
                <CheckCircle className="w-6 h-6 text-brand-success flex-shrink-0" />
                <div className="text-dark-muted font-medium">{feature}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
