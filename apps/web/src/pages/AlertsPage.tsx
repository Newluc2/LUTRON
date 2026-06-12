import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AlertDto } from '@lutron/shared';
import { WS_EVENTS } from '@lutron/shared';
import { ViewLayout } from '../components/layout/ViewLayout';
import { Card } from '../components/ui/Card';
import { api } from '../lib/api';
import { useSocketRefresh } from '../hooks/useSocket';

const filters = [
  { id: 'all', label: 'Toutes' },
  { id: 'open', label: 'Ouvertes' },
  { id: 'resolved', label: 'Résolues' },
];

const severityColors: Record<string, string> = {
  CRITICAL: 'text-red-400',
  WARNING: 'text-amber-400',
  INFO: 'text-blue-400',
};

export function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertDto[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = useCallback(() => void api.getAlerts().then(setAlerts), []);
  useEffect(() => { load(); }, [load]);
  useSocketRefresh(WS_EVENTS.ALERT_CREATED, load);
  useSocketRefresh(WS_EVENTS.ALERT_RESOLVED, load);

  const filtered = alerts.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.serviceName.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ||
      (filter === 'open' && a.status !== 'RESOLVED') ||
      (filter === 'resolved' && a.status === 'RESOLVED');
    return matchSearch && matchFilter;
  });

  return (
    <ViewLayout title="Alertes" filters={filters} activeFilter={filter} onFilterChange={setFilter} search={search} onSearchChange={setSearch} searchPlaceholder="Rechercher une alerte...">
      <Card>
        <div className="divide-y divide-lutron-border">
          {filtered.map((alert) => (
            <Link key={alert.id} to={`/alerts/${alert.id}`} className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-lutron-card-hover">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{alert.title}</p>
                  <span className={`text-xs font-medium ${severityColors[alert.severity ?? 'WARNING'] ?? 'text-zinc-400'}`}>
                    {alert.severity ?? 'WARNING'}
                  </span>
                </div>
                <p className="text-sm text-zinc-500">{alert.serviceName} · {alert.message}</p>
              </div>
              <span className={`text-xs font-medium ${alert.status === 'OPEN' ? 'text-red-400' : alert.status === 'ACKNOWLEDGED' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {alert.status}
              </span>
            </Link>
          ))}
          {!filtered.length && <p className="px-5 py-8 text-center text-sm text-zinc-500">Aucune alerte</p>}
        </div>
      </Card>
    </ViewLayout>
  );
}
