import { Global, Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { StaffMessagesController } from './staff-messages.controller';

// @Global para que el portal del paciente también use MessagesService.
@Global()
@Module({
  controllers: [StaffMessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
