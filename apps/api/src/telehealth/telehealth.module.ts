import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TelehealthService } from './telehealth.service';
import { TelehealthController } from './telehealth.controller';
import { SignalingGateway } from './signaling.gateway';

@Module({
  imports: [JwtModule.register({})],
  controllers: [TelehealthController],
  providers: [TelehealthService, SignalingGateway],
})
export class TelehealthModule {}
