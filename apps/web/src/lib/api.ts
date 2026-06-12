const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

function getToken(): string | null {
  return localStorage.getItem('lutron_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(Array.isArray(error.message) ? error.message.join(', ') : (error.message ?? 'Erreur API'));
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; user: import('@lutron/shared').UserDto }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<import('@lutron/shared').UserDto>('/auth/me'),

  getServices: () => request<import('@lutron/shared').ServiceDto[]>('/services'),
  getService: (id: string) => request<Record<string, unknown>>(`/services/${id}`),
  createService: (data: { technicalId: string; name: string; description?: string; tags?: string[] }) =>
    request('/services', { method: 'POST', body: JSON.stringify(data) }),
  updateService: (id: string, data: { name?: string; description?: string; tags?: string[] }) =>
    request(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteService: (id: string) => request(`/services/${id}`, { method: 'DELETE' }),

  getDashboardStats: () => request<import('@lutron/shared').DashboardStats>('/dashboard/stats'),

  getResources: (serviceId?: string) =>
    request<import('@lutron/shared').MonitoringResourceDto[]>(
      `/monitoring/resources${serviceId ? `?serviceId=${serviceId}` : ''}`,
    ),
  getResource: (id: string) => request<Record<string, unknown>>(`/monitoring/resources/${id}`),
  getChecks: (resourceId?: string) =>
    request(`/monitoring/checks${resourceId ? `?resourceId=${resourceId}` : ''}`),
  runCheck: (id: string) => request(`/monitoring/checks/${id}/run`, { method: 'POST' }),

  getAlerts: (serviceId?: string) =>
    request<import('@lutron/shared').AlertDto[]>(`/alerts${serviceId ? `?serviceId=${serviceId}` : ''}`),
  getAlert: (id: string) => request<Record<string, unknown>>(`/alerts/${id}`),
  acknowledgeAlert: (id: string) => request(`/alerts/${id}/acknowledge`, { method: 'PATCH' }),
  resolveAlert: (id: string) => request(`/alerts/${id}/resolve`, { method: 'PATCH' }),

  getMaintenances: () => request<import('@lutron/shared').MaintenanceDto[]>('/maintenances'),
  createMaintenance: (data: { serviceId: string; startAt: string; endAt: string; reason: string }) =>
    request('/maintenances', { method: 'POST', body: JSON.stringify(data) }),
  deleteMaintenance: (id: string) => request(`/maintenances/${id}`, { method: 'DELETE' }),

  getDocuments: (serviceId?: string) =>
    request<import('@lutron/shared').DocumentDto[]>(`/documents${serviceId ? `?serviceId=${serviceId}` : ''}`),
  getDocument: (id: string) => request<import('@lutron/shared').DocumentDto>(`/documents/${id}`),
  createDocument: (data: { serviceId: string; title: string; content: string }) =>
    request('/documents', { method: 'POST', body: JSON.stringify(data) }),

  getUsers: () => request<import('@lutron/shared').UserDto[]>('/users'),
  getUser: (id: string) => request<Record<string, unknown>>(`/users/${id}`),
  createUser: (data: { email: string; name: string; password: string; role?: string }) =>
    request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: { name?: string; role?: string; password?: string }) =>
    request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteUser: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),

  getModules: () => request<Array<{ id: string; name: string; version: string; enabled: boolean }>>('/modules'),
  registerModule: (data: { id: string; name: string; version: string }) =>
    request('/modules', { method: 'POST', body: JSON.stringify(data) }),
  toggleModule: (id: string, enabled: boolean) =>
    request(`/modules/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ enabled }) }),
  deleteModule: (id: string) => request(`/modules/${id}`, { method: 'DELETE' }),

  getPermissions: () => request<Array<{ id: string; name: string; module: string; description: string }>>('/rbac/permissions'),
  getServiceRoles: (serviceId: string) => request(`/rbac/services/${serviceId}/roles`),
  createRole: (data: { serviceId: string; name: string; permissionIds: string[] }) =>
    request('/rbac/roles', { method: 'POST', body: JSON.stringify(data) }),
  deleteRole: (roleId: string) => request(`/rbac/roles/${roleId}`, { method: 'DELETE' }),
  assignUser: (data: { userId: string; serviceId: string; roleId: string }) =>
    request('/rbac/assign', { method: 'POST', body: JSON.stringify(data) }),

  getChannels: () => request<Array<Record<string, unknown>>>('/channels'),
  createChannel: (data: Record<string, unknown>) =>
    request('/channels', { method: 'POST', body: JSON.stringify(data) }),
  updateChannel: (id: string, data: Record<string, unknown>) =>
    request(`/channels/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteChannel: (id: string) => request(`/channels/${id}`, { method: 'DELETE' }),

  getAvailability: (serviceId: string, days = 7) =>
    request<Array<{ date: string; availability: number }>>(`/monitoring/availability/${serviceId}?days=${days}`),

  getServiceWidgets: (serviceId: string) =>
    request<import('@lutron/shared').ServiceWidgetDto[]>(`/supervision/services/${serviceId}/widgets`),

  createServiceWidget: (
    serviceId: string,
    data: { type: string; title: string; config?: Record<string, unknown>; layout?: { x: number; y: number; w: number; h: number } },
  ) => request(`/supervision/services/${serviceId}/widgets`, { method: 'POST', body: JSON.stringify(data) }),

  updateWidgetLayout: (serviceId: string, layouts: Array<{ id: string; layout: { x: number; y: number; w: number; h: number } }>) =>
    request<import('@lutron/shared').ServiceWidgetDto[]>(`/supervision/services/${serviceId}/layout`, {
      method: 'PATCH',
      body: JSON.stringify({ layouts }),
    }),

  updateWidget: (
    id: string,
    data: { title?: string; config?: Record<string, unknown>; layout?: { x?: number; y?: number; w?: number; h?: number } },
  ) =>
    request<import('@lutron/shared').ServiceWidgetDto>(`/supervision/widgets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteServiceWidget: (id: string) => request(`/supervision/widgets/${id}`, { method: 'DELETE' }),

  getSupervisionPacks: () =>
    request<Array<{ id: string; name: string; description: string | null; category: string }>>('/supervision/packs'),

  applySupervisionPack: (serviceId: string, packId: string) =>
    request<import('@lutron/shared').ServiceWidgetDto[]>(`/supervision/services/${serviceId}/apply-pack`, {
      method: 'POST',
      body: JSON.stringify({ packId }),
    }),

  executeWidgetCommand: (widgetId: string, data: Record<string, unknown>) =>
    request<{ output: string; exitCode: number }>(`/supervision/widgets/${widgetId}/execute`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  startWidgetStream: (widgetId: string, data: Record<string, unknown>) =>
    request(`/supervision/widgets/${widgetId}/stream/start`, { method: 'POST', body: JSON.stringify(data) }),

  stopWidgetStream: (widgetId: string) =>
    request(`/supervision/widgets/${widgetId}/stream/stop`, { method: 'POST' }),
};
