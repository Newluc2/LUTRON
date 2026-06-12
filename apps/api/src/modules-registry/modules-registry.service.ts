import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterModuleDto } from './dto/register-module.dto';

const CORE_MODULES = [
  { id: 'monitoring', name: 'Monitoring', version: '1.0.0' },
  { id: 'documents', name: 'Gestion Documentaire', version: '1.0.0' },
  { id: 'access', name: 'Gestion des Accès', version: '1.0.0' },
  { id: 'maintenance', name: 'Maintenance', version: '1.0.0' },
  { id: 'alerts', name: 'Alertes', version: '1.0.0' },
];

@Injectable()
export class ModulesRegistryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const existing = await this.prisma.module.findMany();
    if (!existing.length) {
      await this.prisma.module.createMany({ data: CORE_MODULES.map((m) => ({ ...m, enabled: true })) });
      return this.prisma.module.findMany();
    }
    return existing;
  }

  async register(dto: RegisterModuleDto) {
    const existing = await this.prisma.module.findUnique({ where: { id: dto.id } });
    if (existing) throw new ConflictException('Module déjà enregistré');

    return this.prisma.module.create({
      data: {
        id: dto.id,
        name: dto.name,
        version: dto.version,
        enabled: dto.enabled ?? true,
      },
    });
  }

  async setEnabled(id: string, enabled: boolean) {
    const mod = await this.prisma.module.findUnique({ where: { id } });
    if (!mod) throw new NotFoundException('Module introuvable');
    return this.prisma.module.update({ where: { id }, data: { enabled } });
  }

  async remove(id: string) {
    const mod = await this.prisma.module.findUnique({ where: { id } });
    if (!mod) throw new NotFoundException('Module introuvable');
    if (CORE_MODULES.some((m) => m.id === id)) {
      throw new ConflictException('Impossible de supprimer un module core');
    }
    await this.prisma.module.delete({ where: { id } });
  }
}
