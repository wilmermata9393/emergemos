import { Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { PatientNotesController } from './patient-notes.controller';
import { NoteTemplatesController } from './note-templates.controller';

@Module({
  controllers: [NotesController, PatientNotesController, NoteTemplatesController],
  providers: [NotesService],
})
export class NotesModule {}
