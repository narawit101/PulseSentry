/**
 * Auto-step Data Volume (B -> KB -> MB -> GB -> TB)
 */
export function formatDataVolume(mb: number): string {
  if (!mb || mb <= 0) return "0 KB";
  const kb = mb * 1024;
  if (kb < 1) return "<1 KB";
  if (kb < 1000) return `${kb.toFixed(0)} KB`;
  if (mb < 1000) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  if (gb < 1000) return `${gb.toFixed(2)} GB`;
  return `${(gb / 1024).toFixed(2)} TB`;
}

/**
 * Auto-step Network Rate (B/s -> KB/s -> MB/s -> GB/s)
 */
export function formatRate(mbs: number): string {
  if (!mbs || mbs <= 0) return "0 B/s";
  const kbs = mbs * 1024;
  if (kbs < 0.1) return "<0.1 KB/s";
  if (kbs < 1000) return `${kbs.toFixed(1)} KB/s`;
  if (mbs < 1000) return `${mbs.toFixed(2)} MB/s`;
  return `${(mbs / 1024).toFixed(2)} GB/s`;
}

/**
 * Format split unit object for prominent hero display cards
 */
export function formatRateSplit(mbs: number): { val: string; unit: string } {
  if (mbs >= 1024) {
    return { val: (mbs / 1024).toFixed(2), unit: "GB/s" };
  }
  if (mbs >= 1) {
    return { val: mbs.toFixed(2), unit: "MB/s" };
  }
  return { val: (mbs * 1024).toFixed(1), unit: "KB/s" };
}

/**
 * Auto-step Network Rate in bits per second (Kbps -> Mbps -> Gbps)
 * @param mbps Rate in Megabits per second (Mbps)
 */
export function formatMbps(mbps: number): string {
  if (!mbps || mbps <= 0) return "0 Mbps";
  if (mbps < 0.1) return "<0.1 Mbps";
  if (mbps < 1.0) return `${(mbps * 1000).toFixed(0)} Kbps`;
  if (mbps < 1000) return `${mbps.toFixed(2)} Mbps`;
  return `${(mbps / 1000).toFixed(2)} Gbps`;
}

/**
 * Format split unit object for Mbps hero display cards
 */
export function formatMbpsSplit(mbps: number): { val: string; unit: string } {
  if (!mbps || mbps <= 0) return { val: "0.00", unit: "Mbps" };
  if (mbps >= 1000) {
    return { val: (mbps / 1000).toFixed(2), unit: "Gbps" };
  }
  if (mbps >= 1.0) {
    return { val: mbps.toFixed(2), unit: "Mbps" };
  }
  return { val: (mbps * 1000).toFixed(0), unit: "Kbps" };
}

/**
 * Shorten long corporate ISP names or truncate with ellipsis
 */
export function formatShortIsp(isp: string): string {
  if (!isp) return "";
  const cleaned = isp.trim();
  if (/triple\s*t|3bb/i.test(cleaned)) return "3BB";
  if (/true\s*internet|true\s*online|true\s*corp/i.test(cleaned)) return "True";
  if (/advanced\s*info|ais|awn/i.test(cleaned)) return "AIS";
  if (/national\s*telecom|tot|cat\s*telecom/i.test(cleaned)) return "NT";
  if (/cloudflare/i.test(cleaned)) return "Cloudflare";
  if (/google/i.test(cleaned)) return "Google";
  if (/amazon|aws/i.test(cleaned)) return "AWS";
  if (/microsoft|azure/i.test(cleaned)) return "Azure";
  if (cleaned.length > 15) return `${cleaned.slice(0, 15)}...`;
  return cleaned;
}

/**
 * Format public IP with clean, shortened ISP name
 */
export function formatDisplayPublicIP(rawIp: string): string {
  if (!rawIp) return "—";
  if (!rawIp.includes("(")) return rawIp;
  const parts = rawIp.split("(");
  const ip = parts[0].trim();
  const ispRaw = parts[1].replace(")", "").trim();
  const shortIsp = formatShortIsp(ispRaw);
  return shortIsp ? `${ip} (${shortIsp})` : ip;
}


