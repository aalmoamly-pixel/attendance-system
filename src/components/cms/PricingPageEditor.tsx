import { useState, useEffect } from 'react';
import { Save, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useCMS } from '../../contexts/CMSContext';
import type { CMSPricingPage, CMSPricingPlan } from '../../types/database';

export default function PricingPageEditor() {
  const { cmsData, loading, updateCMSData, refreshCMSData } = useCMS();
  const [formData, setFormData] = useState<CMSPricingPage | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cmsData && !loading) {
      setFormData({ ...cmsData.pricing });
    }
  }, [cmsData, loading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setSaving(true);
    setError(null);
    try {
      await updateCMSData({ pricing: formData });
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

  const addPlan = () => {
    if (!formData) return;
    const newPlan: CMSPricingPlan = { id: Date.now(), name: '', price: '', period: '', features: [], popular: false };
    setFormData({
      ...formData,
      plans: [...formData.plans, newPlan],
    });
  };

  const removePlan = (index: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      plans: formData.plans.filter((_, i) => i !== index),
    });
  };

  const updatePlan = (index: number, key: keyof CMSPricingPlan, value: any) => {
    if (!formData) return;
    const newPlans = [...formData.plans];
    newPlans[index] = { ...newPlans[index], [key]: value };
    setFormData({ ...formData, plans: newPlans });
  };

  const addPlanFeature = (planIndex: number) => {
    if (!formData) return;
    const newPlans = [...formData.plans];
    newPlans[planIndex].features.push('');
    setFormData({ ...formData, plans: newPlans });
  };

  const removePlanFeature = (planIndex: number, featureIndex: number) => {
    if (!formData) return;
    const newPlans = [...formData.plans];
    newPlans[planIndex].features = newPlans[planIndex].features.filter((_, i) => i !== featureIndex);
    setFormData({ ...formData, plans: newPlans });
  };

  const updatePlanFeature = (planIndex: number, featureIndex: number, value: string) => {
    if (!formData) return;
    const newPlans = [...formData.plans];
    newPlans[planIndex].features[featureIndex] = value;
    setFormData({ ...formData, plans: newPlans });
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
          <h2 className="text-3xl font-bold text-white mb-2">تحرير صفحة الأسعار</h2>
          <p className="text-dark-muted">قم بتعديل محتوى صفحة الأسعار</p>
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
            <h3 className="text-xl font-bold text-white">الباقات</h3>
            <button
              type="button"
              onClick={addPlan}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة باقة
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {formData.plans.map((plan, index) => (
              <div key={index} className="p-6 bg-dark-bg/50 rounded-xl border border-dark-border relative">
                <button
                  type="button"
                  onClick={() => removePlan(index)}
                  className="absolute top-2 left-2 text-brand-danger hover:text-brand-danger/80"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <label className="block text-dark-muted mb-2 font-medium">الباقة الأكثر شيوعاً؟</label>
                    <input
                      type="checkbox"
                      checked={plan.popular || false}
                      onChange={(e) => updatePlan(index, 'popular', e.target.checked)}
                      className="w-5 h-5"
                    />
                  </div>
                  <div>
                    <label className="block text-dark-muted mb-2 font-medium">اسم الباقة</label>
                    <input
                      type="text"
                      value={plan.name}
                      onChange={(e) => updatePlan(index, 'name', e.target.value)}
                      className="glass-input"
                      placeholder="اسم الباقة"
                    />
                  </div>
                  <div>
                    <label className="block text-dark-muted mb-2 font-medium">السعر</label>
                    <input
                      type="text"
                      value={plan.price}
                      onChange={(e) => updatePlan(index, 'price', e.target.value)}
                      className="glass-input"
                      placeholder="السعر"
                    />
                  </div>
                  <div>
                    <label className="block text-dark-muted mb-2 font-medium">المدة</label>
                    <input
                      type="text"
                      value={plan.period}
                      onChange={(e) => updatePlan(index, 'period', e.target.value)}
                      className="glass-input"
                      placeholder="مثال: ريال/شهر"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-dark-muted font-medium">المميزات</label>
                      <button
                        type="button"
                        onClick={() => addPlanFeature(index)}
                        className="text-brand-primary hover:text-brand-primary/80 text-sm flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        إضافة
                      </button>
                    </div>
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => updatePlanFeature(index, featureIndex, e.target.value)}
                          className="glass-input flex-1"
                          placeholder="أدخل مميزة"
                        />
                        <button
                          type="button"
                          onClick={() => removePlanFeature(index, featureIndex)}
                          className="p-2 text-brand-danger hover:text-brand-danger/80"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
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
