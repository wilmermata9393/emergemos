import { Body, Controller, Get, Param, Post, BadRequestException } from '@nestjs/common';
import { AuditAction, UserRole } from '@prisma/client';
import { VitalsService } from './vitals.service';
import { CreateVitalsDto } from './dto/create-vitals.dto';
import { CdcMeasure } from '../clinical/cdc.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

const CLINICAL = [UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER, UserRole.STUDENT];
const VALID_MEASURES: CdcMeasure[] = ['bmiForAge', 'weightForAge', 'statureForAge'];

@Controller('patients/:patientId')
export class VitalsController {
  constructor(private readonly vitalsService: VitalsService) {}

  /// Registrar una toma de vitales.
  @Roles(...CLINICAL)
  @Audit(AuditAction.CREATE, 'Vitals')
  @Post('vitals')
  create(
    @Param('patientId') patientId: string,
    @Body() dto: CreateVitalsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vitalsService.create(patientId, dto, user.id);
  }

  /// Historial de vitales del paciente.
  @Roles(...CLINICAL)
  @Audit(AuditAction.VIEW, 'Vitals')
  @Get('vitals')
  list(@Param('patientId') patientId: string) {
    return this.vitalsService.listByPatient(patientId);
  }

  /// Datos para la gráfica de crecimiento (curvas del CDC + puntos del paciente).
  @Roles(...CLINICAL)
  @Audit(AuditAction.VIEW, 'Vitals')
  @Get('growth/:measure')
  growth(@Param('patientId') patientId: string, @Param('measure') measure: string) {
    if (!VALID_MEASURES.includes(measure as CdcMeasure)) {
      throw new BadRequestException(
        `Medida inválida. Usa una de: ${VALID_MEASURES.join(', ')}`,
      );
    }
    return this.vitalsService.growthChart(patientId, measure as CdcMeasure);
  }
}
