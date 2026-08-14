import { Controller, Get, Query } from '@nestjs/common';
import { Discipline, UserRole } from '@prisma/client';
import { NotesService } from './notes.service';
import { Roles } from '../common/decorators/roles.decorator';

const CLINICAL = [UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER, UserRole.STUDENT];

@Controller('note-templates')
export class NoteTemplatesController {
  constructor(private readonly notesService: NotesService) {}

  /// Lista de plantillas (opcional: ?discipline=CHIROPRACTIC).
  @Roles(...CLINICAL)
  @Get()
  list(@Query('discipline') discipline?: Discipline) {
    return this.notesService.listTemplates(discipline);
  }
}
