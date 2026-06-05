import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import PublicLayout from './PublicLayout';
import { useCMS } from '../../contexts/CMSContext';

export default function ContactPage() {
  const { cmsData, loading } = useCMS();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  if (loading || !cmsData) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full"></div>
        </div>
      </PublicLayout>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">تواصل معنا</h1>
          <p className="text-dark-muted text-xl">نحن هنا لمساعدتك في أي وقت</p>
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
    </PublicLayout>
  );
}
