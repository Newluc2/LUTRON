import { Injectable, NotFoundException } from '@nestjs/common';
import { AlertStatus } from '@prisma/client';
import { WS_EVENTS } from '@lutron/shared';
import { DispatchService } from '../channels/dispatch.service';
import { EventsGateway } from '../events/events.gateway';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway,
    private readonly dispatch: DispatchService,
  ) {}

  private mapAlert(a: {
    id: string;
    serviceId: string;
    title: string;
    message: string;
    severity?: string;
    source?: string | null;
    metadata?: unknown;
    status: AlertStatus;
    createdAt: Date;
    updatedAt: Date;
    service?: { name: string };
  }) {
    return {
      id: a.id,
      serviceId: a.serviceId,
      serviceName: a.service?.name ?? '',
      severity: a.severity ?? 'WARNING',
      source: a.source ?? null,
      metadata: a.metadata ?? {},
      title: a.title,
      message: a.message,
      status: a.status,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    };
  }

  findAll(serviceId?: string) {
    return this.prisma.alert.findMany({
      where: serviceId ? { serviceId } : undefined,
      include: { service: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }).then((alerts) => alerts.map((a) => this.mapAlert(a)));
  }

  async findOne(id: string) {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            technicalId: true,
            resources: {
              select: { id: true, name: true, status: true },
              take: 10,
            },
          },
        },
      },
    });
    if (!alert) throw new NotFoundException('Alerte introuvable');

    const recentResults = await this.prisma.checkResult.findMany({
      where: { check: { resource: { serviceId: alert.serviceId } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        check: { select: { name: true, type: true, resource: { select: { name: true } } } },
      },
    });

    return {
      ...this.mapAlert(alert),
      service: alert.service,
      recentChecks: recentResults.map((r) => ({
        resource: r.check.resource.name,
        check: r.check.name,
        type: r.check.type,
        status: r.status,
        responseTimeMs: r.responseTimeMs,
        message: r.message,
        at: r.createdAt.toISOString(),
      })),
    };
  }

  async create(data: {
    serviceId: string;
    title: string;
    message: string;
    severity?: string;
    source?: string;
    metadata?: Record<string, unknown>;
  }) {
    const alert = await this.prisma.alert.create({
      data: {
        serviceId: data.serviceId,
        title: data.title,
        message: data.message,
        severity: data.severity ?? 'WARNING',
        source: data.source,
        metadata: (data.metadata ?? {}) as object,
      },
      include: { service: { select: { name: true } } },
    });

    const mapped = this.mapAlert(alert);
    this.events.emit(WS_EVENTS.ALERT_CREATED, mapped);
    await this.dispatch.dispatch('ALERT_CREATED', {
      event: 'ALERT_CREATED',
      serviceId: alert.serviceId,
      serviceName: alert.service?.name ?? '',
      title: alert.title,
      message: alert.message,
    });

    return mapped;
  }

  async updateStatus(id: string, status: AlertStatus) {
    const alert = await this.prisma.alert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('Alerte introuvable');

    const updated = await this.prisma.alert.update({
      where: { id },
      data: { status },
      include: { service: { select: { name: true } } },
    });

    const mapped = this.mapAlert(updated);
    const event = status === 'RESOLVED' ? WS_EVENTS.ALERT_RESOLVED : WS_EVENTS.ALERT_CREATED;
    this.events.emit(event, mapped);

    if (status === 'RESOLVED') {
      await this.dispatch.dispatch('ALERT_RESOLVED', {
        event: 'ALERT_RESOLVED',
        serviceId: updated.serviceId,
        serviceName: updated.service.name,
        title: updated.title,
        message: updated.message,
      });
    }

    return mapped;
  }
}
