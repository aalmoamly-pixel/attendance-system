import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Clock,
  AlertCircle,
  FileImage
} from 'lucide-react';
import { db } from '../lib/supabase';
import { getAuthState } from '../lib/auth';
import type { Payment, PaymentMethod } from '../types/database';

export default function StudentPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscription, setSubscription] = useState({ active: false, end_date: null as string | null, days_remaining: 0 });
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [formData, setFormData] = useState({
    amount: 0,
    payment_method: 'bank_transfer' as PaymentMethod,
    transaction_id: '',
    receipt_image: null as File | null,
    receipt_image_url: '',
    notes: '',
  });
  
  const authState = getAuthState();
  const studentId = authState.user?.student_id;

  useEffect(() => {
    if (studentId) {
      loadData();
    }
  }, [studentId]);

  const loadData = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const [paymentsData, subscriptionData, settingsData] = await Promise.all([
        db.getPayments({ student_id: studentId }),
        db.getStudentSubscription(studentId),
        db.getPaymentSettings()
      ]);
      
      setPayments(paymentsData);
      setSubscription(subscriptionData);
      setPaymentSettings(settingsData);
      setFormData(prev => ({ ...prev, amount: settingsData.subscription_amount }));
    } catch (err) {
      console.error('[StudentPayments] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;
    try {
      setLoading(true);
      const now = new Date();
      const invoiceNumber = `INV-${studentId}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      await db.createPayment({
        student_id: studentId,
        invoice_number: invoiceNumber,
        amount: formData.amount,
        payment_method: formData.payment_method,
        transaction_id: formData.transaction_id,
        receipt_image: formData.receipt_image_url || null,
        notes: formData.notes,
        admin_notes: null,
        status: 'pending',
        approved_at: null,
        approved_by: null,
        subscription_start: null,
        subscription_end: null
      });
      
      setShowPaymentModal(false);
      setFormData({
        amount: paymentSettings?.subscription_amount || 0,
        payment_method: 'bank_transfer',
        transaction_id: '',
        receipt_image: null,
        receipt_image_url: '',
        notes: ''
      });
      loadData();
      alert('تم إرسال طلب الدفع بنجاح، سيتم مراجعته قريباً');
    } catch (err) {
      console.error('[StudentPayments] Error submitting payment:', err);
      alert('حدث خطأ أثناء إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="px-3 py-1 bg-brand-success/20 text-brand-success rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> معتمد</span>;
      case 'pending': return <span className="px-3 py-1 bg-brand-warning/20 text-brand-warning rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> قيد المراجعة</span>;
      case 'rejected': return <span className="px-3 py-1 bg-brand-danger/20 text-brand-danger rounded-full text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3" /> مرفوض</span>;
      default: return <span className="px-3 py-1 bg-dark-card text-dark-muted rounded-full text-xs font-bold">غير مدفوع</span>;
    }
  };

  const getPaymentMethodLabel = (method: PaymentMethod | null) => {
    switch (method) {
      case 'bank_transfer': return 'تحويل بنكي';
      case 'ria': return 'RIA Money Transfer';
      case 'binance_usdt': return 'Binance USDT';
      case 'visa': return 'Visa';
      case 'mastercard': return 'MasterCard';
      case 'apple_pay': return 'Apple Pay';
      case 'google_pay': return 'Google Pay';
      case 'paypal': return 'PayPal';
      default: return 'غير محدد';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <DollarSign className="w-8 h-8 text-brand-primary" />
          المدفوعات
        </h1>
      </div>

      {!subscription.active && (
        <div className="bg-brand-danger/10 border border-brand-danger/30 rounded-2xl p-6 flex items-start gap-4">
          <AlertCircle className="w-10 h-10 text-brand-danger shrink-0" />
          <div>
            <h3 className="text-xl font-bold text-white mb-2">⚠️ اشتراكك غير مفعل حالياً</h3>
            <p className="text-dark-muted text-lg">يرجى إتمام عملية الدفع لتفعيل جميع خدمات النظام.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <CheckCircle2 className={`w-6 h-6 ${subscription.active ? 'text-brand-success' : 'text-brand-danger'}`} />
            حالة الاشتراك
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-dark-muted">الحالة</span>
              <span className={`text-lg font-bold ${subscription.active ? 'text-brand-success' : 'text-brand-danger'}`}>
                {subscription.active ? '🟢 فعال' : '🔴 غير مدفوع'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-dark-muted">المبلغ المطلوب</span>
              <span className="text-lg font-bold text-white">{paymentSettings?.subscription_amount || 0} ر.س</span>
            </div>
            {subscription.end_date && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-dark-muted">تاريخ انتهاء الاشتراك</span>
                  <span className="text-white font-semibold">
                    {new Date(subscription.end_date).toLocaleDateString('ar-SA')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-dark-muted">الأيام المتبقية</span>
                  <span className={`text-2xl font-black ${subscription.days_remaining < 7 ? 'text-brand-danger' : 'text-brand-primary'}`}>
                    {subscription.days_remaining} يوم
                  </span>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="w-full mt-6 btn-primary text-lg py-4 flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            💰 رفع إثبات الدفع
          </button>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6">إرشادات الدفع</h2>
          <div className="space-y-4 text-dark-muted">
            {paymentSettings?.payment_instructions ? (
              <p className="whitespace-pre-line">{paymentSettings.payment_instructions}</p>
            ) : (
              <p>يرجى اختيار طريقة الدفع المناسبة ثم رفع إثبات الدفع.</p>
            )}
            {paymentSettings?.bank_transfer_details && (
              <div className="bg-dark-card p-4 rounded-xl border border-dark-border">
                <h4 className="font-bold text-white mb-2">📄 التحويل البنكي</h4>
                <p className="text-sm">{paymentSettings.bank_transfer_details}</p>
              </div>
            )}
            {paymentSettings?.ria_details && (
              <div className="bg-dark-card p-4 rounded-xl border border-dark-border">
                <h4 className="font-bold text-white mb-2">💸 RIA</h4>
                <p className="text-sm">{paymentSettings.ria_details}</p>
              </div>
            )}
            {paymentSettings?.binance_wallet && (
              <div className="bg-dark-card p-4 rounded-xl border border-dark-border">
                <h4 className="font-bold text-white mb-2">₿ Binance USDT</h4>
                <p className="text-sm font-mono break-all">{paymentSettings.binance_wallet}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-6">📋 سجل المدفوعات</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-right p-4 text-dark-muted">رقم الفاتورة</th>
                <th className="text-right p-4 text-dark-muted">المبلغ</th>
                <th className="text-right p-4 text-dark-muted">طريقة الدفع</th>
                <th className="text-right p-4 text-dark-muted">تاريخ الإرسال</th>
                <th className="text-right p-4 text-dark-muted">الحالة</th>
                <th className="text-right p-4 text-dark-muted">ملاحظات الإدارة</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-dark-muted text-lg">لا توجد مدفوعات بعد</td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-dark-border/50 hover:bg-dark-hover/30 transition">
                    <td className="p-4 font-mono text-white">{payment.invoice_number}</td>
                    <td className="p-4 font-bold text-white">{payment.amount} ر.س</td>
                    <td className="p-4 text-white">{getPaymentMethodLabel(payment.payment_method)}</td>
                    <td className="p-4 text-white">{new Date(payment.created_at).toLocaleDateString('ar-SA')}</td>
                    <td className="p-4">{getStatusBadge(payment.status)}</td>
                    <td className="p-4 text-dark-muted text-sm">{payment.admin_notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-dark-border flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">رفع إثبات الدفع</h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-dark-hover rounded-lg">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">المبلغ</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full input"
                  required
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">طريقة الدفع</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })}
                  className="w-full input"
                  required
                >
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="ria">RIA Money Transfer</option>
                  <option value="binance_usdt">Binance USDT</option>
                </select>
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">رقم العملية</label>
                <input
                  type="text"
                  value={formData.transaction_id}
                  onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                  className="w-full input"
                  placeholder="مثال: TRX-123456789"
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">صورة الإيصال</label>
                <div className="border-2 border-dashed border-dark-border rounded-xl p-6 text-center">
                  {formData.receipt_image_url ? (
                    <div className="space-y-2">
                      <img src={formData.receipt_image_url} alt="Receipt" className="max-h-48 mx-auto rounded-lg" />
                      <button type="button" onClick={() => setFormData({ ...formData, receipt_image_url: '' })} className="text-brand-danger text-sm">إزالة</button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FileImage className="w-12 h-12 mx-auto text-dark-muted" />
                      <p className="text-dark-muted">اسحب الصورة هنا أو اضغط لتحديدها</p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="receipt"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setFormData({ ...formData, receipt_image_url: ev.target?.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label htmlFor="receipt" className="btn-primary cursor-pointer inline-block">اختر صورة</label>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">ملاحظات إضافية</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full input"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 py-3 rounded-xl border border-dark-border text-dark-muted hover:text-white hover:bg-dark-hover">إلغاء</button>
                <button type="submit" disabled={loading} className="flex-1 btn-primary py-3">إرسال الطلب</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
