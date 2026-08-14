import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController, StaffProfileController } from './users.controller';

@Module({
  controllers: [UsersController, StaffProfileController],
  providers: [UsersService],
})
export class UsersModule {}
