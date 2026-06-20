import { useState } from 'react';
import { CheckCircle, CreditCard, X, Upload, MessageSquare, AlertCircle, Check, RefreshCw } from 'lucide-react';
import PublicLayout from './PublicLayout';
import { useCMS } from '../../contexts/CMSContext';
import { db } from '../../lib/supabase';

export default function PricingPage() {
  const { cmsData, loading } = useCMS();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | null>(null);
  const [selectedPlanName, setSelectedPlanName] = useState('');
  
    // Form fields
  const [fullName, setFullName] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptFileName, setReceiptFileName] = useState('');
  
  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (loading || !cmsData) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full"></div>
        </div>
      </PublicLayout>
    );
  }

  const handleOpenSubscribe = (plan: any) => {
    let planType: 'basic' | 'premium' = 'basic';
    if (plan.id === 2 || plan.price === '599') {
      planType = 'premium';
    }
    setSelectedPlan(planType);
    setSelectedPlanName(plan.name);
    
    // Reset form
    setFullName('');
    setUniversityName('');
    setUsername('');
    setPassword('');
    setPhone('');
    setReceiptFile(null);
    setReceiptFileName('');
    setErrorMsg('');
    setSuccess(false);
    
    setModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert("حجم الملف يجب ألا يتجاوز 10 ميجابايت");
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert("الملفات المسموح بها هي صور JPG/PNG أو ملفات PDF فقط");
      return;
    }
    
    setReceiptFile(file);
    setReceiptFileName(file.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile) {
      setErrorMsg("يرجى إرفاق إيصال الدفع");
      return;
    }
    setSubmitting(true);
    setErrorMsg('');

    try {
      const receiptUrl = await db.uploadReceipt(receiptFile);
      await db.createNewCustomer({
        full_name: fullName,
        university_name: universityName,
        username,
        password,
        phone,
        plan_type: selectedPlan as any,
        receipt_file: receiptUrl,
      });
      setSuccess(true);
    } catch (err: any) {
      console.error('[PricingPage] Submit error:', err);
      setErrorMsg(`حدث خطأ أثناء إرسال الطلب: ${err?.message || 'يرجى المحاولة مرة أخرى'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // WhatsApp helper
  const whatsappNumber = cmsData.contact.whatsapp.replace(/\D/g, '') || '966501234567';
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`مرحباً إدارة منصة حضورك الذكي، أرغب في الحصول على بيانات التحويل والحساب البنكي للاشتراك في (${selectedPlanName || 'الخطة'}).`)}`;

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{cmsData.pricing.page_title}</h1>
          <p className="text-dark-muted text-xl">{cmsData.pricing.page_subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {cmsData.pricing.plans.map((plan) => (
            <div key={plan.id} className={`glass-card p-8 relative ${plan.popular ? 'border-brand-primary scale-105 shadow-xl shadow-brand-primary/10' : ''}`}>
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
              {plan.price === 'مخصصة' ? (
                <a 
                  href="/contact" 
                  className="w-full inline-flex items-center justify-center btn-secondary text-center py-3 rounded-xl font-semibold transition"
                >
                  اتصل بنا
                </a>
              ) : (
                <button 
                  onClick={() => handleOpenSubscribe(plan)}
                  className={`w-full py-3 rounded-xl font-semibold cursor-pointer transition ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                >
                  اشترك الآن
                </button>
              )}
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

      {/* Subscription Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !submitting && setModalOpen(false)} />
          <div className="relative glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 animate-slide-up">
            
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-dark-border">
              <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-brand-primary" />
                طلب اشتراك جديد - {selectedPlanName}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="p-2 rounded-lg hover:bg-dark-hover text-dark-muted hover:text-white transition-all disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {success ? (
              <div className="text-center py-10 space-y-6">
                <div className="w-20 h-20 bg-brand-success/20 text-brand-success rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <Check className="w-10 h-10 animate-bounce" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">تم إرسال الطلب بنجاح!</h3>
                  <p className="text-brand-success bg-brand-success/10 border border-brand-success/20 p-4 rounded-xl max-w-md mx-auto leading-relaxed">
                    تم استلام طلبك بنجاح، وسيتم مراجعته من قبل الإدارة والتواصل معك قريباً.
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="btn-primary px-8 py-3"
                >
                  حسناً
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 text-right">
                
                {/* Note Banner */}
                <div className="bg-brand-primary/10 border border-brand-primary/30 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-white leading-relaxed">
                    قبل رفع الإيصال يجب التواصل عبر الواتساب للحصول على رقم الحساب أو بيانات التحويل، ثم إرفاق إيصال السداد داخل النموذج.
                  </p>
                </div>

                {/* WhatsApp button */}
                <div className="text-center">
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand-success hover:bg-brand-success/90 text-white font-bold rounded-xl transition shadow-lg shadow-brand-success/10"
                  >
                    <MessageSquare className="w-5 h-5" />
                    التواصل عبر واتساب للحصول على بيانات الدفع
                  </a>
                </div>

                {errorMsg && (
                  <div className="bg-brand-danger/10 border border-brand-danger/30 text-brand-danger p-4 rounded-xl flex items-center gap-2 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-dark-muted">الاسم الرباعي *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="أدخل اسمك الكامل"
                      className="w-full bg-dark-card border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-brand-primary"
                    />
                  </div>

                  {/* University Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-dark-muted">اسم الجامعة *</label>
                    <input
                      type="text"
                      required
                      value={universityName}
                      onChange={(e) => setUniversityName(e.target.value)}
                      placeholder="اسم الجامعة أو المعهد"
                      className="w-full bg-dark-card border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-brand-primary"
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-dark-muted">اسم المستخدم في منصة الجامعة *</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="مثال: الرقم الجامعي أو اسم المستخدم بالمنصة"
                      className="w-full bg-dark-card border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-brand-primary font-mono text-left"
                    />
                    <p className="text-xs text-dark-muted mt-1">المقصود هو بيانات الدخول الخاصة بمنصة الجامعة التعليمية وليس بيانات النظام</p>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-dark-muted">كلمة مرور منصة الجامعة *</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="أدخل كلمة مرور منصة الجامعة"
                      className="w-full bg-dark-card border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-brand-primary"
                    />
                    <p className="text-xs text-dark-muted mt-1">المقصود هو بيانات الدخول الخاصة بمنصة الجامعة التعليمية وليس بيانات النظام</p>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-bold text-dark-muted">رقم الجوال *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="مثال: 0501234567"
                      className="w-full bg-dark-card border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-brand-primary font-mono text-left"
                    />
                  </div>
                </div>

                {/* Receipt File */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-dark-muted">رفع إيصال السداد (صورة أو PDF) *</label>
                  <div className="p-6 border border-dashed border-dark-border rounded-xl text-center bg-dark-bg/30 relative">
                    <input
                      type="file"
                      required
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 mx-auto mb-2 text-brand-primary" />
                    {receiptFileName ? (
                      <p className="text-white text-sm font-semibold">{receiptFileName}</p>
                    ) : (
                      <>
                        <p className="text-white text-sm font-bold">انقر أو اسحب الملف هنا لرفعه</p>
                        <p className="text-xs text-dark-muted mt-1">الحد الأقصى للملف: 10MB (JPG, PNG, PDF)</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        جاري إرسال الطلب...
                      </>
                    ) : (
                      "إرسال الطلب"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    disabled={submitting}
                    className="px-6 py-3 border border-dark-border rounded-xl text-dark-muted hover:text-white hover:bg-dark-hover transition"
                  >
                    إلغاء
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}
    </PublicLayout>
  );
}
