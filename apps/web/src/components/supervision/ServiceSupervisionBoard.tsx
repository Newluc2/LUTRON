import { useCallback, useEffect, useRef, useState } from 'react';
import GridLayout, { type Layout } from 'react-grid-layout';
import { GripVertical, Package, Plus, Settings2, Trash2 } from 'lucide-react';
import type { CheckStatus, ServiceWidgetDto, WidgetType } from '@lutron/shared';
import { WS_EVENTS, WIDGET_TYPE_LABELS } from '@lutron/shared';
import { Modal } from '../ui/Modal';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { AvailabilityChart } from '../charts/AvailabilityChart';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface ServiceData {
  id: string;
  name: string;
  tags: string[];
  status: CheckStatus;
  resources: Array<{
    id: string;
    name: string;
    status: CheckStatus;
    checks: Array<{ name: string; type: string; status: CheckStatus; responseTimeMs: number | null }>;
  }>;
}

interface Props {
  service: ServiceData;
  availability: Array<{ date: string; availability: number }>;
}

export function ServiceSupervisionBoard({ service, availability }: Props) {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<ServiceWidgetDto[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [packOpen, setPackOpen] = useState(false);
  const [packs, setPacks] = useState<Array<{ id: string; name: string; description: string | null; category: string }>>([]);
  const [newWidget, setNewWidget] = useState<{ type: WidgetType; title: string }>({ type: 'LOCAL_COMMAND', title: '' });
  const [editingWidget, setEditingWidget] = useState<ServiceWidgetDto | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editConfig, setEditConfig] = useState<Record<string, unknown>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(1200);

  useEffect(() => {
    if (editingWidget) {
      setEditTitle(editingWidget.title);
      setEditConfig(editingWidget.config || {});
    } else {
      setEditTitle('');
      setEditConfig({});
    }
  }, [editingWidget]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setGridWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const load = useCallback(() => {
    void api.getServiceWidgets(service.id).then(setWidgets);
  }, [service.id]);

  useEffect(() => { load(); }, [load]);

  useSocket(WS_EVENTS.WIDGET_LAYOUT_UPDATED, (payload: unknown) => {
    const p = payload as { serviceId?: string };
    if (p.serviceId === service.id) load();
  });

  const gridLayout: Layout[] = widgets.map((w) => ({
    i: w.id,
    x: w.layout.x,
    y: w.layout.y,
    w: w.layout.w,
    h: w.layout.h,
    minW: 2,
    minH: 2,
    static: !editMode,
  }));

  const handleLayoutChange = (layout: Layout[]) => {
    if (!editMode) return;
    const layouts = layout.map((l) => ({
      id: l.i,
      layout: { x: l.x, y: l.y, w: l.w, h: l.h },
    }));
    void api.updateWidgetLayout(service.id, layouts).then(setWidgets);
  };

  const handleAddWidget = async () => {
    await api.createServiceWidget(service.id, {
      type: newWidget.type,
      title: newWidget.title || WIDGET_TYPE_LABELS[newWidget.type],
      layout: { x: 0, y: 9999, w: 4, h: 3 },
    });
    setAddOpen(false);
    setNewWidget({ type: 'LOCAL_COMMAND', title: '' });
    load();
  };

  const handleSaveWidget = async () => {
    if (!editingWidget) return;
    await api.updateWidget(editingWidget.id, {
      title: editTitle,
      config: editConfig,
    });
    setEditingWidget(null);
    load();
  };

  const openPacks = () => {
    void api.getSupervisionPacks().then(setPacks);
    setPackOpen(true);
  };

  const applyPack = async (packId: string) => {
    const updated = await api.applySupervisionPack(service.id, packId);
    setWidgets(updated);
    setPackOpen(false);
  };

  const deleteWidget = async (id: string) => {
    if (!confirm('Supprimer ce bloc ?')) return;
    await api.deleteServiceWidget(id);
    load();
  };

  return (
    <div ref={containerRef}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {service.tags.map((tag) => (
            <span key={tag} className="rounded-md bg-lutron-bg px-2.5 py-1 text-xs text-zinc-400">{tag}</span>
          ))}
          <StatusBadge status={service.status} />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm ${editMode ? 'bg-violet-600 text-white' : 'bg-lutron-card text-zinc-400 hover:text-white'}`}
          >
            <Settings2 size={16} /> {editMode ? 'Terminer' : 'Personnaliser'}
          </button>
          {editMode && (
            <>
              <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 rounded-xl bg-lutron-card px-4 py-2 text-sm text-zinc-300 hover:text-white">
                <Plus size={16} /> Bloc
              </button>
              <button onClick={openPacks} className="flex items-center gap-2 rounded-xl bg-lutron-card px-4 py-2 text-sm text-zinc-300 hover:text-white">
                <Package size={16} /> Pack
              </button>
            </>
          )}
        </div>
      </div>

      {editMode && (
        <p className="mb-3 text-xs text-zinc-500">Glissez-déposez les blocs pour réorganiser votre tableau de supervision.</p>
      )}

      <GridLayout
        className="layout"
        layout={gridLayout}
        cols={12}
        rowHeight={48}
        width={gridWidth}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".widget-drag-handle"
        isDraggable={editMode}
        isResizable={editMode}
        compactType="vertical"
      >
        {widgets.map((widget) => (
          <div key={widget.id}>
            <Card className="flex h-full flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-lutron-border px-3 py-2">
                <div className="flex items-center gap-2">
                  {editMode && <GripVertical size={14} className="widget-drag-handle cursor-grab text-zinc-600" />}
                  <span className="text-sm font-medium">{widget.title}</span>
                </div>
                {editMode && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingWidget(widget)}
                      className="text-zinc-600 hover:text-violet-400"
                    >
                      <Settings2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteWidget(widget.id)}
                      className="text-zinc-600 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-hidden p-3 flex flex-col min-h-0">
                <WidgetRenderer widget={widget} service={service} availability={availability} isOwner={user?.role === 'OWNER'} />
              </div>
            </Card>
          </div>
        ))}
      </GridLayout>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Ajouter un bloc">
        <div className="space-y-4">
          <select
            value={newWidget.type}
            onChange={(e) => setNewWidget({ ...newWidget, type: e.target.value as WidgetType })}
            className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm"
          >
            {Object.entries(WIDGET_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <input
            placeholder="Titre du bloc"
            value={newWidget.title}
            onChange={(e) => setNewWidget({ ...newWidget, title: e.target.value })}
            className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm"
          />
          <button onClick={() => void handleAddWidget()} className="w-full rounded-xl bg-violet-600 py-2.5 text-sm text-white">
            Ajouter
          </button>
        </div>
      </Modal>

      <Modal open={packOpen} onClose={() => setPackOpen(false)} title="Appliquer un pack" wide>
        <div className="space-y-3">
          {packs.map((pack) => (
            <button
              key={pack.id}
              onClick={() => void applyPack(pack.id)}
              className="w-full rounded-xl border border-lutron-border bg-lutron-bg p-4 text-left transition-colors hover:border-violet-500/50"
            >
              <p className="font-medium">{pack.name}</p>
              <p className="text-sm text-zinc-500">{pack.description}</p>
              <span className="mt-1 inline-block text-xs text-zinc-600">{pack.category}</span>
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={!!editingWidget} onClose={() => setEditingWidget(null)} title="Configurer le bloc">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Titre du bloc</label>
            <input
              placeholder="Titre"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm"
            />
          </div>

          {editingWidget?.type === 'AVAILABILITY_CHART' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Nombre de jours</label>
              <input
                type="number"
                min={1}
                max={30}
                value={Number(editConfig.days ?? 7)}
                onChange={(e) => setEditConfig({ ...editConfig, days: Number(e.target.value) })}
                className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm"
              />
            </div>
          )}

          {editingWidget?.type === 'CUSTOM_NOTE' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Contenu de la note</label>
              <textarea
                rows={4}
                value={String(editConfig.content ?? '')}
                onChange={(e) => setEditConfig({ ...editConfig, content: e.target.value })}
                className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm font-sans"
              />
            </div>
          )}

          {editingWidget?.type === 'CONFIG_BUTTON' && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Texte du bouton</label>
                <input
                  value={String(editConfig.buttonLabel ?? '')}
                  onChange={(e) => setEditConfig({ ...editConfig, buttonLabel: e.target.value })}
                  className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Action</label>
                <select
                  value={String(editConfig.action ?? 'open_url')}
                  onChange={(e) => setEditConfig({ ...editConfig, action: e.target.value })}
                  className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm"
                >
                  <option value="open_url">Ouvrir un lien URL</option>
                  <option value="alert">Afficher une alerte</option>
                </select>
              </div>
              {editConfig.action === 'open_url' ? (
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400">Lien URL</label>
                  <input
                    placeholder="https://..."
                    value={String(editConfig.url ?? '')}
                    onChange={(e) => setEditConfig({ ...editConfig, url: e.target.value })}
                    className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400">Message d'alerte</label>
                  <input
                    placeholder="Message..."
                    value={String(editConfig.message ?? '')}
                    onChange={(e) => setEditConfig({ ...editConfig, message: e.target.value })}
                    className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm"
                  />
                </div>
              )}
            </>
          )}

          {(editingWidget?.type === 'LOCAL_COMMAND' ||
            editingWidget?.type === 'REMOTE_COMMAND' ||
            editingWidget?.type === 'CONSOLE_OUTPUT' ||
            editingWidget?.type === 'LOG_STREAM') && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Commande à exécuter</label>
              <textarea
                rows={3}
                placeholder="docker logs -f my-app"
                value={String(editConfig.command ?? '')}
                onChange={(e) => setEditConfig({ ...editConfig, command: e.target.value })}
                className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm font-mono"
              />
            </div>
          )}

          {(editingWidget?.type === 'LOCAL_COMMAND' || editingWidget?.type === 'REMOTE_COMMAND') && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Texte du bouton</label>
                <input
                  value={String(editConfig.buttonLabel ?? 'Exécuter')}
                  onChange={(e) => setEditConfig({ ...editConfig, buttonLabel: e.target.value })}
                  className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editConfirm"
                  checked={Boolean(editConfig.confirm)}
                  onChange={(e) => setEditConfig({ ...editConfig, confirm: e.target.checked })}
                  className="rounded border-lutron-border bg-lutron-bg text-violet-600 focus:ring-violet-500"
                />
                <label htmlFor="editConfirm" className="text-xs text-zinc-400 select-none cursor-pointer">
                  Demander confirmation avant d'exécuter
                </label>
              </div>
            </>
          )}

          {editingWidget?.type === 'REMOTE_COMMAND' && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Hôte SSH (IP ou nom de domaine)</label>
                <input
                  placeholder="192.168.1.10"
                  value={String(editConfig.host ?? '')}
                  onChange={(e) => setEditConfig({ ...editConfig, host: e.target.value })}
                  className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Utilisateur SSH</label>
                <input
                  placeholder="root"
                  value={String(editConfig.user ?? 'root')}
                  onChange={(e) => setEditConfig({ ...editConfig, user: e.target.value })}
                  className="w-full rounded-xl border border-lutron-border bg-lutron-bg px-4 py-2.5 text-sm"
                />
              </div>
            </>
          )}

          {editingWidget?.type === 'CONSOLE_OUTPUT' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editAutoRun"
                checked={Boolean(editConfig.autoRun)}
                onChange={(e) => setEditConfig({ ...editConfig, autoRun: e.target.checked })}
                className="rounded border-lutron-border bg-lutron-bg text-violet-600 focus:ring-violet-500"
              />
              <label htmlFor="editAutoRun" className="text-xs text-zinc-400 select-none cursor-pointer">
                Exécuter automatiquement au chargement
              </label>
            </div>
          )}

          <button onClick={() => void handleSaveWidget()} className="w-full rounded-xl bg-violet-600 py-2.5 text-sm text-white">
            Enregistrer
          </button>
        </div>
      </Modal>
    </div>
  );
}

function WidgetRenderer({
  widget,
  service,
  availability,
  isOwner,
}: {
  widget: ServiceWidgetDto;
  service: ServiceData;
  availability: Array<{ date: string; availability: number }>;
  isOwner: boolean;
}) {
  switch (widget.type) {
    case 'MONITORING_OVERVIEW':
      if (!service.resources || service.resources.length === 0) {
        return (
          <div className="flex h-full flex-col items-center justify-center p-4 text-center text-xs text-zinc-500">
            <span className="font-medium mb-1">Aucune ressource configurée</span>
            <span className="text-[10px] text-zinc-600">Configurez des ressources dans l'onglet Monitoring</span>
          </div>
        );
      }
      return (
        <div className="space-y-2 overflow-auto h-full pr-1">
          {service.resources.map((r) => (
            <div key={r.id} className="rounded-lg bg-lutron-bg px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">{r.name}</span>
                <StatusBadge status={r.status} />
              </div>
              {r.checks.map((c) => (
                <div key={c.name} className="mt-1 flex justify-between text-xs text-zinc-500">
                  <span>{c.type} — {c.name}</span>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    case 'AVAILABILITY_CHART':
      return <AvailabilityChart data={availability} />;
    case 'CUSTOM_NOTE':
      return <p className="whitespace-pre-wrap text-sm text-zinc-400 overflow-auto h-full pr-1">{String(widget.config.content ?? '')}</p>;
    case 'CONFIG_BUTTON':
      return <ConfigButtonWidget config={widget.config} />;
    case 'LOCAL_COMMAND':
      return <CommandWidget widget={widget} mode="local" isOwner={isOwner} />;
    case 'REMOTE_COMMAND':
      return <CommandWidget widget={widget} mode="remote" isOwner={isOwner} />;
    case 'CONSOLE_OUTPUT':
      return <ConsoleWidget widget={widget} isOwner={isOwner} autoRun={Boolean(widget.config.autoRun)} />;
    case 'LOG_STREAM':
      return <LogStreamWidget widget={widget} isOwner={isOwner} />;
    default:
      return <p className="text-sm text-zinc-500">Type non supporté</p>;
  }
}

function ConfigButtonWidget({ config }: { config: Record<string, unknown> }) {
  const label = String(config.buttonLabel ?? 'Configuration');
  const action = String(config.action ?? 'open_url');

  const handleClick = () => {
    if (action === 'open_url' && config.url) {
      window.open(String(config.url), '_blank');
    } else if (action === 'alert') {
      alert(String(config.message ?? 'Action configuration'));
    }
  };

  return (
    <button onClick={handleClick} className="rounded-xl bg-violet-600/20 px-4 py-2 text-sm text-violet-400 hover:bg-violet-600/30">
      {label}
    </button>
  );
}

function CommandWidget({
  widget,
  mode,
  isOwner,
}: {
  widget: ServiceWidgetDto;
  mode: 'local' | 'remote';
  isOwner: boolean;
}) {
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const label = String(widget.config.buttonLabel ?? 'Exécuter');
  const command = String(widget.config.command ?? '');
  const confirm = Boolean(widget.config.confirm);

  const run = async () => {
    if (!isOwner) return;
    if (confirm && !window.confirm(`Exécuter : ${command} ?`)) return;
    setRunning(true);
    try {
      const result = await api.executeWidgetCommand(widget.id, {
        command,
        mode,
        remoteConfig: widget.config as Record<string, string>,
      });
      setOutput(result.output);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="font-mono text-xs text-zinc-600">{command || 'Commande non configurée'}</p>
      <button
        onClick={() => void run()}
        disabled={!isOwner || running || !command}
        className="rounded-xl bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-500 disabled:opacity-50"
      >
        {running ? 'Exécution...' : label}
      </button>
      {output && <pre className="max-h-32 overflow-auto rounded-lg bg-lutron-bg p-2 font-mono text-xs text-zinc-400">{output}</pre>}
      {!isOwner && <p className="text-xs text-zinc-600">Réservé Owner</p>}
    </div>
  );
}

function ConsoleWidget({
  widget,
  isOwner,
  autoRun,
}: {
  widget: ServiceWidgetDto;
  isOwner: boolean;
  autoRun: boolean;
}) {
  const [output, setOutput] = useState('');
  const command = String(widget.config.command ?? '');

  const run = useCallback(async () => {
    if (!command) return;
    const result = await api.executeWidgetCommand(widget.id, { command });
    setOutput(result.output);
  }, [widget.id, command]);

  useEffect(() => {
    if (autoRun && command) void run();
  }, [autoRun, command, run]);

  return (
    <div className="flex h-full flex-col">
      {isOwner && (
        <button onClick={() => void run()} className="mb-2 self-start rounded-lg bg-lutron-bg px-3 py-1 text-xs text-zinc-400 hover:text-white">
          Rafraîchir
        </button>
      )}
      <pre className="flex-1 overflow-auto rounded-lg bg-black/40 p-2 font-mono text-xs text-emerald-400/90">
        {output || (command ? 'En attente...' : 'Commande non configurée')}
      </pre>
    </div>
  );
}

function LogStreamWidget({ widget, isOwner }: { widget: ServiceWidgetDto; isOwner: boolean }) {
  const [lines, setLines] = useState<string[]>([]);
  const [streaming, setStreaming] = useState(false);
  const command = String(widget.config.command ?? '');

  useSocket(WS_EVENTS.WIDGET_OUTPUT, (payload: unknown) => {
    const p = payload as { widgetId: string; line: string; done?: boolean };
    if (p.widgetId !== widget.id) return;
    setLines((prev) => [...prev.slice(-200), p.line]);
    if (p.done) setStreaming(false);
  });

  const start = async () => {
    if (!isOwner || !command) return;
    setLines([]);
    setStreaming(true);
    await api.startWidgetStream(widget.id, { command });
  };

  const stop = async () => {
    await api.stopWidgetStream(widget.id);
    setStreaming(false);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex gap-2">
        {isOwner && !streaming && (
          <button onClick={() => void start()} className="rounded-lg bg-violet-600/20 px-3 py-1 text-xs text-violet-400">
            Démarrer flux
          </button>
        )}
        {streaming && (
          <button onClick={() => void stop()} className="rounded-lg bg-red-500/20 px-3 py-1 text-xs text-red-400">
            Arrêter
          </button>
        )}
      </div>
      <pre className="flex-1 overflow-auto rounded-lg bg-black/40 p-2 font-mono text-xs text-zinc-400">
        {lines.length ? lines.join('\n') : command || 'Commande non configurée (ex: docker logs -f container)'}
      </pre>
    </div>
  );
}
