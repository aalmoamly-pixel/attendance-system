import { useState, useEffect } from 'react';
import { Save, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useCMS } from '../../contexts/CMSContext';
import type { CMSContactPage } from '../../types/database';

export default function ContactPageEditor() {
  const { cmsData, loading, updateCMSData, refreshCMSData } = useCMS();
  const [formData, setFormData] = useState<CMSContactPage | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cmsData && !loading) {
      setFormData({ ...cmsData.contact });
    }
  }, [cmsData, loading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setSaving(true);
    setError(null);
    try {
      await updateCMSData({ contact: formData });
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

  const addSocialLink = () => {
    if (!formData) return;
    setFormData({
      ...formData,
      social_links: [...formData.social_links, { platform: '', url: '' }],
    });
  };

  const removeSocialLink = (index: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      social_links: formData.social_links.filter((_, i) => i !== index),
    });
  };

  const updateSocialLink = (index: number, key: 'platform' | 'url', value: string) => {
    if (!formData) return;
    const newSocialLinks = [...formData.social_links];
    newSocialLinks[index] = { ...newSocialLinks[index], [key]: value };
    setFormData({ ...formData, social_links: newSocialLinks });
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
          <h2 className="text-3xl font-bold text-white mb-2">تحرير صفحة التواصل</h2>
          <p className="text-dark-muted">قم بتعديل معلومات التواصل</p>
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
          <h3 className="text-xl font-bold text-white">معلومات التواصل</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-dark-muted mb-2 font-medium">البريد الإلكتروني</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="glass-input"
                placeholder="أدخل البريد الإلكتروني"
              />
            </div>
            <div>
              <label className="block text-dark-muted mb-2 font-medium">الهاتف</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="glass-input"
                placeholder="أدخل رقم الهاتف"
              />
            </div>
            <div>
              <label className="block text-dark-muted mb-2 font-medium">واتساب</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="glass-input"
                placeholder="أدخل رقم واتساب"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-dark-muted mb-2 font-medium">العنوان</label>
              <textarea
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="glass-input resize-none"
                placeholder="أدخل العنوان"
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">روابط وسائل التواصل الاجتماعي</h3>
            <button
              type="button"
              onClick={addSocialLink}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة رابط
            </button>
          </div>
          <div className="space-y-4">
            {formData.social_links.map((link, index) => (
              <div key={index} className="p-6 bg-dark-bg/50 rounded-xl border border-dark-border relative">
                <button
                  type="button"
                  onClick={() => removeSocialLink(index)}
                  className="absolute top-2 left-2 text-brand-danger hover:text-brand-danger/80"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div>
                    <label className="block text-dark-muted mb-2 font-medium">المنصة</label>
                    <input
                      type="text"
                      value={link.platform}
                      onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                      className="glass-input"
                      placeholder="مثال: فيسبوك"
                    />
                  </div>
                  <div>
                    <label className="block text-dark-muted mb-2 font-medium">الرابط</label>
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                      className="glass-input"
                      placeholder="أدخل الرابط"
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
