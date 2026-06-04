import { useState, useEffect } from 'react';
import {
  BarChart2,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { db } from '../lib/supabase';
import type { Payment } from '../types/database';

export default function FinancialReports() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [paymentsData, studentsData] = await Promise.all([
        db.getPayments(),
        db.getStudents()
      ]);
      setPayments(paymentsData);
      setStudents(studentsData);
    } catch (err) {
      console.error('[FinancialReports] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const paidStudents = new Set(payments.filter(p => p.status === 'approved').map(p => p.student_id));
    const unpaidStudents = students.filter(s => s.role === 'student' && !paidStudents.has(s.student_id));

    return {
      paidCount: paidStudents.size,
      unpaidCount: unpaidStudents.length
    };
  };

  const handleExportExcel = () => {
    const headers = ['Student Name', 'National ID', 'Invoice Number', 'Amount', 'Payment Method', 'Date', 'Status'];
    const csvContent = [
      headers.join(','),
      ...payments.map(p => {
        const student = students.find(s => s.student_id === p.student_id);
        const getPaymentMethodLabel = (method: any) => {
          switch (method) {
            case 'bank_transfer': return 'Bank Transfer';
            case 'ria': return 'RIA';
            case 'binance_usdt': return 'Binance USDT';
            default: return 'Unknown';
          }
        };
        return [
          student?.full_name || '',
          student?.national_id || '',
          p.invoice_number,
          p.amount,
          getPaymentMethodLabel(p.payment_method),
          p.approved_at || '',
          p.status
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `financial-report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const getPaymentMethodLabel = (method: any) => {
    switch (method) {
      case 'bank_transfer': return 'تحويل بنكي';
      case 'ria': return 'RIA Money Transfer';
      case 'binance_usdt': return 'Binance USDT';
      case 'visa': return 'Visa';
      case 'mastercard': return 'MasterCard';
      default: return 'غير محدد';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart2 className="w-8 h-8 text-brand-primary" />
          التقارير المالية
        </h1>
        <div className="flex gap-2">
          <button onClick={handleExportExcel} className="btn-primary flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            تصدير Excel
          </button>
          <button onClick={handlePrint} className="py-2 px-4 border border-dark-border text-white rounded-xl hover:bg-dark-hover transition flex items-center gap-2">
            <Printer className="w-5 h-5" />
            طباعة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-brand-success" />
            <div>
              <p className="text-dark-muted">الطلاب المسددين</p>
              <p className="text-3xl font-black text-white">{stats.paidCount}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-brand-danger" />
            <div>
              <p className="text-dark-muted">الطلاب غير المسددين</p>
              <p className="text-3xl font-black text-white">{stats.unpaidCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-6">📊 التفاصيل الكاملة</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-right p-4 text-dark-muted">الطالب</th>
                <th className="text-right p-4 text-dark-muted">رقم الهوية</th>
                <th className="text-right p-4 text-dark-muted">رقم الفاتورة</th>
                <th className="text-right p-4 text-dark-muted">المبلغ</th>
                <th className="text-right p-4 text-dark-muted">طريقة الدفع</th>
                <th className="text-right p-4 text-dark-muted">تاريخ الدفع</th>
                <th className="text-right p-4 text-dark-muted">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => {
                const student = students.find(s => s.student_id === payment.student_id);
                return (
                  <tr key={payment.id} className="border-b border-dark-border/50 hover:bg-dark-hover/30 transition">
                    <td className="p-4 text-white font-semibold">{student?.full_name || '-'}</td>
                    <td className="p-4 font-mono text-white">{student?.national_id || '-'}</td>
                    <td className="p-4 font-mono text-white">{payment.invoice_number}</td>
                    <td className="p-4 font-bold text-white">{payment.amount} ر.س</td>
                    <td className="p-4 text-white">{getPaymentMethodLabel(payment.payment_method)}</td>
                    <td className="p-4 text-white">{payment.approved_at ? new Date(payment.approved_at).toLocaleDateString('ar-SA') : '-'}</td>
                    <td className="p-4">{payment.status === 'approved' ? (
                      <span className="px-3 py-1 bg-brand-success/20 text-brand-success rounded-full text-xs font-bold">معتمد</span>
                    ) : (
                      <span className="px-3 py-1 bg-brand-danger/20 text-brand-danger rounded-full text-xs font-bold">{payment.status}</span>
                    )}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
