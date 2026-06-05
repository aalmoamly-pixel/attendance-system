import { useState, useEffect } from 'react';
import { Save, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useCMS } from '../../contexts/CMSContext';
import type { CMSHomepage } from '../../types/database';

export default function HomepageEditor() {
  const { cmsData, loading, updateCMSData } = useCMS();
  const [formData, setFormData] = useState<CMSHomepage | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cmsData && !loading) {
      setFormData({ 
        ...cmsData.homepage,
        hero_quick_features: cmsData.homepage.hero_quick_features || [],
        hero_subtitle_2: cmsData.homepage.hero_subtitle_2 || ''
      });
    }
  }, [cmsData, loading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setSaving(true);
    setError(null);
    try {
      await updateCMSData({ homepage: formData });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const addStat = () => {
    if (!formData) return;
    setFormData({
      ...formData,
      stats: [...formData.stats, { number: '', label: '' }],
    });
  };

  const removeStat = (index: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      stats: formData.stats.filter((_, i) => i !== index),
    });
  };

  const updateStat = (index: number, key: 'number' | 'label', value: string) => {
    if (!formData) return;
    const newStats = [...formData.stats];
    newStats[index] = { ...newStats[index], [key]: value };
    setFormData({ ...formData, stats: newStats });
  };

  const addQuickFeature = () => {
    if (!formData) return;
    setFormData({
      ...formData,
      hero_quick_features: [...formData.hero_quick_features, '']
    });
  };

  const removeQuickFeature = (index: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      hero_quick_features: formData.hero_quick_features.filter((_, i) => i !== index)
    });
  };

  const updateQuickFeature = (index: number, value: string) => {
    if (!formData) return;
    const newQuickFeatures = [...formData.hero_quick_features];
    newQuickFeatures[index] = value;
    setFormData({ ...formData, hero_quick_features: newQuickFeatures });
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
          <h2 className="text-3xl font-bold text-white mb-2">تحرير الصفحة الرئيسية</h2>
          <p className="text-dark-muted">قم بتعديل محتوى الصفحة الرئيسية</p>
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
          <h3 className="text-xl font-bold text-white">الجزء العلوي (Hero)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-dark-muted mb-2 font-medium">العنوان الرئيسي</label>
              <input
                type="text"
                value={formData.hero_title}
                onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                className="glass-input"
                placeholder="أدخل العنوان الرئيسي"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-dark-muted mb-2 font-medium">النص التعريفي</label>
              <textarea
                rows={3}
                value={formData.hero_subtitle}
                onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                className="glass-input resize-none"
                placeholder="أدخل النص التعريفي"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-dark-muted mb-2 font-medium">النص التعريفي الثاني</label>
              <textarea
                rows={2}
                value={formData.hero_subtitle_2}
                onChange={(e) => setFormData({ ...formData, hero_subtitle_2: e.target.value })}
                className="glass-input resize-none"
                placeholder="أدخل النص التعريفي الثاني"
              />
            </div>
            <div>
              <label className="block text-dark-muted mb-2 font-medium">نص الزر الرئيسي</label>
              <input
                type="text"
                value={formData.hero_button_primary}
                onChange={(e) => setFormData({ ...formData, hero_button_primary: e.target.value })}
                className="glass-input"
                placeholder="نص الزر"
              />
            </div>
            <div>
              <label className="block text-dark-muted mb-2 font-medium">رابط الزر الرئيسي</label>
              <input
                type="text"
                value={formData.hero_button_primary_link}
                onChange={(e) => setFormData({ ...formData, hero_button_primary_link: e.target.value })}
                className="glass-input"
                placeholder="رابط الزر"
              />
            </div>
            <div>
              <label className="block text-dark-muted mb-2 font-medium">نص الزر الثانوي</label>
              <input
                type="text"
                value={formData.hero_button_secondary}
                onChange={(e) => setFormData({ ...formData, hero_button_secondary: e.target.value })}
                className="glass-input"
                placeholder="نص الزر"
              />
            </div>
            <div>
              <label className="block text-dark-muted mb-2 font-medium">رابط الزر الثانوي</label>
              <input
                type="text"
                value={formData.hero_button_secondary_link}
                onChange={(e) => setFormData({ ...formData, hero_button_secondary_link: e.target.value })}
                className="glass-input"
                placeholder="رابط الزر"
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">مزايا سريعة في الجزء العلوي</h3>
            <button
              type="button"
              onClick={addQuickFeature}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة ميزة
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.hero_quick_features.map((feature, index) => (
              <div key={index} className="p-6 bg-dark-bg/50 rounded-xl border border-dark-border relative">
                <button
                  type="button"
                  onClick={() => removeQuickFeature(index)}
                  className="absolute top-2 left-2 text-brand-danger hover:text-brand-danger/80"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="pt-4">
                  <label className="block text-dark-muted mb-2 font-medium">الميزة</label>
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => updateQuickFeature(index, e.target.value)}
                    className="glass-input"
                    placeholder="أدخل الميزة"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">الإحصائيات</h3>
            <button
              type="button"
              onClick={addStat}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة إحصائية
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.stats.map((stat, index) => (
              <div key={index} className="p-6 bg-dark-bg/50 rounded-xl border border-dark-border relative">
                <button
                  type="button"
                  onClick={() => removeStat(index)}
                  className="absolute top-2 left-2 text-brand-danger hover:text-brand-danger/80"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="block text-dark-muted mb-2 font-medium">الرقم/القيمة</label>
                    <input
                      type="text"
                      value={stat.number}
                      onChange={(e) => updateStat(index, 'number', e.target.value)}
                      className="glass-input"
                      placeholder="مثال: 1000+"
                    />
                  </div>
                  <div>
                    <label className="block text-dark-muted mb-2 font-medium">التسمية</label>
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => updateStat(index, 'label', e.target.value)}
                      className="glass-input"
                      placeholder="مثال: طالب"
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
