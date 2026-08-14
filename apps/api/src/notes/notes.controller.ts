import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AuditAction, UserRole } from '@prisma/client';
import { NotesService } from './notes.service';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

const CLINICAL = [UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER, UserRole.STUDENT];

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  /// Ver una nota (con su plantilla y su historial de versiones).
  @Roles(...CLINICAL)
  @Audit(AuditAction.VIEW, 'ClinicalNote')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notesService.findOne(id);
  }

  /// Editar (borrador) o enmendar (si está firmada). Solo el autor.
  @Roles(UserRole.PROVIDER, UserRole.STUDENT, UserRole.ADMIN)
  @Audit(AuditAction.UPDATE, 'ClinicalNote')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notesService.update(id, dto, user.id);
  }

  /// Firmar la nota (solo el autor). La bloquea.
  @Roles(UserRole.PROVIDER, UserRole.STUDENT, UserRole.ADMIN)
  @Audit(AuditAction.SIGN, 'ClinicalNote')
  @Post(':id/sign')
  sign(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notesService.sign(id, user.id);
  }

  /// Historial de versiones (firmas y enmiendas).
  @Roles(...CLINICAL)
  @Get(':id/versions')
  versions(@Param('id') id: string) {
    return this.notesService.listVersions(id);
  }
}
