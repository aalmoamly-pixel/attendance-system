import { useState, useEffect } from 'react';
import { Save, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useCMS } from '../../contexts/CMSContext';
import type { CMSAboutPage, CMSFeature } from '../../types/database';

export default function AboutPageEditor() {
  const { cmsData, loading, updateCMSData } = useCMS();
  const [formData, setFormData] = useState<CMSAboutPage | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (cmsData && !loading) {
      setFormData({ ...cmsData.about });
    }
  }, [cmsData, loading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setSaving(true);
    try {
      await updateCMSData({ about: formData });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => {
    if (!formData) return;
    const newFeature: CMSFeature = { id: Date.now(), title: '', description: '', icon: 'BookOpen' };
    setFormData({
      ...formData,
      features: [...formData.features, newFeature],
    });
  };

  const removeFeature = (index: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const updateFeature = (index: number, key: keyof CMSFeature, value: string) => {
    if (!formData) return;
    const newFeatures = [...formData.features];
    newFeatures[index] = { ...newFeatures[index], [key]: value };
    setFormData({ ...formData, features: newFeatures });
  };

  const addGoal = () => {
    if (!formData) return;
    setFormData({
      ...formData,
      goals: [...formData.goals, ''],
    });
  };

  const removeGoal = (index: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      goals: formData.goals.filter((_, i) => i !== index),
    });
  };

  const updateGoal = (index: number, value: string) => {
    if (!formData) return;
    const newGoals = [...formData.goals];
    newGoals[index] = value;
    setFormData({ ...formData, goals: newGoals });
  };

  const iconOptions = ['BookOpen', 'Calendar', 'Award', 'CreditCard', 'MessageSquare', 'Users'];

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
          <h2 className="text-3xl font-bold text-white mb-2">تحرير صفحة من نحن</h2>
          <p className="text-dark-muted">قم بتعديل محتوى صفحة من نحن</p>
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
              <label className="block text-dark-muted mb-2 font-medium">نبذة عن المنصة</label>
              <textarea
                rows={4}
                value={formData.about_description}
                onChange={(e) => setFormData({ ...formData, about_description: e.target.value })}
                className="glass-input resize-none"
                placeholder="أدخل نبذة عن المنصة"
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">الأهداف</h3>
            <button
              type="button"
              onClick={addGoal}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة هدف
            </button>
          </div>
          <div className="space-y-4">
            {formData.goals.map((goal, index) => (
              <div key={index} className="flex items-center gap-4">
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => updateGoal(index, e.target.value)}
                  className="glass-input flex-1"
                  placeholder="أدخل الهدف"
                />
                <button
                  type="button"
                  onClick={() => removeGoal(index)}
                  className="p-3 rounded-xl bg-brand-danger/10 text-brand-danger hover:bg-brand-danger/20 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">المميزات</h3>
            <button
              type="button"
              onClick={addFeature}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة مميزة
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.features.map((feature, index) => (
              <div key={index} className="p-6 bg-dark-bg/50 rounded-xl border border-dark-border relative">
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  className="absolute top-2 left-2 text-brand-danger hover:text-brand-danger/80"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="block text-dark-muted mb-2 font-medium">الأيقونة</label>
                    <select
                      value={feature.icon || 'BookOpen'}
                      onChange={(e) => updateFeature(index, 'icon', e.target.value)}
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
                      value={feature.title}
                      onChange={(e) => updateFeature(index, 'title', e.target.value)}
                      className="glass-input"
                      placeholder="أدخل عنوان المميزة"
                    />
                  </div>
                  <div>
                    <label className="block text-dark-muted mb-2 font-medium">الوصف</label>
                    <textarea
                      rows={3}
                      value={feature.description}
                      onChange={(e) => updateFeature(index, 'description', e.target.value)}
                      className="glass-input resize-none"
                      placeholder="أدخل وصف للمميزة"
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
