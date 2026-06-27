import { Link } from 'react-router-dom';
import { BookOpen, Mail, Phone, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCMS } from '../../contexts/CMSContext';

export default function PublicFooter() {
  const { cmsData, loading: cmsLoading } = useCMS();
  
  const [siteName, setSiteName] = useState('منصة تعليم');
  const [logoUrl, setLogoUrl] = useState('');
  const [phone, setPhone] = useState('0501234567');
  const [email, setEmail] = useState('info@smart-education.edu');
  const [address, setAddress] = useState('الرياض، المملكة العربية السعودية');
  const [socials, setSocials] = useState({
    facebook: 'https://facebook.com',
    twitter: 'https://twitter.com',
    instagram: 'https://instagram.com',
    linkedin: 'https://linkedin.com'
  });

  useEffect(() => {
    const saved = localStorage.getItem('lms_site_config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        if (config.platformName) {
          setSiteName(config.platformName);
        }
        if (config.logoUrl) {
          setLogoUrl(config.logoUrl);
        }
        if (config.contactPhone) {
          setPhone(config.contactPhone);
        }
        if (config.contactEmail) {
          setEmail(config.contactEmail);
        }
        if (config.contactAddress) {
          setAddress(config.contactAddress);
        }
        setSocials({
          facebook: config.socialFacebook || 'https://facebook.com',
          twitter: config.socialTwitter || 'https://twitter.com',
          instagram: config.socialInstagram || 'https://instagram.com',
          linkedin: config.socialLinkedin || 'https://linkedin.com'
        });
      } catch (e) {
        console.error('[PublicFooter] Error parsing local site config:', e);
      }
    } else if (!cmsLoading && cmsData) {
      if (cmsData.general?.site_name) setSiteName(cmsData.general.site_name);
      if (cmsData.contact?.phone) setPhone(cmsData.contact.phone);
      if (cmsData.contact?.email) setEmail(cmsData.contact.email);
      if (cmsData.contact?.address) setAddress(cmsData.contact.address);
    }
  }, [cmsData, cmsLoading]);

  const copyright = `© ${new Date().getFullYear()} ${siteName}. جميع الحقوق محفوظة.`;

  return (
    <footer className="bg-dark-card border-t border-dark-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* About */}
          <div className="lg:col-span-1 text-right" dir="rtl">
            <Link to="/" className="flex items-center gap-3 mb-4 justify-start">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-xl" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              )}
              <span className="text-xl font-bold text-white">{siteName}</span>
            </Link>
            <p className="text-dark-muted mb-6 text-xs leading-relaxed">
              {cmsLoading || !cmsData ? 'منصة تعليمية متكاملة للخدمات الأكاديمية ونظام التعلم الإلكتروني الحديث.' : cmsData.general.site_description}
            </p>
            {/* Social Media Channels */}
            <div className="flex items-center gap-3 justify-start">
              {socials.facebook && (
                <a href={socials.facebook} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-brand-primary transition-all" title="فيسبوك">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
              )}
              {socials.twitter && (
                <a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-brand-primary transition-all" title="تويتر">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                  </svg>
                </a>
              )}
              {socials.instagram && (
                <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-brand-primary transition-all" title="إنستغرام">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
              )}
              {socials.linkedin && (
                <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-brand-primary transition-all" title="لينكد إن">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
              )}
            </div>
          </div>


          {/* Quick Links */}
          <div className="text-right" dir="rtl">
            <h3 className="text-white font-bold text-lg mb-4">روابط سريعة</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-dark-muted hover:text-white transition-colors text-xs">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-dark-muted hover:text-white transition-colors text-xs">
                  من نحن
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-dark-muted hover:text-white transition-colors text-xs">
                  الخدمات
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-dark-muted hover:text-white transition-colors text-xs">
                  الأسعار
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="text-right" dir="rtl">
            <h3 className="text-white font-bold text-lg mb-4">القانونية</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy" className="text-dark-muted hover:text-white transition-colors text-xs">
                  سياسة الخصوصية
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-dark-muted hover:text-white transition-colors text-xs">
                  الشروط والأحكام
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-dark-muted hover:text-white transition-colors text-xs">
                  تواصل معنا
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="text-right" dir="rtl">
            <h3 className="text-white font-bold text-lg mb-4">تواصل معنا</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-dark-muted justify-start">
                <Mail className="w-5 h-5 text-brand-primary flex-shrink-0" />
                <span className="text-xs font-mono">{email}</span>
              </li>
              <li className="flex items-center gap-3 text-dark-muted justify-start">
                <Phone className="w-5 h-5 text-brand-primary flex-shrink-0" />
                <span className="text-xs font-mono">{phone}</span>
              </li>
              <li className="flex items-center gap-3 text-dark-muted justify-start">
                <MapPin className="w-5 h-5 text-brand-primary flex-shrink-0" />
                <span className="text-xs">{address}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-border pt-8 text-center">
          <p className="text-dark-muted text-xs">
            {copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
