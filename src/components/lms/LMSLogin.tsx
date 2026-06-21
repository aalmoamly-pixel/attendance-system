import { useState } from 'react';
import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { lmsDb, type LMSUser } from '../../lib/lms_supabase';

interface LMSLoginProps {
  onLoginSuccess: (user: LMSUser) => void;
}

export default function LMSLogin({ onLoginSuccess }: LMSLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Hash the password simply (SHA-256 in production; here we use plain text for demo)
      const user = await lmsDb.loginUser(email, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err?.message || 'بيانات الدخول غير صحيحة، تحقق من الإيميل وكلمة المرور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-secondary to-brand-primary flex items-center justify-center shadow-2xl shadow-brand-primary/40 mx-auto mb-4">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">المنصة الأكاديمية</h1>
          <p className="text-dark-muted text-sm">Smart LMS – نظام التعليم الإلكتروني المتكامل</p>
        </div>

        <div className="glass-card p-8 space-y-6">
          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-right">
            {error && (
              <div className="bg-brand-danger/10 border border-brand-danger/30 text-brand-danger p-3 rounded-xl flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-dark-muted">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@university.edu"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl pr-10 pl-4 py-3 text-white focus:outline-none focus:border-brand-primary font-mono text-left"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-dark-muted">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-muted" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl pr-10 pl-10 py-3 text-white focus:outline-none focus:border-brand-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted hover:text-white"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 font-bold text-base"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                'دخول إلى المنصة'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-dark-muted border-t border-dark-border pt-4">
            للتسجيل أو استعادة كلمة المرور، تواصل مع مدير النظام.
          </p>
        </div>
      </div>
    </div>
  );
}
