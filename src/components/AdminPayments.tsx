import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { supabase, db } from '../lib/supabase';
import { getAuthState } from '../lib/auth';
import type { Payment, PaymentStatus, PaymentMethod } from '../types/database';

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '' as PaymentStatus | '',
    payment_method: '' as PaymentMethod | '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [payments, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsData, studentsData] = await Promise.all([
        db.getPayments(),
        db.getStudents()
      ]);
      
      setPayments(paymentsData);
      setStudents(studentsData);
    } catch (err) {
      console.error('[AdminPayments] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...payments];
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p => {
        const student = students.find(s => s.student_id === p.student_id);
        return (
          p.invoice_number.toLowerCase().includes(searchLower) ||
          (student && (
            student.full_name.toLowerCase().includes(searchLower) ||
            student.national_id.toLowerCase().includes(searchLower)
          ))
        );
      });
    }
    
    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    
    if (filters.payment_method) {
      filtered = filtered.filter(p => p.payment_method === filters.payment_method);
    }
    
    if (filters.startDate) {
      filtered = filtered.filter(p => new Date(p.created_at) >= new Date(filters.startDate));
    }
    
    if (filters.endDate) {
      filtered = filtered.filter(p => new Date(p.created_at) <= new Date(filters.endDate));
    }
    
    setFilteredPayments(filtered);
  };

  const getStats = () => {
    const totalStudents = students.filter(s => s.role === 'student').length;
    const paidStudents = new Set(payments.filter(p => p.status === 'approved').map(p => p.student_id)).size;
    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    const today = new Date().toISOString().split('T')[0];
    const todayRevenue = payments.filter(p => p.status === 'approved' && p.approved_at && p.approved_at.startsWith(today))
      .reduce((sum, p) => sum + p.amount, 0);
    const thisMonth = new Date().getMonth();
    const thisMonthRevenue = payments.filter(p => {
      if (p.status !== 'approved' || !p.approved_at) return false;
      const date = new Date(p.approved_at);
      return date.getMonth() === thisMonth;
    }).reduce((sum, p) => sum + p.amount, 0);
    const thisYear = new Date().getFullYear();
    const thisYearRevenue = payments.filter(p => {
      if (p.status !== 'approved' || !p.approved_at) return false;
      const date = new Date(p.approved_at);
      return date.getFullYear() === thisYear;
    }).reduce((sum, p) => sum + p.amount, 0);

    return { totalStudents, paidStudents, pendingPayments, todayRevenue, thisMonthRevenue, thisYearRevenue };
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'approved': return <span className="px-3 py-1 bg-brand-success/20 text-brand-success rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> معتمد</span>;
      case 'pending': return <span className="px-3 py-1 bg-brand-warning/20 text-brand-warning rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> قيد المراجعة</span>;
      case 'rejected': return <span className="px-3 py-1 bg-brand-danger/20 text-brand-danger rounded-full text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3" /> مرفوض</span>;
      case 'unpaid': return <span className="px-3 py-1 bg-dark-card text-dark-muted rounded-full text-xs font-bold">غير مدفوع</span>;
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

  const stats = getStats();

  if (selectedPayment) {
    return <PaymentDetail payment={selectedPayment} onBack={() => setSelectedPayment(null)} onUpdate={loadData} />;
  }

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
          إدارة المدفوعات
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-brand-primary" />
            <div>
              <p className="text-dark-muted text-xs">إجمالي الطلاب</p>
              <p className="text-2xl font-black text-white">{stats.totalStudents}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-brand-success" />
            <div>
              <p className="text-dark-muted text-xs">الطلاب المسددين</p>
              <p className="text-2xl font-black text-white">{stats.paidStudents}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-brand-warning" />
            <div>
              <p className="text-dark-muted text-xs">الطلبات المعلقة</p>
              <p className="text-2xl font-black text-white">{stats.pendingPayments}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-brand-secondary" />
            <div>
              <p className="text-dark-muted text-xs">إيرادات اليوم</p>
              <p className="text-2xl font-black text-white">{stats.todayRevenue} ر.س</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-brand-primary" />
            <div>
              <p className="text-dark-muted text-xs">إيرادات الشهر</p>
              <p className="text-2xl font-black text-white">{stats.thisMonthRevenue} ر.س</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-purple-400" />
            <div>
              <p className="text-dark-muted text-xs">إيرادات السنة</p>
              <p className="text-2xl font-black text-white">{stats.thisYearRevenue} ر.س</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Filter className="w-6 h-6" />
          الفلاتر
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="block text-white font-semibold mb-2">بحث</label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-muted" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full glass-input pr-10"
                placeholder="بحث بالاسم، رقم الهوية أو رقم الفاتورة..."
              />
            </div>
          </div>
          <div>
            <label className="block text-white font-semibold mb-2">الحالة</label>
            <div className="relative">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as PaymentStatus })}
                className="w-full glass-input cursor-pointer"
              >
                <option value="">الكل</option>
                <option value="pending">قيد المراجعة</option>
                <option value="approved">معتمد</option>
                <option value="rejected">مرفوض</option>
                <option value="unpaid">غير مدفوع</option>
              </select>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-dark-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-white font-semibold mb-2">طريقة الدفع</label>
            <div className="relative">
              <select
                value={filters.payment_method}
                onChange={(e) => setFilters({ ...filters, payment_method: e.target.value as PaymentMethod })}
                className="w-full glass-input cursor-pointer"
              >
                <option value="">الكل</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="ria">RIA Money Transfer</option>
                <option value="binance_usdt">Binance USDT</option>
              </select>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-dark-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-white font-semibold mb-2">من التاريخ</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full input"
            />
          </div>
          <div>
            <label className="block text-white font-semibold mb-2">إلى التاريخ</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full input"
            />
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-6">📋 جدول المدفوعات</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-right p-4 text-dark-muted">الطالب</th>
                <th className="text-right p-4 text-dark-muted">رقم الهوية</th>
                <th className="text-right p-4 text-dark-muted">رقم الفاتورة</th>
                <th className="text-right p-4 text-dark-muted">المبلغ</th>
                <th className="text-right p-4 text-dark-muted">طريقة الدفع</th>
                <th className="text-right p-4 text-dark-muted">تاريخ الإرسال</th>
                <th className="text-right p-4 text-dark-muted">الحالة</th>
                <th className="text-right p-4 text-dark-muted">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-dark-muted text-lg">لا توجد نتائج مطابقة للفلتر</td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const student = students.find(s => s.student_id === payment.student_id);
                  return (
                    <tr key={payment.id} className="border-b border-dark-border/50 hover:bg-dark-hover/30 transition">
                      <td className="p-4 text-white font-semibold">{student?.full_name || '-'}</td>
                      <td className="p-4 font-mono text-white">{student?.national_id || '-'}</td>
                      <td className="p-4 font-mono text-white">{payment.invoice_number}</td>
                      <td className="p-4 font-bold text-white">{payment.amount} ر.س</td>
                      <td className="p-4 text-white">{getPaymentMethodLabel(payment.payment_method)}</td>
                      <td className="p-4 text-white">{new Date(payment.created_at).toLocaleDateString('ar-SA')}</td>
                      <td className="p-4">{getStatusBadge(payment.status)}</td>
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          className="p-2 bg-brand-primary/20 text-brand-primary rounded-lg hover:bg-brand-primary/30 transition"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PaymentDetail({ payment, onBack, onUpdate }: { payment: Payment; onBack: () => void; onUpdate: () => void }) {
  const [students, setStudents] = useState<any[]>([]);
  const [adminNote, setAdminNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const studentsData = await db.getStudents();
    setStudents(studentsData);
  };

  const student = students.find(s => s.student_id === payment.student_id);

  const handleApprove = async () => {
    try {
      setLoading(true);
      const settings = await db.getPaymentSettings();
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + settings.subscription_duration_days);

      await db.updatePayment(payment.id, {
        status: 'approved',
        approved_at: now.toISOString(),
        approved_by: getAuthState().user?.student_id || 0,
        subscription_start: now.toISOString(),
        subscription_end: endDate.toISOString(),
        admin_notes: adminNote || payment.admin_notes
      });

      // Update student subscription status to active in both systems
      if (student) {
        await db.updateStudent(student.student_id, {
          subscription_status: 'active',
          due_date: endDate.toISOString().split('T')[0]
        });

        if (supabase) {
          const lmsEmail = student.academic_id.includes('@') ? student.academic_id : `${student.academic_id}@lms.com`;
          await supabase
            .from('lms_users')
            .update({ subscription_status: 'active' })
            .eq('email', lmsEmail);
        }
      }

      await db.sendNotification({
        student_id: payment.student_id,
        sender_id: getAuthState().user?.student_id || 0,
        sender_role: 'admin',
        message: `تم قبول دفعتك (${payment.invoice_number})، اشتراكك فعال حتى ${endDate.toLocaleDateString('ar-SA')}`,
        is_read: false,
      });

      alert('تم اعتماد الدفع بنجاح');
      onUpdate();
      onBack();
    } catch (err) {
      console.error('[PaymentDetail] Error approving:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('يرجى إدخال سبب الرفض');
      return;
    }

    try {
      setLoading(true);
      await db.updatePayment(payment.id, {
        status: 'rejected',
        admin_notes: rejectReason
      });

      // Reset student subscription status to pending_payment in both systems
      if (student) {
        await db.updateStudent(student.student_id, {
          subscription_status: 'pending_payment'
        });

        if (supabase) {
          const lmsEmail = student.academic_id.includes('@') ? student.academic_id : `${student.academic_id}@lms.com`;
          await supabase
            .from('lms_users')
            .update({ subscription_status: 'pending_payment' })
            .eq('email', lmsEmail);
        }
      }

      await db.sendNotification({
        student_id: payment.student_id,
        sender_id: getAuthState().user?.student_id || 0,
        sender_role: 'admin',
        message: `تم رفض دفعتك (${payment.invoice_number}): ${rejectReason}`,
        is_read: false,
      });

      alert('تم رفض الدفع');
      onUpdate();
      onBack();
    } catch (err) {
      console.error('[PaymentDetail] Error rejecting:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodLabel = (method: any) => {
    switch (method) {
      case 'bank_transfer': return 'تحويل بنكي';
      case 'ria': return 'RIA Money Transfer';
      case 'binance_usdt': return 'Binance USDT';
      default: return 'غير محدد';
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-white hover:text-brand-primary transition"
      >
        <ArrowLeft className="w-6 h-6" />
        <span>العودة</span>
      </button>

      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold text-white mb-6">تفاصيل الدفع</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-dark-muted text-sm">الطالب</p>
              <p className="text-xl font-bold text-white">{student?.full_name || '-'}</p>
            </div>
            <div>
              <p className="text-dark-muted text-sm">رقم الهوية</p>
              <p className="font-mono text-white">{student?.national_id || '-'}</p>
            </div>
            <div>
              <p className="text-dark-muted text-sm">رقم الفاتورة</p>
              <p className="font-mono text-white">{payment.invoice_number}</p>
            </div>
            <div>
              <p className="text-dark-muted text-sm">المبلغ</p>
              <p className="text-2xl font-black text-brand-primary">{payment.amount} ر.س</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-dark-muted text-sm">طريقة الدفع</p>
              <p className="text-white">{getPaymentMethodLabel(payment.payment_method)}</p>
            </div>
            <div>
              <p className="text-dark-muted text-sm">رقم العملية</p>
              <p className="font-mono text-white">{payment.transaction_id || '-'}</p>
            </div>
            <div>
              <p className="text-dark-muted text-sm">تاريخ الإرسال</p>
              <p className="text-white">{new Date(payment.created_at).toLocaleString('ar-SA')}</p>
            </div>
            <div>
              <p className="text-dark-muted text-sm">ملاحظات الطالب</p>
              <p className="text-white">{payment.notes || '-'}</p>
            </div>
          </div>
        </div>
        {payment.receipt_image && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-white mb-4">صورة الإيصال</h3>
            <img
              src={payment.receipt_image}
              alt="Receipt"
              className="max-h-96 rounded-xl border border-dark-border"
            />
          </div>
        )}
        {payment.status === 'pending' && (
          <div className="mt-8 space-y-6">
            <div>
              <label className="block text-white font-semibold mb-2">ملاحظات الإدارة</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full input"
                rows={3}
                placeholder="أضف ملاحظات إن وجدت..."
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 bg-brand-success hover:bg-brand-success/90 text-white font-bold py-4 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                ✅ اعتماد الدفع
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={loading}
                className="flex-1 bg-brand-danger hover:bg-brand-danger/90 text-white font-bold py-4 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                ❌ رفض الدفع
              </button>
            </div>
          </div>
        )}
      </div>
      
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full">
            <div className="p-6 border-b border-dark-border flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">رفض الدفع</h3>
              <button onClick={() => setShowRejectModal(false)} className="p-2 hover:bg-dark-hover rounded-lg">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">سبب الرفض</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full input"
                  rows={4}
                  placeholder="يرجى كتابة سبب رفض الدفع حتى يفهمه الطالب..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowRejectModal(false)} className="flex-1 py-3 rounded-xl border border-dark-border text-dark-muted hover:text-white hover:bg-dark-hover">إلغاء</button>
                <button type="button" onClick={handleReject} disabled={loading} className="flex-1 bg-brand-danger hover:bg-brand-danger/90 text-white py-3 rounded-xl font-bold disabled:opacity-50">رفض الدفع</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
