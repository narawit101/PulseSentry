import React from "react";
import { Download } from "lucide-react";
import { exportToCsv } from "../utils/csv";

interface ExportCsvButtonProps {
  filename: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
  label?: string;
  disabled?: boolean;
  className?: string;
  title?: string;
}

export const ExportCsvButton: React.FC<ExportCsvButtonProps> = ({
  filename,
  headers,
  rows,
  label = "Export CSV",
  disabled = false,
  className = "",
  title,
}) => {
  const handleClick = () => {
    if (disabled || !rows || rows.length === 0) return;
    exportToCsv(filename, headers, rows);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || !rows || rows.length === 0}
      title={title || label}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface hover:bg-canvas-soft border border-hairline text-ink font-medium text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 ${className}`}
    >
      <Download className="w-3.5 h-3.5 text-primary shrink-0" />
      <span>{label}</span>
    </button>
  );
};
