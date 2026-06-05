import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthState } from '../../types/database';

interface DemoPageProps {
  setAuthStateLocal: (state: AuthState) => void;
}

export default function DemoPage({ setAuthStateLocal }: DemoPageProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const login = async () => {
      try {
        const { loginDemo, getAuthState } = await import('../../lib/auth');
        await loginDemo();
        setAuthStateLocal(getAuthState());
        navigate('/dashboard');
      } catch (err) {
        console.error(err);
        navigate('/');
      }
    };
    login();
  }, [navigate, setAuthStateLocal]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border-4 border-brand-primary border-t-transparent animate-spin"></div>
        <p className="text-dark-muted text-lg">جاري تحويلك إلى لوحة التحكم التجريبية...</p>
      </div>
    </div>
  );
}
