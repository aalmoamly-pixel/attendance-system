import { useState } from 'react';
import { Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react';
import { login } from '../lib/auth';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ national_id: nationalId, password });
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-bg via-dark-bg to-dark-card p-4">
      <div className="glass-card w-full max-w-md p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">تسجيل الدخول</h1>
          <p className="text-dark-muted mt-2">أدخل بياناتك للوصول للنظام</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-brand-danger/10 border border-brand-danger/20 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-brand-danger flex-shrink-0" />
              <span className="text-brand-danger text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-dark-muted">رقم الهوية</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-dark-muted" />
              </div>
              <input
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="أدخل رقم الهوية"
                className="w-full bg-dark-card border border-dark-border rounded-xl pr-12 pl-4 py-4 text-white placeholder-dark-muted focus:outline-none focus:border-brand-primary transition-all"
                dir="ltr"
                autoComplete="off"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-dark-muted">كلمة المرور</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-dark-muted" />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 pl-4 flex items-center text-dark-muted hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                className="w-full bg-dark-card border border-dark-border rounded-xl pr-12 pl-12 py-4 text-white placeholder-dark-muted focus:outline-none focus:border-brand-primary transition-all"
                dir="ltr"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'تسجيل الدخول'
            )}
          </button>
        </form>


      </div>
    </div>
  );
}
