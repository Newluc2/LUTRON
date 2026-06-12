interface Item {
  name: string;
  availability: number;
}

export function BreakdownBars({ items, title }: { items: Item[]; title?: string }) {
  const max = Math.max(...items.map((i) => i.availability), 1);

  return (
    <div className="h-full">
      {title && <p className="mb-4 text-sm font-medium text-zinc-300">{title}</p>}
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.name}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="truncate text-zinc-400">{item.name}</span>
              <span className="font-medium text-zinc-200">{item.availability}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-lutron-bg">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all"
                style={{ width: `${(item.availability / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
