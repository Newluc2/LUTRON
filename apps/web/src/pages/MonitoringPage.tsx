import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MonitoringResourceDto } from '@lutron/shared';
import { WS_EVENTS } from '@lutron/shared';
import { ViewLayout } from '../components/layout/ViewLayout';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { api } from '../lib/api';
import { useSocketRefresh } from '../hooks/useSocket';

export function MonitoringPage() {
  const [resources, setResources] = useState<MonitoringResourceDto[]>([]);
  const [search, setSearch] = useState('');

  const load = useCallback(() => void api.getResources().then(setResources), []);
  useEffect(() => { load(); }, [load]);
  useSocketRefresh(WS_EVENTS.CHECK_UPDATE, load);

  const filtered = resources.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.serviceName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <ViewLayout title="Monitoring" search={search} onSearchChange={setSearch} searchPlaceholder="Rechercher une ressource...">
      <Card>
        <div className="divide-y divide-lutron-border">
          {filtered.map((resource) => (
            <Link
              key={resource.id}
              to={`/monitoring/${resource.id}`}
              className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-lutron-card-hover"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lutron-bg text-sm font-semibold text-violet-400">
                  {resource.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{resource.name}</p>
                  <p className="text-sm text-zinc-500">{resource.serviceName} · {resource.checksCount} vérifications</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {resource.lastCheckAt && (
                  <span className="text-xs text-zinc-600">{new Date(resource.lastCheckAt).toLocaleString('fr-FR')}</span>
                )}
                <StatusBadge status={resource.status} />
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </ViewLayout>
  );
}
