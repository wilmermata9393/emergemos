import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { SchedulingService } from './scheduling.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/scheduling.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('services')
export class ServicesController {
  constructor(private readonly scheduling: SchedulingService) {}

  /// Cualquier usuario autenticado puede ver los servicios activos (para agendar).
  @Get()
  list() {
    return this.scheduling.listServices();
  }

  /// Todos los servicios, incluidos inactivos (administración).
  @Roles(UserRole.ADMIN, UserRole.PROVIDER)
  @Get('all')
  listAll() {
    return this.scheduling.listAllServices();
  }

  @Roles(UserRole.ADMIN, UserRole.PROVIDER)
  @Post()
  create(@Body() dto: CreateServiceDto) {
    return this.scheduling.createService(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.PROVIDER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.scheduling.updateService(id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.PROVIDER)
  @Post(':id/active')
  setActive(@Param('id') id: string, @Body('active') active: boolean) {
    return this.scheduling.setServiceActive(id, active);
  }
}
