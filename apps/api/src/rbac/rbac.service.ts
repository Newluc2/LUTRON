import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignServiceUserDto } from './dto/assign-service-user.dto';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  getPermissions() {
    return this.prisma.permission.findMany({ orderBy: { module: 'asc' } });
  }

  async getServiceRoles(serviceId: string) {
    return this.prisma.role.findMany({
      where: { serviceId },
      include: {
        rolePermissions: { include: { permission: true } },
        serviceUsers: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
  }

  async createRole(dto: CreateRoleDto) {
    return this.prisma.role.create({
      data: {
        serviceId: dto.serviceId,
        name: dto.name,
        rolePermissions: {
          create: dto.permissionIds.map((permissionId) => ({ permissionId })),
        },
      },
      include: { rolePermissions: { include: { permission: true } } },
    });
  }

  async deleteRole(roleId: string) {
    await this.prisma.role.delete({ where: { id: roleId } });
  }

  async assignUser(dto: AssignServiceUserDto) {
    return this.prisma.serviceUser.upsert({
      where: { userId_serviceId: { userId: dto.userId, serviceId: dto.serviceId } },
      update: { roleId: dto.roleId },
      create: { userId: dto.userId, serviceId: dto.serviceId, roleId: dto.roleId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        role: true,
        service: { select: { id: true, name: true } },
      },
    });
  }

  async removeUserFromService(userId: string, serviceId: string) {
    await this.prisma.serviceUser.delete({
      where: { userId_serviceId: { userId, serviceId } },
    });
  }

  async getUserAccess(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        serviceUsers: {
          include: {
            service: { select: { id: true, name: true } },
            role: {
              include: { rolePermissions: { include: { permission: true } } },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }
}
