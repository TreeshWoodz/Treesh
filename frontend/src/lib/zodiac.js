export function getZodiac(birthday) {
  if (!birthday) return "";
  const parts = String(birthday).split("-");
  if (parts.length < 3) return "";
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (!month || !day) return "";
  const z = [
    ["Capricorn", 1, 19], ["Aquarius", 2, 18], ["Pisces", 3, 20], ["Aries", 4, 19],
    ["Taurus", 5, 20], ["Gemini", 6, 20], ["Cancer", 7, 22], ["Leo", 8, 22],
    ["Virgo", 9, 22], ["Libra", 10, 22], ["Scorpio", 11, 21], ["Sagittarius", 12, 21],
    ["Capricorn", 12, 31],
  ];
  for (const [sign, m, d] of z) {
    if (month === m && day <= d) return sign;
  }
  return "Capricorn";
}

export function formatTime(sec) {
  if (!sec || isNaN(sec) || sec === Infinity) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}
