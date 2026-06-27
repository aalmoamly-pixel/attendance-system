import { useState, useEffect } from 'react';
import LMSLanding from './LMSLanding';
import LMSLayout from './LMSLayout';
import LMSAdminDashboard from './LMSAdminDashboard';
import LMSInstructorDashboard from './LMSInstructorDashboard';
import LMSStudentDashboard from './LMSStudentDashboard';
import { type LMSUser } from '../../lib/lms_supabase';
import { supabase } from '../../lib/supabase';

export default function LMSApp() {
  const [user, setUser] = useState<LMSUser | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Restore session from localStorage
    const saved = localStorage.getItem('lms_auth_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('lms_auth_user');
      }
    }
  }, []);

  useEffect(() => {
    const client = supabase;
    if (user && client) {
      // Fetch latest user status from Supabase to keep it in sync
      const fetchLatestUser = async () => {
        try {
          const { data, error } = await client
            .from('lms_users')
            .select('*')
            .eq('id', user.id)
            .single();
          if (data && !error) {
            setUser(data);
            localStorage.setItem('lms_auth_user', JSON.stringify(data));
          }
        } catch (e) {
          console.error(e);
        }
      };
      
      fetchLatestUser();

      // Subscribe to changes on lms_users for this user
      const channel = client
        .channel(`lms_user_sync:${user.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'lms_users', filter: `id=eq.${user.id}` },
          (payload: any) => {
            console.log('[LMS User Sync] Realtime Profile Update:', payload.new);
            setUser(payload.new);
            localStorage.setItem('lms_auth_user', JSON.stringify(payload.new));
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }
  }, [user?.id]);

  const handleLoginSuccess = (loggedInUser: LMSUser) => {
    setUser(loggedInUser);
    localStorage.setItem('lms_auth_user', JSON.stringify(loggedInUser));
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('lms_auth_user');
  };

  if (!user) {
    return <LMSLanding onLoginSuccess={handleLoginSuccess} />;
  }

  // Render appropriate dashboard component inside layout based on role
  const renderDashboard = () => {
    switch (user.role) {
      case 'admin':
        return <LMSAdminDashboard adminUser={user} activeTab={activeTab} />;
      case 'instructor':
        return <LMSInstructorDashboard instructor={user} activeTab={activeTab} />;
      case 'student':
        return <LMSStudentDashboard student={user} />; // Tab state is controlled inside student dashboard or sync'd via activeTab
      default:
        return <div className="text-center py-12 text-white">دور غير مدعوم</div>;
    }
  };

  return (
    <LMSLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      role={user.role}
      userName={user.full_name}
      onLogout={handleLogout}
      subscriptionStatus={user?.subscription_status}
    >
      {user.role === 'student' ? (
        // Pass down activeTab to allow tab switching from sidebar
        <LMSStudentDashboard student={user} activeTab={activeTab} setActiveTab={setActiveTab} />
      ) : (
        renderDashboard()
      )}
    </LMSLayout>
  );
}
