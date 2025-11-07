// src/utils/time.ts
export const secsToWholeMinutes = (secs: number | undefined | null): number =>
  secs && secs > 0 ? Math.floor(secs / 60) : 0;

// Optional: hh/mm/ss pretty print (keeps your current behavior)
export function fmtHMsec(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (s >= 3600) {
    const h = Math.floor(s / 3600);
    const rem = Math.floor((s % 3600) / 60);
    return rem ? `${h}h ${rem}m` : `${h}h`;
  }
  return sec ? `${m}m ${sec}s` : `${m}m`;
}
