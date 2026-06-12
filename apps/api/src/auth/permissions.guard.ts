import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

export const PERMISSIONS_KEY = 'permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;

    if (user.role === 'OWNER') return true;

    const serviceId =
      request.params?.serviceId ??
      request.body?.serviceId ??
      request.query?.serviceId;

    if (!serviceId) {
      throw new ForbiddenException('Service requis pour cette action');
    }

    const membership = await this.prisma.serviceUser.findUnique({
      where: { userId_serviceId: { userId: user.sub, serviceId } },
      include: {
        role: {
          include: { rolePermissions: { include: { permission: true } } },
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Accès refusé à ce service');
    }

    const userPermissions = membership.role.rolePermissions.map((rp) => rp.permission.id);
    const hasAll = required.every((p) => userPermissions.includes(p));
    if (!hasAll) {
      throw new ForbiddenException('Permission insuffisante');
    }

    return true;
  }
}
