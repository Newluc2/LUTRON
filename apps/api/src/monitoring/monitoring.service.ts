import { Injectable, NotFoundException } from '@nestjs/common';
import { CheckStatus } from '@prisma/client';
import { WS_EVENTS } from '@lutron/shared';
import { AlertsService } from '../alerts/alerts.service';
import { EventsGateway } from '../events/events.gateway';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MonitoringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway,
    private readonly alerts: AlertsService,
  ) {}

  async findResources(serviceId?: string) {
    const resources = await this.prisma.resource.findMany({
      where: serviceId ? { serviceId } : undefined,
      include: {
        checks: { include: { results: { orderBy: { createdAt: 'desc' }, take: 1 } } },
        service: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return resources.map((r) => ({
      id: r.id,
      serviceId: r.serviceId,
      serviceName: r.service.name,
      name: r.name,
      description: r.description,
      status: r.status,
      checksCount: r.checks.length,
      lastCheckAt: r.checks[0]?.results[0]?.createdAt.toISOString() ?? null,
    }));
  }

  async findResource(id: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
      include: {
        service: { select: { id: true, name: true } },
        checks: {
          include: {
            results: { orderBy: { createdAt: 'desc' }, take: 20 },
          },
        },
      },
    });
    if (!resource) throw new NotFoundException('Ressource introuvable');

    return {
      id: resource.id,
      serviceId: resource.serviceId,
      serviceName: resource.service.name,
      name: resource.name,
      description: resource.description,
      status: resource.status,
      checks: resource.checks.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status,
        interval: c.interval,
        timeout: c.timeout,
        config: c.config,
        results: c.results.map((r) => ({
          status: r.status,
          responseTimeMs: r.responseTimeMs,
          message: r.message,
          at: r.createdAt.toISOString(),
        })),
      })),
    };
  }

  async findChecks(resourceId?: string) {
    const checks = await this.prisma.check.findMany({
      where: resourceId ? { resourceId } : undefined,
      include: { results: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
    });

    return checks.map((c) => ({
      id: c.id,
      resourceId: c.resourceId,
      type: c.type,
      name: c.name,
      status: c.status,
      responseTimeMs: c.results[0]?.responseTimeMs ?? null,
      interval: c.interval,
      lastRunAt: c.results[0]?.createdAt.toISOString() ?? null,
    }));
  }

  async getAvailabilityHistory(serviceId: string, days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const results = await this.prisma.checkResult.findMany({
      where: {
        createdAt: { gte: since },
        check: { resource: { serviceId } },
      },
      select: { status: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const byDay = new Map<string, { up: number; total: number }>();

    for (const r of results) {
      const key = r.createdAt.toISOString().slice(0, 10);
      const entry = byDay.get(key) ?? { up: 0, total: 0 };
      entry.total += 1;
      if (r.status === 'UP') entry.up += 1;
      byDay.set(key, entry);
    }

    return Array.from(byDay.entries()).map(([date, stats]) => ({
      date,
      availability: stats.total ? Math.round((stats.up / stats.total) * 100) : 100,
    }));
  }

  async runCheck(checkId: string) {
    const check = await this.prisma.check.findUnique({
      where: { id: checkId },
      include: { resource: { include: { service: true } } },
    });

    if (!check) {
      return { status: 'UNKNOWN' as CheckStatus, responseTimeMs: 0, message: 'Check introuvable' };
    }

    const previousStatus = check.status;
    const config = check.config as Record<string, string>;
    const start = Date.now();
    let status: CheckStatus = 'UP';
    let message = 'OK';

    try {
      if (check.type === 'HTTPS' || check.type === 'HTTP') {
        const url = config.url;
        if (!url) throw new Error('URL manquante');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), check.timeout * 1000);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) {
          status = 'DOWN';
          message = `HTTP ${response.status}`;
        }
      } else if (check.type === 'PING') {
        status = 'UP';
        message = `Ping simulé vers ${config.host ?? 'host'}`;
      } else {
        status = 'UP';
        message = 'Vérification simulée';
      }
    } catch (err) {
      status = 'DOWN';
      message = err instanceof Error ? err.message : 'Erreur';
    }

    const responseTimeMs = Date.now() - start;

    await this.prisma.checkResult.create({
      data: { checkId, status, responseTimeMs, message },
    });

    await this.prisma.check.update({
      where: { id: checkId },
      data: { status },
    });

    const resourceChecks = await this.prisma.check.findMany({
      where: { resourceId: check.resourceId },
      select: { status: true },
    });

    const priority: Record<CheckStatus, number> = {
      DOWN: 4,
      WARNING: 3,
      MAINTENANCE: 2,
      UNKNOWN: 1,
      UP: 0,
    };

    const resourceStatus = resourceChecks.reduce<CheckStatus>(
      (worst, c) => (priority[c.status] > priority[worst] ? c.status : worst),
      'UP',
    );

    await this.prisma.resource.update({
      where: { id: check.resourceId },
      data: { status: resourceStatus },
    });

    const payload = {
      checkId,
      resourceId: check.resourceId,
      serviceId: check.resource.serviceId,
      status,
      responseTimeMs,
      message,
    };

    this.events.emit(WS_EVENTS.CHECK_UPDATE, payload);

    if (status === 'DOWN' && previousStatus !== 'DOWN') {
      await this.alerts.create({
        serviceId: check.resource.serviceId,
        title: `Check DOWN : ${check.name}`,
        message: `${check.resource.name} — ${message}`,
        severity: 'CRITICAL',
        source: `monitoring/${check.type}`,
        metadata: { checkId, resourceId: check.resourceId },
      });
    }

    return { status, responseTimeMs, message };
  }
}
