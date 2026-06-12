import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(serviceId?: string) {
    return this.prisma.document.findMany({
      where: serviceId ? { serviceId } : undefined,
      include: { author: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
    }).then((docs) =>
      docs.map((d) => ({
        id: d.id,
        serviceId: d.serviceId,
        title: d.title,
        content: d.content,
        createdBy: d.author.name,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
    );
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { author: { select: { name: true } } },
    });
    if (!doc) throw new NotFoundException('Document introuvable');
    return {
      id: doc.id,
      serviceId: doc.serviceId,
      title: doc.title,
      content: doc.content,
      createdBy: doc.author.name,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  create(dto: CreateDocumentDto, userId: string) {
    return this.prisma.document.create({
      data: {
        serviceId: dto.serviceId,
        title: dto.title,
        content: dto.content,
        createdBy: userId,
      },
      include: { author: { select: { name: true } } },
    }).then((d) => ({
      id: d.id,
      serviceId: d.serviceId,
      title: d.title,
      content: d.content,
      createdBy: d.author.name,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));
  }
}
