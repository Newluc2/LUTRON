import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import type { ServiceDto } from '@lutron/shared';
import { WS_EVENTS } from '@lutron/shared';
import { Modal } from '../components/ui/Modal';
import { ViewLayout } from '../components/layout/ViewLayout';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSocketRefresh } from '../hooks/useSocket';

const filters = [
  { id: 'all', label: 'Tous' },
  { id: 'up', label: 'Actifs' },
  { id: 'down', label: 'En panne' },
];

export function ServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ technicalId: '', name: '', description: '', tags: '' });

  const load = useCallback(() => void api.getServices().then(setServices), []);
  useEffect(() => { load(); }, [load]);
  useSocketRefresh(WS_EVENTS.SERVICE_UPDATED, load);

  const filtered = services.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.technicalId.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ||
      (filter === 'up' && s.status === 'UP') ||
      (filter === 'down' && s.status === 'DOWN');
    return matchSearch && matchFilter;
  });

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    await api.createService({
      technicalId: form.technicalId,
      name: form.name,
      description: form.description || undefined,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()) : [],
    });
    setOpen(false);
    setForm({ technicalId: '', name: '', description: '', tags: '' });
    load();
  };

  return (
    <ViewLayout
      title="Liste Services"
      filters={filters}
      activeFilter={filter}
      onFilterChange={setFilter}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Rechercher un service..."
      actions={
        user?.role === 'OWNER' ? (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            <Plus size={16} /> Créer
          </button>
        ) : undefined
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
                  <p className="text-sm text-zinc-500">{service.technicalId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {service.tags.map((tag) => (
                  <span key={tag} className="rounded-md bg-lutron-bg px-2 py-0.5 text-xs text-zinc-500">{tag}</span>
                ))}
                <StatusBadge status={service.status} />
              </div>
            </Link>
          ))}
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Créer un service">
        <form onSubmit={handleCreate} className="space-y-4">
          <input placeholder="ID technique (ex: api-prod)" value={form.technicalId} onChange={(e) => setForm({ ...form, technicalId: e.target.value })} className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm" required />
          <input placeholder="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm" required />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm" />
          <input placeholder="Tags (séparés par virgule)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm" />
          <button type="submit" className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white">Créer</button>
        </form>
      </Modal>
    </ViewLayout>
  );
}
