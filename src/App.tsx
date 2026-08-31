import { useState, useEffect, useMemo, useRef } from "react";
import {
  Radio,
  Shield,
  ShieldCheck,
  Cpu,
  Globe,
  LayoutDashboard,
  Play,
  Pause,
  DownloadCloud,
  UploadCloud,
  Wifi,
  MapPin,
  Languages,
  Zap,
} from "lucide-react";
import {
  AppTraffic,
  SocketConnection,
  ListeningPort,
  SpeedtestProgress,
  SpeedtestResult,
} from "./types";

import { MetricCard } from "./components/MetricCard";
import { OverviewTab } from "./components/OverviewTab";
import { AppsTab } from "./components/AppsTab";
import { SocketsTab } from "./components/SocketsTab";
import { PortsTab } from "./components/PortsTab";
import { GeoipTab } from "./components/GeoipTab";
import { SpeedtestTab } from "./components/SpeedtestTab";
import { translations, Language } from "./i18n/translations";
import {
  formatDataVolume,
  formatMbps,
  formatMbpsSplit,
} from "./utils/format";

export default function App() {
  const [lang, setLang] = useState<Language>("th");
  const [isLive, setIsLive] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "apps" | "sockets" | "geoip" | "ports" | "speedtest"
  >("overview");

  // Sync HTML lang attribute for dynamic CSS font switching (Kanit for TH, Outfit for EN)
  useEffect(() => {
    document.documentElement.lang = lang;
    document.body.setAttribute("data-lang", lang);
  }, [lang]);

  const t = translations[lang];

  // Core Telemetry State
  const [apps, setApps] = useState<AppTraffic[]>([]);
  const [sockets, setSockets] = useState<SocketConnection[]>([]);
  const [ports, setPorts] = useState<ListeningPort[]>([]);

  // Bandwidth & Traffic Metrics
  const [totalDlMB, setTotalDlMB] = useState(0);
  const [totalUlKB, setTotalUlKB] = useState(0);
  const [sessionDownloadedMB, setSessionDownloadedMB] = useState(0);
  const [sessionUploadedMB, setSessionUploadedMB] = useState(0);
  const [peakDlMB, setPeakDlMB] = useState(0);
  const [peakUlKB, setPeakUlKB] = useState(0);

  // Built-in Speedtest State (In-Memory Session)
  const [speedtestProgress, setSpeedtestProgress] = useState<SpeedtestProgress>(
    {
      stage: "idle",
      percent: 0,
    },
  );
  const [isSpeedtesting, setIsSpeedtesting] = useState(false);
  const [speedtestHistory, setSpeedtestHistory] = useState<SpeedtestResult[]>([]);

  // Live Pings
  const [pingRouter, setPingRouter] = useState(0);
  const [pingCloudflare, setPingCloudflare] = useState(0);
  const [pingGoogle, setPingGoogle] = useState(0);

  // Real Network Adapter & Local/Public IP
  const [activeAdapter, setActiveAdapter] = useState("ตรวจจับอัตโนมัติ");
  const [localIP, setLocalIP] = useState("127.0.0.1");
  const [publicIP, setPublicIP] = useState("กำลังตรวจสอบ...");

  // Chart History Buffer (Max 3600 points = 1 Hour)
  const [fullHistory, setFullHistory] = useState<{
    dl: number[];
    ul: number[];
    ts: number[];
  }>({
    dl: Array.from({ length: 30 }, () => 0),
    ul: Array.from({ length: 30 }, () => 0),
    ts: Array.from({ length: 30 }, (_, i) => Date.now() - (30 - i) * 1000),
  });

  // Connection state & references
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket Live OS Agent Connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket("ws://127.0.0.1:8765");
        wsRef.current = ws;

        ws.onopen = () => {
          setIsAgentConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "SPEEDTEST_PROGRESS") {
              setSpeedtestProgress({
                stage: data.stage,
                percent: data.percent,
                mbps: data.mbps,
                ping: data.ping,
                download_latency: data.download_latency,
                upload_latency: data.upload_latency,
              });
            } else if (data.type === "SPEEDTEST_COMPLETE") {
              setIsSpeedtesting(false);
              setSpeedtestProgress({ stage: "complete", percent: 100 });
              if (data.result) {
                setSpeedtestHistory((prev) => {
                  const newEntry = {
                    id: Date.now().toString(),
                    timestamp: new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    }),
                    download_mbps: Number(data.result.download_mbps || 0),
                    upload_mbps: Number(data.result.upload_mbps || 0),
                    ping: Number(data.result.ping || 0),
                    download_latency: Number(data.result.download_latency || 0),
                    upload_latency: Number(data.result.upload_latency || 0),
                    jitter: Number(data.result.jitter || 0),
                    provider: data.result.provider || "Auto Selected",
                    result_url: data.result.result_url,
                    status: "success",
                  };
                  return [newEntry, ...prev];
                });
              }
            } else if (
              data.type === "TELEMETRY_SNAPSHOT" ||
              data.type === "TELEMETRY" ||
              (typeof data.type === "string" && data.type.startsWith("TELEMETRY"))
            ) {
              if (data.rates) {
                if (data.rates.downloadMBs !== undefined)
                  setTotalDlMB(data.rates.downloadMBs);
                if (data.rates.uploadKBs !== undefined)
                  setTotalUlKB(data.rates.uploadKBs);
                if (data.rates.sessionDownloadedMB !== undefined)
                  setSessionDownloadedMB(data.rates.sessionDownloadedMB);
                else if (data.rates.sessionDownloadedGB !== undefined)
                  setSessionDownloadedMB(data.rates.sessionDownloadedGB * 1024);
                if (data.rates.sessionUploadedMB !== undefined)
                  setSessionUploadedMB(data.rates.sessionUploadedMB);
                if (data.rates.downloadMBs !== undefined)
                  setPeakDlMB((prev) => Math.max(prev, data.rates.downloadMBs));
                if (data.rates.uploadKBs !== undefined)
                  setPeakUlKB((prev) => Math.max(prev, data.rates.uploadKBs));

                setFullHistory((prev) => {
                  const now = Date.now();
                  const newDl = [...prev.dl, data.rates.downloadMBs];
                  const newUl = [...prev.ul, data.rates.uploadKBs / 1024];
                  const newTs = [...(prev.ts || []), now];
                  if (newDl.length > 3600) {
                    return {
                      dl: newDl.slice(-3600),
                      ul: newUl.slice(-3600),
                      ts: newTs.slice(-3600),
                    };
                  }
                  return { dl: newDl, ul: newUl, ts: newTs };
                });
              }
              if (data.pings) {
                if (data.pings.router) setPingRouter(data.pings.router);
                if (data.pings.cloudflare)
                  setPingCloudflare(data.pings.cloudflare);
                if (data.pings.google) setPingGoogle(data.pings.google);
              }
              if (data.network) {
                if (data.network.adapter)
                  setActiveAdapter(data.network.adapter);
                if (data.network.localIP) setLocalIP(data.network.localIP);
                if (data.network.publicIP) setPublicIP(data.network.publicIP);
              }
              if (data.apps && data.apps.length > 0) setApps(data.apps);
              if (data.sockets && data.sockets.length > 0)
                setSockets(data.sockets);
              if (data.ports && data.ports.length > 0) setPorts(data.ports);
            }
          } catch (err) {
            console.error("Error parsing telemetry payload", err);
          }
        };

        ws.onclose = () => {
          setIsAgentConnected(false);
          reconnectTimeout = setTimeout(connectWebSocket, 2000);
        };

        ws.onerror = () => {
          setIsAgentConnected(false);
          ws?.close();
        };
      } catch (err) {
        setIsAgentConnected(false);
        reconnectTimeout = setTimeout(connectWebSocket, 2000);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Aggregated GeoIP Regions
  const geoRegions = useMemo(() => {
    const counts: Record<string, { count: number; orgs: Set<string> }> = {};
    sockets.forEach((s) => {
      if (
        s.country &&
        s.country !== "Unknown" &&
        s.country !== "-" &&
        s.country !== "LOCAL"
      ) {
        if (!counts[s.country]) {
          counts[s.country] = { count: 0, orgs: new Set() };
        }
        counts[s.country].count += 1;
        if (s.org && s.org !== "Local / Unknown") {
          counts[s.country].orgs.add(s.org);
        }
      }
    });

    return Object.entries(counts)
      .map(([country, data]) => ({
        country,
        count: data.count,
        orgs:
          Array.from(data.orgs).slice(0, 3).join(", ") ||
          "Direct Connection",
        ping:
          country === "TH"
            ? "< 15ms"
            : country === "SG"
              ? "~35ms"
              : country === "US"
                ? "~180ms"
                : "~120ms",
        traffic: `${(data.count * 1.2).toFixed(1)} MB`,
      }))
      .sort((a, b) => b.count - a.count);
  }, [sockets]);

  // Speedtest Action Handlers
  const handleStartSpeedtest = (
    provider: string,
    mode: "multi" | "single" = "multi",
  ) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setIsSpeedtesting(true);
      setSpeedtestProgress({ stage: "ping", percent: 0 });
      wsRef.current.send(
        JSON.stringify({
          action: "START_SPEEDTEST",
          provider,
          mode,
        }),
      );
    }
  };

  const handleCancelSpeedtest = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: "CANCEL_SPEEDTEST",
        }),
      );
      setIsSpeedtesting(false);
      setSpeedtestProgress({ stage: "cancelled", percent: 0 });
    }
  };

  const handleClearSpeedtestHistory = () => {
    setSpeedtestHistory([]);
  };

  // Real live rates converted to Mbps (matching Speedtest units directly)
  const liveDlMbps =
    isSpeedtesting && speedtestProgress.stage === "download"
      ? speedtestProgress.mbps || 0
      : totalDlMB * 8;

  const liveUlMbps =
    isSpeedtesting && speedtestProgress.stage === "upload"
      ? speedtestProgress.mbps || 0
      : (totalUlKB * 8) / 1024;

  const dlSplit = formatMbpsSplit(liveDlMbps);
  const ulSplit = formatMbpsSplit(liveUlMbps);

  return (
    <div
      className={`min-h-screen flex flex-col bg-canvas-soft antialiased text-ink-charcoal ${
        lang === "th" ? "font-th" : "font-en"
      }`}
    >
      {/* 1. Sticky Navigation Header */}
      <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-md border-b border-hairline px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-nowrap">
          {/* Left: Logo & Status Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <img
              src="/logo.png"
              alt="PulseSentry Logo"
              className="w-8 h-8 object-contain drop-shadow-xs"
            />
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-ink">
                {t.appName}
              </span>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 transition-colors ${
                  isAgentConnected
                    ? "bg-[#EBF8EE] text-[#0E5C1E]"
                    : "bg-[#FEF0E6] text-[#793400]"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isAgentConnected
                      ? "bg-sticker-green animate-pulse"
                      : "bg-sticker-orange"
                  }`}
                />
                {isAgentConnected
                  ? lang === "th"
                    ? "ออนไลน์"
                    : "Online"
                  : lang === "th"
                    ? "ออฟไลน์"
                    : "Offline"}
              </span>
            </div>
          </div>

          {/* Center: Network Connection Indicators (Desktop) */}
          <div className="hidden lg:flex items-center gap-4 text-xs text-ink-muted shrink-0">
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-ink-faint" />
              <span>{activeAdapter}</span>
            </div>
            <div className="h-3 w-px bg-hairline" />
            <div className="flex items-center gap-1.5 font-mono text-ink">
              <MapPin className="w-3.5 h-3.5 text-ink-faint" />
              <span>{localIP}</span>
            </div>
            <div className="h-3 w-px bg-hairline" />
            <div className="flex items-center gap-1.5 font-mono text-ink">
              <Globe className="w-3.5 h-3.5 text-ink-faint" />
              <span>{publicIP}</span>
            </div>
          </div>

          {/* Right: Quick Pings, Language Toggle & Live CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-hairline bg-surface text-xs font-mono">
              <span className="text-ink-muted">Router:</span>
              <span className="text-sticker-green font-semibold">
                {pingRouter}ms
              </span>
            </div>
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-hairline bg-surface text-xs font-mono">
              <span className="text-ink-muted">1.1.1.1:</span>
              <span className="text-sticker-green font-semibold">
                {pingCloudflare}ms
              </span>
            </div>
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-hairline bg-surface text-xs font-mono">
              <span className="text-ink-muted">8.8.8.8:</span>
              <span className="text-sticker-green font-semibold">
                {pingGoogle}ms
              </span>
            </div>

            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === "th" ? "en" : "th")}
              className="flex items-center justify-center gap-1.5 w-16 py-1 rounded-md border border-hairline bg-surface text-xs font-medium text-ink hover:bg-canvas-soft transition-colors cursor-pointer shrink-0"
            >
              <Languages className="w-3.5 h-3.5 text-primary" />
              <span>{lang === "th" ? "ไทย" : "EN"}</span>
            </button>

            {/* Live Monitoring Button */}
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center justify-center gap-1.5 w-32 py-1.5 rounded-full text-white text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0 ${
                isLive
                  ? "bg-primary hover:bg-primary-pressed"
                  : "bg-ink-muted hover:bg-ink"
              }`}
            >
              {isLive ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>
                {isLive
                  ? lang === "th"
                    ? "มอนิเตอร์สด"
                    : "Live"
                  : lang === "th"
                    ? "หยุดชั่วคราว"
                    : "Paused"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Dashboard Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 flex flex-col gap-6">
        {/* 4 Feature Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Download Speed */}
          <MetricCard
            title={t.dlSpeed}
            dotColor="bg-primary"
            mainValue={dlSplit.val}
            mainUnit={dlSplit.unit}
            mainUnitColor="text-primary"
            icon={<DownloadCloud className="w-4 h-4" />}
            iconBg="bg-[#EBF5FD]"
            iconBorder="border-[#B8DCFA]"
            iconColor="text-primary"
            footerLeft={
              <span className="whitespace-nowrap">
                {t.sessionTotal}:{" "}
                <strong className="text-ink font-mono">
                  {formatDataVolume(sessionDownloadedMB)}
                </strong>
              </span>
            }
            footerRight={
              <span className="text-primary font-mono whitespace-nowrap">
                {t.peak}: {formatMbps(peakDlMB * 8)}
              </span>
            }
          />

          {/* Card 2: Upload Speed */}
          <MetricCard
            title={t.ulSpeed}
            dotColor="bg-sticker-purple"
            mainValue={ulSplit.val}
            mainUnit={ulSplit.unit}
            mainUnitColor="text-[#7e22ce]"
            icon={<UploadCloud className="w-4 h-4" />}
            iconBg="bg-[#F6EEFE]"
            iconBorder="border-[#E7D1FB]"
            iconColor="text-[#6b21a8]"
            footerLeft={
              <span className="whitespace-nowrap">
                {t.sessionTotal}:{" "}
                <strong className="text-ink font-mono">
                  {formatDataVolume(sessionUploadedMB)}
                </strong>
              </span>
            }
            footerRight={
              <span className="text-[#6b21a8] font-mono whitespace-nowrap">
                {t.peak}: {formatMbps((peakUlKB * 8) / 1024)}
              </span>
            }
          />

          {/* Card 3: Active Sockets */}
          <MetricCard
            title={t.activeSockets}
            dotColor="bg-sticker-green"
            mainValue={sockets.length}
            badge={{
              text: "ESTABLISHED",
              bg: "bg-[#EBF8EE]",
              textCol: "text-[#0E5C1E]",
            }}
            icon={<Radio className="w-4 h-4" />}
            iconBg="bg-[#EBF8EE]"
            iconBorder="border-[#C0ECC9]"
            iconColor="text-[#0E5C1E]"
            footerLeft={
              <span className="whitespace-nowrap">
                TCP: {sockets.filter((s) => s.proto === "TCP").length} | UDP:{" "}
                {sockets.filter((s) => s.proto === "UDP").length}
              </span>
            }
            footerRight={
              <span className="text-ink font-mono whitespace-nowrap">
                {sockets.length > 0
                  ? `${new Set(sockets.map((s) => s.remote.split(":")[0])).size} ${t.hosts}`
                  : "0 Hosts"}
              </span>
            }
          />

          {/* Card 4: Open Listening Ports */}
          <MetricCard
            title={t.openPorts}
            dotColor="bg-sticker-orange"
            mainValue={ports.length}
            badge={{
              text: "OPEN",
              bg: "bg-[#FEF0E6]",
              textCol: "text-[#793400]",
            }}
            icon={<ShieldCheck className="w-4 h-4" />}
            iconBg="bg-[#FEF0E6]"
            iconBorder="border-[#FCD1B0]"
            iconColor="text-[#793400]"
            footerLeft={
              <span className="text-amber-600 font-semibold whitespace-nowrap">
                {ports.filter((p) => p.exposed).length} {t.exposed}
              </span>
            }
            footerRight={
              <span className="whitespace-nowrap">
                {ports.filter((p) => !p.exposed).length} {t.localhost}
              </span>
            }
          />
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-1 bg-canvas-soft p-1 rounded-xl border border-hairline self-start">
          {[
            { id: "overview", label: t.tabOverview, icon: LayoutDashboard },
            { id: "apps", label: t.tabApps, icon: Cpu },
            { id: "sockets", label: t.tabSockets, icon: Radio },
            { id: "ports", label: t.tabPorts, icon: Shield },
            { id: "geoip", label: t.tabGeoip, icon: Globe },
            { id: "speedtest", label: t.tabSpeedtest, icon: Zap },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-surface text-primary font-semibold shadow-xs"
                    : "text-ink-muted hover:text-ink hover:bg-surface/50"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? "text-primary" : "text-ink-faint"}`}
                />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <OverviewTab
            lang={lang}
            t={t}
            fullHistory={fullHistory}
            sessionDownloadedMB={sessionDownloadedMB}
            sessionUploadedMB={sessionUploadedMB}
            peakDlMB={peakDlMB}
            peakUlKB={peakUlKB}
            liveDlMbps={liveDlMbps}
            liveUlMbps={liveUlMbps}
            apps={apps}
            sockets={sockets}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* TAB 2: APPS */}
        {activeTab === "apps" && (
          <AppsTab apps={apps} t={t} lang={lang} />
        )}

        {/* TAB 3: SOCKETS */}
        {activeTab === "sockets" && (
          <SocketsTab sockets={sockets} t={t} lang={lang} />
        )}

        {/* TAB 4: GEOIP MAP */}
        {activeTab === "geoip" && (
          <GeoipTab geoRegions={geoRegions} t={t} lang={lang} />
        )}

        {/* TAB 5: PORT SCANNER */}
        {activeTab === "ports" && (
          <PortsTab ports={ports} t={t} lang={lang} />
        )}

        {/* TAB 6: SPEEDTEST */}
        {activeTab === "speedtest" && (
          <div className="ps-fade-in">
            <SpeedtestTab
              t={t}
              progress={speedtestProgress}
              isRunning={isSpeedtesting}
              history={speedtestHistory}
              publicIP={publicIP}
              onStartTest={handleStartSpeedtest}
              onCancelTest={handleCancelSpeedtest}
              onClearHistory={handleClearSpeedtestHistory}
            />
          </div>
        )}
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-hairline bg-surface py-4 px-6 text-center text-xs text-ink-faint">
        <p className="m-0">{t.footerDoc}</p>
      </footer>
    </div>
  );
}
