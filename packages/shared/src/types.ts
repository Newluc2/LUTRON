export type UserRole = 'OWNER' | 'USER';

export type CheckType = 'HTTP' | 'HTTPS' | 'PING' | 'SSH' | 'LOCAL_COMMAND' | 'REMOTE_COMMAND';

export type CheckStatus = 'UP' | 'WARNING' | 'DOWN' | 'MAINTENANCE' | 'UNKNOWN';

export type ServiceTag = 'WEB_APP' | 'API' | 'MACHINE' | 'LOW_SYS' | 'GAME_SYSTEM' | 'PRODUCTION' | 'STAGING';

export interface ServiceDto {
  id: string;
  technicalId: string;
  name: string;
  description: string | null;
  tags: string[];
  status: CheckStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface MonitoringResourceDto {
  id: string;
  serviceId: string;
  serviceName: string;
  name: string;
  description: string | null;
  status: CheckStatus;
  checksCount: number;
  lastCheckAt: string | null;
}

export interface MonitoringCheckDto {
  id: string;
  resourceId: string;
  type: CheckType;
  name: string;
  status: CheckStatus;
  responseTimeMs: number | null;
  interval: number;
  lastRunAt: string | null;
}

export interface AlertDto {
  id: string;
  serviceId: string;
  serviceName: string;
  title: string;
  message: string;
  severity?: string;
  source?: string | null;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  createdAt: string;
}

export interface MaintenanceDto {
  id: string;
  serviceId: string;
  serviceName: string;
  startAt: string;
  endAt: string;
  reason: string;
  active: boolean;
}

export interface DocumentDto {
  id: string;
  serviceId: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalServices: number;
  servicesUp: number;
  servicesDown: number;
  openAlerts: number;
  availabilityHistory: Array<{ date: string; availability: number }>;
  serviceBreakdown: Array<{ name: string; availability: number }>;
}
