import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CommandRunnerService } from './command-runner.service';
import { ApplyPackDto } from './dto/apply-pack.dto';
import { CreateWidgetDto } from './dto/create-widget.dto';
import { ExecuteCommandDto } from './dto/execute-command.dto';
import { UpdateLayoutDto } from './dto/update-layout.dto';
import { UpdateWidgetDto } from './dto/update-widget.dto';
import { SupervisionService } from './supervision.service';

@Controller('supervision')
@UseGuards(JwtAuthGuard)
export class SupervisionController {
  constructor(
    private readonly supervision: SupervisionService,
    private readonly commands: CommandRunnerService,
  ) {}

  @Get('services/:serviceId/widgets')
  getWidgets(@Param('serviceId') serviceId: string) {
    return this.supervision.getWidgets(serviceId);
  }

  @Post('services/:serviceId/widgets')
  createWidget(@Param('serviceId') serviceId: string, @Body() dto: CreateWidgetDto) {
    return this.supervision.createWidget(serviceId, dto);
  }

  @Patch('widgets/:id')
  updateWidget(@Param('id') id: string, @Body() dto: UpdateWidgetDto) {
    return this.supervision.updateWidget(id, dto);
  }

  @Patch('services/:serviceId/layout')
  updateLayout(@Param('serviceId') serviceId: string, @Body() dto: UpdateLayoutDto) {
    return this.supervision.updateLayouts(serviceId, dto);
  }

  @Delete('widgets/:id')
  deleteWidget(@Param('id') id: string) {
    return this.supervision.deleteWidget(id);
  }

  @Get('packs')
  getPacks() {
    return this.supervision.getPacks();
  }

  @Post('services/:serviceId/apply-pack')
  applyPack(@Param('serviceId') serviceId: string, @Body() dto: ApplyPackDto) {
    return this.supervision.applyPack(serviceId, dto);
  }

  @Post('widgets/:id/execute')
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  async execute(@Param('id') id: string, @Body() dto: ExecuteCommandDto) {
    const command = dto.command ?? dto.overrideCommand;
    if (!command) return { output: 'Commande manquante', exitCode: 1 };

    if (dto.mode === 'remote') {
      return this.commands.runRemote(dto.remoteConfig ?? {}, command);
    }

    return this.commands.runOnce(command, dto.cwd);
  }

  @Post('widgets/:id/stream/start')
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  startStream(@Param('id') id: string, @Body() dto: ExecuteCommandDto) {
    const command = dto.command ?? dto.overrideCommand;
    if (!command) return { started: false, error: 'Commande manquante' };
    return this.commands.startLogStream(id, command, dto.cwd);
  }

  @Post('widgets/:id/stream/stop')
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  stopStream(@Param('id') id: string) {
    return this.commands.stopLogStream(id);
  }
}
