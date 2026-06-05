import { FileText, BookOpen, Calendar, Award, CreditCard } from 'lucide-react';
import PublicLayout from './PublicLayout';
import { useCMS } from '../../contexts/CMSContext';

const iconMap: Record<string, React.ReactNode> = {
  FileText: <FileText className="w-10 h-10" />,
  BookOpen: <BookOpen className="w-10 h-10" />,
  Calendar: <Calendar className="w-10 h-10" />,
  Award: <Award className="w-10 h-10" />,
  CreditCard: <CreditCard className="w-10 h-10" />
};

export default function ServicesPage() {
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{cmsData.services.page_title}</h1>
          <p className="text-dark-muted text-xl">{cmsData.services.page_subtitle}</p>
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
    </PublicLayout>
  );
}
