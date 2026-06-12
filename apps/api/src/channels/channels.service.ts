import { Injectable, NotFoundException } from '@nestjs/common';
import { ChannelType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.channel.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const channel = await this.prisma.channel.findUnique({ where: { id } });
    if (!channel) throw new NotFoundException('Canal introuvable');
    return channel;
  }

  create(dto: CreateChannelDto) {
    return this.prisma.channel.create({
      data: {
        name: dto.name,
        type: dto.type as ChannelType,
        enabled: dto.enabled ?? true,
        events: dto.events ?? ['ALERT_CREATED', 'ALERT_RESOLVED'],
        serviceIds: dto.serviceIds ?? [],
        config: dto.config ?? {},
      },
    });
  }

  async update(id: string, dto: UpdateChannelDto) {
    await this.findOne(id);
    return this.prisma.channel.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.enabled !== undefined && { enabled: dto.enabled }),
        ...(dto.events !== undefined && { events: dto.events }),
        ...(dto.serviceIds !== undefined && { serviceIds: dto.serviceIds }),
        ...(dto.config !== undefined && { config: dto.config }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.channel.delete({ where: { id } });
  }
}
