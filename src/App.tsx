import { useState, useEffect } from "react";
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

import { useTelemetry } from "./hooks/useTelemetry";
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
  formatDisplayPublicIP,
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

  // Consume Deep Telemetry Hook
  const {
    isAgentConnected,
    apps,
    sockets,
    ports,
    rates,
    pings,
    network,
    fullHistory,
    speedtest,
  } = useTelemetry(isLive);

  const {
    sessionDownloadedMB,
    sessionUploadedMB,
    peakDlMB,
    peakUlKB,
    liveDlMbps,
    liveUlMbps,
  } = rates;

  const { router: pingRouter, cloudflare: pingCloudflare, google: pingGoogle } = pings;
  const { activeAdapter, localIP, publicIP } = network;
  const {
    progress: speedtestProgress,
    isRunning: isSpeedtesting,
    history: speedtestHistory,
    start: handleStartSpeedtest,
    cancel: handleCancelSpeedtest,
    clearHistory: handleClearSpeedtestHistory,
  } = speedtest;

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
            <div
              className="flex items-center gap-1.5 font-mono text-ink cursor-help"
              title={`Full IP: ${publicIP}`}
            >
              <Globe className="w-3.5 h-3.5 text-ink-faint shrink-0" />
              <span className="truncate max-w-[220px]">
                {formatDisplayPublicIP(publicIP)}
              </span>
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
            footerLeft={
              <span>
                {t.sessionTotal}:{" "}
                <strong className="text-ink font-mono font-semibold">
                  {formatDataVolume(sessionDownloadedMB)}
                </strong>
              </span>
            }
            footerRight={
              <span>
                {t.peak}:{" "}
                <strong className="text-ink font-mono font-semibold">
                  {formatMbps(peakDlMB * 8)}
                </strong>
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
            footerLeft={
              <span>
                {t.sessionTotal}:{" "}
                <strong className="text-ink font-mono font-semibold">
                  {formatDataVolume(sessionUploadedMB)}
                </strong>
              </span>
            }
            footerRight={
              <span>
                {t.peak}:{" "}
                <strong className="text-ink font-mono font-semibold">
                  {formatMbps((peakUlKB * 8) / 1024)}
                </strong>
              </span>
            }
          />

          {/* Card 3: Active Sockets */}
          <MetricCard
            title={t.activeSockets}
            dotColor="bg-sticker-green"
            mainValue={sockets.length}
            mainUnit="ESTABLISHED"
            mainUnitColor="text-[#0E5C1E]"
            icon={<Radio className="w-4 h-4" />}
            footerLeft={
              <span>
                TCP: <strong className="text-ink font-mono font-semibold">{sockets.filter((s) => s.proto === "TCP").length}</strong> • UDP: <strong className="text-ink font-mono font-semibold">{sockets.filter((s) => s.proto === "UDP").length}</strong>
              </span>
            }
            footerRight={
              <span>
                {sockets.length > 0
                  ? `${new Set(sockets.map((s) => s.remote.split(":")[0])).size} ${t.hosts}`
                  : `0 ${t.hosts}`}
              </span>
            }
          />

          {/* Card 4: Open Listening Ports */}
          <MetricCard
            title={t.openPorts}
            dotColor="bg-sticker-orange"
            mainValue={ports.length}
            mainUnit="LISTENING"
            mainUnitColor="text-[#793400]"
            icon={<ShieldCheck className="w-4 h-4" />}
            footerLeft={
              <span>
                <strong className="text-ink font-mono font-semibold">{ports.filter((p) => p.exposed).length}</strong> {t.exposed}
              </span>
            }
            footerRight={
              <span>
                <strong className="text-ink font-mono font-semibold">{ports.filter((p) => !p.exposed).length}</strong> {t.localhost}
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
          <GeoipTab sockets={sockets} t={t} lang={lang} />
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
