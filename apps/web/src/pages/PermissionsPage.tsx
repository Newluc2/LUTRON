import { FormEvent, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import type { ServiceDto } from '@lutron/shared';
import { Modal } from '../components/ui/Modal';
import { ViewLayout } from '../components/layout/ViewLayout';
import { Card } from '../components/ui/Card';
import { api } from '../lib/api';

interface Permission { id: string; name: string; module: string; description: string }
interface Role {
  id: string;
  name: string;
  rolePermissions: Array<{ permission: Permission }>;
  serviceUsers: Array<{ user: { name: string; email: string } }>;
}

export function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', permissionIds: [] as string[] });

  useEffect(() => {
    void api.getPermissions().then(setPermissions);
    void api.getServices().then((s) => {
      setServices(s);
      if (s.length) setSelectedService(s[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedService) return;
    void api.getServiceRoles(selectedService).then((r) => setRoles(r as Role[]));
  }, [selectedService]);

  const handleCreateRole = async (e: FormEvent) => {
    e.preventDefault();
    await api.createRole({ serviceId: selectedService, name: form.name, permissionIds: form.permissionIds });
    setOpen(false);
    setForm({ name: '', permissionIds: [] });
    void api.getServiceRoles(selectedService).then((r) => setRoles(r as Role[]));
  };

  return (
    <ViewLayout
      title="Permissions & Rôles"
      actions={
        <button onClick={() => setOpen(true)} disabled={!selectedService} className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50">
          <Plus size={16} /> Créer un rôle
        </button>
      }
    >
      <div className="mb-4">
        <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)} className="rounded-xl border border-lutron-border bg-lutron-card px-4 py-2 text-sm">
          {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="mb-3 font-medium">Rôles du service</h3>
          <div className="space-y-3">
            {roles.map((role) => (
              <div key={role.id} className="rounded-xl bg-lutron-bg p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-violet-400">{role.name}</p>
                  <button onClick={() => void api.deleteRole(role.id).then(() => api.getServiceRoles(selectedService).then((r) => setRoles(r as Role[])))} className="text-xs text-red-400 hover:underline">Supprimer</button>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {role.rolePermissions.map((rp) => rp.permission.id).join(', ')}
                </p>
                <p className="mt-2 text-xs text-zinc-600">
                  {role.serviceUsers.length} utilisateur(s) : {role.serviceUsers.map((su) => su.user.name).join(', ') || '—'}
                </p>
              </div>
            ))}
            {!roles.length && <p className="text-sm text-zinc-500">Aucun rôle pour ce service</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 font-medium">Permissions disponibles</h3>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {permissions.map((perm) => (
              <div key={perm.id} className="text-sm">
                <span className="font-mono text-xs text-zinc-500">{perm.id}</span>
                <p className="text-zinc-400">{perm.name}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Créer un rôle" wide>
        <form onSubmit={handleCreateRole} className="space-y-4">
          <input placeholder="Nom du rôle" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm" required />
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {permissions.map((perm) => (
              <label key={perm.id} className="flex items-center gap-2 text-sm text-zinc-400">
                <input
                  type="checkbox"
                  checked={form.permissionIds.includes(perm.id)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      permissionIds: e.target.checked
                        ? [...form.permissionIds, perm.id]
                        : form.permissionIds.filter((id) => id !== perm.id),
                    })
                  }
                />
                <span className="font-mono text-xs">{perm.id}</span> — {perm.name}
              </label>
            ))}
          </div>
          <button type="submit" className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white">Créer le rôle</button>
        </form>
      </Modal>
    </ViewLayout>
  );
}
