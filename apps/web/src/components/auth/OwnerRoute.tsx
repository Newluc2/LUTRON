import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function OwnerRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'OWNER') return <Navigate to="/" replace />;
  return <>{children}</>;
}
