import PublicLayout from './PublicLayout';

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">سياسة الخصوصية</h1>
          <p className="text-dark-muted text-xl">كيف نحمي بياناتك وخصوصيتك</p>
        </div>

        <div className="space-y-8">
          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white mb-4">مقدمة</h2>
            <p className="text-dark-muted leading-relaxed">
              نحن ملتزمون بحماية خصوصيتك. توضح هذه السياسة كيف نجمع ونستخدم ونحمي معلوماتك الشخصية عند استخدامك لمنصتنا التعليمية.
            </p>
          </section>

          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white mb-4">المعلومات التي نجمعها</h2>
            <ul className="space-y-3 text-dark-muted">
              <li>• المعلومات الشخصية للطلاب والموظفين (الاسم، رقم الهوية، معلومات الاتصال).</li>
              <li>• معلومات الحضور والنتائج الأكاديمية.</li>
              <li>• معلومات الدفع والمعاملات المالية.</li>
              <li>• معلومات الاستخدام للمنصة.</li>
            </ul>
          </section>

          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white mb-4">كيف نستخدم المعلومات</h2>
            <ul className="space-y-3 text-dark-muted">
              <li>• لتقديم الخدمات التعليمية وتحسينها.</li>
              <li>• لإدارة الحسابات والدفعات.</li>
              <li>• للتواصل مع المستخدمين وتقديم الدعم.</li>
              <li>• للامتثال للمتطلبات القانونية.</li>
            </ul>
          </section>

          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white mb-4">حماية المعلومات</h2>
            <p className="text-dark-muted leading-relaxed">
              نستخدم إجراءات أمنية مناسبة لحماية معلوماتك من الوصول غير المصرح به أو التغيير أو الإفصاح أو التدمير.
            </p>
          </section>

          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white mb-4">تغييرات على السياسة</h2>
            <p className="text-dark-muted leading-relaxed">
              قد نقوم بتحديث هذه السياسة من وقت لآخر. سيتم إعلامك بأي تغييرات عبر المنصة.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
