import { useState, useEffect } from 'react';
import { Search, Edit, X, Save, CheckCircle2, XCircle } from 'lucide-react';
import { db } from '../lib/supabase';
import type { Student } from '../types/database';

export default function StudentFees() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    subscription_amount: 0,
    due_date: '',
    financial_notes: '',
    subscription_status: 'unpaid'
  });
  const [payments, setPayments] = useState<any[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studentsData, paymentsData] = await Promise.all([
        db.getStudents(),
        db.getPayments()
      ]);
      setStudents(studentsData.filter(s => s.role === 'student'));
      setPayments(paymentsData);
    } catch (error) {
      console.error('[StudentFees] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaidAmount = (studentId: number) => {
    return payments.filter(p => p.student_id === studentId && p.status === 'approved').reduce((sum, p) => sum + p.amount, 0);
  };

  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.national_id.includes(search) ||
    s.academic_id.includes(search)
  );

  const startEdit = (student: Student) => {
    setEditingId(student.student_id);
    setEditForm({
      subscription_amount: student.subscription_amount || 0,
      due_date: student.due_date || '',
      financial_notes: student.financial_notes || '',
      subscription_status: student.subscription_status || 'unpaid'
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNotification(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      setLoading(true);
      await db.updateStudentFees(editingId, editForm);
      await loadData();
      setEditingId(null);
      setNotification({ type: 'success', message: 'تم حفظ الرسوم بنجاح.' });
      // لا تختفي تلقائياً
    } catch (error) {
      console.error('[StudentFees] Error updating fees:', error);
      setNotification({ type: 'error', message: `فشل الحفظ: ${error instanceof Error ? error.message : 'خطأ غير معروف'}` });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !students.length) {
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
          رسوم الطلاب
        </h1>
      </div>

      {notification && (
        <div 
          onClick={() => setNotification(null)}
          className={`glass-card p-4 flex items-center gap-3 cursor-pointer hover:opacity-90 transition-all ${
            notification.type === 'success' ? 'border border-brand-success/30 bg-brand-success/10' : 
            'border border-brand-danger/30 bg-brand-danger/10'
          }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-6 h-6 text-brand-success" />
          ) : (
            <XCircle className="w-6 h-6 text-brand-danger" />
          )}
          <span className={`font-semibold ${
            notification.type === 'success' ? 'text-brand-success' : 'text-brand-danger'
          }`}>
            {notification.message}
          </span>
          <span className="text-xs text-dark-muted mr-auto">(انقر للإغلاق)</span>
        </div>
      )}

      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو رقم الهوية أو الرقم الأكاديمي..."
              className="w-full glass-input pr-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-right p-4 text-dark-muted">اسم الطالب</th>
                <th className="text-right p-4 text-dark-muted">رقم الهوية</th>
                <th className="text-right p-4 text-dark-muted">الرقم الأكاديمي</th>
                <th className="text-right p-4 text-dark-muted">التخصص</th>
                <th className="text-right p-4 text-dark-muted">الرسوم المطلوبة</th>
                <th className="text-right p-4 text-dark-muted">المدفوع</th>
                <th className="text-right p-4 text-dark-muted">المتبقي</th>
                <th className="text-right p-4 text-dark-muted">الحالة</th>
                <th className="text-right p-4 text-dark-muted">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const paidAmount = getPaidAmount(student.student_id);
                const remainingAmount = (student.subscription_amount || 0) - paidAmount;
                const isEditing = editingId === student.student_id;

                return (
                  <tr key={student.student_id} className="border-b border-dark-border/50 hover:bg-dark-hover/30 transition">
                    <td className="p-4 text-white font-medium">{student.full_name}</td>
                    <td className="p-4 text-white">{student.national_id}</td>
                    <td className="p-4 text-white">{student.academic_id}</td>
                    <td className="p-4 text-white">{student.departments?.department_name || '-'}</td>
                    <td className="p-4 text-white">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.subscription_amount}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setEditForm({
                              ...editForm,
                              subscription_amount: newValue === '' ? 0 : Number(newValue)
                            });
                          }}
                          className="w-full glass-input"
                          min="0"
                        />
                      ) : (
                        <span className="font-bold">{student.subscription_amount} ريال</span>
                      )}
                    </td>
                    <td className="p-4 text-brand-success font-bold">{paidAmount} ريال</td>
                    <td className="p-4 font-bold" style={{ color: remainingAmount > 0 ? '#EF4444' : '#10B981' }}>
                      {remainingAmount} ريال
                    </td>
                    <td className="p-4">
                      {isEditing ? (
                        <select
                          value={editForm.subscription_status}
                          onChange={(e) => setEditForm({ ...editForm, subscription_status: e.target.value })}
                          className="glass-input"
                        >
                          <option value="unpaid">غير مدفوع</option>
                          <option value="pending">قيد المراجعة</option>
                          <option value="active">فعال</option>
                          <option value="expired">منتهي</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          student.subscription_status === 'active' ? 'bg-brand-success/20 text-brand-success' :
                          student.subscription_status === 'pending' ? 'bg-brand-warning/20 text-brand-warning' :
                          student.subscription_status === 'expired' ? 'bg-brand-danger/20 text-brand-danger' :
                          'bg-dark-card text-dark-muted'
                        }`}>
                          {student.subscription_status === 'active' ? 'فعال' :
                           student.subscription_status === 'pending' ? 'قيد المراجعة' :
                           student.subscription_status === 'expired' ? 'منتهي' : 'غير مدفوع'}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button onClick={saveEdit} className="p-2 bg-brand-success/20 text-brand-success rounded-lg hover:bg-brand-success/30">
                            <Save className="w-5 h-5" />
                          </button>
                          <button onClick={cancelEdit} className="p-2 bg-brand-danger/20 text-brand-danger rounded-lg hover:bg-brand-danger/30">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(student)} className="p-2 bg-brand-primary/20 text-brand-primary rounded-lg hover:bg-brand-primary/30">
                          <Edit className="w-5 h-5" />
                        </button>
                      )}
                    </td>
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
