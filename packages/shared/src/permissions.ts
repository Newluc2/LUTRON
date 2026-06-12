export const CORE_PERMISSIONS = {
  SERVICE_ADMIN: 'SERVICE_ADMIN',
  SERVICE_VIEW: 'SERVICE_VIEW',
  MONITORING_VIEW: 'MONITORING_VIEW',
  MONITORING_EDIT: 'MONITORING_EDIT',
  MONITORING_ACKNOWLEDGE: 'MONITORING_ACKNOWLEDGE',
  DOCUMENT_READ: 'DOCUMENT_READ',
  DOCUMENT_WRITE: 'DOCUMENT_WRITE',
  USER_MANAGE: 'USER_MANAGE',
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
} as const;

export type PermissionId = (typeof CORE_PERMISSIONS)[keyof typeof CORE_PERMISSIONS];

export const PERMISSION_DEFINITIONS: Array<{
  id: PermissionId;
  name: string;
  module: string;
  description: string;
}> = [
  { id: 'SERVICE_ADMIN', name: 'Administration service', module: 'core', description: 'Gestion complète du service' },
  { id: 'SERVICE_VIEW', name: 'Voir service', module: 'core', description: 'Consulter les informations du service' },
  { id: 'MONITORING_VIEW', name: 'Voir monitoring', module: 'monitoring', description: 'Consulter la supervision' },
  { id: 'MONITORING_EDIT', name: 'Éditer monitoring', module: 'monitoring', description: 'Configurer les vérifications' },
  { id: 'MONITORING_ACKNOWLEDGE', name: 'Acquitter alertes', module: 'monitoring', description: 'Acquitter les alertes' },
  { id: 'DOCUMENT_READ', name: 'Lire documents', module: 'documents', description: 'Consulter la documentation' },
  { id: 'DOCUMENT_WRITE', name: 'Éditer documents', module: 'documents', description: 'Créer et modifier la documentation' },
  { id: 'USER_MANAGE', name: 'Gérer utilisateurs', module: 'access', description: 'Gérer les accès utilisateurs' },
  { id: 'PLATFORM_ADMIN', name: 'Admin plateforme', module: 'core', description: 'Accès administrateur plateforme' },
];
