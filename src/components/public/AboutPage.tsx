import { BookOpen, Target, Award, Users } from 'lucide-react';
import PublicLayout from './PublicLayout';
import { useCMS } from '../../contexts/CMSContext';

const iconMap: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="w-6 h-6" />,
  Target: <Target className="w-6 h-6" />,
  Award: <Award className="w-6 h-6" />,
  Users: <Users className="w-6 h-6" />
};

export default function AboutPage() {
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
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{cmsData.about.page_title}</h1>
          <p className="text-dark-muted text-xl">نبذة عن المنصة والخدمات التي نقدمها</p>
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
    </PublicLayout>
  );
}
