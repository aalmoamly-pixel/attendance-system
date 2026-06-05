import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './components/public/HomePage';
import AboutPage from './components/public/AboutPage';
import ServicesPage from './components/public/ServicesPage';
import PrivacyPage from './components/public/PrivacyPage';
import TermsPage from './components/public/TermsPage';
import ContactPage from './components/public/ContactPage';
import PricingPage from './components/public/PricingPage';
import DemoPage from './components/public/DemoPage';
import PartnersPage from './components/public/PartnersPage';
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
import StudentFees from './components/StudentFees';
import GeneralSettings from './components/cms/GeneralSettings';
import HomepageEditor from './components/cms/HomepageEditor';
import AboutPageEditor from './components/cms/AboutPageEditor';
import ServicesPageEditor from './components/cms/ServicesPageEditor';
import PricingPageEditor from './components/cms/PricingPageEditor';
import ContactPageEditor from './components/cms/ContactPageEditor';
import FooterEditor from './components/cms/FooterEditor';
import PartnersPageEditor from './components/cms/PartnersPageEditor';
import { getAuthState, logout, initializeDefaultAdmin } from './lib/auth';
import { db } from './lib/supabase';
import type { AuthState } from './types/database';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const authState = getAuthState();
  if (!authState.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const authState = getAuthState();
  if (authState.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function DashboardRoutes({ authState }: { authState: AuthState }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleLogout = () => {
    logout();
    // Force full page redirect to homepage
    window.location.href = '/';
  };

  const handleImportSuccess = () => {
    setActivePage('dashboard');
    setRefreshTrigger(prev => prev + 1);
  };

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
      case 'student-fees':
        return <StudentFees key={refreshTrigger} />;
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
      // CMS Pages
      case 'cms-general':
        return <GeneralSettings />;
      case 'cms-homepage':
        return <HomepageEditor />;
      case 'cms-about':
        return <AboutPageEditor />;
      case 'cms-services':
        return <ServicesPageEditor />;
      case 'cms-pricing':
        return <PricingPageEditor />;
      case 'cms-contact':
        return <ContactPageEditor />;
      case 'cms-footer':
        return <FooterEditor />;
      case 'cms-partners':
        return <PartnersPageEditor />;
      default:
        return <Dashboard setActivePage={setActivePage} />;
    }
  };

  return (
    <Layout activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout}>
      {renderActivePage()}
    </Layout>
  );
}

function LoginPage({ setAuthStateLocal }: { setAuthStateLocal: (state: AuthState) => void }) {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    setAuthStateLocal(getAuthState());
    navigate('/dashboard');
  };

  return <Login onLoginSuccess={handleLoginSuccess} />;
}

function AppContent() {
  const [authState, setAuthStateLocal] = useState<AuthState>(getAuthState());

  useEffect(() => {
    initializeDefaultAdmin();
    db.autoMarkAbsences();
    const interval = setInterval(() => db.autoMarkAbsences(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/demo" element={<DemoPage setAuthStateLocal={setAuthStateLocal} />} />
      <Route path="/partners" element={<PartnersPage />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage setAuthStateLocal={setAuthStateLocal} />
          </PublicRoute>
        }
      />

      {/* Protected Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRoutes authState={authState} />
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppContent />
    </BrowserRouter>
  );
}
