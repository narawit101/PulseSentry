import React, { useState, useMemo } from "react";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Trash2,
} from "lucide-react";
import { SpeedtestResult } from "../../types";
import { TranslationDict } from "../../i18n/translations";
import { exportToCsv } from "../../utils/csv";

interface SpeedtestHistoryTableProps {
  t: TranslationDict;
  history: SpeedtestResult[];
  onClearHistory: () => void;
}

type HistorySortField =
  | "timestamp"
  | "provider"
  | "ping"
  | "download_latency"
  | "upload_latency"
  | "download_mbps"
  | "upload_mbps";
type HistorySortOrder = "asc" | "desc";

export const SpeedtestHistoryTable: React.FC<SpeedtestHistoryTableProps> = ({
  t,
  history,
  onClearHistory,
}) => {
  const [sortField, setSortField] = useState<HistorySortField>("timestamp");
  const [sortOrder, setSortOrder] = useState<HistorySortOrder>("desc");

  const handleSort = (field: HistorySortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedHistory = useMemo(() => {
    if (!history || history.length === 0) return [];
    return [...history].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA === undefined || valA === null) valA = 0;
      if (valB === undefined || valB === null) valB = 0;

      if (typeof valA === "string") {
        return sortOrder === "asc"
          ? (valA as string).localeCompare(valB as string)
          : (valB as string).localeCompare(valA as string);
      }

      return sortOrder === "asc"
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });
  }, [history, sortField, sortOrder]);

  // Export CSV handler (with UTF-8 BOM for Excel compatibility)
  const handleExportCsv = () => {
    if (!history.length) return;
    const headers = [
      "No",
      "Timestamp",
      "Server",
      "Idle Latency (ms)",
      "Download Latency (ms)",
      "Upload Latency (ms)",
      "Download (Mbps)",
      "Upload (Mbps)",
    ];
    const rows = history.map((item, idx) => [
      idx + 1,
      item.timestamp,
      item.provider || "",
      item.ping ?? "-",
      item.download_latency ?? "-",
      item.upload_latency ?? "-",
      item.download_mbps ?? 0,
      item.upload_mbps ?? 0,
    ]);
    exportToCsv("pulsesentry_speedtest", headers, rows);
  };

  // Export JSON handler (with Blob ObjectURL)
  const handleExportJson = () => {
    if (!history.length) return;
    const jsonString = JSON.stringify(history, null, 2);
    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pulsesentry_speedtest_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-surface rounded-2xl border border-hairline p-6 shadow-notion-card">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-bold text-ink">{t.speedtestHistory}</h4>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-canvas-soft border border-hairline text-ink-muted">
            {history.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={!history.length}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-hairline bg-surface hover:bg-canvas-soft text-ink text-xs font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-sticker-green" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportJson}
            disabled={!history.length}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-hairline bg-surface hover:bg-canvas-soft text-ink text-xs font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-primary" />
            <span>JSON</span>
          </button>
          <button
            onClick={onClearHistory}
            disabled={!history.length}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.speedtestClear}</span>
          </button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="py-12 text-center text-xs text-ink-faint flex flex-col items-center gap-2">
          <Activity className="w-8 h-8 text-hairline" />
          <span>{t.speedtestNoHistory}</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-hairline text-[11px] font-semibold text-ink-faint uppercase tracking-wider">
                <th className="py-2.5 px-3 w-10">#</th>

                {/* Timestamp */}
                <th
                  onClick={() => handleSort("timestamp")}
                  className="py-2.5 px-3 cursor-pointer hover:text-ink select-none transition-colors"
                >
                  <div className="inline-flex items-center gap-1 group">
                    <span>{t.speedtestTableTime}</span>
                    {sortField === "timestamp" ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="w-3 h-3 text-primary" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 text-ink-faint opacity-30 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* Server */}
                <th
                  onClick={() => handleSort("provider")}
                  className="py-2.5 px-3 cursor-pointer hover:text-ink select-none transition-colors"
                >
                  <div className="inline-flex items-center gap-1 group">
                    <span>{t.speedtestTableServer}</span>
                    {sortField === "provider" ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="w-3 h-3 text-primary" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 text-ink-faint opacity-30 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* Idle Ping */}
                <th
                  onClick={() => handleSort("ping")}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-ink select-none transition-colors"
                >
                  <div className="inline-flex items-center justify-end gap-1 group w-full">
                    <span>{t.speedtestTableIdlePing}</span>
                    {sortField === "ping" ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="w-3 h-3 text-sticker-orange" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-sticker-orange" />
                      )
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 text-ink-faint opacity-30 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* Down Latency */}
                <th
                  onClick={() => handleSort("download_latency")}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-ink select-none transition-colors"
                >
                  <div className="inline-flex items-center justify-end gap-1 group w-full">
                    <span>{t.speedtestTableDownLatency}</span>
                    {sortField === "download_latency" ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="w-3 h-3 text-primary" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 text-ink-faint opacity-30 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* Up Latency */}
                <th
                  onClick={() => handleSort("upload_latency")}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-ink select-none transition-colors"
                >
                  <div className="inline-flex items-center justify-end gap-1 group w-full">
                    <span>{t.speedtestTableUpLatency}</span>
                    {sortField === "upload_latency" ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="w-3 h-3 text-[#6b21a8]" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-[#6b21a8]" />
                      )
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 text-ink-faint opacity-30 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* Download Mbps */}
                <th
                  onClick={() => handleSort("download_mbps")}
                  className="py-2.5 px-3 text-right cursor-pointer text-primary hover:text-primary-pressed select-none transition-colors"
                >
                  <div className="inline-flex items-center justify-end gap-1 group w-full">
                    <span>{t.speedtestTableDownload}</span>
                    {sortField === "download_mbps" ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="w-3 h-3 text-primary" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* Upload Mbps */}
                <th
                  onClick={() => handleSort("upload_mbps")}
                  className="py-2.5 px-3 text-right cursor-pointer text-[#7e22ce] hover:text-[#581c87] select-none transition-colors"
                >
                  <div className="inline-flex items-center justify-end gap-1 group w-full">
                    <span>{t.speedtestTableUpload}</span>
                    {sortField === "upload_mbps" ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="w-3 h-3 text-[#7e22ce]" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-[#7e22ce]" />
                      )
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 text-[#7e22ce] opacity-40 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* Result Link */}
                <th className="py-2.5 px-3 text-center">
                  {t.speedtestTableResult}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline font-mono">
              {sortedHistory.map((res, index) => (
                <tr
                  key={res.id || index}
                  className="hover:bg-canvas-soft/80 transition-colors"
                >
                  <td className="py-2.5 px-3 text-ink-faint">{index + 1}</td>
                  <td className="py-2.5 px-3 font-sans text-ink">
                    {res.timestamp}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-ink-muted">
                    {res.provider}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-ink">
                    {Math.round(res.ping)} ms
                  </td>
                  <td className="py-2.5 px-3 text-right text-ink-muted">
                    {res.download_latency
                      ? `${Math.round(res.download_latency)} ms`
                      : "—"}
                  </td>
                  <td className="py-2.5 px-3 text-right text-ink-muted">
                    {res.upload_latency
                      ? `${Math.round(res.upload_latency)} ms`
                      : "—"}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-primary">
                    {res.download_mbps.toFixed(2)} Mbps
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#7e22ce]">
                    {res.upload_mbps.toFixed(2)} Mbps
                  </td>
                  <td className="py-2.5 px-3 text-center font-sans">
                    <a
                      href={res.result_url || "https://www.speedtest.net"}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline text-[11px]"
                    >
                      <span>{t.speedtestViewResult}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
