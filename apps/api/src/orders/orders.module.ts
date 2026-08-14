import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { LabTestsController } from './lab-tests.controller';
import { PatientOrdersController } from './patient-orders.controller';

@Module({
  controllers: [OrdersController, LabTestsController, PatientOrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
