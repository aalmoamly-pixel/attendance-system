import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Lock, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCMS } from '../../contexts/CMSContext';

export default function PublicNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { cmsData, loading: cmsLoading } = useCMS();
  const [navLinks, setNavLinks] = useState<Array<{ label: string; href: string }>>([
    { label: 'الرئيسية', href: '/' },
    { label: 'الخدمات', href: '/services' },
    { label: 'المميزات', href: '#features' },
    { label: 'الأسعار والباقات', href: '/pricing' },
    { label: 'الأسئلة الشائعة', href: '#faq' },
    { label: 'تواصل معنا', href: '/contact' },
  ]);

  const [siteName, setSiteName] = useState('منصة تعليم');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    // Load dynamic settings from CMS if available
    const saved = localStorage.getItem('lms_site_config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        if (config.navbarLinks && config.navbarLinks.length > 0) {
          setNavLinks(config.navbarLinks);
        }
        if (config.platformName) {
          setSiteName(config.platformName);
        }
        if (config.logoUrl) {
          setLogoUrl(config.logoUrl);
        }
      } catch (e) {
        console.error('[PublicNavbar] Error parsing local site config:', e);
      }
    } else if (!cmsLoading && cmsData?.general?.site_name) {
      setSiteName(cmsData.general.site_name);
    }
  }, [cmsData, cmsLoading]);

  const renderLink = (link: { label: string; href: string }, isMobile = false) => {
    const isHash = link.href.startsWith('#');
    const baseClass = isMobile
      ? 'text-dark-muted hover:text-white py-2 transition-colors font-medium block text-right'
      : 'text-dark-muted hover:text-white transition-colors font-medium';

    if (isHash) {
      return (
        <a
          key={link.href + link.label}
          href={link.href}
          onClick={() => isMobile && setIsMenuOpen(false)}
          className={baseClass}
        >
          {link.label}
        </a>
      );
    }

    return (
      <Link
        key={link.href + link.label}
        to={link.href}
        onClick={() => isMobile && setIsMenuOpen(false)}
        className={baseClass}
      >
        {link.label}
      </Link>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-bg/80 backdrop-blur-xl border-b border-dark-border" dir="rtl">
      <div className="max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 flex-row">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-xl" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg shadow-brand-primary/20">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            )}
            <span className="text-xl font-bold text-white">{siteName}</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8 flex-row">
            {navLinks.map((link) => renderLink(link, false))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4 flex-row">
            <button
              onClick={() => navigate('/login')}
              className="btn-primary flex items-center gap-2"
            >
              <Lock className="w-5 h-5" />
              بوابة التحضير
            </button>
            <Link to="/lms" className="btn-secondary flex items-center gap-2 border border-brand-primary/50 text-brand-primary hover:bg-brand-primary/10">
              <BookOpen className="w-4 h-4" />
              بوابة LMS الأكاديمية
            </Link>
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
          <div className="md:hidden py-6 border-t border-dark-border animate-fade-in text-right">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => renderLink(link, true))}
              <div className="flex flex-col gap-3 pt-4 border-t border-dark-border">
                <button
                  onClick={() => {
                    navigate('/login');
                    setIsMenuOpen(false);
                  }}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Lock className="w-5 h-5" />
                  بوابة التحضير
                </button>
                <Link
                  to="/lms"
                  onClick={() => setIsMenuOpen(false)}
                  className="btn-secondary w-full flex items-center justify-center gap-2 border border-brand-primary/50 text-brand-primary"
                >
                  <BookOpen className="w-4 h-4" />
                  بوابة LMS الأكاديمية
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
