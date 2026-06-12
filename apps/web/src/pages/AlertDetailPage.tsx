import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { WS_EVENTS } from '@lutron/shared';
import { ViewLayout } from '../components/layout/ViewLayout';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { api } from '../lib/api';
import { useSocketRefresh } from '../hooks/useSocket';

export function AlertDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [alert, setAlert] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    void api.getAlert(id).then(setAlert);
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useSocketRefresh(WS_EVENTS.ALERT_CREATED, load);
  useSocketRefresh(WS_EVENTS.ALERT_RESOLVED, load);

  if (!alert) {
    return <ViewLayout title="Alerte"><Card className="p-8 text-center text-zinc-500">Chargement...</Card></ViewLayout>;
  }

  const recentChecks = (alert.recentChecks as Array<Record<string, unknown>>) ?? [];
  const service = alert.service as { id: string; name: string; resources?: Array<{ name: string; status: string }> };

  return (
    <ViewLayout
      title={String(alert.title)}
      actions={
        <div className="flex gap-2">
          {alert.status !== 'RESOLVED' && (
            <>
              <button
                onClick={() => void api.acknowledgeAlert(id!).then(load)}
                className="rounded-xl bg-lutron-card px-4 py-2 text-sm text-zinc-300 hover:text-white"
              >
                Acquitter
              </button>
              <button
                onClick={() => void api.resolveAlert(id!).then(load)}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-500"
              >
                Résoudre
              </button>
            </>
          )}
        </div>
      }
    >
      <Card className="mb-4 p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="rounded-md bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-400">
            {String(alert.severity)}
          </span>
          <span className="text-sm text-zinc-500">{String(alert.status)}</span>
          <Link to={`/services/${service?.id}`} className="text-sm text-violet-400 hover:underline">
            {String(alert.serviceName)}
          </Link>
        </div>
        <p className="mb-2 text-zinc-300">{String(alert.message)}</p>
        <div className="flex gap-4 text-xs text-zinc-600">
          <span>Source : {String(alert.source ?? '—')}</span>
          <span>Créée : {new Date(String(alert.createdAt)).toLocaleString('fr-FR')}</span>
          <span>Mise à jour : {new Date(String(alert.updatedAt)).toLocaleString('fr-FR')}</span>
        </div>
      </Card>

      {service?.resources && (
        <Card className="mb-4 p-5">
          <h3 className="mb-3 font-medium">État des ressources</h3>
          <div className="space-y-2">
            {service.resources.map((r) => (
              <div key={r.name} className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">{r.name}</span>
                <StatusBadge status={r.status as import('@lutron/shared').CheckStatus} />
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <h3 className="mb-3 font-medium">Vérifications récentes</h3>
        <div className="divide-y divide-lutron-border">
          {recentChecks.map((c, i) => (
            <div key={i} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm">{String(c.resource)} / {String(c.check)}</p>
                <p className="text-xs text-zinc-600">{String(c.message)}</p>
              </div>
              <div className="flex items-center gap-2">
                {c.responseTimeMs != null && (
                  <span className="text-xs text-zinc-500">{String(c.responseTimeMs)}ms</span>
                )}
                <StatusBadge status={c.status as import('@lutron/shared').CheckStatus} />
              </div>
            </div>
          ))}
          {!recentChecks.length && <p className="py-4 text-sm text-zinc-500">Aucune vérification récente</p>}
        </div>
      </Card>
    </ViewLayout>
  );
}
