import React from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ExternalLink,
  Gamepad2,
  Monitor,
  PlaySquare,
  RotateCcw,
  User,
} from "lucide-react";
import { SpeedtestResult } from "../../types";
import { TranslationDict } from "../../i18n/translations";
import { TestServer } from "../../constants/speedtestServers";

interface SpeedtestScorecardProps {
  t: TranslationDict;
  latest: SpeedtestResult;
  selectedServer: TestServer;
  connectionMode: "multi" | "single";
  ispName: string;
  cleanIp: string;
  isFading: boolean;
  onRetest: () => void;
}

export const SpeedtestScorecard: React.FC<SpeedtestScorecardProps> = ({
  t,
  latest,
  selectedServer,
  connectionMode,
  ispName,
  cleanIp,
  isFading,
  onRetest,
}) => {
  // QoE Assessment Ratings
  const dl = latest.download_mbps || 0;
  const ul = latest.upload_mbps || 0;
  const ping = latest.ping || 25;
  const jitter = latest.jitter || 2;

  let web = 1;
  if (dl >= 25 && ping <= 50) web = 5;
  else if (dl >= 15 && ping <= 80) web = 4;
  else if (dl >= 5 && ping <= 120) web = 3;
  else if (dl >= 2) web = 2;

  let game = 1;
  if (ping <= 30 && jitter <= 5) game = 5;
  else if (ping <= 55 && jitter <= 12) game = 4;
  else if (ping <= 85 && jitter <= 20) game = 3;
  else if (ping <= 130) game = 2;

  let video = 1;
  if (dl >= 50 && jitter <= 15) video = 5;
  else if (dl >= 25) video = 4;
  else if (dl >= 10) video = 3;
  else if (dl >= 5) video = 2;

  let call = 1;
  if (ul >= 15 && jitter <= 8 && ping <= 50) call = 5;
  else if (ul >= 5 && jitter <= 18 && ping <= 90) call = 4;
  else if (ul >= 2 && jitter <= 30) call = 3;
  else if (ul >= 1) call = 2;

  return (
    <div
      className={`flex flex-col gap-6 ${isFading ? "ps-fade-out" : "ps-fade-in"}`}
    >
      {/* Top Bar: Title & Re-test Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-hairline">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
            {t.speedtestTitle}
          </h3>
        </div>

        {/* Start Again Pill CTA */}
        <button
          onClick={onRetest}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary hover:bg-primary-pressed active:scale-95 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t.speedtestStart}</span>
        </button>
      </div>

      {/* 2 Primary KPI Tiles: Download & Upload (Matching SpeedGauge Tinted Card Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* DOWNLOAD Card */}
        <div className="p-6 rounded-2xl bg-[#EBF5FD] border border-[#B8DCFA] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider font-sans">
                {t.speedtestDownload}
              </span>
              <span className="text-[10px] text-ink-faint">Mbps</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="text-5xl sm:text-6xl font-black font-mono text-ink tracking-tight">
              {latest.download_mbps.toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-ink-muted mt-4 pt-3 border-t border-[#B8DCFA]/60 flex justify-between font-mono">
            <span>
              Latency:{" "}
              <strong className="text-ink font-semibold">
                {Math.round(latest.download_latency || latest.ping || 0)} ms
              </strong>
            </span>
            <span>
              Throughput:{" "}
              <strong className="text-ink font-semibold">
                {(latest.download_mbps / 8).toFixed(2)} MB/s
              </strong>
            </span>
          </div>
        </div>

        {/* UPLOAD Card */}
        <div className="p-6 rounded-2xl bg-[#F6EEFE] border border-[#E7D1FB] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 text-[#6b21a8]" />
              <span className="text-xs font-bold text-[#6b21a8] uppercase tracking-wider font-sans">
                {t.speedtestUpload}
              </span>
              <span className="text-[10px] text-ink-faint">Mbps</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="text-5xl sm:text-6xl font-black font-mono text-ink tracking-tight">
              {latest.upload_mbps.toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-ink-muted mt-4 pt-3 border-t border-[#E7D1FB]/60 flex justify-between font-mono">
            <span>
              Latency:{" "}
              <strong className="text-ink font-semibold">
                {Math.round(latest.upload_latency || latest.ping || 0)} ms
              </strong>
            </span>
            <span>
              Throughput:{" "}
              <strong className="text-ink font-semibold">
                {(latest.upload_mbps / 8).toFixed(2)} MB/s
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Latency Trio & Jitter Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-hairline bg-canvas-soft flex flex-col justify-between">
          <span className="text-[11px] text-ink-muted font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sticker-green shrink-0" />
            <span>PING</span>
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-ink">
              {Math.round(latest.ping || 0)}
            </span>
            <span className="text-xs font-mono text-ink-muted">ms</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-hairline bg-canvas-soft flex flex-col justify-between">
          <span className="text-[11px] text-ink-muted font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sticker-orange shrink-0" />
            <span>JITTER</span>
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-ink">
              {(latest.jitter || 0).toFixed(1)}
            </span>
            <span className="text-xs font-mono text-ink-muted">ms</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-hairline bg-canvas-soft flex flex-col justify-between">
          <span className="text-[11px] text-ink-muted font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <span>DOWNLOAD LATENCY</span>
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-ink">
              {Math.round(latest.download_latency || latest.ping || 0)}
            </span>
            <span className="text-xs font-mono text-ink-muted">ms</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-hairline bg-canvas-soft flex flex-col justify-between">
          <span className="text-[11px] text-ink-muted font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7e22ce] shrink-0" />
            <span>UPLOAD LATENCY</span>
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-ink">
              {Math.round(latest.upload_latency || latest.ping || 0)}
            </span>
            <span className="text-xs font-mono text-ink-muted">ms</span>
          </div>
        </div>
      </div>

      {/* 4 Quality Ratings (QoE) Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Web */}
        <div className="p-4 rounded-xl border border-hairline bg-surface shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#EBF5FD] text-primary flex items-center justify-center shrink-0">
            <Monitor className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-ink truncate">
              {t.speedtestWeb}
            </div>
            <div className="flex items-center gap-1 my-1">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i < web ? "bg-primary" : "bg-hairline"
                  }`}
                />
              ))}
              <span className="text-[10px] font-mono text-ink-faint ml-1">
                {web}/5
              </span>
            </div>
            <div className="text-[10px] text-ink-muted truncate font-medium">
              {web >= 4
                ? t.speedtestWebQualityHigh
                : t.speedtestWebQualityNormal}
            </div>
          </div>
        </div>

        {/* Game */}
        <div className="p-4 rounded-xl border border-hairline bg-surface shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#E6F6F5] text-[#155755] flex items-center justify-center shrink-0">
            <Gamepad2 className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-ink truncate">
              {t.speedtestGame}
            </div>
            <div className="flex items-center gap-1 my-1">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i < game ? "bg-sticker-teal" : "bg-hairline"
                  }`}
                />
              ))}
              <span className="text-[10px] font-mono text-ink-faint ml-1">
                {game}/5
              </span>
            </div>
            <div className="text-[10px] text-ink-muted truncate font-medium">
              {game >= 4
                ? t.speedtestGameQualityHigh
                : t.speedtestGameQualityNormal}
            </div>
          </div>
        </div>

        {/* Stream */}
        <div className="p-4 rounded-xl border border-hairline bg-surface shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#FFEBF7] text-[#9E006A] flex items-center justify-center shrink-0">
            <PlaySquare className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-ink truncate">
              {t.speedtestStream}
            </div>
            <div className="flex items-center gap-1 my-1">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i < video ? "bg-sticker-pink" : "bg-hairline"
                  }`}
                />
              ))}
              <span className="text-[10px] font-mono text-ink-faint ml-1">
                {video}/5
              </span>
            </div>
            <div className="text-[10px] text-ink-muted truncate font-medium">
              {video >= 4
                ? t.speedtestStreamQualityHigh
                : t.speedtestStreamQualityNormal}
            </div>
          </div>
        </div>

        {/* Call */}
        <div className="p-4 rounded-xl border border-hairline bg-surface shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#F6EEFE] text-[#7e22ce] flex items-center justify-center shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-ink truncate">
              {t.speedtestCall}
            </div>
            <div className="flex items-center gap-1 my-1">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i < call ? "bg-[#7e22ce]" : "bg-hairline"
                  }`}
                />
              ))}
              <span className="text-[10px] font-mono text-ink-faint ml-1">
                {call}/5
              </span>
            </div>
            <div className="text-[10px] text-ink-muted truncate font-medium">
              {call >= 4
                ? t.speedtestCallQualityHigh
                : t.speedtestCallQualityNormal}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Metadata & Verified Result Link */}
      <div className="pt-4 border-t border-hairline flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-ink-muted">
        <div className="flex items-center gap-4">
          <span>
            ISP: <strong className="text-ink font-sans">{ispName}</strong> (
            {cleanIp})
          </span>
          <span>•</span>
          <span>
            Server:{" "}
            <strong className="text-ink font-sans">
              {latest.provider || selectedServer.name}
            </strong>
          </span>
          <span>•</span>
          <span>
            Mode:{" "}
            <strong className="text-ink uppercase">{connectionMode}</strong>
          </span>
        </div>

        <a
          href={latest.result_url || "https://www.speedtest.net"}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline font-semibold font-sans"
        >
          <span>{t.speedtestViewResult}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
