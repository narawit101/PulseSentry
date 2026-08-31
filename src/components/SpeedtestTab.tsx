import React, { useState, useMemo, useEffect } from "react";
import {
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Gamepad2,
  Monitor,
  PlaySquare,
  RotateCcw,
  Search,
  Server,
  Trash2,
  User,
  X,
  Zap,
} from "lucide-react";
import { SpeedtestProgress, SpeedtestResult } from "../types";
import { TranslationDict } from "../i18n/translations";

export interface TestServer {
  id: string;
  name: string;
  location: string;
  host: string;
  badge: string;
}

export const THAI_SERVERS: TestServer[] = [
  {
    id: "auto",
    name: "Select Automatically",
    location: "Lowest Latency Node",
    host: "Auto-detected",
    badge: "AUTO",
  },
  {
    id: "8990",
    name: "3BB",
    location: "Bangkok",
    host: "speedtest-sp1.3bb.co.th",
    badge: "ISP",
  },
  {
    id: "33968",
    name: "SCM Technologies",
    location: "Bangkok",
    host: "speedtest.scm.co.th",
    badge: "IDC",
  },
  {
    id: "9830",
    name: "Bangmod Enterprise",
    location: "Bangkok",
    host: "speedtest.bangmod.co.th",
    badge: "IDC",
  },
  {
    id: "64015",
    name: "Siamcolo",
    location: "Bangkok",
    host: "speedtest.siamcolo.com",
    badge: "IDC",
  },
  {
    id: "1219",
    name: "TrueMove H",
    location: "Bangkok",
    host: "speedtest.truecorp.co.th",
    badge: "ISP",
  },
  {
    id: "47115",
    name: "NT Bangrak",
    location: "Bangkok",
    host: "speedtest.ntplc.co.th",
    badge: "ISP",
  },
  {
    id: "73387",
    name: "NT Corporate",
    location: "Bangkok",
    host: "speedtest.ntplc.co.th",
    badge: "ISP",
  },
  {
    id: "11823",
    name: "TCC Technology",
    location: "Bangkok",
    host: "speedtest.tcct.co.th",
    badge: "IDC",
  },
  {
    id: "63681",
    name: "Kirz",
    location: "Bangkok",
    host: "speedtest.kirz.com",
    badge: "IDC",
  },
];

interface SpeedtestTabProps {
  t: TranslationDict;
  progress: SpeedtestProgress;
  isRunning: boolean;
  history: SpeedtestResult[];
  publicIP?: string;
  onStartTest: (provider: string, mode?: "multi" | "single") => void;
  onCancelTest: () => void;
  onClearHistory: () => void;
}

export const SpeedtestTab: React.FC<SpeedtestTabProps> = ({
  t,
  progress,
  isRunning,
  history,
  publicIP = "183.88.225.63 (3BB)",
  onStartTest,
  onCancelTest,
  onClearHistory,
}) => {
  const [selectedServerId, setSelectedServerId] = useState<string>("auto");
  const [connectionMode, setConnectionMode] = useState<"multi" | "single">(
    "multi",
  );
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [serverSearch, setServerSearch] = useState("");
  const [measuredDl, setMeasuredDl] = useState<number>(0);
  const [isFading, setIsFading] = useState<boolean>(false);

  const handleStartWithFade = (
    serverName: string,
    mode: "multi" | "single",
  ) => {
    setIsFading(true);
    setTimeout(() => {
      onStartTest(serverName, mode);
      setIsFading(false);
    }, 200);
  };

  useEffect(() => {
    if (progress.stage === "download" && progress.mbps && progress.mbps > 0) {
      setMeasuredDl(progress.mbps);
    } else if (progress.download_mbps && progress.download_mbps > 0) {
      setMeasuredDl(progress.download_mbps);
    } else if (progress.stage === "ping") {
      setMeasuredDl(0);
    }
  }, [progress.stage, progress.mbps, progress.download_mbps]);

  // Test History Sorting State
  type HistorySortField =
    | "timestamp"
    | "provider"
    | "ping"
    | "download_latency"
    | "upload_latency"
    | "download_mbps"
    | "upload_mbps";
  type HistorySortOrder = "asc" | "desc";

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

  const selectedServer = useMemo(
    () =>
      THAI_SERVERS.find((s) => s.id === selectedServerId) || THAI_SERVERS[0],
    [selectedServerId],
  );

  const filteredServers = useMemo(() => {
    return THAI_SERVERS.filter(
      (s) =>
        s.name.toLowerCase().includes(serverSearch.toLowerCase()) ||
        s.location.toLowerCase().includes(serverSearch.toLowerCase()) ||
        s.host.toLowerCase().includes(serverSearch.toLowerCase()),
    );
  }, [serverSearch]);

  const currentMbps = progress.mbps || 0;
  const latest = history.length ? history[0] : null;

  // Determine current UI stage: "idle" | "testing" | "summary"
  const isTesting = isRunning;
  const isSummary = !isRunning && latest !== null;
  const isIdle = !isRunning && latest === null;

  // Extract clean ISP name and IP
  const ispName = publicIP.includes("(")
    ? publicIP.split("(")[1].replace(")", "")
    : "3BB";
  const cleanIp = publicIP.split(" ")[0] || "183.88.225.63";

  // Accurate 8-Segment Logarithmic Gauge Mapping matching dial tick marks exactly
  const getLogGaugePercent = (mbps: number): number => {
    if (mbps <= 0) return 0;
    if (mbps <= 5) return (mbps / 5) * 0.125;
    if (mbps <= 10) return 0.125 + ((mbps - 5) / 5) * 0.125;
    if (mbps <= 50) return 0.25 + ((mbps - 10) / 40) * 0.125;
    if (mbps <= 100) return 0.375 + ((mbps - 50) / 50) * 0.125;
    if (mbps <= 250) return 0.5 + ((mbps - 100) / 150) * 0.125;
    if (mbps <= 500) return 0.625 + ((mbps - 250) / 250) * 0.125;
    if (mbps <= 750) return 0.75 + ((mbps - 500) / 250) * 0.125;
    if (mbps <= 1000) return 0.875 + ((mbps - 750) / 250) * 0.125;
    return 1.0;
  };

  // Real Dynamic QoE Rating Calculator based on actual test results
  const getQoE = () => {
    const dl = isTesting
      ? progress.stage === "download"
        ? progress.mbps || 0
        : latest?.download_mbps || progress.mbps || 0
      : latest?.download_mbps || 0;
    const ul = isTesting
      ? progress.stage === "upload"
        ? progress.mbps || 0
        : latest?.upload_mbps || 0
      : latest?.upload_mbps || 0;
    const ping = isTesting
      ? progress.ping || latest?.ping || 25
      : latest?.ping || 25;
    const jitter = isTesting
      ? progress.jitter || latest?.jitter || 2
      : latest?.jitter || 2;

    // 1. Web Browsing Score (1-5)
    let web = 1;
    if (dl >= 25 && ping <= 50) web = 5;
    else if (dl >= 15 && ping <= 80) web = 4;
    else if (dl >= 5 && ping <= 120) web = 3;
    else if (dl >= 2) web = 2;

    // 2. Online Gaming Score (1-5) - Requires low latency (<30ms) & low jitter (<5ms)
    let game = 1;
    if (ping <= 30 && jitter <= 5) game = 5;
    else if (ping <= 55 && jitter <= 12) game = 4;
    else if (ping <= 85 && jitter <= 20) game = 3;
    else if (ping <= 130) game = 2;

    // 3. 4K/HD Video Streaming Score (1-5) - Requires sustained download bandwidth
    let video = 1;
    if (dl >= 50 && jitter <= 15) video = 5;
    else if (dl >= 25) video = 4;
    else if (dl >= 10) video = 3;
    else if (dl >= 5) video = 2;

    // 4. Video Calls / Conferences Score (1-5) - Requires solid upload & low jitter
    let call = 1;
    if (ul >= 15 && jitter <= 8 && ping <= 50) call = 5;
    else if (ul >= 5 && jitter <= 18 && ping <= 90) call = 4;
    else if (ul >= 2 && jitter <= 30) call = 3;
    else if (ul >= 1) call = 2;

    return {
      web,
      game,
      video,
      call,
      webDesc: `Web: ${web}/5 (${dl.toFixed(1)} Mbps, Ping ${Math.round(ping)}ms)`,
      gameDesc: `Gaming: ${game}/5 (Ping ${Math.round(ping)}ms, Jitter ${jitter.toFixed(1)}ms)`,
      videoDesc: `4K Stream: ${video}/5 (${dl.toFixed(1)} Mbps)`,
      callDesc: `Video Call: ${call}/5 (Upload ${ul.toFixed(1)} Mbps, Jitter ${jitter.toFixed(1)}ms)`,
    };
  };

  const qoe = getQoE();

  const gaugePercent =
    progress.stage === "ping"
      ? 0
      : Math.min(1.0, getLogGaugePercent(currentMbps));
  const needleAngle = -120 + gaugePercent * 240;

  // Export CSV handler (with UTF-8 BOM for Excel & browser compatibility)
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
      `"${item.timestamp}"`,
      `"${(item.provider || "").replace(/"/g, '""')}"`,
      item.ping ?? "-",
      item.download_latency ?? "-",
      item.upload_latency ?? "-",
      item.download_mbps ?? 0,
      item.upload_mbps ?? 0,
    ]);
    const csvString = [headers.join(","), ...rows.map((e) => e.join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pulsesentry_speedtest_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
    <div className="flex flex-col gap-6 relative font-sans">
      {/* ========================================================================= */}
      {/* 1. SPEEDTEST HERO CARD (Notion Design System Standard)                    */}
      {/* ========================================================================= */}
      <div className="w-full bg-surface text-ink rounded-2xl border border-hairline p-6 sm:p-8 shadow-notion-card transition-all duration-200">
        {/* ----------------------------------------------------------------------- */}
        {/* STATE 1: IDLE (Before Testing) - Warm Notion Document Aesthetic         */}
        {/* ----------------------------------------------------------------------- */}
        {isIdle && (
          <div
            className={`flex flex-col items-center justify-center py-8 text-center ${
              isFading ? "ps-fade-out" : "ps-fade-in"
            }`}
          >
            {/* Notion Header Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF5FD] text-primary border border-[#B8DCFA] text-xs font-semibold mb-3">
              <Zap className="w-3.5 h-3.5" />
              <span>{t.tabSpeedtest}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight mb-8">
              {t.speedtestTitle}
            </h2>

            {/* Giant Circular Notion Blue GO Button */}
            <div className="relative my-4">
              <button
                onClick={() =>
                  handleStartWithFade(
                    selectedServer.id === "auto"
                      ? "Speedtest.net"
                      : selectedServer.name,
                    connectionMode,
                  )
                }
                className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-primary hover:bg-primary-pressed active:scale-95 text-white font-black text-4xl sm:text-5xl tracking-widest shadow-md hover:shadow-xl transition-all duration-200 flex flex-col items-center justify-center cursor-pointer border-4 border-white ring-8 ring-[#EBF5FD] group"
              >
                <span>GO</span>
                <span className="text-[11px] font-normal tracking-normal text-white/80 mt-1">
                  START
                </span>
              </button>
            </div>

            {/* Bottom Config Strip: ISP, Server, and Connection Mode */}
            <div className="w-full max-w-2xl mt-8 pt-6 border-t border-hairline flex flex-wrap items-center justify-between gap-4 text-xs">
              {/* ISP & IP */}
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-8 h-8 rounded-lg bg-[#EBF5FD] border border-[#B8DCFA] flex items-center justify-center text-primary">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-ink">{ispName}</div>
                  <div className="text-ink-faint font-mono text-[11px]">
                    {cleanIp}
                  </div>
                </div>
              </div>

              {/* Server Selector */}
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-8 h-8 rounded-lg bg-[#F6EEFE] border border-[#E7D1FB] flex items-center justify-center text-[#6b21a8]">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-ink flex items-center gap-1.5">
                    <span>{selectedServer.name}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-canvas-soft border border-hairline text-ink-muted">
                      {selectedServer.badge}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsServerModalOpen(true)}
                    className="text-primary hover:underline font-medium text-[11px] cursor-pointer"
                  >
                    {selectedServer.location} • {t.speedtestChangeServer}
                  </button>
                </div>
              </div>

              {/* Multi / Single Switch */}
              <div className="flex items-center gap-1 bg-canvas-soft border border-hairline p-1 rounded-lg">
                <button
                  onClick={() => setConnectionMode("multi")}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    connectionMode === "multi"
                      ? "bg-surface text-primary shadow-xs"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  Multi
                </button>
                <button
                  onClick={() => setConnectionMode("single")}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    connectionMode === "single"
                      ? "bg-surface text-primary shadow-xs"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  Single
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* STATE 2: TESTING (Active Download / Upload with Notion Dial)             */}
        {/* ----------------------------------------------------------------------- */}
        {isTesting && (
          <div className="flex flex-col items-center select-none ps-fade-in">
            {/* Top Bar: 4 Notion Metric Cards (Download, Upload, Ping, Quality) */}
            <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 pb-6 border-b border-hairline">
              {/* PING & LATENCY Card */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  progress.stage === "ping"
                    ? "bg-[#FEF0E6] border-[#FCD1B0] ring-2 ring-sticker-orange/20 shadow-xs"
                    : "bg-canvas-soft border-hairline"
                } flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between text-xs font-semibold text-ink-muted">
                  <div className="flex items-center gap-1.5">
                    <Zap
                      className={`w-3.5 h-3.5 ${
                        progress.stage === "ping"
                          ? "text-sticker-orange animate-bounce"
                          : "text-sticker-orange"
                      }`}
                    />
                    <span
                      className={
                        progress.stage === "ping"
                          ? "text-sticker-orange font-bold"
                          : ""
                      }
                    >
                      LATENCY (ms)
                    </span>
                  </div>
                  {/* {progress.stage === "ping" ? (
                    <span className="text-[10px] text-sticker-orange font-semibold animate-pulse">
                      {t.speedtestMeasuring}
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#0E5C1E] font-semibold">
                      {t.speedtestCompleted}
                    </span>
                  )} */}
                </div>
                <div className="flex items-center justify-between text-xs font-mono mt-2">
                  <div>
                    <span className="text-ink-faint block text-[10px]">
                      Idle
                    </span>
                    <strong className="text-ink font-bold text-sm">
                      {progress.ping !== undefined && progress.ping > 0 ? (
                        Math.round(progress.ping)
                      ) : progress.stage === "ping" ? (
                        <span className="inline-flex items-center gap-1 text-sticker-orange animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-sticker-orange animate-ping" />
                          --
                        </span>
                      ) : (
                        "—"
                      )}
                    </strong>
                  </div>
                  <div>
                    <span className="text-primary block text-[10px]">
                      DownLoad
                    </span>
                    <strong className="text-ink font-bold text-sm">
                      {progress.download_latency !== undefined &&
                      progress.download_latency > 0
                        ? Math.round(progress.download_latency)
                        : "—"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#6b21a8] block text-[10px]">
                      UpLoad
                    </span>
                    <strong className="text-ink font-bold text-sm">
                      {progress.upload_latency !== undefined &&
                      progress.upload_latency > 0
                        ? Math.round(progress.upload_latency)
                        : "—"}
                    </strong>
                  </div>
                </div>
              </div>
              {/* DOWNLOAD Card */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  progress.stage === "download"
                    ? "bg-[#EBF5FD] border-[#B8DCFA] ring-2 ring-primary/20 shadow-xs"
                    : "bg-canvas-soft border-hairline"
                } flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between text-xs font-semibold text-ink-muted mb-1">
                  <div className="flex items-center gap-1.5">
                    <ArrowDownCircle
                      className={`w-4 h-4 ${
                        progress.stage === "download"
                          ? "text-primary animate-pulse"
                          : "text-ink-faint"
                      }`}
                    />
                    <span
                      className={
                        progress.stage === "download"
                          ? "text-primary font-bold"
                          : ""
                      }
                    >
                      DOWNLOAD
                    </span>
                    <span className="text-[10px] text-ink-faint">Mbps</span>
                  </div>
                  {/* {progress.stage === "download" ? (
                    <span className="text-[10px] text-primary font-semibold animate-pulse">
                      {t.speedtestMeasuring}
                    </span>
                  ) : progress.stage === "upload" ||
                    progress.stage === "complete" ? (
                    <span className="text-[10px] text-[#0E5C1E] font-semibold">
                      {t.speedtestCompleted}
                    </span>
                  ) : (
                    <span className="text-[10px] text-ink-faint font-normal">
                      {t.speedtestPending}
                    </span>
                  )} */}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-ink tracking-tight">
                  {progress.stage === "download"
                    ? (progress.mbps || 0).toFixed(2)
                    : measuredDl > 0
                      ? measuredDl.toFixed(2)
                      : progress.download_mbps !== undefined &&
                          progress.download_mbps > 0
                        ? progress.download_mbps.toFixed(2)
                        : progress.stage === "upload" ||
                            progress.stage === "complete"
                          ? (latest?.download_mbps || 0).toFixed(2)
                          : "—"}
                </div>
              </div>

              {/* UPLOAD Card */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  progress.stage === "upload"
                    ? "bg-[#F6EEFE] border-[#E7D1FB] ring-2 ring-[#7e22ce]/20 shadow-xs"
                    : "bg-canvas-soft border-hairline"
                } flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between text-xs font-semibold text-ink-muted mb-1">
                  <div className="flex items-center gap-1.5">
                    <ArrowUpCircle
                      className={`w-4 h-4 ${
                        progress.stage === "upload"
                          ? "text-[#6b21a8] animate-pulse"
                          : "text-ink-faint"
                      }`}
                    />
                    <span
                      className={
                        progress.stage === "upload"
                          ? "text-[#6b21a8] font-bold"
                          : ""
                      }
                    >
                      UPLOAD
                    </span>
                    <span className="text-[10px] text-ink-faint">Mbps</span>
                  </div>
                  {/* {progress.stage === "upload" ? (
                    <span className="text-[10px] text-[#6b21a8] font-semibold animate-pulse">
                      {t.speedtestMeasuring}
                    </span>
                  ) : progress.stage === "complete" ? (
                    <span className="text-[10px] text-[#0E5C1E] font-semibold">
                      {t.speedtestCompleted}
                    </span>
                  ) : (
                    <span className="text-[10px] text-ink-faint font-normal">
                      {t.speedtestPending}
                    </span>
                  )} */}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-ink tracking-tight">
                  {progress.stage === "upload"
                    ? (progress.mbps || 0).toFixed(2)
                    : "—"}
                </div>
              </div>

              {/* QUALITY QoE Card (Clean Monochromatic Grey Running Wave) */}
              <div className="p-4 rounded-xl border border-hairline bg-canvas-soft flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-semibold text-ink-muted">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-ink-faint" />
                    <span>QUALITY (QoE)</span>
                  </div>
                  {/* <span className="text-[10px] text-ink-faint font-normal">
                    {isTesting
                      ? t.speedtestMeasuring
                      : latest
                        ? t.speedtestCompleted
                        : t.speedtestPending}
                  </span> */}
                </div>
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {/* Web */}
                  <div
                    className="flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-surface/80 transition-colors cursor-help group"
                    title={qoe.webDesc}
                  >
                    <Monitor className="w-3.5 h-3.5 text-ink-muted group-hover:text-ink transition-colors" />
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          style={
                            isTesting
                              ? { animationDelay: `${i * 150}ms` }
                              : undefined
                          }
                          className={`w-1 h-1 rounded-full transition-all duration-200 ${
                            isTesting
                              ? "bg-[#71717a] animate-pulse"
                              : latest && i < qoe.web
                                ? "bg-ink"
                                : "bg-[#d4d4d8]"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Game */}
                  <div
                    className="flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-surface/80 transition-colors cursor-help group"
                    title={qoe.gameDesc}
                  >
                    <Gamepad2 className="w-3.5 h-3.5 text-ink-muted group-hover:text-ink transition-colors" />
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          style={
                            isTesting
                              ? { animationDelay: `${i * 150}ms` }
                              : undefined
                          }
                          className={`w-1 h-1 rounded-full transition-all duration-200 ${
                            isTesting
                              ? "bg-[#71717a] animate-pulse"
                              : latest && i < qoe.game
                                ? "bg-ink"
                                : "bg-[#d4d4d8]"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Video */}
                  <div
                    className="flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-surface/80 transition-colors cursor-help group"
                    title={qoe.videoDesc}
                  >
                    <PlaySquare className="w-3.5 h-3.5 text-ink-muted group-hover:text-ink transition-colors" />
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          style={
                            isTesting
                              ? { animationDelay: `${i * 150}ms` }
                              : undefined
                          }
                          className={`w-1 h-1 rounded-full transition-all duration-200 ${
                            isTesting
                              ? "bg-[#71717a] animate-pulse"
                              : latest && i < qoe.video
                                ? "bg-ink"
                                : "bg-[#d4d4d8]"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Call */}
                  <div
                    className="flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-surface/80 transition-colors cursor-help group"
                    title={qoe.callDesc}
                  >
                    <User className="w-3.5 h-3.5 text-ink-muted group-hover:text-ink transition-colors" />
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          style={
                            isTesting
                              ? { animationDelay: `${i * 150}ms` }
                              : undefined
                          }
                          className={`w-1 h-1 rounded-full transition-all duration-200 ${
                            isTesting
                              ? "bg-[#71717a] animate-pulse"
                              : latest && i < qoe.call
                                ? "bg-ink"
                                : "bg-[#d4d4d8]"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Clean Speedometer Dial */}
            <div className="relative w-full max-w-[360px] aspect-[1/0.88] flex flex-col items-center justify-center my-6">
              <svg
                viewBox="0 0 240 190"
                className="w-full h-full overflow-visible"
              >
                {/* Background Track Arc (Radius 82, Center 120, 112) */}
                <path
                  d="M 48.99 153 A 82 82 0 1 1 191.01 153"
                  fill="none"
                  stroke="#f0efed"
                  strokeWidth="10"
                  strokeLinecap="round"
                />

                {/* Progress Arc */}
                <path
                  d="M 48.99 153 A 82 82 0 1 1 191.01 153"
                  fill="none"
                  stroke={progress.stage === "upload" ? "#7e22ce" : "#0075de"}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray="343.5"
                  strokeDashoffset={343.5 - 343.5 * gaugePercent}
                  style={{
                    transition: "stroke-dashoffset 120ms ease-out",
                  }}
                />

                {/* Dial Tick Notches (Exact 8-Segment 30-deg Spacing) */}
                {/* 0 (-120°) */}
                <line
                  x1="55.0"
                  y1="149.5"
                  x2="46.4"
                  y2="154.5"
                  stroke="#d4d4d8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                {/* 5 (-90°) */}
                <line
                  x1="45.0"
                  y1="112.0"
                  x2="35.0"
                  y2="112.0"
                  stroke="#d4d4d8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                {/* 10 (-60°) */}
                <line
                  x1="55.0"
                  y1="74.5"
                  x2="46.4"
                  y2="69.5"
                  stroke="#d4d4d8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                {/* 50 (-30°) */}
                <line
                  x1="82.5"
                  y1="47.1"
                  x2="77.5"
                  y2="38.4"
                  stroke="#d4d4d8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                {/* 100 (0°) Top Center */}
                <line
                  x1="120.0"
                  y1="37.0"
                  x2="120.0"
                  y2="27.0"
                  stroke="#a1a1aa"
                  strokeWidth="2.0"
                  strokeLinecap="round"
                />
                {/* 250 (+30°) */}
                <line
                  x1="157.5"
                  y1="47.1"
                  x2="162.5"
                  y2="38.4"
                  stroke="#d4d4d8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                {/* 500 (+60°) */}
                <line
                  x1="185.0"
                  y1="74.5"
                  x2="193.6"
                  y2="69.5"
                  stroke="#d4d4d8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                {/* 750 (+90°) */}
                <line
                  x1="195.0"
                  y1="112.0"
                  x2="205.0"
                  y2="112.0"
                  stroke="#d4d4d8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                {/* 1000 (+120°) */}
                <line
                  x1="185.0"
                  y1="149.5"
                  x2="193.6"
                  y2="154.5"
                  stroke="#d4d4d8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* Radar Ripple Animation during Ping Stage */}
                {progress.stage === "ping" && (
                  <g>
                    <circle
                      cx="120"
                      cy="112"
                      r="18"
                      fill="none"
                      stroke="#dd5b00"
                      strokeWidth="2"
                      className="animate-ping opacity-60 origin-[120px_112px]"
                    />
                    <circle
                      cx="120"
                      cy="112"
                      r="36"
                      fill="none"
                      stroke="#dd5b00"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      className="animate-spin opacity-40 origin-[120px_112px]"
                    />
                  </g>
                )}

                {/* Sweeping Needle */}
                <g
                  transform={`translate(120, 112) rotate(${needleAngle})`}
                  style={{
                    transition: "transform 120ms ease-out",
                  }}
                >
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="-72"
                    stroke="#18181b"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="0"
                    cy="0"
                    r="6"
                    fill={
                      progress.stage === "ping"
                        ? "#dd5b00"
                        : progress.stage === "upload"
                          ? "#7e22ce"
                          : "#0075de"
                    }
                  />
                  <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
                </g>

                {/* Scale Numbers Placed Accurately on Radial Axes (r=58, Center 120, 112) */}
                <text
                  x="70"
                  y="141"
                  fontSize="7.5"
                  fontWeight="700"
                  fill="#52525b"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  0
                </text>
                <text
                  x="62"
                  y="115"
                  fontSize="7.5"
                  fontWeight="700"
                  fill="#52525b"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  5
                </text>
                <text
                  x="70"
                  y="85"
                  fontSize="7.5"
                  fontWeight="700"
                  fill="#52525b"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  10
                </text>
                <text
                  x="91"
                  y="63"
                  fontSize="7.5"
                  fontWeight="700"
                  fill="#52525b"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  50
                </text>
                <text
                  x="120"
                  y="55"
                  fontSize="8.5"
                  fontWeight="800"
                  fill="#18181b"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  100
                </text>
                <text
                  x="149"
                  y="63"
                  fontSize="7.5"
                  fontWeight="700"
                  fill="#52525b"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  250
                </text>
                <text
                  x="170"
                  y="85"
                  fontSize="7.5"
                  fontWeight="700"
                  fill="#52525b"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  500
                </text>
                <text
                  x="178"
                  y="115"
                  fontSize="7.5"
                  fontWeight="700"
                  fill="#52525b"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  750
                </text>
                <text
                  x="170"
                  y="141"
                  fontSize="7.5"
                  fontWeight="700"
                  fill="#52525b"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  1000
                </text>
              </svg>

              {/* Instant Speed Digital Readout / Ping Indicator */}
              <div className="absolute bottom-1 flex flex-col items-center">
                {progress.stage === "ping" ? (
                  <div className="flex flex-col items-center">
                    <div className="text-2xl sm:text-3xl font-extrabold text-sticker-orange font-sans tracking-tight flex items-center gap-2.5 animate-pulse">
                      <span className="w-2.5 h-2.5 rounded-full bg-sticker-orange animate-ping" />
                      <span>{t.speedtestConnecting}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="text-4xl lg:text-5xl font-black text-ink font-mono tracking-tight leading-none">
                      {currentMbps.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-bold mt-1.5">
                      {progress.stage === "upload" ? (
                        <span className="text-[#7e22ce] flex items-center gap-1 bg-[#F6EEFE] px-2 py-0.5 rounded-full border border-[#E7D1FB]">
                          <ArrowUp className="w-3 h-3" /> UPLOAD Mbps
                        </span>
                      ) : (
                        <span className="text-primary flex items-center gap-1 bg-[#EBF5FD] px-2 py-0.5 rounded-full border border-[#B8DCFA]">
                          <ArrowDown className="w-3 h-3" /> DOWNLOAD Mbps
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Full-Width Progress Stage Line (Download & Upload Only, 100% Width) */}
            {(progress.stage === "download" || progress.stage === "upload") && (
              <div className="w-full mt-2 mb-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5 px-0.5">
                  <div className="flex items-center gap-2">
                    {/* <span
                      className={`w-2 h-2 rounded-full animate-ping ${
                        progress.stage === "download"
                          ? "bg-primary"
                          : "bg-[#7e22ce]"
                      }`}
                    /> */}
                    {/* <span className="text-ink font-bold">
                      {progress.stage === "download"
                        ? t.speedtestStageDl
                        : t.speedtestStageUl}
                    </span> */}
                  </div>
                  {/* <span
                    className={`font-mono font-bold text-xs ${
                      progress.stage === "download"
                        ? "text-primary"
                        : "text-[#7e22ce]"
                    }`}
                  >
                    {progress.percent || 0}%
                  </span> */}
                </div>

                {/* Full-Width Progress Bar */}
                <div className="w-full h-2.5 bg-canvas-soft border border-hairline rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${
                      progress.stage === "download"
                        ? "bg-primary shadow-[0_0_12px_rgba(0,117,222,0.4)]"
                        : "bg-[#7e22ce] shadow-[0_0_12px_rgba(126,34,206,0.4)]"
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(2, progress.percent || 0))}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Bottom Status Bar + Cancel Button */}
            <div className="w-full flex justify-between items-center pt-3 border-t border-hairline text-xs">
              <div className="flex items-center gap-2 text-ink-muted">
                <Server className="w-4 h-4 text-primary" />
                <span>
                  {selectedServer.name} ({selectedServer.location})
                </span>
              </div>
              <button
                onClick={onCancelTest}
                className="px-4 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 font-semibold transition-colors cursor-pointer"
              >
                {t.speedtestCancel}
              </button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* STATE 3: SUMMARY (Clean Notion Result Scorecard)                        */}
        {/* ----------------------------------------------------------------------- */}
        {isSummary && (
          <div
            className={`flex flex-col gap-6 ${
              isFading ? "ps-fade-out" : "ps-fade-in"
            }`}
          >
            {/* Top Bar: Title & Re-test Button */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-hairline">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
                    {t.speedtestTitle}
                  </h3>
                </div>
              </div>

              {/* Start Again Pill CTA */}
              <button
                onClick={() =>
                  handleStartWithFade(
                    selectedServer.id === "auto"
                      ? "Speedtest.net"
                      : selectedServer.name,
                    connectionMode,
                  )
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary hover:bg-primary-pressed active:scale-95 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.speedtestStart}</span>
              </button>
            </div>

            {/* 2 Primary KPI Tiles: Download & Upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* DOWNLOAD Card */}
              <div className="p-6 rounded-2xl bg-[#F8FAFC] border-2 border-[#B8DCFA] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#EBF5FD] border border-[#B8DCFA] flex items-center justify-center text-primary">
                      <ArrowDown className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                      {t.speedtestDownload}
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EBF5FD] text-primary border border-[#B8DCFA]">
                    DOWNLOAD
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl sm:text-6xl font-black font-mono text-ink tracking-tight">
                    {latest?.download_mbps.toFixed(2)}
                  </span>
                  <span className="text-lg font-bold text-primary font-mono">
                    Mbps
                  </span>
                </div>
                <div className="text-xs text-ink-faint mt-3 pt-3 border-t border-[#B8DCFA]/50 flex justify-between">
                  <span>
                    Down Latency:{" "}
                    <strong className="text-ink font-mono">
                      {Math.round(
                        latest?.download_latency || latest?.ping || 0,
                      )}{" "}
                      ms
                    </strong>
                  </span>
                  <span>
                    Bandwidth:{" "}
                    <strong className="text-ink font-mono">
                      {((latest?.download_mbps || 0) / 8).toFixed(2)} MB/s
                    </strong>
                  </span>
                </div>
              </div>

              {/* UPLOAD Card */}
              <div className="p-6 rounded-2xl bg-[#FAF5FE] border-2 border-[#E7D1FB] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#F6EEFE] border border-[#E7D1FB] flex items-center justify-center text-[#6b21a8]">
                      <ArrowUp className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                      {t.speedtestUpload}
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F6EEFE] text-[#6b21a8] border border-[#E7D1FB]">
                    UPLOAD
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl sm:text-6xl font-black font-mono text-ink tracking-tight">
                    {latest?.upload_mbps.toFixed(2)}
                  </span>
                  <span className="text-lg font-bold text-[#7e22ce] font-mono">
                    Mbps
                  </span>
                </div>
                <div className="text-xs text-ink-faint mt-3 pt-3 border-t border-[#E7D1FB]/50 flex justify-between">
                  <span>
                    Up Latency:{" "}
                    <strong className="text-ink font-mono">
                      {Math.round(latest?.upload_latency || latest?.ping || 0)}{" "}
                      ms
                    </strong>
                  </span>
                  <span>
                    Bandwidth:{" "}
                    <strong className="text-ink font-mono">
                      {((latest?.upload_mbps || 0) / 8).toFixed(2)} MB/s
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Latency Trio & Jitter Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-hairline bg-canvas-soft">
                <span className="text-[11px] text-ink-faint font-semibold block">
                  IDLE PING
                </span>
                <span className="text-xl font-bold font-mono text-ink">
                  {Math.round(latest?.ping || 0)}{" "}
                  <span className="text-xs font-normal text-ink-muted">ms</span>
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-hairline bg-canvas-soft">
                <span className="text-[11px] text-primary font-semibold block">
                  DOWNLOAD LATENCY
                </span>
                <span className="text-xl font-bold font-mono text-ink">
                  {Math.round(latest?.download_latency || latest?.ping || 0)}{" "}
                  <span className="text-xs font-normal text-ink-muted">ms</span>
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-hairline bg-canvas-soft">
                <span className="text-[11px] text-[#6b21a8] font-semibold block">
                  UPLOAD LATENCY
                </span>
                <span className="text-xl font-bold font-mono text-ink">
                  {Math.round(latest?.upload_latency || latest?.ping || 0)}{" "}
                  <span className="text-xs font-normal text-ink-muted">ms</span>
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-hairline bg-canvas-soft">
                <span className="text-[11px] text-sticker-orange font-semibold block">
                  JITTER
                </span>
                <span className="text-xl font-bold font-mono text-ink">
                  {(latest?.jitter || 0).toFixed(1)}{" "}
                  <span className="text-xs font-normal text-ink-muted">ms</span>
                </span>
              </div>
            </div>

            {/* 4 Quality Ratings (QoE) Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Web */}
              <div className="p-4 rounded-xl border border-hairline bg-surface shadow-xs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#EBF5FD] border border-[#B8DCFA] flex items-center justify-center text-primary shrink-0">
                  <Monitor className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-ink">
                    {t.speedtestWeb}
                  </div>
                  <div className="flex gap-1 my-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${i < qoe.web ? "bg-primary" : "bg-hairline"}`}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] text-ink-faint font-medium">
                    {qoe.web >= 4
                      ? t.speedtestWebQualityHigh
                      : t.speedtestWebQualityNormal}
                  </div>
                </div>
              </div>

              {/* Game */}
              <div className="p-4 rounded-xl border border-hairline bg-surface shadow-xs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#E6F6F5] border border-[#B5E4E2] flex items-center justify-center text-[#155755] shrink-0">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-ink">
                    {t.speedtestGame}
                  </div>
                  <div className="flex gap-1 my-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${i < qoe.game ? "bg-sticker-teal" : "bg-hairline"}`}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] text-ink-faint font-medium">
                    {qoe.game >= 4
                      ? t.speedtestGameQualityHigh
                      : t.speedtestGameQualityNormal}
                  </div>
                </div>
              </div>

              {/* Stream */}
              <div className="p-4 rounded-xl border border-hairline bg-surface shadow-xs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#FFEBF7] border border-[#FFC7EC] flex items-center justify-center text-[#9E006A] shrink-0">
                  <PlaySquare className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-ink">
                    {t.speedtestStream}
                  </div>
                  <div className="flex gap-1 my-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${i < qoe.video ? "bg-sticker-pink" : "bg-hairline"}`}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] text-ink-faint font-medium">
                    {qoe.video >= 4
                      ? t.speedtestStreamQualityHigh
                      : t.speedtestStreamQualityNormal}
                  </div>
                </div>
              </div>

              {/* Call */}
              <div className="p-4 rounded-xl border border-hairline bg-surface shadow-xs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#F6EEFE] border border-[#E7D1FB] flex items-center justify-center text-[#6b21a8] shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-ink">
                    {t.speedtestCall}
                  </div>
                  <div className="flex gap-1 my-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${i < qoe.call ? "bg-sticker-purple" : "bg-hairline"}`}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] text-ink-faint font-medium">
                    {qoe.call >= 4
                      ? t.speedtestCallQualityHigh
                      : t.speedtestCallQualityNormal}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Metadata & Verified Result Link */}
            <div className="pt-4 border-t border-hairline flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-4 text-ink-muted">
                <span>
                  ISP: <strong className="text-ink">{ispName}</strong> (
                  {cleanIp})
                </span>
                <span>•</span>
                <span>
                  Server:{" "}
                  <strong className="text-ink">
                    {latest?.provider || selectedServer.name}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Mode:{" "}
                  <strong className="text-ink uppercase">
                    {connectionMode}
                  </strong>
                </span>
              </div>

              <a
                href={latest?.result_url || "https://www.speedtest.net"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold"
              >
                <span>{t.speedtestOfficialResult}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. HISTORICAL LOGS CARD (Notion Data Table Specification)                  */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* 3. SERVER SELECTION MODAL (Notion Modal Card Specification)               */}
      {/* ========================================================================= */}
      {isServerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface rounded-2xl border border-hairline shadow-lg max-w-md w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-hairline flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-ink">
                  {t.speedtestSelectServer}
                </h3>
              </div>
              <button
                onClick={() => setIsServerModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-canvas-soft flex items-center justify-center text-ink-muted cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-hairline bg-canvas-soft">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  type="text"
                  placeholder={t.speedtestSearchServer}
                  value={serverSearch}
                  onChange={(e) => setServerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface border border-hairline text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="divide-y divide-hairline overflow-y-auto flex-1">
              {filteredServers.map((srv) => (
                <button
                  key={srv.id}
                  onClick={() => {
                    setSelectedServerId(srv.id);
                    setIsServerModalOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-canvas-soft transition-colors cursor-pointer ${
                    selectedServerId === srv.id ? "bg-[#EBF5FD]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        selectedServerId === srv.id
                          ? "bg-primary"
                          : "bg-hairline"
                      }`}
                    />
                    <div>
                      <span className="text-xs text-ink font-bold block">
                        {srv.name}
                      </span>
                      <span className="text-[11px] text-ink-muted">
                        {srv.location} • {srv.host}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-canvas-soft border border-hairline text-ink-muted">
                    {srv.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
