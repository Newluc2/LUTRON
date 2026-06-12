import { Injectable, NotFoundException } from '@nestjs/common';
import { WidgetType } from '@prisma/client';
import { WS_EVENTS } from '@lutron/shared';
import { EventsGateway } from '../events/events.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { ApplyPackDto } from './dto/apply-pack.dto';
import { CreateWidgetDto } from './dto/create-widget.dto';
import { UpdateLayoutDto } from './dto/update-layout.dto';
import { UpdateWidgetDto } from './dto/update-widget.dto';

const DEFAULT_WIDGETS = [
  { type: 'MONITORING_OVERVIEW' as WidgetType, title: 'Monitoring', layoutX: 0, layoutY: 0, layoutW: 8, layoutH: 5, config: {} },
  { type: 'AVAILABILITY_CHART' as WidgetType, title: 'Disponibilité', layoutX: 8, layoutY: 0, layoutW: 4, layoutH: 5, config: {} },
];

@Injectable()
export class SupervisionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway,
  ) {}

  private mapWidget(w: {
    id: string;
    serviceId: string;
    type: WidgetType;
    title: string;
    config: unknown;
    layoutX: number;
    layoutY: number;
    layoutW: number;
    layoutH: number;
    packId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: w.id,
      serviceId: w.serviceId,
      type: w.type,
      title: w.title,
      config: w.config as Record<string, unknown>,
      layout: { x: w.layoutX, y: w.layoutY, w: w.layoutW, h: w.layoutH },
      packId: w.packId,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
    };
  }

  async ensureDefaultLayout(serviceId: string) {
    const count = await this.prisma.serviceWidget.count({ where: { serviceId } });
    if (count > 0) return;

    await this.prisma.serviceWidget.createMany({
      data: DEFAULT_WIDGETS.map((w) => ({ ...w, serviceId, config: {} })),
    });
  }

  async getWidgets(serviceId: string) {
    await this.ensureDefaultLayout(serviceId);
    const widgets = await this.prisma.serviceWidget.findMany({
      where: { serviceId },
      orderBy: [{ layoutY: 'asc' }, { layoutX: 'asc' }],
    });
    return widgets.map((w) => this.mapWidget(w));
  }

  async createWidget(serviceId: string, dto: CreateWidgetDto) {
    const widget = await this.prisma.serviceWidget.create({
      data: {
        serviceId,
        type: dto.type as WidgetType,
        title: dto.title,
        config: (dto.config ?? {}) as object,
        layoutX: dto.layout?.x ?? 0,
        layoutY: dto.layout?.y ?? 99,
        layoutW: dto.layout?.w ?? 4,
        layoutH: dto.layout?.h ?? 3,
        packId: dto.packId,
      },
    });
    const mapped = this.mapWidget(widget);
    this.events.emit(WS_EVENTS.WIDGET_LAYOUT_UPDATED, { serviceId, widgets: [mapped] });
    return mapped;
  }

  async updateWidget(id: string, dto: UpdateWidgetDto) {
    const existing = await this.prisma.serviceWidget.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Widget introuvable');

    const widget = await this.prisma.serviceWidget.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.config !== undefined && { config: dto.config as object }),
        ...(dto.layout?.x !== undefined && { layoutX: dto.layout.x }),
        ...(dto.layout?.y !== undefined && { layoutY: dto.layout.y }),
        ...(dto.layout?.w !== undefined && { layoutW: dto.layout.w }),
        ...(dto.layout?.h !== undefined && { layoutH: dto.layout.h }),
      },
    });
    return this.mapWidget(widget);
  }

  async updateLayouts(serviceId: string, dto: UpdateLayoutDto) {
    await Promise.all(
      dto.layouts.map((item) =>
        this.prisma.serviceWidget.update({
          where: { id: item.id },
          data: {
            layoutX: item.layout.x,
            layoutY: item.layout.y,
            layoutW: item.layout.w,
            layoutH: item.layout.h,
          },
        }),
      ),
    );

    const widgets = await this.getWidgets(serviceId);
    this.events.emit(WS_EVENTS.WIDGET_LAYOUT_UPDATED, { serviceId, widgets });
    return widgets;
  }

  async deleteWidget(id: string) {
    const widget = await this.prisma.serviceWidget.findUnique({ where: { id } });
    if (!widget) throw new NotFoundException('Widget introuvable');
    await this.prisma.serviceWidget.delete({ where: { id } });
    this.events.emit(WS_EVENTS.WIDGET_LAYOUT_UPDATED, { serviceId: widget.serviceId });
  }

  async getPacks() {
    const packs = await this.prisma.supervisionPack.findMany({ orderBy: { name: 'asc' } });
    if (!packs.length) await this.seedSystemPacks();
    return this.prisma.supervisionPack.findMany({ orderBy: { name: 'asc' } }).then((p) =>
      p.map((pack) => ({
        id: pack.id,
        name: pack.name,
        description: pack.description,
        category: pack.category,
        widgets: pack.widgets as unknown[],
        isSystem: pack.isSystem,
      })),
    );
  }

  async applyPack(serviceId: string, dto: ApplyPackDto) {
    const pack = await this.prisma.supervisionPack.findUnique({ where: { id: dto.packId } });
    if (!pack) throw new NotFoundException('Pack introuvable');

    const templates = pack.widgets as Array<{
      type: WidgetType;
      title: string;
      config?: Record<string, unknown>;
      layout: { x: number; y: number; w: number; h: number };
    }>;

    const maxY = await this.prisma.serviceWidget.aggregate({
      where: { serviceId },
      _max: { layoutY: true },
    });
    const offsetY = (maxY._max.layoutY ?? 0) + 1;

    await this.prisma.serviceWidget.createMany({
      data: templates.map((t, i) => ({
        serviceId,
        type: t.type,
        title: t.title,
        config: (t.config ?? {}) as object,
        layoutX: t.layout.x,
        layoutY: t.layout.y + offsetY + i,
        layoutW: t.layout.w,
        layoutH: t.layout.h,
        packId: pack.id,
      })),
    });

    return this.getWidgets(serviceId);
  }

  private async seedSystemPacks() {
    const packs = [
      {
        name: 'Supervision Docker',
        description: 'Logs conteneur et commandes Docker',
        category: 'docker',
        isSystem: true,
        widgets: [
          {
            type: 'LOG_STREAM',
            title: 'Logs Docker',
            config: { command: 'docker logs --tail 50 -f mon-container', streamOnLoad: false },
            layout: { x: 0, y: 0, w: 8, h: 6 },
          },
          {
            type: 'LOCAL_COMMAND',
            title: 'Redémarrer conteneur',
            config: { command: 'docker restart mon-container', buttonLabel: 'Redémarrer', confirm: true },
            layout: { x: 8, y: 0, w: 4, h: 2 },
          },
          {
            type: 'CONSOLE_OUTPUT',
            title: 'État conteneurs',
            config: { command: 'docker ps -a', autoRun: true },
            layout: { x: 8, y: 2, w: 4, h: 4 },
          },
        ],
      },
      {
        name: 'Administration distante',
        description: 'Commandes SSH et actions admin',
        category: 'remote',
        isSystem: true,
        widgets: [
          {
            type: 'REMOTE_COMMAND',
            title: 'Commande SSH',
            config: { host: '', user: 'root', command: 'uptime', buttonLabel: 'Exécuter' },
            layout: { x: 0, y: 0, w: 6, h: 4 },
          },
          {
            type: 'CONFIG_BUTTON',
            title: 'Ouvrir configuration',
            config: { action: 'open_url', url: '', buttonLabel: 'Configuration' },
            layout: { x: 6, y: 0, w: 3, h: 2 },
          },
          {
            type: 'LOCAL_COMMAND',
            title: 'Script local',
            config: { command: 'echo "Hello LUTRON"', buttonLabel: 'Lancer' },
            layout: { x: 9, y: 0, w: 3, h: 2 },
          },
        ],
      },
      {
        name: 'Monitoring avancé',
        description: 'Vue monitoring + graphiques',
        category: 'monitoring',
        isSystem: true,
        widgets: [
          {
            type: 'MONITORING_OVERVIEW',
            title: 'Ressources',
            config: {},
            layout: { x: 0, y: 0, w: 8, h: 5 },
          },
          {
            type: 'AVAILABILITY_CHART',
            title: 'Disponibilité 7j',
            config: { days: 7 },
            layout: { x: 8, y: 0, w: 4, h: 5 },
          },
          {
            type: 'CUSTOM_NOTE',
            title: 'Notes',
            config: { content: 'Ajoutez vos notes de supervision ici.' },
            layout: { x: 0, y: 5, w: 12, h: 2 },
          },
        ],
      },
    ];

    for (const pack of packs) {
      await this.prisma.supervisionPack.create({ data: { ...pack, widgets: pack.widgets as object } });
    }
  }
}
