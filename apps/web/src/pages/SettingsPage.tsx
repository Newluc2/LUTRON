import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { ViewLayout } from '../components/layout/ViewLayout';
import { Card } from '../components/ui/Card';
import { api } from '../lib/api';

interface Channel {
  id: string;
  name: string;
  type: 'DISCORD' | 'TELEGRAM';
  enabled: boolean;
  events: string[];
  serviceIds: string[];
  config: Record<string, string>;
}

const EVENTS = ['ALERT_CREATED', 'ALERT_RESOLVED', 'CHECK_UPDATE'];

export function SettingsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'DISCORD' as 'DISCORD' | 'TELEGRAM',
    enabled: true,
    webhookUrl: '',
    botToken: '',
    chatId: '',
    events: ['ALERT_CREATED', 'ALERT_RESOLVED'] as string[],
  });

  const load = useCallback(() => void api.getChannels().then((c) => setChannels(c as unknown as Channel[])), []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const config =
      form.type === 'DISCORD'
        ? { webhookUrl: form.webhookUrl }
        : { botToken: form.botToken, chatId: form.chatId };

    await api.createChannel({
      name: form.name,
      type: form.type,
      enabled: form.enabled,
      events: form.events,
      serviceIds: [],
      config,
    });
    setOpen(false);
    load();
  };

  return (
    <ViewLayout
      title="Paramètres LUTRON"
      actions={
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
        >
          <Plus size={16} /> Ajouter un canal
        </button>
      }
    >
      <Card>
        <div className="divide-y divide-lutron-border">
          {channels.map((ch) => (
            <div key={ch.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-medium">{ch.name}</p>
                <p className="text-sm text-zinc-500">
                  {ch.type} · {ch.events.join(', ')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => void api.updateChannel(ch.id, { enabled: !ch.enabled }).then(load)}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    ch.enabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-500/15 text-zinc-400'
                  }`}
                >
                  {ch.enabled ? 'Actif' : 'Inactif'}
                </button>
                <button
                  onClick={() => void api.deleteChannel(ch.id).then(load)}
                  className="text-zinc-500 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {!channels.length && (
            <p className="px-5 py-8 text-center text-sm text-zinc-500">
              Aucun canal configuré. Les webhooks Discord/Telegram sont optionnels.
            </p>
          )}
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nouveau canal de notification" wide>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder="Nom du canal"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm"
            required
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as 'DISCORD' | 'TELEGRAM' })}
            className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm"
          >
            <option value="DISCORD">Discord (Webhook)</option>
            <option value="TELEGRAM">Telegram (Bot)</option>
          </select>
          {form.type === 'DISCORD' ? (
            <input
              placeholder="URL Webhook Discord"
              value={form.webhookUrl}
              onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })}
              className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm"
            />
          ) : (
            <>
              <input
                placeholder="Bot Token"
                value={form.botToken}
                onChange={(e) => setForm({ ...form, botToken: e.target.value })}
                className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm"
              />
              <input
                placeholder="Chat ID"
                value={form.chatId}
                onChange={(e) => setForm({ ...form, chatId: e.target.value })}
                className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm"
              />
            </>
          )}
          <div className="flex flex-wrap gap-2">
            {EVENTS.map((ev) => (
              <label key={ev} className="flex items-center gap-1.5 text-sm text-zinc-400">
                <input
                  type="checkbox"
                  checked={form.events.includes(ev)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      events: e.target.checked
                        ? [...form.events, ev]
                        : form.events.filter((x) => x !== ev),
                    })
                  }
                />
                {ev}
              </label>
            ))}
          </div>
          <button type="submit" className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white">
            Créer
          </button>
        </form>
      </Modal>
    </ViewLayout>
  );
}
