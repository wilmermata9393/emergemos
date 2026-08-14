import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { AuditAction, UserRole, DocumentCategory } from '@prisma/client';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

const CLINICAL = [UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER, UserRole.STUDENT];
const MAX_SIZE = 15 * 1024 * 1024; // 15 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];

interface MulterFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

function validate(file?: MulterFile) {
  if (!file) return;
  if (!ALLOWED.includes(file.mimetype)) {
    throw new BadRequestException('Tipo de archivo no permitido. Usa imagen o PDF.');
  }
}

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  /// Auto-registro público de pacientes (queda pendiente de aprobación).
  @Public()
  @Post('register')
  register(@Body() dto: CreatePatientDto) {
    return this.patientsService.selfRegister(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Audit(AuditAction.CREATE, 'Patient')
  @Post()
  create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }

  @Roles(...CLINICAL)
  @Audit(AuditAction.VIEW, 'Patient')
  @Get()
  list(@Query('q') q?: string) {
    return this.patientsService.list(q);
  }

  /// Pacientes pendientes de aprobación (declarado antes de :id para no chocar).
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Get('pending')
  pending() {
    return this.patientsService.listPending();
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Audit(AuditAction.UPDATE, 'Patient')
  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.patientsService.setApproval(id, true);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Audit(AuditAction.UPDATE, 'Patient')
  @Post(':id/reject')
  reject(@Param('id') id: string) {
    return this.patientsService.setApproval(id, false);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Audit(AuditAction.UPDATE, 'Patient')
  @Post(':id/active')
  setActive(@Param('id') id: string, @Body('active') active: boolean) {
    return this.patientsService.setActive(id, active);
  }

  @Roles(...CLINICAL)
  @Audit(AuditAction.VIEW, 'Patient')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Audit(AuditAction.UPDATE, 'Patient')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(id, dto);
  }

  // ---- Plan médico ----

  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER)
  @Audit(AuditAction.CREATE, 'InsuranceCard')
  @Post(':patientId/insurance-card')
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'front', maxCount: 1 }, { name: 'back', maxCount: 1 }],
      { limits: { fileSize: MAX_SIZE } },
    ),
  )
  uploadInsuranceCard(
    @Param('patientId') patientId: string,
    @UploadedFiles() files: { front?: MulterFile[]; back?: MulterFile[] },
    @Body() body: { planName?: string; memberId?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const front = files?.front?.[0];
    const back = files?.back?.[0];
    validate(front);
    validate(back);
    if (!front && !back) throw new BadRequestException('Sube al menos una imagen.');
    return this.patientsService.uploadInsuranceCard(
      patientId,
      front,
      back,
      { planName: body.planName, memberId: body.memberId },
      user.id,
    );
  }

  @Roles(...CLINICAL)
  @Audit(AuditAction.VIEW, 'InsuranceCard')
  @Get(':patientId/insurance-cards')
  listInsuranceCards(@Param('patientId') patientId: string) {
    return this.patientsService.listInsuranceCards(patientId);
  }

  // ---- Documentos ----

  @Roles(...CLINICAL)
  @Audit(AuditAction.CREATE, 'PatientDocument')
  @Post(':patientId/documents')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_SIZE } }))
  uploadDocument(
    @Param('patientId') patientId: string,
    @UploadedFile() file: MulterFile,
    @Body() body: { title?: string; category?: DocumentCategory },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('Falta el archivo.');
    validate(file);
    return this.patientsService.uploadDocument(
      patientId,
      file,
      { title: body.title || file.originalname, category: body.category },
      user.id,
    );
  }

  @Roles(...CLINICAL)
  @Audit(AuditAction.VIEW, 'PatientDocument')
  @Get(':patientId/documents')
  listDocuments(@Param('patientId') patientId: string) {
    return this.patientsService.listDocuments(patientId);
  }
}
