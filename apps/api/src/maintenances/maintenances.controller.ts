import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { MaintenancesService } from './maintenances.service';

@Controller('maintenances')
@UseGuards(JwtAuthGuard)
export class MaintenancesController {
  constructor(private readonly maintenancesService: MaintenancesService) {}

  @Get()
  findAll() {
    return this.maintenancesService.findAll();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  create(@Body() dto: CreateMaintenanceDto) {
    return this.maintenancesService.create(dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  remove(@Param('id') id: string) {
    return this.maintenancesService.remove(id);
  }
}
