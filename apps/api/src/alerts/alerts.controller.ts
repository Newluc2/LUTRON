import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AlertStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AlertsService } from './alerts.service';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  findAll(@Query('serviceId') serviceId?: string) {
    return this.alertsService.findAll(serviceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.alertsService.findOne(id);
  }

  @Patch(':id/acknowledge')
  acknowledge(@Param('id') id: string) {
    return this.alertsService.updateStatus(id, AlertStatus.ACKNOWLEDGED);
  }

  @Patch(':id/resolve')
  resolve(@Param('id') id: string) {
    return this.alertsService.updateStatus(id, AlertStatus.RESOLVED);
  }
}
