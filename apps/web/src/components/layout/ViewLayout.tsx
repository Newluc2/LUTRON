import type { ReactNode } from 'react';
import { Search } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
}

interface ViewLayoutProps {
  title: string;
  actions?: ReactNode;
  filters?: FilterOption[];
  activeFilter?: string;
  onFilterChange?: (id: string) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  children: ReactNode;
  stats?: ReactNode;
}

export function ViewLayout({
  title,
  actions,
  filters,
  activeFilter,
  onFilterChange,
  search,
  onSearchChange,
  searchPlaceholder = 'Rechercher...',
  children,
  stats,
}: ViewLayoutProps) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-[72px] shrink-0 items-center justify-between px-8">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>

      {(filters || onSearchChange) && (
        <div className="flex h-[56px] shrink-0 items-center justify-between gap-4 px-8">
          <div className="flex items-center gap-2">
            {filters?.map((f) => (
              <button
                key={f.id}
                onClick={() => onFilterChange?.(f.id)}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  activeFilter === f.id
                    ? 'bg-lutron-card text-white'
                    : 'text-zinc-500 hover:bg-lutron-card/50 hover:text-zinc-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {onSearchChange && (
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={search ?? ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-64 rounded-xl border border-lutron-border bg-lutron-card py-2 pl-9 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
              />
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-8 pb-8">
        <div className="mb-6">{children}</div>
        {stats && <div className="grid grid-cols-5 gap-4">{stats}</div>}
      </div>
    </div>
  );
}
