import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { WS_EVENTS } from '@lutron/shared';
import { EventsGateway } from '../events/events.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway,
  ) {}

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
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
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email déjà utilisé');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: (dto.role as UserRole) ?? 'USER',
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    this.events.emit(WS_EVENTS.USER_UPDATED, user);
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const data: { name?: string; role?: UserRole; passwordHash?: string } = {};
    if (dto.name) data.name = dto.name;
    if (dto.role) data.role = dto.role as UserRole;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    this.events.emit(WS_EVENTS.USER_UPDATED, updated);
    return updated;
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    await this.prisma.user.delete({ where: { id } });
    this.events.emit(WS_EVENTS.USER_UPDATED, { id, deleted: true });
  }
}
