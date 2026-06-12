import { NavLink } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Boxes,
  FileText,
  LayoutDashboard,
  Server,
  Settings,
  Shield,
  Users,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  ownerOnly?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    title: 'Gestion Services',
    items: [
      { to: '/', label: 'Vue Globale', icon: <LayoutDashboard size={16} /> },
      { to: '/services', label: 'Liste Services', icon: <Server size={16} /> },
      { to: '/monitoring', label: 'Monitoring', icon: <Activity size={16} /> },
      { to: '/documents', label: 'Documentation', icon: <FileText size={16} /> },
    ],
  },
  {
    title: 'Supervision',
    items: [
      { to: '/alerts', label: 'Alertes', icon: <AlertTriangle size={16} /> },
      { to: '/maintenances', label: 'Maintenances', icon: <Wrench size={16} /> },
    ],
  },
  {
    title: 'Administration',
    items: [
      { to: '/users', label: 'Utilisateurs', icon: <Users size={16} />, ownerOnly: true },
      { to: '/modules', label: 'Modules', icon: <Boxes size={16} />, ownerOnly: true },
      { to: '/permissions', label: 'Permissions', icon: <Shield size={16} />, ownerOnly: true },
    ],
  },
];

export function Sidebar() {
  const { user } = useAuth();
  const isOwner = user?.role === 'OWNER';

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col bg-lutron-surface">
      <div className="flex h-[110px] items-center gap-3 border-b border-lutron-border px-5">
        <div className="relative">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-semibold">
            {user?.name?.charAt(0) ?? 'L'}
          </div>
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-lutron-surface bg-lutron-success" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{user?.name}</p>
          <p className="truncate text-xs text-lutron-muted">
            {user?.role === 'OWNER' ? 'Platform Owner' : user?.email}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navigation.map((group) => {
          const items = group.items.filter((item) => !item.ownerOnly || isOwner);
          if (!items.length) return null;

          return (
            <div key={group.title} className="mb-5">
              <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-lutron-muted">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-lutron-card text-white'
                            : 'text-zinc-400 hover:bg-lutron-card/50 hover:text-zinc-200'
                        }`
                      }
                    >
                      {item.icon}
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-lutron-border p-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
              isActive ? 'bg-lutron-card text-zinc-200' : 'text-zinc-500 hover:bg-lutron-card/50 hover:text-zinc-300'
            }`
          }
        >
          <Settings size={16} />
          Paramètres LUTRON
        </NavLink>
        <NavLink
          to="/docs"
          className={({ isActive }) =>
            `flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
              isActive ? 'bg-lutron-card text-zinc-200' : 'text-zinc-500 hover:bg-lutron-card/50 hover:text-zinc-300'
            }`
          }
        >
          <BookOpen size={16} />
          Documentation LUTRON
        </NavLink>
      </div>
    </aside>
  );
}
