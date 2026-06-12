import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Play } from 'lucide-react';
import { WS_EVENTS } from '@lutron/shared';
import { ViewLayout } from '../components/layout/ViewLayout';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { api } from '../lib/api';
import { useSocketRefresh } from '../hooks/useSocket';

export function MonitoringResourcePage() {
  const { id } = useParams<{ id: string }>();
  const [resource, setResource] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    void api.getResource(id).then(setResource);
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useSocketRefresh(WS_EVENTS.CHECK_UPDATE, load);

  if (!resource) {
    return <ViewLayout title="Ressource"><Card className="p-8 text-center text-zinc-500">Chargement...</Card></ViewLayout>;
  }

  const checks = (resource.checks as Array<Record<string, unknown>>) ?? [];

  return (
    <ViewLayout
      title={String(resource.name)}
      actions={
        <Link
          to={`/services/${resource.serviceId}`}
          className="rounded-xl bg-lutron-card px-4 py-2 text-sm text-zinc-300 hover:text-white"
        >
          Voir le service
        </Link>
      }
    >
      <div className="mb-4 flex items-center gap-3">
        <StatusBadge status={resource.status as import('@lutron/shared').CheckStatus} />
        <span className="text-sm text-zinc-500">{String(resource.serviceName)}</span>
      </div>

      <Card>
        <div className="divide-y divide-lutron-border">
          {checks.map((check) => (
            <div key={String(check.id)} className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{String(check.name)}</p>
                  <p className="text-sm text-zinc-500">{String(check.type)} · toutes les {String(check.interval)}s</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => void api.runCheck(String(check.id)).then(load)}
                    className="flex items-center gap-1.5 rounded-lg bg-violet-600/20 px-3 py-1.5 text-xs text-violet-400 hover:bg-violet-600/30"
                  >
                    <Play size={12} /> Exécuter
                  </button>
                  <StatusBadge status={check.status as import('@lutron/shared').CheckStatus} />
                </div>
              </div>
              {(check.results as Array<Record<string, unknown>>)?.slice(0, 5).map((r, i) => (
                <div key={i} className="mt-2 flex justify-between border-t border-lutron-border/50 pt-2 text-xs text-zinc-600">
                  <span>{new Date(String(r.at)).toLocaleString('fr-FR')} — {String(r.message)}</span>
                  <span>{r.responseTimeMs != null ? `${String(r.responseTimeMs)}ms` : ''}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
    </ViewLayout>
  );
}
