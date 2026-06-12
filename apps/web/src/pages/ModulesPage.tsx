import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { ViewLayout } from '../components/layout/ViewLayout';
import { Card } from '../components/ui/Card';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface ModuleInfo {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
}

const CORE_IDS = ['monitoring', 'documents', 'access', 'maintenance', 'alerts'];

export function ModulesPage() {
  const { user } = useAuth();
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', version: '1.0.0' });

  const load = useCallback(() => void api.getModules().then(setModules), []);
  useEffect(() => { load(); }, [load]);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    await api.registerModule(form);
    setOpen(false);
    setForm({ id: '', name: '', version: '1.0.0' });
    load();
  };

  return (
    <ViewLayout
      title="Modules"
      actions={
        user?.role === 'OWNER' ? (
          <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500">
            <Plus size={16} /> Ajouter
          </button>
        ) : undefined
      }
    >
      <Card>
        <div className="divide-y divide-lutron-border">
          {modules.map((mod) => (
            <div key={mod.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-medium">{mod.name}</p>
                <p className="text-sm text-zinc-500">{mod.id}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-600">v{mod.version}</span>
                {user?.role === 'OWNER' && (
                  <>
                    <button
                      onClick={() => void api.toggleModule(mod.id, !mod.enabled).then(load)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${mod.enabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-500/15 text-zinc-400'}`}
                    >
                      {mod.enabled ? 'Actif' : 'Inactif'}
                    </button>
                    {!CORE_IDS.includes(mod.id) && (
                      <button onClick={() => void api.deleteModule(mod.id).then(load)} className="text-zinc-500 hover:text-red-400">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Enregistrer un module">
        <form onSubmit={handleRegister} className="space-y-4">
          <input placeholder="ID (ex: ticketing)" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm" required />
          <input placeholder="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm" required />
          <input placeholder="Version" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm" required />
          <button type="submit" className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white">Enregistrer</button>
        </form>
      </Modal>
    </ViewLayout>
  );
}
