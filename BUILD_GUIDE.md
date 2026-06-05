# دليل بناء المشروع - Build Guide 📱💻

## المتطلبات الأساسية (Prerequisites)

### Web Application
- Node.js 18+
- npm أو yarn

### Android Application (APK)
- Node.js 18+
- Android Studio
- Java Development Kit (JDK 17+)
- Android SDK (API 33+)

### Windows Desktop Application (Setup.exe / Portable)
- Node.js 18+
- Windows 10 أو أحدث

---

## الأوامر للبناء (Build Commands)

### 1. Web Application
```bash
npm run build-web
```
سيتم إنشاء المخرجات في مجلد `dist/`. يمكن رفعه مباشرة إلى Vercel أو أي مستوي.

---

### 2. Android Application (APK)
#### تطوير وتشغيل محلي:
```bash
npm run dev-android
```
سيتم فتح Android Studio تلقائياً.

#### بناء APK (Debug):
```bash
npm run build-android
```
سيتم إنشاء ملف `android/app/build/outputs/apk/debug/app-debug.apk`.

---

### 3. Windows Desktop Application
#### تطوير وتشغيل محلي:
```bash
npm run dev-desktop
```
سيتم تشغيل Vite dev server و Electron معاً.

#### بناء Setup.exe و Portable:
```bash
# بناء كلا النوعين معاً
npm run build-desktop

# أو بناء Setup.exe فقط
npm run build-desktop-setup

# أو بناء النسخة المحمولة فقط
npm run build-desktop-portable
```
سيتم إنشاء المخرجات في مجلد `release/`.

---

## إعدادات Supabase
تأكد من تحديث ملف `.env` إذا كنت تريد استخدام قاعدة بيانات حقيقية (بدلاً من LocalStorage):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## هيكل المشروع النهائي (Final Project Structure)

```
d:\system/
├── android/                   # مشروع Capacitor للاندرويد
├── dist/                      # مخرجات بناء Web (يتم إنشاؤه تلقائياً)
├── electron/                  # ملفات Electron
│   ├── main.js                # الملف الرئيسي لـ Electron
│   └── preload.js             # Preload Script
├── public/                    # ملفات ثابتة
├── release/                   # مخرجات بناء Electron (يتم إنشاؤه تلقائياً)
├── src/                       # كود التطبيق الرئيسي
│   ├── components/            # مكونات React
│   │   ├── cms/
│   │   └── public/
│   ├── contexts/
│   ├── lib/
│   ├── utils/
│   ├── types/
│   └── ...
├── supabase/                  # ملفات Supabase
├── .env                       # متغيرات البيئة
├── .gitignore
├── BUILD_GUIDE.md            # هذا الملف
├── capacitor.config.ts       # إعدادات Capacitor
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## إضافات Capacitor المثبتة (Capacitor Plugins)
✅ @capacitor/app → إدارة الحياة للتطبيق  
✅ @capacitor/camera → الوصول للكاميرا  
✅ @capacitor/filesystem → إدارة الملفات  
✅ @capacitor/preferences → تخزين بيانات محلية  
✅ @capacitor/push-notifications → إشعارات PUSH

---

## ملاحظات إضافية
- جميع النسخ تستخدم نفس قاعدة بيانات Supabase (إذا تم إعدادها).
- جميع التعديلات تظهر فورياً عبر Supabase Realtime لجميع الأنظمة.
