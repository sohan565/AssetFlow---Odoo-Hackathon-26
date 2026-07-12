import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  color?: 'indigo' | 'emerald' | 'rose' | 'amber';
}

const glowMap = {
  indigo: {
    border: 'hover:border-indigo-500/30',
    glow: 'rgba(99,102,241,0.08)',
    glowHover: 'rgba(99,102,241,0.15)',
    iconBg: 'rgba(99,102,241,0.1)',
    iconBorder: 'rgba(99,102,241,0.2)',
    iconColor: '#818cf8',
    valueColor: '#e0e7ff',
  },
  emerald: {
    border: 'hover:border-emerald-500/30',
    glow: 'rgba(16,185,129,0.06)',
    glowHover: 'rgba(16,185,129,0.14)',
    iconBg: 'rgba(16,185,129,0.1)',
    iconBorder: 'rgba(16,185,129,0.2)',
    iconColor: '#34d399',
    valueColor: '#d1fae5',
  },
  rose: {
    border: 'hover:border-rose-500/30',
    glow: 'rgba(244,63,94,0.06)',
    glowHover: 'rgba(244,63,94,0.14)',
    iconBg: 'rgba(244,63,94,0.1)',
    iconBorder: 'rgba(244,63,94,0.2)',
    iconColor: '#fb7185',
    valueColor: '#ffe4e6',
  },
  amber: {
    border: 'hover:border-amber-500/30',
    glow: 'rgba(245,158,11,0.06)',
    glowHover: 'rgba(245,158,11,0.14)',
    iconBg: 'rgba(245,158,11,0.1)',
    iconBorder: 'rgba(245,158,11,0.2)',
    iconColor: '#fbbf24',
    valueColor: '#fef3c7',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  color = 'indigo',
}) => {
  const c = glowMap[color];

  return (
    <div
      className={`relative p-6 rounded-2xl border border-slate-800/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden group cursor-default ${c.border}`}
      style={{ background: 'rgba(12, 17, 32, 0.8)', backdropFilter: 'blur(12px)' }}
    >
      {/* Corner glow */}
      <div
        className="absolute top-0 right-0 w-28 h-28 rounded-full blur-2xl transition-opacity duration-300 opacity-60 group-hover:opacity-100 pointer-events-none"
        style={{ background: c.glow, transform: 'translate(30%, -30%)' }}
      />

      <div className="relative flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">{title}</span>
          <span className="text-4xl font-extrabold tracking-tight" style={{ color: c.valueColor }}>{value}</span>
        </div>
        <div
          className="p-3 rounded-xl border"
          style={{ background: c.iconBg, borderColor: c.iconBorder }}
        >
          <Icon className="w-5 h-5" style={{ color: c.iconColor }} />
        </div>
      </div>

      {description && (
        <p className="relative text-xs text-slate-500 mt-4 font-medium tracking-wide">{description}</p>
      )}
    </div>
  );
};
