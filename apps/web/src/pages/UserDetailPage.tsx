import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { ViewLayout } from '../components/layout/ViewLayout';
import { Card } from '../components/ui/Card';
import { api } from '../lib/api';

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('USER');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!id) return;
    void api.getUser(id).then((u) => {
      setUser(u);
      setName(String(u.name));
      setRole(String(u.role));
    });
  }, [id]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    await api.updateUser(id!, { name, role, ...(password ? { password } : {}) });
    const updated = await api.getUser(id!);
    setUser(updated);
    setPassword('');
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    await api.deleteUser(id!);
    navigate('/users');
  };

  if (!user) {
    return <ViewLayout title="Utilisateur"><Card className="p-8 text-center text-zinc-500">Chargement...</Card></ViewLayout>;
  }

  const serviceUsers = (user.serviceUsers as Array<Record<string, unknown>>) ?? [];

  return (
    <ViewLayout
      title={String(user.name)}
      actions={
        <button onClick={handleDelete} className="flex items-center gap-2 rounded-xl bg-red-500/15 px-4 py-2 text-sm text-red-400 hover:bg-red-500/25">
          <Trash2 size={16} /> Supprimer
        </button>
      }
    >
      <Card className="mb-4 p-5">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Email</label>
            <p className="text-sm">{String(user.email)}</p>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Nom</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Rôle global</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2 text-sm">
              <option value="USER">USER</option>
              <option value="OWNER">OWNER</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Nouveau mot de passe (optionnel)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2 text-sm" />
          </div>
          <button type="submit" className="rounded-xl bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-500">Enregistrer</button>
        </form>
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 font-medium">Accès par service (RBAC)</h3>
        <div className="divide-y divide-lutron-border">
          {serviceUsers.map((su) => {
            const service = su.service as { name: string };
            const roleObj = su.role as { name: string; rolePermissions?: Array<{ permission: { name: string } }> };
            return (
              <div key={String(su.serviceId)} className="py-3">
                <p className="font-medium">{service.name}</p>
                <p className="text-sm text-violet-400">Rôle : {roleObj.name}</p>
                <p className="mt-1 text-xs text-zinc-600">
                  {(roleObj.rolePermissions ?? []).map((rp) => rp.permission.name).join(', ')}
                </p>
              </div>
            );
          })}
          {!serviceUsers.length && <p className="py-4 text-sm text-zinc-500">Aucun accès service assigné</p>}
        </div>
      </Card>
    </ViewLayout>
  );
}
