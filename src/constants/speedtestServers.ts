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
