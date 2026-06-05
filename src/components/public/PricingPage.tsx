import { CheckCircle, CreditCard } from 'lucide-react';
import PublicLayout from './PublicLayout';
import { useCMS } from '../../contexts/CMSContext';

export default function PricingPage() {
  const { cmsData, loading } = useCMS();

  if (loading || !cmsData) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full"></div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{cmsData.pricing.page_title}</h1>
          <p className="text-dark-muted text-xl">{cmsData.pricing.page_subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {cmsData.pricing.plans.map((plan) => (
            <div key={plan.id} className={`glass-card p-8 relative ${plan.popular ? 'border-brand-primary scale-105' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-6 py-1 rounded-full text-sm font-bold">
                  الأكثر شيوعاً
                </div>
              )}
              <h3 className="text-xl font-bold text-white mb-4">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-dark-muted mr-2">{plan.period}</span>
              </div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-brand-success flex-shrink-0" />
                    <span className="text-dark-muted">{feature}</span>
                  </li>
                ))}
              </ul>
              <button className={`w-full ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}>
                {plan.price === 'مخصصة' ? 'اتصل بنا' : 'اشترك الآن'}
              </button>
            </div>
          ))}
        </div>

        <div className="glass-card p-10">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">طرق الدفع المتاحة</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center gap-3 p-6 bg-dark-bg/50 rounded-xl border border-dark-border">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center text-brand-primary">
                <CreditCard className="w-6 h-6" />
              </div>
              <span className="text-white font-medium">التحويل البنكي</span>
            </div>
            <div className="flex flex-col items-center gap-3 p-6 bg-dark-bg/50 rounded-xl border border-dark-border">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center text-brand-primary">
                <CreditCard className="w-6 h-6" />
              </div>
              <span className="text-white font-medium">URPay</span>
            </div>
            <div className="flex flex-col items-center gap-3 p-6 bg-dark-bg/50 rounded-xl border border-dark-border">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center text-brand-primary">
                <CreditCard className="w-6 h-6" />
              </div>
              <span className="text-white font-medium">Ria Money Transfer</span>
            </div>
            <div className="flex flex-col items-center gap-3 p-6 bg-dark-bg/50 rounded-xl border border-dark-border">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center text-brand-primary">
                <CreditCard className="w-6 h-6" />
              </div>
              <span className="text-white font-medium">Binance USDT</span>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
