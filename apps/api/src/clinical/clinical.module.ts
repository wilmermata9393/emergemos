import { Global, Module } from '@nestjs/common';
import { CdcService } from './cdc.service';

// @Global para que el módulo de vitales (y futuros) use CdcService fácilmente.
@Global()
@Module({
  providers: [CdcService],
  exports: [CdcService],
})
export class ClinicalModule {}
