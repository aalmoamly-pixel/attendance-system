import { useState, useEffect } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Subjects from './components/Subjects';
import AttendancePage from './components/Attendance';
import AttendanceReport from './components/AttendanceReport';
import SmartImport from './components/SmartImport';
import ScheduleImport from './components/ScheduleImport';
import StudentDashboard from './components/StudentDashboard';
import Notifications from './components/Notifications';
import AdminPayments from './components/AdminPayments';
import PaymentSettings from './components/PaymentSettings';
import FinancialReports from './components/FinancialReports';
import { getAuthState, logout, initializeDefaultAdmin } from './lib/auth';
import { db } from './lib/supabase';
import type { AuthState } from './types/database';

export default function App() {
  const [authState, setAuthStateLocal] = useState<AuthState>(getAuthState());
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  useEffect(() => {
    initializeDefaultAdmin();
    
    // Run auto mark absences on app load
    db.autoMarkAbsences();
    
    // Auto-run every 5 minutes
    const interval = setInterval(() => {
      db.autoMarkAbsences();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = () => {
    setAuthStateLocal(getAuthState());
  };

  const handleLogout = () => {
    logout();
    setAuthStateLocal(getAuthState());
  };

  const handleImportSuccess = () => {
    setActivePage('dashboard');
    setRefreshTrigger(prev => prev + 1);
  };

  if (!authState.isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (authState.role === 'student') {
    return <StudentDashboard onLogout={handleLogout} />;
  }

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard key={refreshTrigger} setActivePage={setActivePage} />;
      case 'students':
        return <Students key={refreshTrigger} />;
      case 'subjects':
        return <Subjects key={refreshTrigger} />;
      case 'attendance':
        return <AttendancePage key={refreshTrigger} />;
      case 'attendance-report':
        return <AttendanceReport key={refreshTrigger} setActivePage={setActivePage} />;
      case 'payments':
        return <AdminPayments key={refreshTrigger} />;
      case 'payment-settings':
        return <PaymentSettings key={refreshTrigger} />;
      case 'financial-reports':
        return <FinancialReports key={refreshTrigger} />;
      case 'notifications':
        return <Notifications key={refreshTrigger} isAdmin={true} />;
      case 'import':
        return <SmartImport onImportSuccess={handleImportSuccess} />;
      case 'schedule-import':
        return <ScheduleImport onImportSuccess={handleImportSuccess} />;
      default:
        return <Dashboard setActivePage={setActivePage} />;
    }
  };

  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      {renderActivePage()}
    </Layout>
  );
}
