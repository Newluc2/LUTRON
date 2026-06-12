import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { DashboardStats, ServiceDto } from '@lutron/shared';
import { WS_EVENTS } from '@lutron/shared';
import { useSocketRefresh } from '../hooks/useSocket';
import { AvailabilityChart } from '../components/charts/AvailabilityChart';
import { BreakdownBars } from '../components/charts/BreakdownBars';
import { ViewLayout } from '../components/layout/ViewLayout';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { api } from '../lib/api';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    void Promise.all([api.getDashboardStats(), api.getServices()]).then(([s, svc]) => {
      setStats(s);
      setServices(svc);
    });
  }, []);

  useEffect(() => { load(); }, [load]);
  useSocketRefresh(WS_EVENTS.SERVICE_UPDATED, load);
  useSocketRefresh(WS_EVENTS.CHECK_UPDATE, load);

  const filtered = services.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <ViewLayout
      title="Vue Globale"
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Rechercher un service..."
      stats={
        stats && (
          <>
            <Card className="col-span-3 p-5">
              <AvailabilityChart
                data={stats.availabilityHistory}
                title={`Disponibilité globale — ${stats.servicesUp}/${stats.totalServices} services UP`}
              />
            </Card>
            <Card className="col-span-2 p-5">
              <BreakdownBars items={stats.serviceBreakdown} title="Disponibilité par service" />
            </Card>
          </>
        )
      }
    >
      <Card>
        <div className="divide-y divide-lutron-border">
          {filtered.map((service) => (
            <Link
              key={service.id}
              to={`/services/${service.id}`}
              className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-lutron-card-hover"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lutron-bg text-sm font-semibold text-violet-400">
                  {service.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm text-zinc-500">{service.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  {service.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-lutron-bg px-2 py-0.5 text-xs text-zinc-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <StatusBadge status={service.status} />
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </ViewLayout>
  );
}
