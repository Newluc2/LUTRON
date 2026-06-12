import { Global, Module } from '@nestjs/common';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { DispatchService } from './dispatch.service';

@Global()
@Module({
  controllers: [ChannelsController],
  providers: [ChannelsService, DispatchService],
  exports: [ChannelsService, DispatchService],
})
export class ChannelsModule {}
