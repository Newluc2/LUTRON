import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { MaintenanceDto, ServiceDto } from '@lutron/shared';
import { Modal } from '../components/ui/Modal';
import { ViewLayout } from '../components/layout/ViewLayout';
import { Card } from '../components/ui/Card';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function MaintenancesPage() {
  const { user } = useAuth();
  const [maintenances, setMaintenances] = useState<MaintenanceDto[]>([]);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ serviceId: '', startAt: '', endAt: '', reason: '' });

  const load = useCallback(() => void api.getMaintenances().then(setMaintenances), []);

  useEffect(() => {
    load();
    void api.getServices().then(setServices);
  }, [load]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    await api.createMaintenance(form);
    setOpen(false);
    setForm({ serviceId: '', startAt: '', endAt: '', reason: '' });
    load();
  };

  return (
    <ViewLayout
      title="Maintenances"
      actions={
        user?.role === 'OWNER' ? (
          <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500">
            <Plus size={16} /> Planifier
          </button>
        ) : undefined
      }
    >
      <Card>
        <div className="divide-y divide-lutron-border">
          {maintenances.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-medium">{m.serviceName}</p>
                <p className="text-sm text-zinc-500">{m.reason}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm text-zinc-400">
                    {new Date(m.startAt).toLocaleString('fr-FR')} → {new Date(m.endAt).toLocaleString('fr-FR')}
                  </p>
                  {m.active && <span className="text-xs font-medium text-indigo-400">En cours</span>}
                </div>
                {user?.role === 'OWNER' && (
                  <button onClick={() => void api.deleteMaintenance(m.id).then(load)} className="text-zinc-500 hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {!maintenances.length && <p className="px-5 py-8 text-center text-sm text-zinc-500">Aucune maintenance planifiée</p>}
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Planifier une maintenance">
        <form onSubmit={handleCreate} className="space-y-4">
          <select value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })} className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm" required>
            <option value="">Sélectionner un service</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm" required />
          <input type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm" required />
          <input placeholder="Raison" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm" required />
          <button type="submit" className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white">Créer</button>
        </form>
      </Modal>
    </ViewLayout>
  );
}
