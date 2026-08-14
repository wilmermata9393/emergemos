import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TelehealthService } from './telehealth.service';

interface SocketUser { id: string; role: UserRole; name: string }

// ============================================================================
//  Servidor de señalización WebRTC (socket.io).
//  Solo transporta los "mensajes de saludo" (offer/answer/ICE) para que dos
//  navegadores se conecten directo. El VIDEO NO pasa por aquí: va P2P y
//  cifrado (DTLS-SRTP) entre los participantes.
// ============================================================================
@WebSocketGateway({
  cors: { origin: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(',') },
})
export class SignalingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger('Signaling');

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly telehealth: TelehealthService,
  ) {}

  /// Autenticación: el cliente envía su token JWT al conectar.
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      const payload = await this.jwt.verifyAsync(token ?? '', {
        secret: process.env.JWT_SECRET,
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.isActive) throw new Error('inactivo');
      client.data.user = { id: user.id, role: user.role, name: `${user.firstName} ${user.lastName}` } as SocketUser;
      // Canal personal: permite "timbrar" a este usuario esté donde esté en la app.
      await client.join(`user:${user.id}`);
      // Avisar que ya está autenticado: el cliente debe esperar esto antes de unirse.
      client.emit('ready');
    } catch {
      client.emit('unauthorized');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const room of client.rooms) {
      if (room !== client.id) {
        client.to(room).emit('peer-left', { peerId: client.id });
      }
    }
  }

  @SubscribeMessage('join')
  async onJoin(@ConnectedSocket() client: Socket, @MessageBody() body: { roomId: string }) {
    const user = client.data.user as SocketUser;
    if (!user) return;
    const allowed = await this.telehealth.canJoin(user, body.roomId);
    if (!allowed) {
      client.emit('join-denied', { roomId: body.roomId });
      return;
    }
    // Enviar al que entra la lista de participantes actuales.
    const sockets = await this.server.in(body.roomId).fetchSockets();
    const peers = sockets
      .filter((s) => s.id !== client.id)
      .map((s) => ({ peerId: s.id, user: (s.data as any).user }));
    client.emit('peers', { peers });

    await client.join(body.roomId);
    // Avisar a los demás que llegó alguien.
    client.to(body.roomId).emit('peer-joined', { peerId: client.id, user });
    this.logger.log(`${user.name} entró a ${body.roomId} (${peers.length + 1} en sala)`);
  }

  /// "Timbrar" al otro participante de una cita: le llega una llamada entrante
  /// (con sonido) esté en la pantalla que esté dentro de la app.
  @SubscribeMessage('ring')
  async onRing(@ConnectedSocket() client: Socket, @MessageBody() body: { appointmentId: string }) {
    const user = client.data.user as SocketUser;
    if (!user || !body?.appointmentId) return;
    const appt = await this.prisma.appointment.findUnique({
      where: { id: body.appointmentId },
      include: {
        patient: { select: { userId: true } },
        service: { select: { name: true } },
      },
    });
    if (!appt) return;
    // Solo el equipo clínico inicia la videollamada; el paciente nunca timbra.
    const clinical: UserRole[] = [UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER, UserRole.STUDENT];
    if (!clinical.includes(user.role)) return;
    // El profesional/equipo timbra al paciente de la cita.
    const targetUserId = appt.patient.userId;
    this.server.to(`user:${targetUserId}`).emit('incoming-call', {
      appointmentId: appt.id,
      from: user.name,
      service: appt.service?.name ?? 'Consulta',
    });
    this.logger.log(`${user.name} está timbrando la cita ${appt.id}`);
  }

  /// Relay de un mensaje de señalización a un peer específico.
  @SubscribeMessage('signal')
  onSignal(@ConnectedSocket() client: Socket, @MessageBody() body: { to: string; data: unknown }) {
    const user = client.data.user as SocketUser;
    this.server.to(body.to).emit('signal', { from: client.id, data: body.data, user });
  }

  @SubscribeMessage('leave')
  async onLeave(@ConnectedSocket() client: Socket, @MessageBody() body: { roomId: string }) {
    client.to(body.roomId).emit('peer-left', { peerId: client.id });
    await client.leave(body.roomId);
  }
}
