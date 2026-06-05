import { Link } from 'react-router-dom';
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
  School
} from 'lucide-react';
import PublicLayout from './PublicLayout';
import { useCMS } from '../../contexts/CMSContext';

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
  School: <School className="w-6 h-6" />
};

export default function HomePage() {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="text-center py-16 lg:py-24">
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

        {/* Features Section */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">مميزات المنصة للطالب</h2>
            <p className="text-dark-muted text-lg max-w-2xl mx-auto">
              كل ما يحتاجه الطالب في مكان واحد
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cmsData.about.features.map((feature, index) => (
              <div key={feature.id} className="glass-card p-8 hover:border-brand-primary/50 transition-all group animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center text-brand-primary mb-6 group-hover:scale-110 transition-transform">
                  {iconMap[feature.icon || 'BookOpen']}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-dark-muted">{feature.description}</p>
              </div>
            ))}
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
              <Link to="/pricing" className="btn-secondary text-lg px-8 py-4">
                عرض الأسعار
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
