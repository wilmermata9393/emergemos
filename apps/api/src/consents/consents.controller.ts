import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuditAction, UserRole } from '@prisma/client';
import { ConsentsService } from './consents.service';
import { SignConsentDto, InitialAssessmentDto } from './dto/consents.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

const CLINICAL = [UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER, UserRole.STUDENT];

// Catálogo de documentos (cualquier usuario autenticado).
@Controller('consent-documents')
export class ConsentDocumentsController {
  constructor(private readonly consents: ConsentsService) {}
  @Get()
  list() {
    return this.consents.listDocuments();
  }
}

// Gestión por el equipo.
@Controller('patients/:patientId/consents')
export class StaffConsentsController {
  constructor(private readonly consents: ConsentsService) {}

  @Roles(...CLINICAL)
  @Audit(AuditAction.VIEW, 'Consent')
  @Get()
  list(@Param('patientId') patientId: string) {
    return this.consents.listForPatient(patientId);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Audit(AuditAction.CREATE, 'Consent')
  @Post('assign-standard')
  assign(@Param('patientId') patientId: string) {
    return this.consents.assignStandard(patientId);
  }
}

// Portal del paciente: firma remota y evaluación inicial.
@Roles(UserRole.PATIENT)
@Controller('me')
export class PatientConsentsController {
  constructor(private readonly consents: ConsentsService) {}

  @Get('consents')
  async list(@CurrentUser() user: AuthenticatedUser) {
    return this.consents.listForPatient(await this.consents.patientIdOf(user.id));
  }

  @Get('consents/:id')
  async one(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.consents.getForSigning(id, await this.consents.patientIdOf(user.id));
  }

  @Audit(AuditAction.SIGN, 'Consent')
  @Post('consents/:id/sign')
  async sign(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SignConsentDto,
    @Req() req: Request,
  ) {
    const patientId = await this.consents.patientIdOf(user.id);
    return this.consents.sign(id, patientId, dto.signatureName, dto.signatureImage ?? '', req.ip);
  }

  @Post('initial-assessment')
  async assess(@CurrentUser() user: AuthenticatedUser, @Body() dto: InitialAssessmentDto) {
    const patientId = await this.consents.patientIdOf(user.id);
    return this.consents.submitInitialAssessment(patientId, dto.answers);
  }
}
