export interface QoERating {
  web: number;
  game: number;
  video: number;
  call: number;
  webDesc: string;
  gameDesc: string;
  videoDesc: string;
  callDesc: string;
}

/**
 * Calculates QoE (Quality of Experience) ratings from network telemetry.
 * Calibrated to ITU-T & Global Industry Standards 2026.
 */
export function calculateQoE(
  dl: number,
  ul: number,
  ping: number,
  jitter: number
): QoERating {
  // 1. Web Browsing
  let web = 1;
  if (dl >= 10 && ping <= 50) web = 5;
  else if (dl >= 5 && ping <= 100) web = 4;
  else if (dl >= 2 && ping <= 150) web = 3;
  else if (dl >= 1) web = 2;

  // 2. Online Gaming
  let game = 1;
  if (ping <= 20 && jitter <= 5) game = 5; // Pro Gaming / Competitive
  else if (ping <= 50 && jitter <= 15) game = 4; // Smooth Casual Gaming
  else if (ping <= 100 && jitter <= 30) game = 3; // Playable with minor lag
  else if (ping <= 150 && jitter <= 50) game = 2;

  // 3. 4K/HD Video Streaming
  let video = 1;
  if (dl >= 25) video = 5; // Netflix 4K UHD Requirement
  else if (dl >= 15) video = 4; // 1080p FHD Smart TV
  else if (dl >= 5) video = 3; // 720p HD Mobile
  else if (dl >= 3) video = 2; // 480p SD

  // 4. Video Calls & Conferences
  let call = 1;
  if (ul >= 4 && ping <= 150 && jitter <= 10) call = 5; // Zoom HD / High Fidelity
  else if (ul >= 2 && ping <= 200 && jitter <= 20) call = 4;
  else if (ul >= 1 && ping <= 300 && jitter <= 30) call = 3;
  else if (ul >= 0.5) call = 2;

  return {
    web,
    game,
    video,
    call,
    webDesc: `Web: ${web}/5 (${dl.toFixed(1)} Mbps, Ping ${Math.round(ping)}ms)`,
    gameDesc: `Gaming: ${game}/5 (Ping ${Math.round(ping)}ms, Jitter ${jitter.toFixed(1)}ms)`,
    videoDesc: `4K Stream: ${video}/5 (${dl.toFixed(1)} Mbps)`,
    callDesc: `Video Call: ${call}/5 (Upload ${ul.toFixed(1)} Mbps, Jitter ${jitter.toFixed(1)}ms)`,
  };
}
