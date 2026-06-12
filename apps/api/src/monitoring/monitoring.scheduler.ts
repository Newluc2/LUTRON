import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MonitoringService } from './monitoring.service';

@Injectable()
export class MonitoringScheduler implements OnModuleInit {
  private readonly logger = new Logger(MonitoringScheduler.name);
  private interval?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly monitoring: MonitoringService,
  ) {}

  onModuleInit() {
    this.interval = setInterval(() => void this.tick(), 60_000);
    this.logger.log('Monitoring scheduler démarré (intervalle 60s)');
  }

  private async tick() {
    const checks = await this.prisma.check.findMany({ select: { id: true } });
    for (const check of checks) {
      try {
        await this.monitoring.runCheck(check.id);
      } catch (err) {
        this.logger.warn(`Échec check ${check.id}: ${err}`);
      }
    }
  }
}
