import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UserRole } from '@prisma/client';
import { AnnouncementsService } from './announcements.service';
import { FilesService } from '../files/files.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

const MAX = 8 * 1024 * 1024;
const ALLOWED_IMG = ['image/jpeg', 'image/png', 'image/webp'];

@Controller('announcements')
export class AnnouncementsController {
  constructor(
    private readonly announcements: AnnouncementsService,
    private readonly files: FilesService,
  ) {}

  /// Crear y difundir un anuncio (con arte opcional). Admin o profesional.
  @Roles(UserRole.ADMIN, UserRole.PROVIDER)
  @Post()
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: MAX } }))
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() image: { buffer: Buffer; mimetype: string; originalname: string; size: number } | undefined,
    @Body() body: { title?: string; body?: string; terms?: string; audience?: 'ALL' | 'SERVICE'; serviceId?: string },
  ) {
    if (!body.title?.trim() || !body.body?.trim()) throw new BadRequestException('Falta el título o el mensaje.');
    if (image && !ALLOWED_IMG.includes(image.mimetype)) throw new BadRequestException('El arte debe ser una imagen (JPG, PNG, WEBP).');
    return this.announcements.createAndBroadcast(
      {
        title: body.title,
        body: body.body,
        terms: body.terms,
        audience: body.audience === 'SERVICE' ? 'SERVICE' : 'ALL',
        serviceId: body.serviceId || undefined,
      },
      image,
      user.id,
    );
  }

  /// Ver un anuncio (cualquier usuario autenticado).
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.announcements.getOne(id);
  }

  /// Imagen (arte) del anuncio.
  @Get(':id/image')
  async image(@Param('id') id: string, @Res() res: Response) {
    const fileId = await this.announcements.imageFileId(id);
    const { meta, data } = await this.files.get(fileId);
    res.setHeader('Content-Type', meta.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(meta.originalName)}"`);
    res.send(data);
  }
}
