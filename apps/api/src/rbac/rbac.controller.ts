import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AssignServiceUserDto } from './dto/assign-service-user.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { RbacService } from './rbac.service';

@Controller('rbac')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('permissions')
  getPermissions() {
    return this.rbacService.getPermissions();
  }

  @Get('services/:serviceId/roles')
  getServiceRoles(@Param('serviceId') serviceId: string) {
    return this.rbacService.getServiceRoles(serviceId);
  }

  @Post('roles')
  createRole(@Body() dto: CreateRoleDto) {
    return this.rbacService.createRole(dto);
  }

  @Delete('roles/:roleId')
  deleteRole(@Param('roleId') roleId: string) {
    return this.rbacService.deleteRole(roleId);
  }

  @Post('assign')
  assignUser(@Body() dto: AssignServiceUserDto) {
    return this.rbacService.assignUser(dto);
  }

  @Delete('assign/:userId/:serviceId')
  removeUser(@Param('userId') userId: string, @Param('serviceId') serviceId: string) {
    return this.rbacService.removeUserFromService(userId, serviceId);
  }

  @Get('users/:userId/access')
  getUserAccess(@Param('userId') userId: string) {
    return this.rbacService.getUserAccess(userId);
  }
}
