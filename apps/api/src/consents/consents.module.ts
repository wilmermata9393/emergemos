import { Global, Module } from '@nestjs/common';
import { ConsentsService } from './consents.service';
import {
  ConsentDocumentsController,
  StaffConsentsController,
  PatientConsentsController,
} from './consents.controller';

// @Global para que PatientsService pueda auto-asignar consentimientos al crear.
@Global()
@Module({
  controllers: [ConsentDocumentsController, StaffConsentsController, PatientConsentsController],
  providers: [ConsentsService],
  exports: [ConsentsService],
})
export class ConsentsModule {}
