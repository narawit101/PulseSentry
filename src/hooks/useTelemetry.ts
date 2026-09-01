import { useState, useEffect, useMemo, useRef } from "react";
import {
  AppTraffic,
  SocketConnection,
  ListeningPort,
  SpeedtestProgress,
  SpeedtestResult,
  GeoRegionItem,
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

  // Speedtest State
  const [speedtestProgress, setSpeedtestProgress] = useState<SpeedtestProgress>({
    stage: "idle",
    percent: 0,
  });
  const [isSpeedtesting, setIsSpeedtesting] = useState(false);
  const [speedtestHistory, setSpeedtestHistory] = useState<SpeedtestResult[]>([]);

  // Live Pings
  const [pingRouter, setPingRouter] = useState(0);
  const [pingCloudflare, setPingCloudflare] = useState(0);
  const [pingGoogle, setPingGoogle] = useState(0);

  // Network Info
  const [activeAdapter, setActiveAdapter] = useState("ตรวจจับอัตโนมัติ");
  const [localIP, setLocalIP] = useState("127.0.0.1");
  const [publicIP, setPublicIP] = useState("กำลังตรวจสอบ...");

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
                setSpeedtestHistory((prev) => {
                  const newEntry: SpeedtestResult = {
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
              if (!isLiveRef.current) return;
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
                if (data.pings.cloudflare) setPingCloudflare(data.pings.cloudflare);
                if (data.pings.google) setPingGoogle(data.pings.google);
              }
              if (data.network) {
                if (data.network.adapter) setActiveAdapter(data.network.adapter);
                if (data.network.localIP) setLocalIP(data.network.localIP);
                if (data.network.publicIP) setPublicIP(data.network.publicIP);
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

  // Aggregated GeoIP Regions
  const geoRegions = useMemo<GeoRegionItem[]>(() => {
    const counts: Record<string, { count: number; code: string; orgs: Set<string> }> = {};
    sockets.forEach((s) => {
      if (
        s.country &&
        s.country !== "Unknown" &&
        s.country !== "-" &&
        s.country !== "LOCAL"
      ) {
        if (!counts[s.country]) {
          counts[s.country] = {
            count: 0,
            code: s.code || (s.country === "LAN" ? "LAN" : s.country.slice(0, 2).toUpperCase()),
            orgs: new Set(),
          };
        }
        counts[s.country].count += 1;
        if (s.code) {
          counts[s.country].code = s.code;
        }
        if (s.org && s.org !== "Local / Unknown") {
          counts[s.country].orgs.add(s.org);
        }
      }
    });

    return Object.entries(counts)
      .map(([country, data]) => ({
        country,
        code: data.code,
        count: data.count,
        orgs: Array.from(data.orgs).slice(0, 3).join(", ") || "Direct Connection",
        ping:
          data.code === "TH"
            ? "< 15ms"
            : data.code === "SG"
              ? "~35ms"
              : data.code === "US"
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

  return {
    isAgentConnected,
    apps,
    sockets,
    ports,
    rates: {
      totalDlMB,
      totalUlKB,
      sessionDownloadedMB,
      sessionUploadedMB,
      peakDlMB,
      peakUlKB,
      liveDlMbps,
      liveUlMbps,
    },
    pings: {
      router: pingRouter,
      cloudflare: pingCloudflare,
      google: pingGoogle,
    },
    network: {
      activeAdapter,
      localIP,
      publicIP,
    },
    fullHistory,
    speedtest: {
      progress: speedtestProgress,
      isRunning: isSpeedtesting,
      history: speedtestHistory,
      start: handleStartSpeedtest,
      cancel: handleCancelSpeedtest,
      clearHistory: handleClearSpeedtestHistory,
    },
    geoRegions,
  };
}
