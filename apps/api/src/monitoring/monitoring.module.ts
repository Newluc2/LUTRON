import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module';
import { EventsModule } from '../events/events.module';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { MonitoringScheduler } from './monitoring.scheduler';

@Module({
  imports: [EventsModule, AlertsModule],
  controllers: [MonitoringController],
  providers: [MonitoringService, MonitoringScheduler],
  exports: [MonitoringService],
})
export class MonitoringModule {}
