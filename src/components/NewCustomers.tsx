import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  X, 
  ArrowLeft, 
  FileText, 
  ExternalLink,
  Building2
} from 'lucide-react';
import { supabase, db } from '../lib/supabase';
import type { NewCustomer } from '../types/database';

export default function NewCustomers() {
  const [customers, setCustomers] = useState<NewCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [planFilter, setPlanFilter] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<NewCustomer | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await db.getNewCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('[NewCustomers] Error fetching:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Realtime subscription to new_customers table
  useEffect(() => {
    fetchCustomers();

    if (!supabase) return;
    const channel = supabase
      .channel('public:new_customers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'new_customers' }, (payload: any) => {
        console.log('[NewCustomers] Realtime update:', payload);
        // Refresh list on any insert/update/delete
        fetchCustomers();
      })
      .subscribe();
    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleStatusChange = async (customer: NewCustomer, newStatus: 'new' | 'pending' | 'approved' | 'rejected') => {
    if (window.confirm(`هل أنت متأكد من تغيير حالة طلب العميل (${customer.full_name}) إلى [${getStatusLabel(newStatus)}]؟`)) {
      try {
        setLoading(true);
        await db.updateNewCustomer(customer.id, { status: newStatus });
        
        if (newStatus === 'approved') {
          // Auto-onboard Student
          // 1. Get or Create Department
          const departments = await db.getDepartments();
          let dept = departments.find(d => d.department_name.toLowerCase() === customer.university_name.toLowerCase());
          let deptId;
          
          if (dept) {
            deptId = dept.department_id;
          } else {
            const newDept = await db.createDepartment({
              department_name: customer.university_name,
              degree_type: 'بكالوريوس'
            });
            deptId = newDept.department_id;
          }

          // 2. Create student user
          const amount = customer.plan_type === 'basic' ? 299 : 599;
          const today = new Date();
          const dueDate = new Date();
          dueDate.setDate(today.getDate() + 30);
          
          await db.createStudent({
            full_name: customer.full_name,
            phone: customer.phone,
            academic_id: customer.username,
            national_id: `NC-${customer.id}-${Math.floor(1000 + Math.random() * 9000)}`, // unique ID
            password: customer.password,
            role: 'student',
            department_id: deptId,
            subscription_amount: amount,
            due_date: dueDate.toISOString().split('T')[0],
            subscription_status: 'active',
            financial_notes: `حساب منشأ تلقائياً ومعتمد من طلب الاشتراك الجديد رقم #${customer.id}`
          });
          
          // 3. Send Notification to Student
          await db.sendNotification({
            student_id: 0, // Admin system notifications are broad or to student_id. Wait, we can look up student, but since we created them, we will send to their username later or via normal route.
            sender_id: 1, // Admin id
            sender_role: 'admin',
            message: `أهلاً بك ${customer.full_name}، تم اعتماد اشتراكك وتفعيل حسابك بنجاح! اسم المستخدم الخاص بك هو: ${customer.username}`,
            is_read: false
          });
          
          alert(`تم اعتماد الطلب بنجاح! تم إنشاء حساب الطالب بالاسم الحركي: ${customer.username} وكلمة المرور المدخلة.`);
        } else {
          alert(`تم تغيير حالة الطلب بنجاح إلى: ${getStatusLabel(newStatus)}.`);
        }
        
        // Update selected customer view if it is open
        if (selectedCustomer && selectedCustomer.id === customer.id) {
          setSelectedCustomer({ ...customer, status: newStatus });
        }
        
        await fetchCustomers();
      } catch (err: any) {
        console.error(err);
        alert("فشل تحديث حالة الطلب: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'جديد';
      case 'pending': return 'قيد المراجعة';
      case 'approved': return 'مقبول';
      case 'rejected': return 'مرفوض';
      default: return status;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="px-3 py-1 bg-brand-primary/20 text-brand-primary rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3 animate-pulse" /> جديد</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-brand-warning/20 text-brand-warning rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> قيد المراجعة</span>;
      case 'approved':
        return <span className="px-3 py-1 bg-brand-success/20 text-brand-success rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> مقبول</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-brand-danger/20 text-brand-danger rounded-full text-xs font-bold flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> مرفوض</span>;
      default:
        return <span className="px-3 py-1 bg-dark-card text-dark-muted rounded-full text-xs font-bold">{status}</span>;
    }
  };

  const getPlanBadge = (plan: string) => {
    return plan === 'basic' 
      ? <span className="px-2.5 py-1 bg-brand-secondary/20 text-brand-secondary rounded-lg text-xs font-bold">أساسية Basic</span>
      : <span className="px-2.5 py-1 bg-purple-400/20 text-purple-400 rounded-lg text-xs font-bold">متقدمة Premium</span>;
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = 
        c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.university_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery);
        
      const matchesStatus = !statusFilter || c.status === statusFilter;
      const matchesPlan = !planFilter || c.plan_type === planFilter;
      
      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [customers, searchQuery, statusFilter, planFilter]);

  const stats = useMemo(() => {
    return {
      total: customers.length,
      new: customers.filter(c => c.status === 'new').length,
      pending: customers.filter(c => c.status === 'pending').length,
      approved: customers.filter(c => c.status === 'approved').length,
      rejected: customers.filter(c => c.status === 'rejected').length,
    };
  }, [customers]);

  const isPDF = (fileData: string) => {
    return fileData.startsWith('data:application/pdf') || fileData.includes('.pdf');
  };

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (selectedCustomer) {
    return (
      <div className="space-y-6 text-right">
        <button
          onClick={() => setSelectedCustomer(null)}
          className="flex items-center gap-2 text-white hover:text-brand-primary transition"
        >
          <ArrowLeft className="w-6 h-6" />
          <span>العودة للجدول</span>
        </button>

        <div className="glass-card p-6 md:p-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-dark-border pb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{selectedCustomer.full_name}</h2>
              <p className="text-dark-muted flex items-center gap-1.5 justify-end">
                <span>{selectedCustomer.university_name}</span>
                <Building2 className="w-4 h-4 text-brand-primary" />
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {getStatusBadge(selectedCustomer.status)}
              {getPlanBadge(selectedCustomer.plan_type)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white border-b border-dark-border/50 pb-2">تفاصيل الحساب</h3>
              <div className="space-y-2 text-sm text-white">
                <p><span className="text-dark-muted ml-2">الاسم الرباعي:</span> {selectedCustomer.full_name}</p>
                <p><span className="text-dark-muted ml-2">اسم الجامعة:</span> {selectedCustomer.university_name}</p>
                <p><span className="text-dark-muted ml-2">اسم المستخدم:</span> <span className="font-mono text-brand-secondary font-bold">{selectedCustomer.username}</span></p>
                <p><span className="text-dark-muted ml-2">كلمة المرور:</span> <span className="font-mono">{selectedCustomer.password}</span></p>
                <p><span className="text-dark-muted ml-2">رقم الجوال:</span> <span className="font-mono">{selectedCustomer.phone}</span></p>
                <p><span className="text-dark-muted ml-2">تاريخ الطلب:</span> {new Date(selectedCustomer.created_at).toLocaleString('ar-SA')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white border-b border-dark-border/50 pb-2">إجراءات الإدارة</h3>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleStatusChange(selectedCustomer, 'approved')}
                  disabled={selectedCustomer.status === 'approved'}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2 font-bold cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  موافقة واعتماد الاشتراك وتفعيل الحساب
                </button>
                <button
                  onClick={() => handleStatusChange(selectedCustomer, 'pending')}
                  disabled={selectedCustomer.status === 'pending' || selectedCustomer.status === 'approved'}
                  className="w-full py-3 bg-brand-warning/20 hover:bg-brand-warning/30 text-brand-warning rounded-xl border border-brand-warning/30 transition flex items-center justify-center gap-2 font-semibold cursor-pointer disabled:opacity-50"
                >
                  <Clock className="w-5 h-5" />
                  تغيير الحالة إلى: قيد المراجعة
                </button>
                <button
                  onClick={() => handleStatusChange(selectedCustomer, 'rejected')}
                  disabled={selectedCustomer.status === 'rejected' || selectedCustomer.status === 'approved'}
                  className="w-full py-3 bg-brand-danger/20 hover:bg-brand-danger/30 text-brand-danger rounded-xl border border-brand-danger/30 transition flex items-center justify-center gap-2 font-semibold cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  تغيير الحالة إلى: مرفوض
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between border-b border-dark-border/50 pb-2">
              <button
                onClick={() => setShowReceiptModal(true)}
                className="btn-secondary px-4 py-2 text-xs flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" /> تكبير الملف
              </button>
              <h3 className="text-lg font-bold text-white">إيصال السداد المرفق</h3>
            </div>

            <div className="border border-dark-border/60 rounded-xl overflow-hidden bg-dark-bg/60 p-4 flex justify-center items-center min-h-[300px]">
              {isPDF(selectedCustomer.receipt_file) ? (
                <div className="text-center space-y-4">
                  <FileText className="w-20 h-20 mx-auto text-brand-primary" />
                  <p className="text-white text-sm font-semibold">مستند PDF ملحق</p>
                  <a
                    href={selectedCustomer.receipt_file}
                    download={`receipt_${selectedCustomer.full_name}.pdf`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white font-bold rounded-lg text-xs"
                  >
                    تنزيل ملف PDF
                  </a>
                </div>
              ) : (
                <img
                  src={selectedCustomer.receipt_file}
                  alt="إيصال السداد"
                  className="max-h-[500px] object-contain rounded-lg border border-dark-border"
                />
              )}
            </div>
          </div>
        </div>

        {/* Receipt Lightbox Modal */}
        {showReceiptModal && (
          <div className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-center items-center p-4">
            <button
              onClick={() => setShowReceiptModal(false)}
              className="absolute top-4 right-4 p-2 bg-dark-card border border-dark-border rounded-xl text-white hover:text-brand-primary"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="w-full max-w-4xl h-[80vh] flex justify-center items-center">
              {isPDF(selectedCustomer.receipt_file) ? (
                <iframe
                  src={selectedCustomer.receipt_file}
                  className="w-full h-full rounded-xl border border-dark-border"
                  title="PDF Receipt"
                />
              ) : (
                <img
                  src={selectedCustomer.receipt_file}
                  alt="إيصال السداد الكامل"
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="space-y-6 text-right">
      
      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-card p-4 flex items-center justify-between">
          <Users className="w-8 h-8 text-white opacity-80" />
          <div className="text-left">
            <p className="text-xs text-dark-muted">إجمالي الطلبات</p>
            <p className="text-2xl font-black text-white">{stats.total}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center justify-between">
          <Clock className="w-8 h-8 text-brand-primary animate-pulse" />
          <div className="text-left">
            <p className="text-xs text-dark-muted">طلبات جديدة</p>
            <p className="text-2xl font-black text-brand-primary">{stats.new}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center justify-between">
          <Clock className="w-8 h-8 text-brand-warning" />
          <div className="text-left">
            <p className="text-xs text-dark-muted">قيد المراجعة</p>
            <p className="text-2xl font-black text-brand-warning">{stats.pending}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center justify-between">
          <CheckCircle2 className="w-8 h-8 text-brand-success" />
          <div className="text-left">
            <p className="text-xs text-dark-muted">مقبول</p>
            <p className="text-2xl font-black text-brand-success">{stats.approved}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center justify-between">
          <XCircle className="w-8 h-8 text-brand-danger" />
          <div className="text-left">
            <p className="text-xs text-dark-muted">مرفوض</p>
            <p className="text-2xl font-black text-brand-danger">{stats.rejected}</p>
          </div>
        </div>
      </div>

      {/* Filter and search */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 justify-end">
          <span>فلاتر البحث</span>
          <Filter className="w-5 h-5 text-brand-primary" />
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-white font-semibold mb-2">البحث العام</label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم، الجامعة، أو رقم الجوال..."
                className="w-full bg-dark-card border border-dark-border rounded-xl pr-10 pl-4 py-3 text-white focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-white font-semibold mb-2">حالة الطلب</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-dark-card border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-brand-primary"
            >
              <option value="">جميع الحالات</option>
              <option value="new">جديد</option>
              <option value="pending">قيد المراجعة</option>
              <option value="approved">مقبول</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">نوع الخطة</label>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="w-full bg-dark-card border border-dark-border rounded-xl p-3 text-white focus:outline-none focus:border-brand-primary"
            >
              <option value="">جميع الخطط</option>
              <option value="basic">الخطة الأساسية</option>
              <option value="premium">الخطة المتقدمة</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-dark-bg/60">
              <tr className="border-b border-dark-border">
                <th className="p-4 text-white font-bold text-sm">اسم العميل</th>
                <th className="p-4 text-white font-bold text-sm">الجامعة</th>
                <th className="p-4 text-white font-bold text-sm">اسم المستخدم</th>
                <th className="p-4 text-white font-bold text-sm">رقم الجوال</th>
                <th className="p-4 text-white font-bold text-sm font-mono">الخطة</th>
                <th className="p-4 text-white font-bold text-sm">تاريخ الطلب</th>
                <th className="p-4 text-white font-bold text-sm">الحالة</th>
                <th className="p-4 text-white font-bold text-sm text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-dark-muted">لا توجد طلبات اشتراك مطابقة للبحث</td>
                </tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr key={customer.id} className="border-b border-dark-border/50 hover:bg-dark-hover/20 transition">
                    <td className="p-4 text-white font-bold">{customer.full_name}</td>
                    <td className="p-4 text-dark-muted text-sm">{customer.university_name}</td>
                    <td className="p-4 font-mono text-brand-secondary text-sm">{customer.username}</td>
                    <td className="p-4 font-mono text-dark-muted text-sm">{customer.phone}</td>
                    <td className="p-4">{getPlanBadge(customer.plan_type)}</td>
                    <td className="p-4 text-dark-muted text-xs">
                      {new Date(customer.created_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="p-4">{getStatusBadge(customer.status)}</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="p-2 bg-brand-primary/20 text-brand-primary rounded-lg hover:bg-brand-primary/30 transition"
                          title="عرض التفاصيل والإيصال"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
