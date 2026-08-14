import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuditAction, UserRole } from '@prisma/client';
import { FilesService } from './files.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

const CLINICAL = [UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER, UserRole.STUDENT];

@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly audit: AuditService,
  ) {}

  /// Descarga (visualiza) un archivo. Descifra al vuelo y registra el acceso.
  @Roles(...CLINICAL)
  @Get(':id')
  async download(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const { meta, data } = await this.filesService.get(id);

    // Auditoría: descargar/ver un archivo es acceso a PHI.
    await this.audit.record({
      actorId: user.id,
      action: AuditAction.EXPORT,
      entityType: 'File',
      entityId: id,
    });

    res.setHeader('Content-Type', meta.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(meta.originalName)}"`,
    );
    res.send(data);
  }
}
