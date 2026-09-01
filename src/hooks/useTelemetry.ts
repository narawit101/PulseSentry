import { useState, useEffect, useRef } from "react";
import {
  AppTraffic,
  SocketConnection,
  ListeningPort,
  SpeedtestProgress,
  SpeedtestResult,
} from "../types";

export interface TelemetryRates {
  totalDlMB: number;
  totalUlKB: number;
  sessionDownloadedMB: number;
  sessionUploadedMB: number;
  peakDlMB: number;
  peakUlKB: number;
  liveDlMbps: number;
  liveUlMbps: number;
}

export interface TelemetryPings {
  router: number;
  cloudflare: number;
  google: number;
}

export interface TelemetryNetwork {
  activeAdapter: string;
  localIP: string;
  publicIP: string;
}

export interface HistoryBuffer {
  dl: number[];
  ul: number[];
  ts: number[];
}

export function useTelemetry(isLive: boolean = true) {
  // Core Telemetry Collections
  const [apps, setApps] = useState<AppTraffic[]>([]);
  const [sockets, setSockets] = useState<SocketConnection[]>([]);
  const [ports, setPorts] = useState<ListeningPort[]>([]);

  // Consolidated Rates State (Single Batch Dispatch)
  const [rateMetrics, setRateMetrics] = useState({
    totalDlMB: 0,
    totalUlKB: 0,
    sessionDownloadedMB: 0,
    sessionUploadedMB: 0,
    peakDlMB: 0,
    peakUlKB: 0,
  });

  // Consolidated Pings State (Single Batch Dispatch)
  const [pings, setPings] = useState<TelemetryPings>({
    router: 0,
    cloudflare: 0,
    google: 0,
  });

  // Network Identifiers
  const [network, setNetwork] = useState<TelemetryNetwork>({
    activeAdapter: "ตรวจจับอัตโนมัติ",
    localIP: "127.0.0.1",
    publicIP: "กำลังตรวจสอบ...",
  });

  // Speedtest State
  const [speedtestProgress, setSpeedtestProgress] = useState<SpeedtestProgress>({
    stage: "idle",
    percent: 0,
  });
  const [isSpeedtesting, setIsSpeedtesting] = useState(false);
  const [speedtestHistory, setSpeedtestHistory] = useState<SpeedtestResult[]>([]);

  // Chart History Buffer (Max 3600 points = 1 Hour)
  const [fullHistory, setFullHistory] = useState<HistoryBuffer>({
    dl: Array.from({ length: 30 }, () => 0),
    ul: Array.from({ length: 30 }, () => 0),
    ts: Array.from({ length: 30 }, (_, i) => Date.now() - (30 - i) * 1000),
  });

  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const isLiveRef = useRef(isLive);

  useEffect(() => {
    isLiveRef.current = isLive;
  }, [isLive]);

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
                jitter: data.jitter,
                download_latency: data.download_latency,
                upload_latency: data.upload_latency,
                download_mbps: data.download_mbps,
                upload_mbps: data.upload_mbps,
              });
            } else if (data.type === "SPEEDTEST_COMPLETE") {
              setIsSpeedtesting(false);
              setSpeedtestProgress({ stage: "complete", percent: 100 });
              if (data.result) {
                setSpeedtestHistory((prev) => [
                  {
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
                  },
                  ...prev,
                ]);
              }
            } else if (
              data.type === "TELEMETRY_SNAPSHOT" ||
              data.type === "TELEMETRY" ||
              (typeof data.type === "string" && data.type.startsWith("TELEMETRY"))
            ) {
              if (!isLiveRef.current) return;

              if (data.rates) {
                const dl = Number(data.rates.downloadMBs || 0);
                const ul = Number(data.rates.uploadKBs || 0);
                const sessDl = data.rates.sessionDownloadedMB !== undefined
                  ? Number(data.rates.sessionDownloadedMB)
                  : data.rates.sessionDownloadedGB !== undefined
                    ? Number(data.rates.sessionDownloadedGB) * 1024
                    : 0;
                const sessUl = Number(data.rates.sessionUploadedMB || 0);

                setRateMetrics((prev) => ({
                  totalDlMB: dl,
                  totalUlKB: ul,
                  sessionDownloadedMB: sessDl || prev.sessionDownloadedMB,
                  sessionUploadedMB: sessUl || prev.sessionUploadedMB,
                  peakDlMB: Math.max(prev.peakDlMB, dl),
                  peakUlKB: Math.max(prev.peakUlKB, ul),
                }));

                setFullHistory((prev) => {
                  const now = Date.now();
                  const newDl = [...prev.dl, dl];
                  const newUl = [...prev.ul, ul / 1024];
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
                setPings({
                  router: Number(data.pings.router || 0),
                  cloudflare: Number(data.pings.cloudflare || 0),
                  google: Number(data.pings.google || 0),
                });
              }

              if (data.network) {
                setNetwork((prev) => ({
                  activeAdapter: data.network.adapter || prev.activeAdapter,
                  localIP: data.network.localIP || prev.localIP,
                  publicIP: data.network.publicIP || prev.publicIP,
                }));
              }

              if (data.apps && data.apps.length > 0) setApps(data.apps);
              if (data.sockets && data.sockets.length > 0) setSockets(data.sockets);
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

  // Speedtest Handlers
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
      : rateMetrics.totalDlMB * 8;

  const liveUlMbps =
    isSpeedtesting && speedtestProgress.stage === "upload"
      ? speedtestProgress.mbps || 0
      : (rateMetrics.totalUlKB * 8) / 1024;

  const rates: TelemetryRates = {
    ...rateMetrics,
    liveDlMbps,
    liveUlMbps,
  };

  return {
    isAgentConnected,
    apps,
    sockets,
    ports,
    rates,
    pings,
    network,
    fullHistory,
    speedtest: {
      progress: speedtestProgress,
      isRunning: isSpeedtesting,
      history: speedtestHistory,
      start: handleStartSpeedtest,
      cancel: handleCancelSpeedtest,
      clearHistory: handleClearSpeedtestHistory,
    },
  };
}
