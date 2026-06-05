import { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { useCMS } from '../../contexts/CMSContext';
import type { CMSGeneralSettings } from '../../types/database';

export default function GeneralSettings() {
  const { cmsData, loading, updateCMSData, refreshCMSData } = useCMS();
  const [formData, setFormData] = useState<CMSGeneralSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cmsData && !loading) {
      setFormData({ ...cmsData.general });
    }
  }, [cmsData, loading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setSaving(true);
    setError(null);
    try {
      await updateCMSData({ general: formData });
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
          <h2 className="text-3xl font-bold text-white mb-2">الإعدادات العامة</h2>
          <p className="text-dark-muted">قم بتعديل معلومات المنصة الأساسية</p>
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

      <form onSubmit={handleSave} className="glass-card p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-dark-muted mb-2 font-medium">اسم المنصة</label>
            <input
              type="text"
              value={formData.site_name}
              onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
              className="glass-input"
              placeholder="أدخل اسم المنصة"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-dark-muted mb-2 font-medium">وصف المنصة</label>
            <textarea
              rows={4}
              value={formData.site_description}
              onChange={(e) => setFormData({ ...formData, site_description: e.target.value })}
              className="glass-input resize-none"
              placeholder="أدخل وصف للمنصة"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-dark-muted mb-2 font-medium">نص حقوق النشر</label>
            <input
              type="text"
              value={formData.copyright_text}
              onChange={(e) => setFormData({ ...formData, copyright_text: e.target.value })}
              className="glass-input"
              placeholder="أدخل نص حقوق النشر"
            />
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
