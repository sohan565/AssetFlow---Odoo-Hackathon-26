import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  color?: 'indigo' | 'emerald' | 'rose' | 'amber';
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  color = 'indigo' 
}) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-500/10 border-indigo-500/10 hover:border-indigo-500/30',
      iconBg: 'bg-indigo-600/10 text-indigo-400',
    },
    emerald: {
      bg: 'bg-emerald-500/10 border-emerald-500/10 hover:border-emerald-500/30',
      iconBg: 'bg-emerald-600/10 text-emerald-400',
    },
    rose: {
      bg: 'bg-rose-500/10 border-rose-500/10 hover:border-rose-500/30',
      iconBg: 'bg-rose-600/10 text-rose-400',
    },
    amber: {
      bg: 'bg-amber-500/10 border-amber-500/10 hover:border-amber-500/30',
      iconBg: 'bg-amber-600/10 text-amber-400',
    }
  };

  const selectedColor = colorMap[color];

  return (
    <div className={`p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${selectedColor.bg}`}>
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">{title}</span>
          <span className="text-3xl font-extrabold text-white tracking-tight">{value}</span>
        </div>
        <div className={`p-3 rounded-xl ${selectedColor.iconBg}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {description && (
        <p className="text-xs text-slate-500 mt-4 font-medium tracking-wide">
          {description}
        </p>
      )}
    </div>
  );
};
