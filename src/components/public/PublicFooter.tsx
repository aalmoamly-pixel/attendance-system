import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Mail, Phone, MapPin } from 'lucide-react';
import { useCMS } from '../../contexts/CMSContext';

export default function PublicFooter() {
  const { cmsData, loading } = useCMS();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSmoothScroll = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    
    if (location.pathname !== '/') {
      navigate(`/#${id}`);
      return;
    }

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
  };

  const siteName = loading || !cmsData ? 'منصة تعليم' : cmsData.general.site_name;
  const copyright = loading || !cmsData ? `© ${new Date().getFullYear()} منصة تعليم. جميع الحقوق محفوظة.` : cmsData.footer.copyright_text;

  return (
    <footer className="bg-dark-card border-t border-dark-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* About */}
          <div className="lg:col-span-1">
            <Link 
              to="/" 
              onClick={(e) => {
                if (location.pathname === '/') {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">{siteName}</span>
            </Link>
            <p className="text-dark-muted mb-6">
              {loading || !cmsData ? 'منصة تعليمية متكاملة لإدارة المدارس والمعاهد' : cmsData.general.site_description}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">روابط سريعة</h3>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={(e) => handleSmoothScroll(e, 'home')} 
                  className="text-dark-muted hover:text-white transition-colors bg-transparent border-none cursor-pointer text-right"
                >
                  الرئيسية
                </button>
              </li>
              <li>
                <button 
                  onClick={(e) => handleSmoothScroll(e, 'about')} 
                  className="text-dark-muted hover:text-white transition-colors bg-transparent border-none cursor-pointer text-right"
                >
                  من نحن
                </button>
              </li>
              <li>
                <button 
                  onClick={(e) => handleSmoothScroll(e, 'services')} 
                  className="text-dark-muted hover:text-white transition-colors bg-transparent border-none cursor-pointer text-right"
                >
                  الخدمات
                </button>
              </li>
              <li>
                <button 
                  onClick={(e) => handleSmoothScroll(e, 'pricing')} 
                  className="text-dark-muted hover:text-white transition-colors bg-transparent border-none cursor-pointer text-right"
                >
                  الأسعار
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">القانونية</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy" className="text-dark-muted hover:text-white transition-colors">
                  سياسة الخصوصية
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-dark-muted hover:text-white transition-colors">
                  الشروط والأحكام
                </Link>
              </li>
              <li>
                <button 
                  onClick={(e) => handleSmoothScroll(e, 'contact')} 
                  className="text-dark-muted hover:text-white transition-colors bg-transparent border-none cursor-pointer text-right"
                >
                  تواصل معنا
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">تواصل معنا</h3>
            <ul className="space-y-3">
              {!loading && cmsData && (
                <>
                  <li className="flex items-center gap-3 text-dark-muted">
                    <Mail className="w-5 h-5 text-brand-primary flex-shrink-0" />
                    <span>{cmsData.contact.email}</span>
                  </li>
                  <li className="flex items-center gap-3 text-dark-muted">
                    <Phone className="w-5 h-5 text-brand-primary flex-shrink-0" />
                    <span>{cmsData.contact.phone}</span>
                  </li>
                  <li className="flex items-center gap-3 text-dark-muted">
                    <MapPin className="w-5 h-5 text-brand-primary flex-shrink-0" />
                    <span>{cmsData.contact.address}</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-border pt-8 text-center">
          <p className="text-dark-muted">
            {copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
