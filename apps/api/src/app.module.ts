import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ServicesModule } from './services/services.module';
import { UsersModule } from './users/users.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { AlertsModule } from './alerts/alerts.module';
import { MaintenancesModule } from './maintenances/maintenances.module';
import { DocumentsModule } from './documents/documents.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EventsModule } from './events/events.module';
import { ModulesRegistryModule } from './modules-registry/modules-registry.module';
import { ChannelsModule } from './channels/channels.module';
import { RbacModule } from './rbac/rbac.module';

import { SupervisionModule } from './supervision/supervision.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ServicesModule,
    MonitoringModule,
    AlertsModule,
    MaintenancesModule,
    DocumentsModule,
    DashboardModule,
    EventsModule,
    ChannelsModule,
    RbacModule,
    ModulesRegistryModule,
    SupervisionModule,
  ],
})
export class AppModule {}
