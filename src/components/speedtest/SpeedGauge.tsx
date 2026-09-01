import React from "react";
import {
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowDown,
  ArrowUp,
  Gamepad2,
  Monitor,
  PlaySquare,
  User,
  Zap,
} from "lucide-react";
import { SpeedtestProgress, SpeedtestResult } from "../../types";
import { TranslationDict } from "../../i18n/translations";
import { calculateQoE } from "../../utils/qoe";

interface SpeedGaugeProps {
  t: TranslationDict;
  progress: SpeedtestProgress;
  latest: SpeedtestResult | null;
  measuredDl: number;
  onCancel: () => void;
}

// Accurate 8-Segment Logarithmic Gauge Mapping matching dial tick marks exactly
export const getLogGaugePercent = (mbps: number): number => {
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

export const SpeedGauge: React.FC<SpeedGaugeProps> = ({
  t,
  progress,
  latest,
  measuredDl,
  onCancel,
}) => {
  const currentMbps = progress.mbps || 0;

  // Real Dynamic QoE Rating Calculator (Single Source of Truth)
  const qoe = calculateQoE(
    progress.stage === "download"
      ? progress.mbps || 0
      : latest?.download_mbps || progress.mbps || 0,
    progress.stage === "upload"
      ? progress.mbps || 0
      : latest?.upload_mbps || 0,
    progress.ping || latest?.ping || 25,
    progress.jitter || latest?.jitter || 2
  );

  const gaugePercent =
    progress.stage === "ping"
      ? 0
      : Math.min(1.0, getLogGaugePercent(currentMbps));
  const needleAngle = -120 + gaugePercent * 240;

  return (
    <div className="flex flex-col items-center select-none ps-fade-in">
      {/* Top Bar: 4 Metric Cards (Latency, Download, Upload, Quality) */}
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
                  progress.stage === "ping" ? "text-sticker-orange font-bold" : ""
                }
              >
                LATENCY (ms)
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-mono mt-2">
            <div>
              <span className="text-ink-faint block text-[10px]">Idle</span>
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
              <span className="text-primary block text-[10px]">DownLoad</span>
              <strong className="text-ink font-bold text-sm">
                {progress.download_latency !== undefined &&
                progress.download_latency > 0
                  ? Math.round(progress.download_latency)
                  : "—"}
              </strong>
            </div>
            <div>
              <span className="text-[#6b21a8] block text-[10px]">UpLoad</span>
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
                  progress.stage === "download" ? "text-primary font-bold" : ""
                }
              >
                DOWNLOAD
              </span>
              <span className="text-[10px] text-ink-faint">Mbps</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-ink tracking-tight">
            {progress.stage === "download"
              ? (progress.mbps || 0).toFixed(2)
              : measuredDl > 0
                ? measuredDl.toFixed(2)
                : progress.download_mbps !== undefined &&
                    progress.download_mbps > 0
                  ? progress.download_mbps.toFixed(2)
                  : progress.stage === "upload" || progress.stage === "complete"
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
                  progress.stage === "upload" ? "text-[#6b21a8] font-bold" : ""
                }
              >
                UPLOAD
              </span>
              <span className="text-[10px] text-ink-faint">Mbps</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-ink tracking-tight">
            {progress.stage === "upload"
              ? (progress.mbps || 0).toFixed(2)
              : "—"}
          </div>
        </div>

        {/* QUALITY QoE Card */}
        <div className="p-4 rounded-xl border border-hairline bg-canvas-soft flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-ink-muted">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-ink-faint" />
              <span>QUALITY (QoE)</span>
            </div>
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
                    style={{ animationDelay: `${i * 150}ms` }}
                    className="w-1 h-1 rounded-full transition-all duration-200 bg-[#71717a] animate-pulse"
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
                    style={{ animationDelay: `${i * 150}ms` }}
                    className="w-1 h-1 rounded-full transition-all duration-200 bg-[#71717a] animate-pulse"
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
                    style={{ animationDelay: `${i * 150}ms` }}
                    className="w-1 h-1 rounded-full transition-all duration-200 bg-[#71717a] animate-pulse"
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
                    style={{ animationDelay: `${i * 150}ms` }}
                    className="w-1 h-1 rounded-full transition-all duration-200 bg-[#71717a] animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Center Speedometer Dial */}
      <div className="relative w-full max-w-[360px] aspect-[1/0.88] flex flex-col items-center justify-center my-6">
        <svg viewBox="0 0 240 190" className="w-full h-full overflow-visible">
          {/* Background Track Arc */}
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
            style={{ transition: "stroke-dashoffset 120ms ease-out" }}
          />

          {/* Dial Tick Notches */}
          <line x1="55.0" y1="149.5" x2="46.4" y2="154.5" stroke="#d4d4d8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="45.0" y1="112.0" x2="35.0" y2="112.0" stroke="#d4d4d8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="55.0" y1="74.5" x2="46.4" y2="69.5" stroke="#d4d4d8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="82.5" y1="47.1" x2="77.5" y2="38.4" stroke="#d4d4d8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="120.0" y1="37.0" x2="120.0" y2="27.0" stroke="#a1a1aa" strokeWidth="2.0" strokeLinecap="round" />
          <line x1="157.5" y1="47.1" x2="162.5" y2="38.4" stroke="#d4d4d8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="185.0" y1="74.5" x2="193.6" y2="69.5" stroke="#d4d4d8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="195.0" y1="112.0" x2="205.0" y2="112.0" stroke="#d4d4d8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="185.0" y1="149.5" x2="193.6" y2="154.5" stroke="#d4d4d8" strokeWidth="1.5" strokeLinecap="round" />

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
            style={{ transition: "transform 120ms ease-out" }}
          >
            <line x1="0" y1="0" x2="0" y2="-72" stroke="#18181b" strokeWidth="3" strokeLinecap="round" />
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

          {/* Scale Numbers */}
          <text x="70" y="141" fontSize="7.5" fontWeight="700" fill="#52525b" textAnchor="middle" fontFamily="sans-serif">0</text>
          <text x="62" y="115" fontSize="7.5" fontWeight="700" fill="#52525b" textAnchor="middle" fontFamily="sans-serif">5</text>
          <text x="70" y="85" fontSize="7.5" fontWeight="700" fill="#52525b" textAnchor="middle" fontFamily="sans-serif">10</text>
          <text x="91" y="63" fontSize="7.5" fontWeight="700" fill="#52525b" textAnchor="middle" fontFamily="sans-serif">50</text>
          <text x="120" y="55" fontSize="8.5" fontWeight="800" fill="#18181b" textAnchor="middle" fontFamily="sans-serif">100</text>
          <text x="149" y="63" fontSize="7.5" fontWeight="700" fill="#52525b" textAnchor="middle" fontFamily="sans-serif">250</text>
          <text x="170" y="85" fontSize="7.5" fontWeight="700" fill="#52525b" textAnchor="middle" fontFamily="sans-serif">500</text>
          <text x="178" y="115" fontSize="7.5" fontWeight="700" fill="#52525b" textAnchor="middle" fontFamily="sans-serif">750</text>
          <text x="170" y="141" fontSize="7.5" fontWeight="700" fill="#52525b" textAnchor="middle" fontFamily="sans-serif">1000</text>
        </svg>

        {/* Digital Speed Readout */}
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

      {/* Progress Stage Bar */}
      {(progress.stage === "download" || progress.stage === "upload") && (
        <div className="w-full mt-2 mb-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5 px-0.5">
            <span className="text-ink-muted flex items-center gap-1.5 font-sans">
              <span
                className={`w-2 h-2 rounded-full ${
                  progress.stage === "upload" ? "bg-[#7e22ce]" : "bg-primary"
                } animate-pulse`}
              />
              {progress.stage === "download"
                ? t.speedtestStageDl
                : t.speedtestStageUl}
            </span>
            <span className="text-ink font-mono font-bold">
              {Math.round(progress.percent || 0)}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-canvas-soft border border-hairline overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-150 ${
                progress.stage === "upload" ? "bg-[#7e22ce]" : "bg-primary"
              }`}
              style={{ width: `${Math.min(100, progress.percent || 0)}%` }}
            />
          </div>
        </div>
      )}

      {/* Cancel Button */}
      <button
        onClick={onCancel}
        className="mt-2 px-5 py-2 rounded-lg border border-hairline text-ink-muted hover:text-ink hover:bg-canvas-soft text-xs font-semibold transition-all cursor-pointer shadow-2xs"
      >
        {t.speedtestCancel}
      </button>
    </div>
  );
};
