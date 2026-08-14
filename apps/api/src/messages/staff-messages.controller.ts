import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AuditAction, UserRole } from '@prisma/client';
import { MessagesService } from './messages.service';
import { ReplyDto } from './dto/message.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

const CLINICAL = [UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER, UserRole.STUDENT];

// Vista y respuesta del equipo a los mensajes de un paciente.
@Controller()
export class StaffMessagesController {
  constructor(private readonly messages: MessagesService) {}

  /// Bandeja general del equipo: todos los mensajes de todos los pacientes.
  @Roles(...CLINICAL)
  @Get('message-threads')
  listAll() {
    return this.messages.listAllThreads();
  }

  @Roles(...CLINICAL)
  @Audit(AuditAction.VIEW, 'MessageThread')
  @Get('patients/:patientId/message-threads')
  listForPatient(@Param('patientId') patientId: string) {
    return this.messages.listThreads(patientId);
  }

  @Roles(...CLINICAL)
  @Audit(AuditAction.VIEW, 'MessageThread')
  @Get('message-threads/:id')
  getThread(@Param('id') id: string) {
    return this.messages.getThread(id);
  }

  @Roles(...CLINICAL)
  @Audit(AuditAction.CREATE, 'Message')
  @Post('message-threads/:id/reply')
  reply(
    @Param('id') id: string,
    @Body() dto: ReplyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.messages.addMessage(id, { id: user.id, role: user.role as UserRole }, dto.body);
  }
}
