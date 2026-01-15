import { ArrowUp, ArrowDown } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  growth: number; // persen (+ / -)
  period?: string; // default: last 12 months
  icon: React.ReactNode;
}

export default function StatCard({
  title,
  value,
  growth,
  period = 'last 12 months',
  icon,
}: StatCardProps) {
  const isPositive = growth >= 0;

  return (
    <div className="rounded-xl bg-neutral-900/80 backdrop-blur border border-neutral-800 p-5 shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>

          <div className="flex items-center gap-2 mt-2 text-sm">
            <span
              className={clsx(
                'flex items-center gap-1 font-medium',
                isPositive ? 'text-emerald-400' : 'text-red-400'
              )}
            >
              {isPositive ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <ArrowDown className="w-4 h-4" />
              )}
              {Math.abs(growth).toFixed(1)}%
            </span>

            <span className="text-neutral-500">· {period}</span>
          </div>
        </div>

        <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300">
          {icon}
        </div>
      </div>
    </div>
  );
}
