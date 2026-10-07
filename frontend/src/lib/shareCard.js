const HEX = { red: "#FF3B30", blue: "#007AFF", green: "#34C759", yellow: "#FFCC00" };
const SQ = { red: "🟥", blue: "🟦", green: "🟩", yellow: "🟨", given: "⬛", empty: "⬜" };

export const shareUrl = () => `${window.location.origin}/play/daily`;

export function shareText(r) {
  const rows = [];
  for (let k = 0; k < 6; k++) rows.push(r.grid.slice(k * 6, k * 6 + 6).map((c) => SQ[c]).join(""));
  const hearts = "❤️".repeat(r.lives) + "🖤".repeat(3 - r.lives);
  return [
    `SONOKO Daily ${r.date} ${r.won ? "✅" : "❌"}`,
    `Score ${r.score.toLocaleString()} · ${r.time} · ${hearts}`,
    `🔥 ${r.streak}-day streak`,
    ...rows,
    shareUrl(),
  ].join("\n");
}

export async function renderShareImage(r) {
  await document.fonts?.ready;
  const W = 1080, H = 1350;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d");
  x.fillStyle = "#0B0F19";
  x.fillRect(0, 0, W, H);
  const glow = (cx, cy, rad, col) => {
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, col);
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
  };
  glow(120, 80, 520, "rgba(255,59,48,0.25)");
  glow(980, 160, 520, "rgba(0,122,255,0.25)");
  glow(540, 1400, 600, "rgba(52,199,89,0.18)");

  x.font = "italic 900 170px 'Barlow Condensed', sans-serif";
  const letters = ["S", "O", "N", "O", "K", "O"];
  const cols = ["#FF3B30", "#FFCC00", "#007AFF", "#34C759", "#FFCC00", "#FF3B30"];
  let tx = 80;
  letters.forEach((ch, i) => {
    x.fillStyle = cols[i];
    x.fillText(ch, tx, 220);
    tx += x.measureText(ch).width + 4;
  });
  x.fillStyle = "#94A3B8";
  x.font = "700 34px 'DM Sans', sans-serif";
  x.fillText(`DAILY CHALLENGE · ${r.date}`, 84, 285);

  x.fillStyle = r.won ? "#FFCC00" : "#FF3B30";
  x.font = "800 150px 'JetBrains Mono', monospace";
  x.fillText(r.score.toLocaleString(), 80, 450);
  x.fillStyle = "#F8FAFC";
  x.font = "800 46px 'Barlow Condensed', sans-serif";
  x.fillText(`${r.won ? "SOLVED" : "BUSTED"} · ${r.time} · ${r.lives}/3 HEARTS · ${r.streak}-DAY STREAK`, 84, 520);

  const size = 560, cell = size / 6, gx = (W - size) / 2, gy = 600;
  x.fillStyle = "#161C2E";
  x.fillRect(gx - 16, gy - 16, size + 32, size + 32);
  r.grid.forEach((col, i) => {
    const cx = gx + (i % 6) * cell, cy = gy + Math.floor(i / 6) * cell;
    x.fillStyle = HEX[col] || (col === "given" ? "#2A3350" : "#0F1424");
    x.fillRect(cx + 5, cy + 5, cell - 10, cell - 10);
  });
  x.fillStyle = "#64748B";
  x.font = "700 32px 'DM Sans', sans-serif";
  x.fillText("TREESH GAMES", 84, 1270);
  x.textAlign = "right";
  x.fillText(window.location.host, W - 84, 1270);
  return new Promise((res) => c.toBlob(res, "image/png"));
}
