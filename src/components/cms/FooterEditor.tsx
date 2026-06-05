import { useState, useEffect } from 'react';
import { Save, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useCMS } from '../../contexts/CMSContext';
import type { CMSFooter } from '../../types/database';

export default function FooterEditor() {
  const { cmsData, loading, updateCMSData } = useCMS();
  const [formData, setFormData] = useState<CMSFooter | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (cmsData && !loading) {
      setFormData({ ...cmsData.footer });
    }
  }, [cmsData, loading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setSaving(true);
    try {
      await updateCMSData({ footer: formData });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const addQuickLink = () => {
    if (!formData) return;
    setFormData({
      ...formData,
      quick_links: [...formData.quick_links, { label: '', url: '' }],
    });
  };

  const removeQuickLink = (index: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      quick_links: formData.quick_links.filter((_, i) => i !== index),
    });
  };

  const updateQuickLink = (index: number, key: 'label' | 'url', value: string) => {
    if (!formData) return;
    const newQuickLinks = [...formData.quick_links];
    newQuickLinks[index] = { ...newQuickLinks[index], [key]: value };
    setFormData({ ...formData, quick_links: newQuickLinks });
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
          <h2 className="text-3xl font-bold text-white mb-2">تحرير الفوتر</h2>
          <p className="text-dark-muted">قم بتعديل محتوى الفوتر</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-brand-success bg-brand-success/10 px-4 py-2 rounded-xl">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">تم الحفظ بنجاح!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="glass-card p-8 space-y-6">
          <h3 className="text-xl font-bold text-white">المعلومات الأساسية</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-dark-muted mb-2 font-medium">نص حقوق النشر</label>
              <input
                type="text"
                value={formData.copyright_text}
                onChange={(e) => setFormData({ ...formData, copyright_text: e.target.value })}
                className="glass-input"
                placeholder="أدخل نص حقوق النشر"
              />
            </div>
            <div>
              <label className="block text-dark-muted mb-2 font-medium">رابط الشروط والأحكام</label>
              <input
                type="text"
                value={formData.terms_url}
                onChange={(e) => setFormData({ ...formData, terms_url: e.target.value })}
                className="glass-input"
                placeholder="/terms"
              />
            </div>
            <div>
              <label className="block text-dark-muted mb-2 font-medium">رابط سياسة الخصوصية</label>
              <input
                type="text"
                value={formData.privacy_url}
                onChange={(e) => setFormData({ ...formData, privacy_url: e.target.value })}
                className="glass-input"
                placeholder="/privacy"
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">روابط سريعة</h3>
            <button
              type="button"
              onClick={addQuickLink}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة رابط
            </button>
          </div>
          <div className="space-y-4">
            {formData.quick_links.map((link, index) => (
              <div key={index} className="p-6 bg-dark-bg/50 rounded-xl border border-dark-border relative">
                <button
                  type="button"
                  onClick={() => removeQuickLink(index)}
                  className="absolute top-2 left-2 text-brand-danger hover:text-brand-danger/80"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div>
                    <label className="block text-dark-muted mb-2 font-medium">العنوان</label>
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => updateQuickLink(index, 'label', e.target.value)}
                      className="glass-input"
                      placeholder="العنوان"
                    />
                  </div>
                  <div>
                    <label className="block text-dark-muted mb-2 font-medium">الرابط</label>
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => updateQuickLink(index, 'url', e.target.value)}
                      className="glass-input"
                      placeholder="الرابط"
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
