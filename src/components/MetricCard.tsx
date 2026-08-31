import React from "react";

export interface MetricCardProps {
  title: string;
  dotColor: string;
  mainValue: string | number;
  mainUnit?: string;
  mainUnitColor?: string;
  badge?: { text: string; bg: string; textCol: string };
  icon: React.ReactNode;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  footerLeft: React.ReactNode;
  footerRight: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  dotColor,
  mainValue,
  mainUnit,
  mainUnitColor = "text-primary",
  badge,
  icon,
  iconBg,
  iconBorder,
  iconColor,
  footerLeft,
  footerRight,
}) => {
  return (
    <div className="bg-surface rounded-xl border border-hairline p-5 shadow-notion-card hover:shadow-notion-hover transition-shadow flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1.5 truncate">
            <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
            <span className="truncate">{title}</span>
          </span>
          <div className="mt-2 flex items-baseline gap-1.5 flex-nowrap">
            <span className="text-3xl font-bold font-mono text-ink tracking-tight whitespace-nowrap">
              {mainValue}
            </span>
            {mainUnit && (
              <span className={`text-xs font-semibold ${mainUnitColor} shrink-0`}>
                {mainUnit}
              </span>
            )}
            {badge && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.bg} ${badge.textCol} shrink-0 ml-1`}
              >
                {badge.text}
              </span>
            )}
          </div>
        </div>
        <div
          className={`w-9 h-9 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center border ${iconBorder} shrink-0 ml-2`}
        >
          {icon}
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-hairline flex justify-between items-center text-[11px] text-ink-muted gap-2 whitespace-nowrap min-w-0">
        <div className="truncate shrink min-w-0">{footerLeft}</div>
        <div className="shrink-0 text-right font-mono">{footerRight}</div>
      </div>
    </div>
  );
};
