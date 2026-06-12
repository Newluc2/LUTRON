import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';

@Injectable()
export class MaintenancesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.maintenance.findMany({
      include: { service: { select: { name: true } } },
      orderBy: { startAt: 'desc' },
    }).then((items) => {
      const now = new Date();
      return items.map((m) => ({
        id: m.id,
        serviceId: m.serviceId,
        serviceName: m.service.name,
        startAt: m.startAt.toISOString(),
        endAt: m.endAt.toISOString(),
        reason: m.reason,
        active: m.startAt <= now && m.endAt >= now,
      }));
    });
  }

  create(dto: CreateMaintenanceDto) {
    return this.prisma.maintenance.create({
      data: {
        serviceId: dto.serviceId,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        reason: dto.reason,
      },
      include: { service: { select: { name: true } } },
    }).then((m) => ({
      id: m.id,
      serviceId: m.serviceId,
      serviceName: m.service.name,
      startAt: m.startAt.toISOString(),
      endAt: m.endAt.toISOString(),
      reason: m.reason,
      active: m.startAt <= new Date() && m.endAt >= new Date(),
    }));
  }

  async remove(id: string) {
    await this.prisma.maintenance.delete({ where: { id } });
  }
}
