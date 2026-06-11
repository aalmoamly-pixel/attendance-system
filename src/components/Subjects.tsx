import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  BookOpen, 
  RefreshCw,
  AlertCircle,
  Building2,
  Info
} from 'lucide-react';
import { db } from '../lib/supabase';
import type { Subject, Department } from '../types/database';

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    subject_name: '',
    department_id: 1
  });

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [subs, depts] = await Promise.all([
        db.getSubjects(),
        db.getDepartments()
      ]);
      setSubjects(subs);
      setDepartments(depts);
      if (depts.length > 0) setFormData(prev => ({ ...prev, department_id: depts[0].department_id }));
    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    // لا تختفي تلقائياً
  };

  const handleOpenEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      subject_name: subject.subject_name,
      department_id: subject.department_id || 1
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المادة؟')) {
      try {
        await db.deleteSubject(id);
        setSubjects(subjects.filter(s => s.subject_id !== id));
        showToast('✅ تم حذف المادة');
      } catch (err: any) {
        setError('فشل حذف المادة');
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.subject_name) {
      setFormError('الرجاء كتابة اسم المادة');
      return;
    }

    try {
      if (editingSubject) {
        const updated = await db.saveSubject({
          ...formData,
          subject_id: editingSubject.subject_id
        });
        setSubjects(subjects.map(s => s.subject_id === editingSubject.subject_id ? updated : s));
        showToast('✅ تم تحديث المادة');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError('فشل حفظ البيانات');
    }
  };

  const filteredSubjects = subjects.filter(subject => 
    subject.subject_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDeptName = (deptId: number | null) => deptId ? (departments.find(d => d.department_id === deptId)?.department_name || 'عام') : 'عام';

  return (
    <div className="space-y-6 animate-fade-in">
      
      {successMsg && (
        <div 
          onClick={() => setSuccessMsg(null)}
          className="fixed bottom-5 left-5 bg-brand-success text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 z-[99999] animate-bounce cursor-pointer hover:opacity-90 transition-all"
        >
          <Check className="w-5 h-5" />
          <span className="text-sm font-semibold">{successMsg}</span>
          <span className="text-xs text-white/70 ml-1">(انقر للإغلاق)</span>
        </div>
      )}

      <div className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
          <input 
            type="text" 
            placeholder="ابحث باسم المادة..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input pl-4 pr-10 py-2.5 text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData}
            className="btn-secondary px-3.5 py-2.5"
          >
            <RefreshCw className={`w-4 h-4 text-dark-muted ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

      </div>

      <div className="glass-card p-4 bg-brand-info/10 border border-brand-info/20 flex items-center gap-3">
        <Info className="w-5 h-5 text-brand-info" />
        <span className="text-brand-info text-sm">
          المواد تُضافتogether مع الطلاب. اذهب إلى صفحة <strong>الطلاب</strong> واضغط على <strong>إضافة طالب</strong> لإضافة مواد جديدة مع جدول الطالب.
        </span>
      </div>

      {error && (
        <div className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-xl text-brand-danger flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-6 h-40 animate-pulse" />
          ))}
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-brand-secondary/30" />
          <p className="font-semibold text-sm text-white mb-2">لا يوجد مواد</p>
          <p className="text-xs text-dark-muted">المواد تُضافتogether مع الطلاب من صفحة الطلاب</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((sub) => (
            <div key={sub.subject_id} className="glass-card p-6">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold text-brand-info flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {getDeptName(sub.department_id)}
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => handleOpenEdit(sub)}
                    className="p-1.5 rounded bg-dark-hover hover:bg-brand-primary/20 hover:text-brand-primary text-dark-muted transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(sub.subject_id)}
                    className="p-1.5 rounded bg-dark-hover hover:bg-brand-danger/20 hover:text-brand-danger text-dark-muted transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-base font-extrabold text-white mb-2">
                {sub.subject_name}
              </h3>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 animate-slide-up">
            
            <div className="flex items-center justify-between pb-4 border-b border-dark-border/40 mb-6">
              <h3 className="text-lg font-extrabold text-white">
                تعديل المادة
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg bg-dark-hover hover:bg-dark-border border border-dark-border text-dark-muted hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-brand-danger/10 border border-brand-danger/20 rounded-lg text-brand-danger text-xs font-semibold mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-dark-muted mb-1.5">اسم المادة <span className="text-brand-danger">*</span></label>
                <input 
                  type="text" 
                  value={formData.subject_name}
                  onChange={(e) => setFormData({...formData, subject_name: e.target.value})}
                  placeholder="مثال: هندسة البرمجيات"
                  className="glass-input text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dark-muted mb-1.5">التخصص</label>
                <select 
                  value={formData.department_id}
                  onChange={(e) => setFormData({...formData, department_id: Number(e.target.value)})}
                  className="glass-input text-sm"
                >
                  {departments.map(dept => (
                    <option key={dept.department_id} value={dept.department_id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-border/40 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary py-2 px-4 text-sm"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="btn-primary py-2 px-5 text-sm"
                >
                  تحديث
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
