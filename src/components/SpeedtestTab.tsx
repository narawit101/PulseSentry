import React, { useState, useMemo, useEffect } from "react";
import { Server, User, Zap } from "lucide-react";
import { SpeedtestProgress, SpeedtestResult } from "../types";
import { TranslationDict } from "../i18n/translations";
import { THAI_SERVERS, TestServer } from "../constants/speedtestServers";
import { ServerSelectModal } from "./speedtest/ServerSelectModal";
import { SpeedGauge } from "./speedtest/SpeedGauge";
import { SpeedtestScorecard } from "./speedtest/SpeedtestScorecard";
import { SpeedtestHistoryTable } from "./speedtest/SpeedtestHistoryTable";

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
  const [connectionMode, setConnectionMode] = useState<"multi" | "single">("multi");
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

  const selectedServer: TestServer = useMemo(
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

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* 1. SPEEDTEST BENCHMARK CARD */}
      <div className="bg-surface rounded-2xl border border-hairline p-6 shadow-notion-card transition-all duration-300">
        {/* STATE 1: IDLE (Large Modern Minimalist GO Dial) */}
        {isIdle && (
          <div
            className={`flex flex-col items-center justify-center py-12 select-none ${
              isFading ? "ps-fade-out" : "ps-fade-in"
            }`}
          >
            <div className="text-center mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-ink tracking-tight flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <span>{t.speedtestTitle}</span>
              </h3>
              <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
                {t.speedtestDesc || "ทดสอบความเร็วและการเชื่อมต่ออินเทอร์เน็ตแบบเรียลไทม์"}
              </p>
            </div>

            {/* Circular GO Action Button */}
            <div className="relative group my-4">
              <div className="absolute -inset-2 bg-gradient-to-r from-primary/30 to-[#7e22ce]/30 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300 opacity-60 group-hover:opacity-100" />
              <button
                onClick={() =>
                  handleStartWithFade(
                    selectedServer.id === "auto"
                      ? "Speedtest.net"
                      : selectedServer.name,
                    connectionMode,
                  )
                }
                className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-surface border-4 border-hairline hover:border-primary flex flex-col items-center justify-center text-ink hover:text-primary font-black text-3xl sm:text-4xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <span>GO</span>
                <span className="text-[11px] font-normal tracking-normal text-ink-muted mt-1 font-mono">
                  START BENCHMARK
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

        {/* STATE 2: TESTING (Active Live Dial & Telemetry Needle) */}
        {isTesting && (
          <SpeedGauge
            t={t}
            progress={progress}
            latest={latest}
            measuredDl={measuredDl}
            onCancel={onCancelTest}
          />
        )}

        {/* STATE 3: SUMMARY (Notion Result Scorecard) */}
        {isSummary && (
          <SpeedtestScorecard
            t={t}
            latest={latest}
            selectedServer={selectedServer}
            connectionMode={connectionMode}
            ispName={ispName}
            cleanIp={cleanIp}
            isFading={isFading}
            onRetest={() =>
              handleStartWithFade(
                selectedServer.id === "auto"
                  ? "Speedtest.net"
                  : selectedServer.name,
                connectionMode,
              )
            }
          />
        )}
      </div>

      {/* 2. HISTORICAL LOGS CARD */}
      <SpeedtestHistoryTable
        t={t}
        history={history}
        onClearHistory={onClearHistory}
      />

      {/* 3. SERVER SELECTION MODAL */}
      <ServerSelectModal
        t={t}
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        servers={filteredServers}
        selectedServerId={selectedServerId}
        onSelectServer={setSelectedServerId}
        serverSearch={serverSearch}
        onSearchChange={setServerSearch}
      />
    </div>
  );
};
