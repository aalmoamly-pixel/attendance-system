import { useState, useEffect } from 'react';
import { Save, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useCMS } from '../../contexts/CMSContext';
import type { CMSServicesPage, CMSService } from '../../types/database';

export default function ServicesPageEditor() {
  const { cmsData, loading, updateCMSData, refreshCMSData } = useCMS();
  const [formData, setFormData] = useState<CMSServicesPage | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cmsData && !loading) {
      setFormData({ ...cmsData.services });
    }
  }, [cmsData, loading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setSaving(true);
    setError(null);
    try {
      await updateCMSData({ services: formData });
      await refreshCMSData();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const addService = () => {
    if (!formData) return;
    const newService: CMSService = { id: Date.now(), icon: 'FileText', title: '', description: '' };
    setFormData({
      ...formData,
      services: [...formData.services, newService],
    });
  };

  const removeService = (index: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      services: formData.services.filter((_, i) => i !== index),
    });
  };

  const updateService = (index: number, key: keyof CMSService, value: string) => {
    if (!formData) return;
    const newServices = [...formData.services];
    newServices[index] = { ...newServices[index], [key]: value };
    setFormData({ ...formData, services: newServices });
  };

  const iconOptions = ['FileText', 'BookOpen', 'Calendar', 'Award', 'CreditCard', 'MessageSquare', 'Users'];

  if (loading || !formData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">تحرير صفحة الخدمات</h2>
          <p className="text-dark-muted">قم بتعديل محتوى صفحة الخدمات</p>
        </div>
        <div className="flex items-center gap-4">
          {error && (
            <div className="flex items-center gap-2 text-brand-danger bg-brand-danger/10 px-4 py-2 rounded-xl">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{error}</span>
            </div>
          )}
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
          <h3 className="text-xl font-bold text-white">معلومات أساسية</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-dark-muted mb-2 font-medium">عنوان الصفحة</label>
              <input
                type="text"
                value={formData.page_title}
                onChange={(e) => setFormData({ ...formData, page_title: e.target.value })}
                className="glass-input"
                placeholder="أدخل عنوان الصفحة"
              />
            </div>
            <div>
              <label className="block text-dark-muted mb-2 font-medium">نص فرعي للصفحة</label>
              <textarea
                rows={3}
                value={formData.page_subtitle}
                onChange={(e) => setFormData({ ...formData, page_subtitle: e.target.value })}
                className="glass-input resize-none"
                placeholder="أدخل نص فرعي للصفحة"
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">الخدمات</h3>
            <button
              type="button"
              onClick={addService}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة خدمة
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.services.map((service, index) => (
              <div key={index} className="p-6 bg-dark-bg/50 rounded-xl border border-dark-border relative">
                <button
                  type="button"
                  onClick={() => removeService(index)}
                  className="absolute top-2 left-2 text-brand-danger hover:text-brand-danger/80"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="block text-dark-muted mb-2 font-medium">الأيقونة</label>
                    <select
                      value={service.icon}
                      onChange={(e) => updateService(index, 'icon', e.target.value)}
                      className="glass-input"
                    >
                      {iconOptions.map((icon) => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-dark-muted mb-2 font-medium">العنوان</label>
                    <input
                      type="text"
                      value={service.title}
                      onChange={(e) => updateService(index, 'title', e.target.value)}
                      className="glass-input"
                      placeholder="أدخل عنوان الخدمة"
                    />
                  </div>
                  <div>
                    <label className="block text-dark-muted mb-2 font-medium">الوصف</label>
                    <textarea
                      rows={3}
                      value={service.description}
                      onChange={(e) => updateService(index, 'description', e.target.value)}
                      className="glass-input resize-none"
                      placeholder="أدخل وصف للخدمة"
                    />
                  </div>
                </div>
              </div>
            ))}
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
