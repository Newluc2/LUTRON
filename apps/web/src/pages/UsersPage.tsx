import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import type { UserDto } from '@lutron/shared';
import { WS_EVENTS } from '@lutron/shared';
import { Modal } from '../components/ui/Modal';
import { ViewLayout } from '../components/layout/ViewLayout';
import { Card } from '../components/ui/Card';
import { api } from '../lib/api';
import { useSocketRefresh } from '../hooks/useSocket';

export function UsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'USER' });

  const load = useCallback(() => void api.getUsers().then(setUsers), []);
  useEffect(() => { load(); }, [load]);
  useSocketRefresh(WS_EVENTS.USER_UPDATED, load);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    await api.createUser(form);
    setOpen(false);
    setForm({ email: '', name: '', password: '', role: 'USER' });
    load();
  };

  return (
    <ViewLayout
      title="Utilisateurs"
      actions={
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500">
          <Plus size={16} /> Créer
        </button>
      }
    >
      <Card>
        <div className="divide-y divide-lutron-border">
          {users.map((user) => (
            <Link key={user.id} to={`/users/${user.id}`} className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-lutron-card-hover">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lutron-bg text-sm font-semibold text-violet-400">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-zinc-500">{user.email}</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${user.role === 'OWNER' ? 'bg-violet-500/15 text-violet-400' : 'bg-zinc-500/15 text-zinc-400'}`}>
                {user.role}
              </span>
            </Link>
          ))}
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Créer un utilisateur">
        <form onSubmit={handleCreate} className="space-y-4">
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm" required />
          <input placeholder="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm" required />
          <input type="password" placeholder="Mot de passe" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm" required />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm">
            <option value="USER">USER</option>
            <option value="OWNER">OWNER</option>
          </select>
          <button type="submit" className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white">Créer</button>
        </form>
      </Modal>
    </ViewLayout>
  );
}
