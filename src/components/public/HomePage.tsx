import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Award, 
  CreditCard, 
  MessageSquare, 
  FileText, 
  GraduationCap, 
  CheckSquare, 
  Upload, 
  Bell, 
  BarChart3, 
  Globe, 
  School,
  Mail,
  Phone,
  MapPin,
  Target,
  CheckCircle,
  Send
} from 'lucide-react';
import PublicLayout from './PublicLayout';
import { useCMS } from '../../contexts/CMSContext';
import { useEffect, useState } from 'react';

const iconMap: Record<string, React.ReactNode> = {
  Users: <Users className="w-8 h-8" />,
  BookOpen: <BookOpen className="w-8 h-8" />,
  Calendar: <Calendar className="w-8 h-8" />,
  Award: <Award className="w-8 h-8" />,
  CreditCard: <CreditCard className="w-8 h-8" />,
  MessageSquare: <MessageSquare className="w-8 h-8" />,
  FileText: <FileText className="w-8 h-8" />,
  GraduationCap: <GraduationCap className="w-6 h-6" />,
  CheckSquare: <CheckSquare className="w-6 h-6" />,
  Upload: <Upload className="w-6 h-6" />,
  Bell: <Bell className="w-6 h-6" />,
  BarChart3: <BarChart3 className="w-6 h-6" />,
  Globe: <Globe className="w-6 h-6" />,
  School: <School className="w-6 h-6" />,
  Target: <Target className="w-6 h-6" />
};

export default function HomePage() {
  const { cmsData, loading } = useCMS();
  const location = useLocation();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  // Handle smooth scroll to hash when location changes
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      const element = document.getElementById(id);
      if (element) {
        const offset = 100;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  }, [location.hash]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section id="home" className="text-center py-16 lg:py-24">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              {cmsData.homepage.hero_title}
            </h1>
            <p className="text-xl text-dark-muted mb-6 max-w-4xl mx-auto leading-relaxed">
              {cmsData.homepage.hero_subtitle}
            </p>
            <p className="text-lg text-dark-muted/80 mb-10 max-w-3xl mx-auto leading-relaxed">
              {cmsData.homepage.hero_subtitle_2}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={cmsData.homepage.hero_button_primary_link} className="btn-primary text-lg px-8 py-4">
                {cmsData.homepage.hero_button_primary}
              </Link>
              <Link to={cmsData.homepage.hero_button_secondary_link} className="btn-secondary text-lg px-8 py-4">
                {cmsData.homepage.hero_button_secondary}
              </Link>
            </div>
          </div>

          {/* Quick Features */}
          {cmsData.homepage.hero_quick_features && cmsData.homepage.hero_quick_features.length > 0 && (
            <div className="mt-20 max-w-6xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {cmsData.homepage.hero_quick_features.map((feature, index) => (
                  <div key={index} className="glass-card p-6 flex flex-col items-center gap-3 text-center animate-slide-up hover:border-brand-primary/50 transition-all" style={{ animationDelay: `${index * 60}ms` }}>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center text-brand-primary">
                      {['GraduationCap', 'Calendar', 'CheckSquare', 'BookOpen', 'Award', 'CreditCard', 'Upload', 'Bell', 'BarChart3', 'Globe', 'School', 'GraduationCap'][index % 12] ? 
                        iconMap[['GraduationCap', 'Calendar', 'CheckSquare', 'BookOpen', 'Award', 'CreditCard', 'Upload', 'Bell', 'BarChart3', 'Globe', 'School', 'GraduationCap'][index % 12]] || iconMap.CheckSquare 
                        : iconMap.CheckSquare}
                    </div>
                    <span className="text-white text-sm md:text-base font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {cmsData.homepage.stats.map((stat, index) => (
              <div key={index} className="text-center animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="text-4xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-dark-muted text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{cmsData.about.page_title}</h2>
              <p className="text-dark-muted text-lg">نبذة عن المنصة والخدمات التي نقدمها</p>
            </div>

            <div className="glass-card p-10 mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">نبذة عن المنصة</h2>
              <p className="text-dark-muted text-lg leading-relaxed">
                {cmsData.about.about_description}
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-8 text-center">أهداف المنصة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cmsData.about.goals.map((goal, index) => (
                  <div key={index} className="glass-card p-6 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-success/20 flex items-center justify-center text-brand-success flex-shrink-0">
                      ✓
                    </div>
                    <span className="text-dark-muted text-lg">{goal}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-10">
              <h2 className="text-2xl font-bold text-white mb-6">مميزات المنصة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cmsData.about.features.map((feature) => (
                  <div key={feature.id} className="p-6 bg-dark-bg/50 rounded-xl border border-dark-border">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center text-brand-primary mb-4">
                      {iconMap[feature.icon || 'BookOpen']}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-dark-muted">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{cmsData.services.page_title}</h2>
              <p className="text-dark-muted text-lg">{cmsData.services.page_subtitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {cmsData.services.services.map((service, index) => (
                <div key={service.id} className="glass-card p-8 hover:border-brand-primary/50 transition-all group animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center text-brand-primary mb-6 group-hover:scale-110 transition-transform">
                    {iconMap[service.icon || 'FileText']}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">{service.title}</h3>
                  <p className="text-dark-muted">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{cmsData.pricing.page_title}</h2>
              <p className="text-dark-muted text-lg">{cmsData.pricing.page_subtitle}</p>
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
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">تواصل معنا</h2>
              <p className="text-dark-muted text-lg">نحن هنا لمساعدتك في أي وقت</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Info */}
              <div className="space-y-8">
                <div className="glass-card p-10">
                  <h2 className="text-2xl font-bold text-white mb-8">معلومات التواصل</h2>
                  <div className="space-y-8">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center text-brand-primary flex-shrink-0">
                        <Mail className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">البريد الإلكتروني</h3>
                        <p className="text-dark-muted">{cmsData.contact.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center text-brand-primary flex-shrink-0">
                        <Phone className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">الهاتف</h3>
                        <p className="text-dark-muted">{cmsData.contact.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center text-brand-primary flex-shrink-0">
                        <MapPin className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">العنوان</h3>
                        <p className="text-dark-muted">{cmsData.contact.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {cmsData.contact.social_links.length > 0 && (
                  <div className="glass-card p-8">
                    <h3 className="text-xl font-bold text-white mb-6">تابعنا على وسائل التواصل الاجتماعي</h3>
                    <div className="flex gap-4">
                      {cmsData.contact.social_links.map((social, idx) => (
                        <a 
                          key={idx} 
                          href={social.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-12 h-12 rounded-xl bg-dark-hover flex items-center justify-center text-white hover:bg-brand-primary transition-colors"
                        >
                          {social.platform}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Form */}
              <div className="glass-card p-10">
                <h2 className="text-2xl font-bold text-white mb-6">أرسل لنا رسالة</h2>
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-success/20 flex items-center justify-center text-brand-success">
                      ✓
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">تم إرسال رسالتك!</h3>
                    <p className="text-dark-muted">سنتواصل معك في أقرب وقت ممكن.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-dark-muted mb-2 font-medium">الاسم</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="glass-input"
                        placeholder="أدخل اسمك"
                      />
                    </div>
                    <div>
                      <label className="block text-dark-muted mb-2 font-medium">البريد الإلكتروني</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="glass-input"
                        placeholder="أدخل بريدك الإلكتروني"
                      />
                    </div>
                    <div>
                      <label className="block text-dark-muted mb-2 font-medium">الموضوع</label>
                      <input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="glass-input"
                        placeholder="موضوع الرسالة"
                      />
                    </div>
                    <div>
                      <label className="block text-dark-muted mb-2 font-medium">الرسالة</label>
                      <textarea
                        required
                        rows={6}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="glass-input resize-none"
                        placeholder="اكتب رسالتك هنا..."
                      />
                    </div>
                    <button type="submit" className="btn-primary w-full py-4">
                      <Send className="w-5 h-5" />
                      إرسال الرسالة
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="glass-card p-12 lg:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">جاهز للبدء؟</h2>
            <p className="text-dark-muted text-lg mb-8 max-w-2xl mx-auto">
              ابدأ تجربتك المجانية الآن واكتشف كيف يمكن لمنصتنا أن تحول تجربتك التعليمية
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/demo" className="btn-primary text-lg px-8 py-4">
                تجربة مجانية
              </Link>
              <Link to="#pricing" className="btn-secondary text-lg px-8 py-4">
                عرض الأسعار
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
