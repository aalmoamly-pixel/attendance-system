import PublicLayout from './PublicLayout';

export default function TermsPage() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">الشروط والأحكام</h1>
          <p className="text-dark-muted text-xl">شروط استخدام منصتنا</p>
        </div>

        <div className="space-y-8">
          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white mb-4">قبول الشروط</h2>
            <p className="text-dark-muted leading-relaxed">
              باستخدامك لمنصتنا التعليمية، فأنت توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، فيرجى عدم استخدام المنصة.
            </p>
          </section>

          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white mb-4">استخدام المنصة</h2>
            <ul className="space-y-3 text-dark-muted">
              <li>• يجب استخدام المنصة للأغراض التعليمية المشروعة فقط.</li>
              <li>• أنت مسؤول عن الحفاظ على سرية معلومات حسابك.</li>
              <li>• لا يجوز استخدام المنصة بأي طريقة تسبب ضررًا للمنصة أو للمستخدمين الآخرين.</li>
            </ul>
          </section>

          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white mb-4">الحسابات والدفعات</h2>
            <ul className="space-y-3 text-dark-muted">
              <li>• يجب دفع الرسوم المستحقة في الوقت المحدد.</li>
              <li>• تحتفظ المنصة بالحق في تعليق أو إلغاء الحسابات غير المدفوعة.</li>
              <li>• تخضع عمليات الاسترداد لسياسة الاسترداد المعمول بها.</li>
            </ul>
          </section>

          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white mb-4">الملكية الفكرية</h2>
            <p className="text-dark-muted leading-relaxed">
              جميع المحتويات والمواد الموجودة على المنصة محمية بحقوق الملكية الفكرية. لا يجوز نسخ أو إعادة توزيع أي مواد دون إذن مسبق منا.
            </p>
          </section>

          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white mb-4">تغييرات على الشروط</h2>
            <p className="text-dark-muted leading-relaxed">
              تحتفظ المنصة بالحق في تعديل هذه الشروط في أي وقت. سيتم إعلامك بأي تغييرات مهمة عبر المنصة.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
