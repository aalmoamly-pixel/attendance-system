import { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { db } from '../lib/supabase';
import type { PaymentSettings as PaymentSettingsType, PaymentMethod } from '../types/database';

export default function PaymentSettings() {
  const [settings, setSettings] = useState<Partial<PaymentSettingsType>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await db.getPaymentSettings();
      setSettings(data);
    } catch (err) {
      console.error('[PaymentSettings] Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await db.updatePaymentSettings(settings);
      alert('تم حفظ الإعدادات بنجاح');
    } catch (err) {
      console.error('[PaymentSettings] Error saving:', err);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const togglePaymentMethod = (method: PaymentMethod) => {
    const current = settings.enabled_payment_methods || [];
    if (current.includes(method)) {
      setSettings({
        ...settings,
        enabled_payment_methods: current.filter(m => m !== method)
      });
    } else {
      setSettings({
        ...settings,
        enabled_payment_methods: [...current, method]
      });
    }
  };

  const paymentMethodLabels: Record<PaymentMethod, string> = {
    'bank_transfer': 'تحويل بنكي',
    'ria': 'RIA Money Transfer',
    'binance_usdt': 'Binance USDT',
    'visa': 'Visa',
    'mastercard': 'MasterCard',
    'apple_pay': 'Apple Pay',
    'google_pay': 'Google Pay',
    'paypal': 'PayPal'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-8 h-8 text-brand-primary" />
          إعدادات المدفوعات
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-6"
        >
          <Save className="w-5 h-5" />
          {saving ? 'جار الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </div>

      <div className="glass-card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white font-semibold mb-2">قيمة الاشتراك (ر.س)</label>
            <input
              type="number"
              value={settings.subscription_amount || 0}
              onChange={(e) => setSettings({ ...settings, subscription_amount: Number(e.target.value) })}
              className="w-full input"
              min={0}
            />
          </div>
          <div>
            <label className="block text-white font-semibold mb-2">مدة الاشتراك (أيام)</label>
            <input
              type="number"
              value={settings.subscription_duration_days || 30}
              onChange={(e) => setSettings({ ...settings, subscription_duration_days: Number(e.target.value) })}
              className="w-full input"
              min={1}
            />
          </div>
        </div>

        <div>
          <label className="block text-white font-semibold mb-4">طرق الدفع المفعلة</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((method) => (
              <label key={method} className="flex items-center gap-2 bg-dark-card border border-dark-border rounded-xl p-4 cursor-pointer hover:border-brand-primary transition">
                <input
                  type="checkbox"
                  checked={(settings.enabled_payment_methods || []).includes(method)}
                  onChange={() => togglePaymentMethod(method)}
                  className="w-4 h-4 accent-brand-primary"
                />
                <span className="text-white font-medium">{paymentMethodLabels[method]}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">تفاصيل التحويل البنكي</label>
          <textarea
            value={settings.bank_transfer_details || ''}
            onChange={(e) => setSettings({ ...settings, bank_transfer_details: e.target.value })}
            className="w-full input"
            rows={4}
            placeholder="أدخل تفاصيل الحساب البنكي هنا..."
          />
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">تفاصيل RIA</label>
          <textarea
            value={settings.ria_details || ''}
            onChange={(e) => setSettings({ ...settings, ria_details: e.target.value })}
            className="w-full input"
            rows={3}
            placeholder="أدخل تفاصيل RIA هنا..."
          />
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">محفظة Binance USDT</label>
          <input
            type="text"
            value={settings.binance_wallet || ''}
            onChange={(e) => setSettings({ ...settings, binance_wallet: e.target.value })}
            className="w-full input font-mono"
            placeholder="0x..."
          />
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">إرشادات الدفع</label>
          <textarea
            value={settings.payment_instructions || ''}
            onChange={(e) => setSettings({ ...settings, payment_instructions: e.target.value })}
            className="w-full input"
            rows={5}
            placeholder="أضف تعليمات دفع مفصلة للطلاب..."
          />
        </div>
      </div>
    </div>
  );
}
