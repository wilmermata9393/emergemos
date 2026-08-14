import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AuditAction, DocumentCategory, UserRole } from '@prisma/client';
import { PortalService } from './portal.service';
import { MessagesService } from '../messages/messages.service';
import { FilesService } from '../files/files.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiaryDto } from './dto/diary.dto';
import { CreateThreadDto, ReplyDto } from '../messages/dto/message.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

const MAX_SIZE = 15 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];

// Portal del paciente: cada quien accede SOLO a sus propios datos.
@Roles(UserRole.PATIENT)
@Controller('me')
export class PortalController {
  constructor(
    private readonly portal: PortalService,
    private readonly messages: MessagesService,
    private readonly files: FilesService,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('profile')
  profile(@CurrentUser() user: AuthenticatedUser) {
    return this.portal.myProfile(user.id);
  }

  // ---- Diario ----
  @Get('diary')
  listDiary(@CurrentUser() user: AuthenticatedUser) {
    return this.portal.listDiary(user.id);
  }

  @Post('diary')
  createDiary(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDiaryDto) {
    return this.portal.createDiary(user.id, dto);
  }

  // ---- Documentos ----
  @Get('documents')
  listDocuments(@CurrentUser() user: AuthenticatedUser) {
    return this.portal.listDocuments(user.id);
  }

  @Post('documents')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_SIZE } }))
  async uploadDocument(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
    @Body() body: { title?: string; category?: DocumentCategory },
  ) {
    if (!file) throw new BadRequestException('Falta el archivo.');
    if (!ALLOWED.includes(file.mimetype)) throw new BadRequestException('Tipo de archivo no permitido. Usa imagen o PDF.');
    return this.portal.uploadDocument(user.id, file, { title: body.title || file.originalname, category: body.category });
  }

  /// Descarga un documento PROPIO (verifica que le pertenece).
  @Get('documents/:docId/file')
  async downloadDocument(
    @Param('docId') docId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const patientId = await this.portal.patientIdOf(user.id);
    const doc = await this.prisma.patientDocument.findUnique({ where: { id: docId } });
    if (!doc || doc.patientId !== patientId) throw new NotFoundException('Documento no encontrado.');
    const { meta, data } = await this.files.get(doc.fileId);
    await this.audit.record({ actorId: user.id, action: AuditAction.EXPORT, entityType: 'File', entityId: doc.fileId, patientId });
    res.setHeader('Content-Type', meta.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(meta.originalName)}"`);
    res.send(data);
  }

  // ---- Mensajes ----
  @Get('messages')
  async listMessages(@CurrentUser() user: AuthenticatedUser) {
    const patientId = await this.portal.patientIdOf(user.id);
    return this.messages.listThreads(patientId);
  }

  @Post('messages')
  async createThread(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateThreadDto) {
    const patientId = await this.portal.patientIdOf(user.id);
    return this.messages.createThread(patientId, { id: user.id, role: user.role as UserRole }, dto);
  }

  @Get('messages/:id')
  async getThread(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const patientId = await this.portal.patientIdOf(user.id);
    const thread = await this.messages.getThread(id);
    if (thread.patientId !== patientId) throw new ForbiddenException('No tienes acceso a esta conversación.');
    return thread;
  }

  @Post('messages/:id/reply')
  async reply(@Param('id') id: string, @Body() dto: ReplyDto, @CurrentUser() user: AuthenticatedUser) {
    const patientId = await this.portal.patientIdOf(user.id);
    return this.messages.addMessage(id, { id: user.id, role: user.role as UserRole }, dto.body, patientId);
  }
}
