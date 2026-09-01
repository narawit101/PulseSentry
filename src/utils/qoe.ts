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

  // 2. Online Gaming (Weighted Ping & Jitter)
  let game = 1;
  if (ping <= 25 && jitter <= 20) game = 5; // Pro Esports / Competitive
  else if (ping <= 60 && jitter <= 60) game = 4; // Smooth Casual / MMO / FPS
  else if (ping <= 120 && jitter <= 90) game = 3; // Playable with minor lag
  else if (ping <= 200) game = 2; // Noticeable lag

  // 3. 4K/HD Video Streaming (Based on Netflix / YouTube Bitrate)
  let video = 1;
  if (dl >= 25) video = 5; // 4K Ultra HD / Multi-Stream
  else if (dl >= 15) video = 4; // 1080p FHD Smart TV
  else if (dl >= 5) video = 3; // 720p HD Mobile
  else if (dl >= 3) video = 2; // 480p SD

  // 4. Video Calls & Conferences (Zoom / Teams / Discord)
  let call = 1;
  if (ul >= 5 && ping <= 120 && jitter <= 30) call = 5; // Zoom HD / Studio Quality
  else if (ul >= 2 && ping <= 180 && jitter <= 70) call = 4; // Smooth HD Video Call
  else if (ul >= 1 && ping <= 250 && jitter <= 120) call = 3; // Standard Call / Audio
  else if (ul >= 0.5) call = 2; // Low Res / Voice Only

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
