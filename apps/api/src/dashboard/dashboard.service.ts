import { Injectable } from '@nestjs/common';
import { CheckStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [services, resources, openAlerts] = await Promise.all([
      this.prisma.service.findMany({
        include: { resources: { select: { status: true } } },
      }),
      this.prisma.resource.findMany({ select: { status: true, name: true, serviceId: true } }),
      this.prisma.alert.count({ where: { status: 'OPEN' } }),
    ]);

    const priority: Record<CheckStatus, number> = {
      DOWN: 4,
      WARNING: 3,
      MAINTENANCE: 2,
      UNKNOWN: 1,
      UP: 0,
    };

    const serviceStatuses = services.map((s) => {
      if (!s.resources.length) return 'UNKNOWN' as CheckStatus;
      return s.resources.reduce<CheckStatus>(
        (worst, r) => (priority[r.status] > priority[worst] ? r.status : worst),
        'UP',
      );
    });

    const servicesUp = serviceStatuses.filter((s) => s === 'UP').length;
    const servicesDown = serviceStatuses.filter((s) => s === 'DOWN').length;

    const since = new Date();
    since.setDate(since.getDate() - 7);

    const results = await this.prisma.checkResult.findMany({
      where: { createdAt: { gte: since } },
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

    const availabilityHistory = Array.from(byDay.entries()).map(([date, stats]) => ({
      date,
      availability: stats.total ? Math.round((stats.up / stats.total) * 100) : 100,
    }));

    const serviceBreakdown = await Promise.all(
      services.slice(0, 5).map(async (s) => {
        const history = await this.prisma.checkResult.findMany({
          where: {
            createdAt: { gte: since },
            check: { resource: { serviceId: s.id } },
          },
          select: { status: true },
        });
        const up = history.filter((h) => h.status === 'UP').length;
        const availability = history.length ? Math.round((up / history.length) * 100) : 100;
        return { name: s.name, availability };
      }),
    );

    return {
      totalServices: services.length,
      servicesUp,
      servicesDown,
      openAlerts,
      availabilityHistory,
      serviceBreakdown,
    };
  }
}
