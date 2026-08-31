import React from "react";

export interface MetricCardProps {
  title: string;
  dotColor?: string;
  icon?: React.ReactNode;
  mainValue: string | number;
  mainUnit?: string;
  mainUnitColor?: string;
  subValue?: string;
  footerLeft: React.ReactNode;
  footerRight?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  dotColor,
  icon,
  mainValue,
  mainUnit,
  mainUnitColor,
  subValue,
  footerLeft,
  footerRight,
}) => {
  return (
    <div className="bg-surface rounded-xl border border-hairline p-5 shadow-notion-card hover:border-ink/20 transition-all flex flex-col justify-between group">
      {/* Top Header: Title & Subtle Icon */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider font-sans flex items-center gap-1.5">
          {dotColor && (
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
          )}
          <span>{title}</span>
        </span>
        {icon && (
          <div className="text-ink-faint group-hover:text-ink transition-colors">
            {icon}
          </div>
        )}
      </div>

      {/* Main Metric Value */}
      <div className="my-3 flex items-baseline gap-2 flex-wrap">
        <span className="text-3xl sm:text-4xl font-black font-mono text-ink tracking-tight">
          {mainValue}
        </span>
        {mainUnit && (
          <span
            className={`text-xs font-bold font-mono tracking-normal ${
              mainUnitColor || "text-ink-muted"
            }`}
          >
            {mainUnit}
          </span>
        )}
        {subValue && (
          <span className="text-[11px] text-ink-faint font-mono font-medium">
            {subValue}
          </span>
        )}
      </div>

      {/* Clean Bottom Metadata Strip */}
      <div className="pt-3 border-t border-hairline flex items-center justify-between text-[11px] text-ink-muted gap-2 whitespace-nowrap min-w-0 font-sans">
        <div className="truncate min-w-0 font-medium">{footerLeft}</div>
        {footerRight && (
          <div className="shrink-0 font-mono text-ink-faint">{footerRight}</div>
        )}
      </div>
    </div>
  );
};
