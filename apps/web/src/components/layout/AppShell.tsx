import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppShell() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-lutron-surface">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-lutron-surface">
        <Outlet />
      </main>
    </div>
  );
}
