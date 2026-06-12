import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MonitoringService } from './monitoring.service';

@Controller('monitoring')
@UseGuards(JwtAuthGuard)
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('resources')
  findResources(@Query('serviceId') serviceId?: string) {
    return this.monitoringService.findResources(serviceId);
  }

  @Get('resources/:id')
  findResource(@Param('id') id: string) {
    return this.monitoringService.findResource(id);
  }

  @Get('checks')
  findChecks(@Query('resourceId') resourceId?: string) {
    return this.monitoringService.findChecks(resourceId);
  }

  @Get('availability/:serviceId')
  getAvailability(@Param('serviceId') serviceId: string, @Query('days') days?: string) {
    return this.monitoringService.getAvailabilityHistory(serviceId, days ? Number(days) : 7);
  }

  @Post('checks/:id/run')
  runCheck(@Param('id') id: string) {
    return this.monitoringService.runCheck(id);
  }
}
