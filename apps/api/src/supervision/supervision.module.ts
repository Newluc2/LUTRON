import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { CommandRunnerService } from './command-runner.service';
import { SupervisionController } from './supervision.controller';
import { SupervisionService } from './supervision.service';

@Module({
  imports: [EventsModule],
  controllers: [SupervisionController],
  providers: [SupervisionService, CommandRunnerService],
  exports: [SupervisionService],
})
export class SupervisionModule {}
