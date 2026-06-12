import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RegisterModuleDto } from './dto/register-module.dto';
import { ModulesRegistryService } from './modules-registry.service';

@Controller('modules')
@UseGuards(JwtAuthGuard)
export class ModulesRegistryController {
  constructor(private readonly modulesService: ModulesRegistryService) {}

  @Get()
  findAll() {
    return this.modulesService.findAll();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  register(@Body() dto: RegisterModuleDto) {
    return this.modulesService.register(dto);
  }

  @Patch(':id/toggle')
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  toggle(@Param('id') id: string, @Body('enabled') enabled: boolean) {
    return this.modulesService.setEnabled(id, enabled);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  remove(@Param('id') id: string) {
    return this.modulesService.remove(id);
  }
}
