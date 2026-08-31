export interface AppTraffic {
  name: string;
  pid: number;
  dl: number; // MB/s
  ul: number; // MB/s
  totalDl: number; // MB
  totalUl: number; // MB
  sockets: number;
  icon?: string;
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
