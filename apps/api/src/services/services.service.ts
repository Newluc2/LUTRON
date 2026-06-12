import { Injectable, NotFoundException } from '@nestjs/common';
import { CheckStatus } from '@prisma/client';
import { WS_EVENTS } from '@lutron/shared';
import { EventsGateway } from '../events/events.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

const STATUS_PRIORITY: Record<CheckStatus, number> = {
  DOWN: 4,
  WARNING: 3,
  MAINTENANCE: 2,
  UNKNOWN: 1,
  UP: 0,
};

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway,
  ) {}

  private computeServiceStatus(resources: Array<{ status: CheckStatus }>): CheckStatus {
    if (!resources.length) return 'UNKNOWN';
    return resources.reduce<CheckStatus>((worst, r) => {
      return STATUS_PRIORITY[r.status] > STATUS_PRIORITY[worst] ? r.status : worst;
    }, 'UP');
  }

  async findAll() {
    const services = await this.prisma.service.findMany({
      include: { resources: { select: { status: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return services.map((s) => ({
      id: s.id,
      technicalId: s.technicalId,
      name: s.name,
      description: s.description,
      tags: s.tags,
      status: this.computeServiceStatus(s.resources),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        resources: {
          include: {
            checks: {
              include: {
                results: { orderBy: { createdAt: 'desc' }, take: 1 },
              },
            },
          },
        },
        states: true,
        maintenances: {
          where: { endAt: { gte: new Date() } },
          orderBy: { startAt: 'asc' },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service introuvable');
    }

    return {
      id: service.id,
      technicalId: service.technicalId,
      name: service.name,
      description: service.description,
      tags: service.tags,
      status: this.computeServiceStatus(service.resources),
      states: service.states,
      maintenances: service.maintenances,
      resources: service.resources.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        status: r.status,
        checks: r.checks.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          status: c.status,
          responseTimeMs: c.results[0]?.responseTimeMs ?? null,
          interval: c.interval,
          lastRunAt: c.results[0]?.createdAt.toISOString() ?? null,
        })),
      })),
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    };
  }

  async create(dto: CreateServiceDto) {
    const service = await this.prisma.service.create({
      data: {
        technicalId: dto.technicalId,
        name: dto.name,
        description: dto.description,
        tags: dto.tags ?? [],
        states: {
          create: [
            { name: 'UP', priority: 0, color: '#22c55e' },
            { name: 'WARNING', priority: 1, color: '#eab308' },
            { name: 'DOWN', priority: 2, color: '#ef4444' },
            { name: 'MAINTENANCE', priority: 3, color: '#6366f1' },
            { name: 'UNKNOWN', priority: 4, color: '#6b7280' },
          ],
        },
      },
    });

    const result = await this.findOne(service.id);
    this.events.emit(WS_EVENTS.SERVICE_UPDATED, result);
    return result;
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findOne(id);
    await this.prisma.service.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
      },
    });
    const result = await this.findOne(id);
    this.events.emit(WS_EVENTS.SERVICE_UPDATED, result);
    return result;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.service.delete({ where: { id } });
    this.events.emit(WS_EVENTS.SERVICE_UPDATED, { id, deleted: true });
  }
}
