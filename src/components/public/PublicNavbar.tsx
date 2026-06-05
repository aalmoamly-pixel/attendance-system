import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Lock, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { useCMS } from '../../contexts/CMSContext';

export default function PublicNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { cmsData, loading } = useCMS();

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

  const navLinks = [
    { label: 'الرئيسية', id: 'home', path: '/' },
    { label: 'من نحن', id: 'about', path: '/#about' },
    { label: 'الخدمات', id: 'services', path: '/#services' },
    { label: 'الأسعار', id: 'pricing', path: '/#pricing' },
    { label: 'تواصل معنا', id: 'contact', path: '/#contact' },
  ];

  const siteName = loading || !cmsData ? 'منصة تعليم' : cmsData.general.site_name;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-bg/80 backdrop-blur-xl border-b border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link 
            to="/" 
            onClick={(e) => {
              if (location.pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">{siteName}</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={(e) => handleSmoothScroll(e, link.id)}
                className="text-dark-muted hover:text-white transition-colors font-medium bg-transparent border-none cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/demo" className="btn-secondary">
              تجربة مجانية
            </Link>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary"
            >
              <Lock className="w-5 h-5" />
              تسجيل الدخول
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-6 border-t border-dark-border animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={(e) => {
                    setIsMenuOpen(false);
                    handleSmoothScroll(e, link.id);
                  }}
                  className="text-dark-muted hover:text-white py-2 transition-colors font-medium bg-transparent border-none cursor-pointer text-right"
                >
                  {link.label}
                </button>
              ))}
              <div className="flex flex-col gap-3 pt-4 border-t border-dark-border">
                <Link
                  to="/demo"
                  onClick={() => setIsMenuOpen(false)}
                  className="btn-secondary w-full"
                >
                  تجربة مجانية
                </Link>
                <button
                  onClick={() => {
                    navigate('/login');
                    setIsMenuOpen(false);
                  }}
                  className="btn-primary w-full"
                >
                  تسجيل الدخول
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
