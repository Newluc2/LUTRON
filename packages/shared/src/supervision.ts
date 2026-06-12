export const WIDGET_TYPES = {
  MONITORING_OVERVIEW: 'MONITORING_OVERVIEW',
  AVAILABILITY_CHART: 'AVAILABILITY_CHART',
  CONFIG_BUTTON: 'CONFIG_BUTTON',
  REMOTE_COMMAND: 'REMOTE_COMMAND',
  LOCAL_COMMAND: 'LOCAL_COMMAND',
  CONSOLE_OUTPUT: 'CONSOLE_OUTPUT',
  LOG_STREAM: 'LOG_STREAM',
  CUSTOM_NOTE: 'CUSTOM_NOTE',
} as const;

export type WidgetType = (typeof WIDGET_TYPES)[keyof typeof WIDGET_TYPES];

export interface WidgetLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ServiceWidgetDto {
  id: string;
  serviceId: string;
  type: WidgetType;
  title: string;
  config: Record<string, unknown>;
  layout: WidgetLayout;
  packId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupervisionPackDto {
  id: string;
  name: string;
  description: string | null;
  category: string;
  widgets: Array<{
    type: WidgetType;
    title: string;
    config: Record<string, unknown>;
    layout: WidgetLayout;
  }>;
  isSystem: boolean;
}

export const WIDGET_TYPE_LABELS: Record<WidgetType, string> = {
  MONITORING_OVERVIEW: 'Vue monitoring',
  AVAILABILITY_CHART: 'Graphique disponibilité',
  CONFIG_BUTTON: 'Bouton configuration',
  REMOTE_COMMAND: 'Commande distante',
  LOCAL_COMMAND: 'Commande locale',
  CONSOLE_OUTPUT: 'Console sortie',
  LOG_STREAM: 'Flux de logs',
  CUSTOM_NOTE: 'Note personnalisée',
};
