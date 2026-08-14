import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AuditAction, UserRole } from '@prisma/client';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

const CLINICAL = [UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER, UserRole.STUDENT];

@Controller('patients/:patientId/notes')
export class PatientNotesController {
  constructor(private readonly notesService: NotesService) {}

  /// Crear una nota (borrador) para el paciente.
  @Roles(UserRole.PROVIDER, UserRole.STUDENT, UserRole.ADMIN)
  @Audit(AuditAction.CREATE, 'ClinicalNote')
  @Post()
  create(
    @Param('patientId') patientId: string,
    @Body() dto: CreateNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notesService.create(patientId, dto, user.id);
  }

  /// Listar las notas del paciente.
  @Roles(...CLINICAL)
  @Audit(AuditAction.VIEW, 'ClinicalNote')
  @Get()
  list(@Param('patientId') patientId: string) {
    return this.notesService.listByPatient(patientId);
  }
}
