import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { OwnerRoute } from './components/auth/OwnerRoute';
import { useAuth } from './context/AuthContext';
import { AlertDetailPage } from './pages/AlertDetailPage';
import { AlertsPage } from './pages/AlertsPage';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentDetailPage } from './pages/DocumentDetailPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { LoginPage } from './pages/LoginPage';
import { LutronDocsPage } from './pages/LutronDocsPage';
import { MaintenancesPage } from './pages/MaintenancesPage';
import { ModulesPage } from './pages/ModulesPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { MonitoringResourcePage } from './pages/MonitoringResourcePage';
import { PermissionsPage } from './pages/PermissionsPage';
import { ServiceDetailPage } from './pages/ServiceDetailPage';
import { ServicesPage } from './pages/ServicesPage';
import { SettingsPage } from './pages/SettingsPage';
import { UserDetailPage } from './pages/UserDetailPage';
import { UsersPage } from './pages/UsersPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-lutron-bg text-zinc-500">
        Chargement...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="services/:id" element={<ServiceDetailPage />} />
        <Route path="monitoring" element={<MonitoringPage />} />
        <Route path="monitoring/:id" element={<MonitoringResourcePage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="alerts/:id" element={<AlertDetailPage />} />
        <Route path="maintenances" element={<MaintenancesPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="documents/:id" element={<DocumentDetailPage />} />
        <Route path="docs" element={<LutronDocsPage />} />
        <Route path="settings" element={<OwnerRoute><SettingsPage /></OwnerRoute>} />
        <Route path="users" element={<OwnerRoute><UsersPage /></OwnerRoute>} />
        <Route path="users/:id" element={<OwnerRoute><UserDetailPage /></OwnerRoute>} />
        <Route path="modules" element={<OwnerRoute><ModulesPage /></OwnerRoute>} />
        <Route path="permissions" element={<OwnerRoute><PermissionsPage /></OwnerRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
