export interface AppTraffic {
  name: string;
  pid: number;
  dl: number; // MB/s
  ul: number; // MB/s
  totalDl: number; // MB
  totalUl: number; // MB
  sockets: number;
  icon?: string;
  sticker?: string;
}

export interface SocketConnection {
  proc: string;
  pid: number;
  proto: 'TCP' | 'UDP';
  local: string;
  remote: string;
  status: 'ESTABLISHED' | 'LISTEN' | 'TIME_WAIT' | 'CLOSE_WAIT';
  org: string;
  country: string;
  rtt: number;
}

export interface ListeningPort {
  port: number;
  proto: 'TCP' | 'UDP';
  proc: string;
  pid: number;
  addr: string;
  desc: string;
  exposed: boolean;
}

export interface GeoRegion {
  country: string;
  flag: string;
  code: string;
  count: number;
  ping: string;
  orgs: string;
  traffic: string;
}

export type SpeedtestStage = 'idle' | 'ping' | 'download' | 'upload' | 'complete' | 'cancelled' | 'error';

export interface SpeedtestProgress {
  stage: SpeedtestStage;
  percent: number;
  mbps?: number;
  ping?: number;
  jitter?: number;
  download_latency?: number;
  upload_latency?: number;
  download_mbps?: number;
  upload_mbps?: number;
  bytes?: number;
  error?: string;
}

export interface SpeedtestResult {
  id: string;
  timestamp: string;
  provider: string;
  ping: number;
  jitter: number;
  download_latency?: number;
  upload_latency?: number;
  download_mbps: number;
  upload_mbps: number;
  result_url?: string;
  status: string;
}

