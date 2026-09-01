import React, { useState, useMemo } from "react";
import { ChevronRight, ShieldCheck } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { AppTraffic, SocketConnection } from "../types";
import { STICKER_COLORS, StickerColorKey } from "../constants/theme";
import { ExportCsvButton } from "./ExportCsvButton";
import { formatDataVolume, formatRate, formatMbps } from "../utils/format";
import { Language, TranslationDict } from "../i18n/translations";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const TIMEFRAME_OPTIONS = [
  { label: "30s", seconds: 30, textTh: "30 วินาที", textEn: "30 seconds" },
  { label: "1m", seconds: 60, textTh: "1 นาที", textEn: "1 minute" },
  { label: "5m", seconds: 300, textTh: "5 นาที", textEn: "5 minutes" },
  { label: "10m", seconds: 600, textTh: "10 นาที", textEn: "10 minutes" },
  { label: "30m", seconds: 1800, textTh: "30 นาที", textEn: "30 minutes" },
  { label: "1h", seconds: 3600, textTh: "1 ชั่วโมง", textEn: "1 hour" },
];

interface OverviewTabProps {
  lang: Language;
  t: TranslationDict;
  fullHistory: { dl: number[]; ul: number[]; ts: number[] };
  sessionDownloadedMB: number;
  sessionUploadedMB: number;
  peakDlMB: number;
  peakUlKB: number;
  liveDlMbps: number;
  liveUlMbps: number;
  apps: AppTraffic[];
  sockets: SocketConnection[];
  onNavigateTab: (tab: "apps" | "sockets") => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  lang,
  t,
  fullHistory,
  sessionDownloadedMB,
  sessionUploadedMB,
  peakDlMB,
  peakUlKB,
  liveDlMbps,
  liveUlMbps,
  apps,
  sockets,
  onNavigateTab,
}) => {
  const [timeframe, setTimeframe] = useState<number>(30);
  const [chartUnitMode, setChartUnitMode] = useState<
    "auto" | "kb" | "mb" | "mbps"
  >("auto");

  const currentTimeframeObj =
    TIMEFRAME_OPTIONS.find((opt) => opt.seconds === timeframe) ||
    TIMEFRAME_OPTIONS[0];

  // Protocol Distribution for Protocol Card
  const protocolStats = useMemo(() => {
    if (sockets.length === 0) return { https: 70, http: 15, dns: 10, other: 5 };
    const httpsCount = sockets.filter(
      (s) => s.remote.endsWith(":443") || s.remote.includes(":443"),
    ).length;
    const dnsCount = sockets.filter(
      (s) => s.remote.endsWith(":53") || s.proto === "UDP",
    ).length;
    const httpCount = sockets.filter(
      (s) => s.remote.endsWith(":80") || s.remote.includes(":80"),
    ).length;
    const total = sockets.length;
    const httpsPct = Math.round((httpsCount / total) * 100);
    const dnsPct = Math.round((dnsCount / total) * 100);
    const httpPct = Math.round((httpCount / total) * 100);
    const otherPct = Math.max(0, 100 - httpsPct - dnsPct - httpPct);
    return { https: httpsPct, http: httpPct, dns: dnsPct, other: otherPct };
  }, [sockets]);

  // Smart Downsampling & History Slicing for Smooth 60fps Chart Rendering
  const visibleSlice = useMemo(() => {
    const rawDl = fullHistory.dl.slice(-timeframe);
    const rawUl = fullHistory.ul.slice(-timeframe);
    const rawTs = (fullHistory.ts || []).slice(-timeframe);
    const padLength = Math.max(0, timeframe - rawDl.length);
    const paddedDl = [...Array(padLength).fill(0), ...rawDl];
    const paddedUl = [...Array(padLength).fill(0), ...rawUl];
    const now = Date.now();
    const paddedTs = [
      ...Array.from(
        { length: padLength },
        (_, i) => now - (timeframe - i) * 1000,
      ),
      ...rawTs,
    ];

    const maxPoints = 60;
    const step = Math.max(1, Math.floor(timeframe / maxPoints));

    const dlSampled: number[] = [];
    const ulSampled: number[] = [];
    const labels: string[] = [];
    const timeLabels: string[] = [];

    for (let i = 0; i < timeframe; i += step) {
      const chunkDl = paddedDl.slice(i, i + step);
      const chunkUl = paddedUl.slice(i, i + step);
      const chunkTs = paddedTs.slice(i, i + step);
      const avgDl = chunkDl.reduce((a, b) => a + b, 0) / chunkDl.length;
      const avgUl = chunkUl.reduce((a, b) => a + b, 0) / chunkUl.length;
      const pointTs = chunkTs[chunkTs.length - 1] || now;

      dlSampled.push(avgDl);
      ulSampled.push(avgUl);

      const d = new Date(pointTs);
      const timeStr = d.toLocaleTimeString([], {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      timeLabels.push(timeStr);

      const secondsAgo = timeframe - i;
      if (i + step >= timeframe || secondsAgo <= 0) {
        labels.push("Now");
      } else if (secondsAgo < 60) {
        labels.push(`-${secondsAgo}s`);
      } else if (secondsAgo < 3600) {
        labels.push(`-${Math.round(secondsAgo / 60)}m`);
      } else {
        labels.push(`-${(secondsAgo / 3600).toFixed(1)}h`);
      }
    }

    return { dl: dlSampled, ul: ulSampled, labels, timeLabels };
  }, [fullHistory, timeframe]);

  // Adaptive Auto-scaling Unit
  const unitLabel = useMemo(() => {
    if (chartUnitMode === "mbps") return "Mbps";
    if (chartUnitMode === "kb") return "KB/s";
    if (chartUnitMode === "mb") return "MB/s";
    const maxVal = Math.max(...visibleSlice.dl, ...visibleSlice.ul);
    return maxVal < 0.8 ? "KB/s" : "MB/s";
  }, [chartUnitMode, visibleSlice]);

  const displayDlData = useMemo(() => {
    return visibleSlice.dl.map((v) => {
      if (unitLabel === "Mbps") return Number((v * 8).toFixed(2));
      if (unitLabel === "KB/s") return Math.round(v * 1024);
      return Number(v.toFixed(2));
    });
  }, [visibleSlice.dl, unitLabel]);

  const displayUlData = useMemo(() => {
    return visibleSlice.ul.map((v) => {
      if (unitLabel === "Mbps") return Number((v * 8).toFixed(2));
      if (unitLabel === "KB/s") return Math.round(v * 1024);
      return Number(v.toFixed(2));
    });
  }, [visibleSlice.ul, unitLabel]);

  const chartData = useMemo(() => {
    return {
      labels: visibleSlice.labels,
      datasets: [
        {
          label: `${t.download} (${unitLabel})`,
          data: displayDlData,
          borderColor: "#0075de",
          backgroundColor: "rgba(0, 117, 222, 0.08)",
          borderWidth: 2,
          tension: 0.35,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: "#0075de",
        },
        {
          label: `${t.upload} (${unitLabel})`,
          data: displayUlData,
          borderColor: "#7c3aed",
          backgroundColor: "rgba(124, 58, 237, 0.06)",
          borderWidth: 2,
          tension: 0.35,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: "#7c3aed",
        },
      ],
    };
  }, [
    displayDlData,
    displayUlData,
    visibleSlice.labels,
    unitLabel,
    t.download,
    t.upload,
  ]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        titleColor: "#000000",
        bodyColor: "#31302e",
        borderColor: "#e6e6e6",
        borderWidth: 1,
        titleFont: {
          family: "Kanit, Outfit, system-ui",
          size: 12,
          weight: 700 as any,
        },
        bodyFont: { family: "JetBrains Mono, monospace", size: 12 },
        padding: 12,
        boxPadding: 4,
        usePointStyle: true,
        displayColors: true,
        callbacks: {
          title: (items: any[]) => {
            if (!items.length) return "";
            const idx = items[0].dataIndex;
            const timeStr = visibleSlice.timeLabels?.[idx] || "";
            const relLabel = items[0].label;
            const relText =
              relLabel === "Now"
                ? lang === "th"
                  ? "ตอนนี้ (Real-time)"
                  : "Now"
                : lang === "th"
                  ? `${relLabel} ที่แล้ว`
                  : `${relLabel} ago`;
            return `🕒 ${timeStr} • ${relText}`;
          },
          label: (context: any) => {
            const isDl = context.datasetIndex === 0;
            const name = isDl
              ? lang === "th"
                ? "ความเร็วดาวน์โหลด"
                : "Download"
              : lang === "th"
                ? "ความเร็วอัปโหลด"
                : "Upload";
            return ` ${name}: ${context.parsed.y} ${unitLabel}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(0, 0, 0, 0.03)" },
        ticks: {
          color: "#a39e98",
          font: { family: "JetBrains Mono", size: 10 },
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.04)" },
        ticks: {
          color: "#a39e98",
          font: { family: "JetBrains Mono", size: 10 },
          callback: (val: any) => `${val} ${unitLabel}`,
        },
      },
    },
  };

  return (
    <div className="flex flex-col gap-6 ps-fade-in">
      {/* Hero Bandwidth Timeline Card */}
      <div className="w-full bg-surface rounded-xl border border-hairline p-6 shadow-notion-card flex flex-col min-h-[360px]">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-ink tracking-tight m-0">
              {t.bandwidthTimeline}
            </h3>
            <p className="text-xs text-ink-muted mt-0.5 m-0">
              {lang === "th"
                ? `ความเร็วรับ-ส่งข้อมูลย้อนหลัง ${currentTimeframeObj.textTh}`
                : `Live ${currentTimeframeObj.textEn} rolling transmission rate`}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Timeframe Selector */}
            <div className="flex bg-canvas-soft p-0.5 rounded-md border border-hairline text-xs">
              {TIMEFRAME_OPTIONS.map((opt) => (
                <button
                  key={opt.seconds}
                  onClick={() => setTimeframe(opt.seconds)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    timeframe === opt.seconds
                      ? "bg-surface text-primary font-semibold shadow-xs"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Unit Selector */}
            <div className="flex bg-canvas-soft p-0.5 rounded-md border border-hairline text-xs">
              <button
                onClick={() => setChartUnitMode("auto")}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  chartUnitMode === "auto"
                    ? "bg-surface text-primary font-semibold shadow-xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Auto ({unitLabel})
              </button>
              <button
                onClick={() => setChartUnitMode("kb")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  chartUnitMode === "kb"
                    ? "bg-surface text-primary font-semibold shadow-xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                KB/s
              </button>
              <button
                onClick={() => setChartUnitMode("mb")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  chartUnitMode === "mb"
                    ? "bg-surface text-primary font-semibold shadow-xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                MB/s
              </button>
              <button
                onClick={() => setChartUnitMode("mbps")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  chartUnitMode === "mbps"
                    ? "bg-surface text-primary font-semibold shadow-xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Mbps
              </button>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-primary font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />{" "}
                {t.download}
              </span>
              <span className="flex items-center gap-1.5 text-[#7c3aed] font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7c3aed]" />{" "}
                {t.upload}
              </span>
            </div>
          </div>
        </div>

        {/* Embedded Traffic Summary Bar (Total & Peak) + Export CSV */}
        <div className="w-full bg-canvas-soft/70 border border-hairline rounded-lg px-3.5 py-2.5 mb-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 sm:gap-5 font-mono">
            {/* Download Summary */}
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              <span className="text-ink-muted">{t.download}:</span>
              <span className="text-ink font-semibold">
                {t.sessionTotal} {formatDataVolume(sessionDownloadedMB)}
              </span>
              <span className="text-ink-faint">|</span>
              <span className="text-ink-muted">{t.peak}:</span>
              <span className="text-primary font-semibold">
                {formatMbps(peakDlMB * 8)}
              </span>
            </div>

            {/* Upload Summary */}
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#7c3aed] shrink-0" />
              <span className="text-ink-muted">{t.upload}:</span>
              <span className="text-ink font-semibold">
                {t.sessionTotal} {formatDataVolume(sessionUploadedMB)}
              </span>
              <span className="text-ink-faint">|</span>
              <span className="text-ink-muted">{t.peak}:</span>
              <span className="text-[#7c3aed] font-semibold">
                {formatMbps((peakUlKB * 8) / 1024)}
              </span>
            </div>
          </div>

          {/* Export CSV Button */}
          <ExportCsvButton
            filename="pulsesentry_traffic_summary"
            label={
              lang === "th" ? "ส่งออกสรุปข้อมูล (CSV)" : "Export Traffic (CSV)"
            }
            headers={[
              "Metric",
              "Current Speed (Mbps)",
              "Peak Speed (Mbps)",
              "Session Total Volume",
              "Timestamp",
            ]}
            rows={[
              [
                "Download",
                liveDlMbps.toFixed(2),
                (peakDlMB * 8).toFixed(2),
                formatDataVolume(sessionDownloadedMB),
                new Date().toISOString(),
              ],
              [
                "Upload",
                liveUlMbps.toFixed(2),
                ((peakUlKB * 8) / 1024).toFixed(2),
                formatDataVolume(sessionUploadedMB),
                new Date().toISOString(),
              ],
            ]}
          />
        </div>

        <div className="flex-1 relative min-h-[250px] w-full">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Bottom Row: 3 Balanced Cards (Top Apps, Active Sockets, Protocol Breakdown) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Top Bandwidth Applications */}
        <div className="bg-surface rounded-xl border border-hairline p-6 shadow-notion-card flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-ink tracking-tight m-0">
                {t.topApps}
              </h3>
              <button
                onClick={() => onNavigateTab("apps")}
                className="text-xs text-primary font-semibold hover:underline bg-transparent border-none cursor-pointer"
              >
                {t.viewAll}
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {apps.length === 0 ? (
                <p className="text-xs text-ink-muted text-center py-4 font-mono">
                  {lang === "th"
                    ? "กำลังสแกนการใช้เน็ตของแอป..."
                    : "Scanning network processes..."}
                </p>
              ) : (
                apps.slice(0, 5).map((app, idx) => {
                  const sticker =
                    (app.sticker &&
                      STICKER_COLORS[app.sticker as StickerColorKey]) ||
                    STICKER_COLORS.sky;
                  const maxRate = Math.max(
                    ...apps.map((a) => a.dl + a.ul),
                    0.001,
                  );
                  const totalRate = app.dl + app.ul;
                  const percent =
                    totalRate > 0
                      ? Math.min(100, Math.max(4, (totalRate / maxRate) * 100))
                      : 0;

                  return (
                    <div
                      key={idx}
                      className="flex flex-col gap-1.5 p-2 rounded-lg hover:bg-canvas-soft/60 transition-colors"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span
                            className={`w-2 h-2 rounded-full ${sticker.dot} shrink-0`}
                          />
                          <span
                            className="font-semibold text-ink truncate"
                            title={app.name}
                          >
                            {app.name}
                          </span>
                          <span className="text-ink-faint font-normal font-mono text-[11px] shrink-0">
                            #{app.pid}
                          </span>
                        </div>
                        <span className="font-mono text-ink text-xs shrink-0 font-medium">
                          ↓ {formatRate(app.dl)} • ↑ {formatRate(app.ul)}
                        </span>
                      </div>

                      <div className="w-full h-1.5 bg-canvas-soft rounded-full overflow-hidden">
                        <div
                          className={`h-full ${sticker.bg} rounded-full transition-all duration-300`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-hairline flex justify-between items-center text-xs text-ink-muted">
            <span>
              {t.trackingApps} {apps.length} {t.activeProcs}
            </span>
            <button
              onClick={() => onNavigateTab("apps")}
              className="flex items-center gap-1 text-primary font-semibold hover:underline bg-transparent border-none cursor-pointer"
            >
              {t.viewAll} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Active Remote Connections */}
        <div className="bg-surface rounded-xl border border-hairline p-6 shadow-notion-card flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-ink tracking-tight m-0">
                {t.activeConns}
              </h3>
              {/* <button
                onClick={() => onNavigateTab("sockets")}
                className="text-xs text-primary font-semibold hover:underline bg-transparent border-none cursor-pointer"
              >
                {t.fullInspector}
              </button> */}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-ink-muted border-b border-hairline uppercase text-[10px] tracking-wider font-semibold font-mono">
                    <th className="pb-2 w-6 font-mono text-ink-faint">#</th>
                    <th className="pb-2">{t.colApp}</th>
                    <th className="pb-2">Proto</th>
                    <th className="pb-2">{t.colRemote}</th>
                    <th className="pb-2">{t.colStatus}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {sockets.slice(0, 5).map((s, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-canvas-soft/50 transition-colors"
                    >
                      <td className="py-2 font-mono text-ink-faint text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2 font-semibold text-ink flex items-center gap-1.5 truncate max-w-[120px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-sticker-sky shrink-0" />
                        <span className="truncate">{s.proc}</span>
                      </td>
                      <td className="py-2 font-mono text-ink-faint">
                        {s.proto}
                      </td>
                      <td className="py-2 font-mono text-ink-muted truncate max-w-[110px]">
                        {s.remote}
                      </td>
                      <td className="py-2 font-mono">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#EBF8EE] text-[#0E5C1E]">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-hairline flex justify-between items-center text-xs text-ink-muted">
            <span>
              {sockets.length} {t.activeSockets}
            </span>
            <button
              onClick={() => onNavigateTab("sockets")}
              className="flex items-center gap-1 text-primary font-semibold hover:underline bg-transparent border-none cursor-pointer"
            >
              {t.viewAll} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3: Protocol Distribution */}
        <div className="bg-surface rounded-xl border border-hairline p-6 shadow-notion-card flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-ink tracking-tight mb-4 m-0">
              {t.protocolDist}
            </h3>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary" /> HTTPS
                    (443)
                  </span>
                  <strong className="text-ink font-mono">
                    {protocolStats.https}%
                  </strong>
                </div>
                <div className="w-full h-1.5 bg-canvas-soft rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${protocolStats.https}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sticker-sky" />{" "}
                    HTTP (80)
                  </span>
                  <strong className="text-ink font-mono">
                    {protocolStats.http}%
                  </strong>
                </div>
                <div className="w-full h-1.5 bg-canvas-soft rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sticker-sky transition-all duration-300"
                    style={{ width: `${protocolStats.http}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sticker-green" />{" "}
                    DNS (53)
                  </span>
                  <strong className="text-ink font-mono">
                    {protocolStats.dns}%
                  </strong>
                </div>
                <div className="w-full h-1.5 bg-canvas-soft rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sticker-green transition-all duration-300"
                    style={{ width: `${protocolStats.dns}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sticker-orange" />{" "}
                    Direct Sockets
                  </span>
                  <strong className="text-ink font-mono">
                    {protocolStats.other}%
                  </strong>
                </div>
                <div className="w-full h-1.5 bg-canvas-soft rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sticker-orange transition-all duration-300"
                    style={{ width: `${protocolStats.other}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-hairline text-xs text-ink-muted flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-sticker-green" />
            <span className="line-clamp-1">{t.safeRoutes}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
