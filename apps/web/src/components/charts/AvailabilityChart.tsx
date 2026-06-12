import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DataPoint {
  date: string;
  availability: number;
}

export function AvailabilityChart({ data, title }: { data: DataPoint[]; title?: string }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full min-h-[100px] items-center justify-center text-center text-xs text-zinc-500">
        Aucune donnée de disponibilité
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: d.date ? new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short' }) : '',
  }));

  return (
    <div className="flex h-full w-full flex-col min-h-0">
      {title && <p className="mb-2 text-sm font-medium text-zinc-300">{title}</p>}
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted}>
            <defs>
              <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value}%`, 'Disponibilité']}
            />
            <Area
              type="monotone"
              dataKey="availability"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#purpleGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
