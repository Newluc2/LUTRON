import { PrismaClient, CheckStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PERMISSION_DEFINITIONS } from '@lutron/shared';

const prisma = new PrismaClient();

async function main() {
  for (const perm of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { id: perm.id },
      update: {},
      create: perm,
    });
  }

  const ownerHash = await bcrypt.hash('owner123', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@lutron.local' },
    update: {},
    create: {
      email: 'owner@lutron.local',
      passwordHash: ownerHash,
      name: 'Luc',
      role: 'OWNER',
    },
  });

  const userHash = await bcrypt.hash('user123', 10);
  await prisma.user.upsert({
    where: { email: 'tech@lutron.local' },
    update: {},
    create: {
      email: 'tech@lutron.local',
      passwordHash: userHash,
      name: 'Technicien',
      role: 'USER',
    },
  });

  const services = [
    {
      technicalId: 'api-production',
      name: 'API Production',
      description: 'API principale de production',
      tags: ['API', 'PRODUCTION', 'WEB_APP'],
    },
    {
      technicalId: 'frontend-app',
      name: 'Frontend App',
      description: 'Application web frontend',
      tags: ['WEB_APP', 'PRODUCTION'],
    },
    {
      technicalId: 'game-server',
      name: 'Serveur de Jeu',
      description: 'Infrastructure jeu en ligne',
      tags: ['GAME_SYSTEM', 'MACHINE'],
    },
  ];

  for (const svc of services) {
    const existing = await prisma.service.findUnique({ where: { technicalId: svc.technicalId } });
    if (existing) continue;

    const service = await prisma.service.create({
      data: {
        ...svc,
        states: {
          create: [
            { name: 'UP', priority: 0, color: '#22c55e' },
            { name: 'WARNING', priority: 1, color: '#eab308' },
            { name: 'DOWN', priority: 2, color: '#ef4444' },
            { name: 'MAINTENANCE', priority: 3, color: '#6366f1' },
            { name: 'UNKNOWN', priority: 4, color: '#6b7280' },
          ],
        },
      },
    });

    const role = await prisma.role.create({
      data: {
        serviceId: service.id,
        name: 'Technicien',
        rolePermissions: {
          create: [
            { permissionId: 'MONITORING_VIEW' },
            { permissionId: 'MONITORING_ACKNOWLEDGE' },
            { permissionId: 'DOCUMENT_READ' },
          ],
        },
      },
    });

    await prisma.serviceUser.create({
      data: {
        userId: owner.id,
        serviceId: service.id,
        roleId: role.id,
      },
    });

    const resource = await prisma.resource.create({
      data: {
        serviceId: service.id,
        name: svc.name === 'API Production' ? 'Site Principal' : `${svc.name} - Ressource`,
        description: 'Ressource principale supervisée',
        status: 'UP',
      },
    });

    const checks = [
      {
        name: 'HTTPS',
        type: 'HTTPS' as const,
        config: { url: 'https://httpbin.org/status/200' },
        status: 'UP' as CheckStatus,
      },
      {
        name: 'API Health',
        type: 'HTTP' as const,
        config: { url: 'https://httpbin.org/get' },
        status: 'UP' as CheckStatus,
      },
      {
        name: 'Ping',
        type: 'PING' as const,
        config: { host: '8.8.8.8' },
        status: 'UP' as CheckStatus,
      },
    ];

    for (const check of checks) {
      const created = await prisma.check.create({
        data: { resourceId: resource.id, ...check, interval: 60, timeout: 30 },
      });

      const daysAgo = 7;
      for (let d = daysAgo; d >= 0; d--) {
        const date = new Date();
        date.setDate(date.getDate() - d);
        date.setHours(12, 0, 0, 0);
        await prisma.checkResult.create({
          data: {
            checkId: created.id,
            status: d === 2 && svc.technicalId === 'api-production' ? 'DOWN' : 'UP',
            responseTimeMs: 80 + Math.floor(Math.random() * 120),
            message: 'OK',
            createdAt: date,
          },
        });
      }
    }

    await prisma.document.create({
      data: {
        serviceId: service.id,
        title: `Documentation ${svc.name}`,
        content: `# ${svc.name}\n\nDocumentation technique initiale pour le service ${svc.name}.`,
        createdBy: owner.id,
      },
    });

    if (svc.technicalId === 'api-production') {
      await prisma.alert.create({
        data: {
          serviceId: service.id,
          title: 'Latence élevée détectée',
          message: 'Le temps de réponse HTTPS dépasse le seuil configuré.',
          status: 'OPEN',
        },
      });
    }
  }

  await prisma.module.createMany({
    data: [
      { id: 'monitoring', name: 'Monitoring', version: '1.0.0', enabled: true },
      { id: 'documents', name: 'Gestion Documentaire', version: '1.0.0', enabled: true },
      { id: 'access', name: 'Gestion des Accès', version: '1.0.0', enabled: true },
      { id: 'maintenance', name: 'Maintenance', version: '1.0.0', enabled: true },
      { id: 'alerts', name: 'Alertes', version: '1.0.0', enabled: true },
    ],
    skipDuplicates: true,
  });

  await prisma.channel.createMany({
    data: [
      { name: 'Discord Ops', type: 'DISCORD', config: { webhookUrl: 'https://discord.com/api/webhooks/...' } },
      { name: 'Telegram Alerts', type: 'TELEGRAM', config: { botToken: '...', chatId: '...' } },
    ],
    skipDuplicates: true,
  });

  console.log('Seed LUTRON terminé.');
  console.log('Compte Owner: owner@lutron.local / owner123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
