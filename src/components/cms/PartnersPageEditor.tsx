import { useState, useEffect } from 'react';
import { Save, AlertCircle, Plus, Trash2, Copy, Check, ExternalLink } from 'lucide-react';
import { useCMS } from '../../contexts/CMSContext';
import type { CMSPartnerPage } from '../../types/database';

export default function PartnersPageEditor() {
  const { cmsData, loading, updateCMSData } = useCMS();
  const [formData, setFormData] = useState<CMSPartnerPage | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (cmsData && !loading) {
      setFormData({ ...cmsData.partners });
    }
  }, [cmsData, loading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setSaving(true);
    try {
      await updateCMSData({ partners: formData });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.origin + '/partners');
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading || !formData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">تحرير صفحة شركاء الدفع</h2>
          <p className="text-dark-muted">قم بتعديل محتوى صفحة الشركاء</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={copyLink}
            className="btn-secondary flex items-center gap-2"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? 'تم نسخ الرابط' : 'نسخ رابط الصفحة'}
          </button>
          <a
            href="/partners"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center gap-2"
          >
            <ExternalLink className="w-5 h-5" />
            عرض الصفحة
          </a>
          {saved && (
            <div className="flex items-center gap-2 text-brand-success bg-brand-success/10 px-4 py-2 rounded-xl">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">تم الحفظ بنجاح!</span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="glass-card p-8 space-y-6">
          <h3 className="text-xl font-bold text-white">الإعدادات الأساسية</h3>
          <div className="flex items-center gap-4">
            <label className="text-dark-muted">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2 w-5 h-5"
              />
              تفعيل الصفحة
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-dark-muted mb-2 font-medium">عنوان الصفحة</label>
              <input
                type="text"
                value={formData.pageTitle}
                onChange={(e) => setFormData({ ...formData, pageTitle: e.target.value })}
                className="glass-input"
              />
            </div>
            <div>
              <label className="block text-dark-muted mb-2 font-medium">العنوان الفرعي</label>
              <input
                type="text"
                value={formData.pageSubtitle}
                onChange={(e) => setFormData({ ...formData, pageSubtitle: e.target.value })}
                className="glass-input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-dark-muted mb-2 font-medium">نبذة عن المنصة</label>
              <textarea
                rows={4}
                value={formData.aboutUs}
                onChange={(e) => setFormData({ ...formData, aboutUs: e.target.value })}
                className="glass-input resize-none"
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-8 space-y-6">
          <h3 className="text-xl font-bold text-white">الإحصائيات</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-dark-muted mb-2 font-medium">عدد الطلاب</label>
              <input
                type="text"
                value={formData.totalStudents}
                onChange={(e) => setFormData({ ...formData, totalStudents: e.target.value })}
                className="glass-input"
              />
            </div>
            <div>
              <label className="block text-dark-muted mb-2 font-medium">عدد المستخدمين النشطين</label>
              <input
                type="text"
                value={formData.activeUsers}
                onChange={(e) => setFormData({ ...formData, activeUsers: e.target.value })}
                className="glass-input"
              />
            </div>
            <div>
              <label className="block text-dark-muted mb-2 font-medium">متوسط العمليات الشهرية</label>
              <input
                type="text"
                value={formData.avgMonthlyTransactions}
                onChange={(e) => setFormData({ ...formData, avgMonthlyTransactions: e.target.value })}
                className="glass-input"
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-8 space-y-6">
          <h3 className="text-xl font-bold text-white">طرق الدفع الحالية</h3>
          <div className="space-y-3">
            {formData.currentPaymentMethods.map((method, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="text"
                  value={method}
                  onChange={(e) => {
                    const newMethods = [...formData.currentPaymentMethods];
                    newMethods[index] = e.target.value;
                    setFormData({ ...formData, currentPaymentMethods: newMethods });
                  }}
                  className="glass-input flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newMethods = formData.currentPaymentMethods.filter((_, i) => i !== index);
                    setFormData({ ...formData, currentPaymentMethods: newMethods });
                  }}
                  className="p-3 rounded-xl bg-brand-danger/10 text-brand-danger hover:bg-brand-danger/20 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setFormData({
                ...formData,
                currentPaymentMethods: [...formData.currentPaymentMethods, '']
              })}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة طريقة دفع
            </button>
          </div>
        </div>

        <div className="glass-card p-8 space-y-6">
          <h3 className="text-xl font-bold text-white">مميزات المنصة</h3>
          <div className="space-y-4">
            {formData.platformFeatures.map((feature, index) => (
              <div key={feature.id} className="p-6 bg-dark-bg/50 rounded-xl border border-dark-border relative">
                <button
                  type="button"
                  onClick={() => {
                    const newFeatures = formData.platformFeatures.filter((_, i) => i !== index);
                    setFormData({ ...formData, platformFeatures: newFeatures });
                  }}
                  className="absolute top-2 left-2 text-brand-danger hover:text-brand-danger/80"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="grid grid-cols-1 gap-4 pt-4">
                  <div>
                    <label className="block text-dark-muted mb-2 font-medium">العنوان</label>
                    <input
                      type="text"
                      value={feature.title}
                      onChange={(e) => {
                        const newFeatures = [...formData.platformFeatures];
                        newFeatures[index] = { ...newFeatures[index], title: e.target.value };
                        setFormData({ ...formData, platformFeatures: newFeatures });
                      }}
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <label className="block text-dark-muted mb-2 font-medium">الوصف</label>
                    <textarea
                      rows={2}
                      value={feature.description}
                      onChange={(e) => {
                        const newFeatures = [...formData.platformFeatures];
                        newFeatures[index] = { ...newFeatures[index], description: e.target.value };
                        setFormData({ ...formData, platformFeatures: newFeatures });
                      }}
                      className="glass-input resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const newId = Date.now();
                setFormData({
                  ...formData,
                  platformFeatures: [...formData.platformFeatures, { id: newId, title: '', description: '' }]
                });
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة مميزة
            </button>
          </div>
        </div>

        <div className="glass-card p-8 space-y-6">
          <h3 className="text-xl font-bold text-white">لوحة الإحصائيات</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-dark-muted mb-2 font-medium">عدد الطلاب</label>
              <input
                type="text"
                value={formData.dashboardStats.studentsCount}
                onChange={(e) => setFormData({
                  ...formData,
                  dashboardStats: { ...formData.dashboardStats, studentsCount: e.target.value }
                })}
                className="glass-input"
              />
            </div>
            <div>
              <label className="block text-dark-muted mb-2 font-medium">عدد المدفوعات</label>
              <input
                type="text"
                value={formData.dashboardStats.paymentsCount}
                onChange={(e) => setFormData({
                  ...formData,
                  dashboardStats: { ...formData.dashboardStats, paymentsCount: e.target.value }
                })}
                className="glass-input"
              />
            </div>
            <div>
              <label className="block text-dark-muted mb-2 font-medium">إجمالي الرسوم</label>
              <input
                type="text"
                value={formData.dashboardStats.totalRevenue}
                onChange={(e) => setFormData({
                  ...formData,
                  dashboardStats: { ...formData.dashboardStats, totalRevenue: e.target.value }
                })}
                className="glass-input"
              />
            </div>
            <div>
              <label className="block text-dark-muted mb-2 font-medium">عدد العمليات المعلقة</label>
              <input
                type="text"
                value={formData.dashboardStats.pendingCount}
                onChange={(e) => setFormData({
                  ...formData,
                  dashboardStats: { ...formData.dashboardStats, pendingCount: e.target.value }
                })}
                className="glass-input"
              />
            </div>
            <div>
              <label className="block text-dark-muted mb-2 font-medium">نسبة السداد</label>
              <input
                type="text"
                value={formData.dashboardStats.paymentRate}
                onChange={(e) => setFormData({
                  ...formData,
                  dashboardStats: { ...formData.dashboardStats, paymentRate: e.target.value }
                })}
                className="glass-input"
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-8 space-y-6">
          <h3 className="text-xl font-bold text-white">معرض الصور</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.screenshots.map((screenshot, index) => (
              <div key={screenshot.id} className="p-6 bg-dark-bg/50 rounded-xl border border-dark-border relative">
                <button
                  type="button"
                  onClick={() => {
                    const newScreenshots = formData.screenshots.filter((_, i) => i !== index);
                    setFormData({ ...formData, screenshots: newScreenshots });
                  }}
                  className="absolute top-2 left-2 text-brand-danger hover:text-brand-danger/80"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="grid grid-cols-1 gap-4 pt-4">
                  <div>
                    <label className="block text-dark-muted mb-2 font-medium">العنوان</label>
                    <input
                      type="text"
                      value={screenshot.title}
                      onChange={(e) => {
                        const newScreenshots = [...formData.screenshots];
                        newScreenshots[index] = { ...newScreenshots[index], title: e.target.value };
                        setFormData({ ...formData, screenshots: newScreenshots });
                      }}
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <label className="block text-dark-muted mb-2 font-medium">الوصف</label>
                    <textarea
                      rows={2}
                      value={screenshot.description}
                      onChange={(e) => {
                        const newScreenshots = [...formData.screenshots];
                        newScreenshots[index] = { ...newScreenshots[index], description: e.target.value };
                        setFormData({ ...formData, screenshots: newScreenshots });
                      }}
                      className="glass-input resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-dark-muted mb-2 font-medium">رابط الصورة</label>
                    <input
                      type="text"
                      value={screenshot.imageUrl}
                      onChange={(e) => {
                        const newScreenshots = [...formData.screenshots];
                        newScreenshots[index] = { ...newScreenshots[index], imageUrl: e.target.value };
                        setFormData({ ...formData, screenshots: newScreenshots });
                      }}
                      className="glass-input"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              const newId = Date.now();
              setFormData({
                ...formData,
                screenshots: [...formData.screenshots, { id: newId, title: '', description: '', imageUrl: '' }]
              });
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            إضافة صورة
          </button>
        </div>

        <div className="glass-card p-8 space-y-6">
          <h3 className="text-xl font-bold text-white">جاهزية التكامل</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-dark-muted mb-2 font-medium">عنوان القسم</label>
              <input
                type="text"
                value={formData.integrationReadyTitle}
                onChange={(e) => setFormData({ ...formData, integrationReadyTitle: e.target.value })}
                className="glass-input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-dark-muted mb-2 font-medium">وصف القسم</label>
              <textarea
                rows={3}
                value={formData.integrationReadyDescription}
                onChange={(e) => setFormData({ ...formData, integrationReadyDescription: e.target.value })}
                className="glass-input resize-none"
              />
            </div>
          </div>
          <h4 className="text-lg font-bold text-white mt-4">طرق الدفع المتاحة للتكامل</h4>
          <div className="space-y-3">
            {formData.integrationMethods.map((method, index) => (
              <div key={method.id} className="flex items-center gap-3">
                <input
                  type="text"
                  value={method.name}
                  onChange={(e) => {
                    const newMethods = [...formData.integrationMethods];
                    newMethods[index] = { ...newMethods[index], name: e.target.value };
                    setFormData({ ...formData, integrationMethods: newMethods });
                  }}
                  className="glass-input flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newMethods = formData.integrationMethods.filter((_, i) => i !== index);
                    setFormData({ ...formData, integrationMethods: newMethods });
                  }}
                  className="p-3 rounded-xl bg-brand-danger/10 text-brand-danger hover:bg-brand-danger/20 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const newId = Date.now();
                setFormData({
                  ...formData,
                  integrationMethods: [...formData.integrationMethods, { id: newId, name: '' }]
                });
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة طريقة دفع للتكامل
            </button>
          </div>
        </div>

        <div className="glass-card p-8 space-y-6">
          <h3 className="text-xl font-bold text-white">الأمان والخصوصية</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-dark-muted mb-2 font-medium">عنوان القسم</label>
              <input
                type="text"
                value={formData.securityTitle}
                onChange={(e) => setFormData({ ...formData, securityTitle: e.target.value })}
                className="glass-input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-dark-muted mb-2 font-medium">وصف القسم</label>
              <textarea
                rows={3}
                value={formData.securityDescription}
                onChange={(e) => setFormData({ ...formData, securityDescription: e.target.value })}
                className="glass-input resize-none"
              />
            </div>
          </div>
          <h4 className="text-lg font-bold text-white mt-4">مميزات الأمان</h4>
          <div className="space-y-3">
            {formData.securityFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => {
                    const newFeatures = [...formData.securityFeatures];
                    newFeatures[index] = e.target.value;
                    setFormData({ ...formData, securityFeatures: newFeatures });
                  }}
                  className="glass-input flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newFeatures = formData.securityFeatures.filter((_, i) => i !== index);
                    setFormData({ ...formData, securityFeatures: newFeatures });
                  }}
                  className="p-3 rounded-xl bg-brand-danger/10 text-brand-danger hover:bg-brand-danger/20 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setFormData({
                ...formData,
                securityFeatures: [...formData.securityFeatures, '']
              })}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة مميزة أمان
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'جار الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </form>
    </div>
  );
}
