import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [EventsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
