import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import type { CheckStatus } from '@lutron/shared';
import { ServiceSupervisionBoard } from '../components/supervision/ServiceSupervisionBoard';
import { ViewLayout } from '../components/layout/ViewLayout';
import { Card } from '../components/ui/Card';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface ServiceDetail {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  status: CheckStatus;
  resources: Array<{
    id: string;
    name: string;
    status: CheckStatus;
    checks: Array<{ id: string; name: string; type: string; status: CheckStatus; responseTimeMs: number | null }>;
  }>;
}

export function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [availability, setAvailability] = useState<Array<{ date: string; availability: number }>>([]);

  useEffect(() => {
    if (!id) return;
    void api.getService(id).then((s) => setService(s as unknown as ServiceDetail));
    void api.getAvailability(id).then(setAvailability);
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Supprimer ce service et toutes ses données ?')) return;
    await api.deleteService(id!);
    navigate('/services');
  };

  if (!service) {
    return <ViewLayout title="Chargement..."><Card className="p-8 text-center text-zinc-500">Chargement...</Card></ViewLayout>;
  }

  return (
    <ViewLayout
      title={`Service : ${service.name}`}
      actions={
        user?.role === 'OWNER' ? (
          <button onClick={handleDelete} className="flex items-center gap-2 rounded-xl bg-red-500/15 px-4 py-2 text-sm text-red-400 hover:bg-red-500/25">
            <Trash2 size={16} /> Supprimer
          </button>
        ) : undefined
      }
    >
      <ServiceSupervisionBoard service={service} availability={availability} />
    </ViewLayout>
  );
}
