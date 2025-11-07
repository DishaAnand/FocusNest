// src/audio/sounds.ts
export type SoundOption = {
  key: string;
  label: string;
  file: string; // filename in your bundle
};

export const SOUND_OPTIONS: SoundOption[] = [
  { key: 'chimes',    label: 'Chimes',    file: 'bell-chime-238836.mp3' },
  { key: 'beep',      label: 'Beep',      file: 'beep-alarm-366507.mp3' },
  { key: 'soft_ping', label: 'Soft Ping', file: 'notification-ping-335500.mp3' },
  { key: 'bell',      label: 'Bell',      file: 'school-bell-87744.mp3' },
  { key: 'meow',      label: 'Meow',      file: 'cat-meow-12-fx-306191.mp3' },
  { key: 'happy',     label: 'Happy',     file: 'happy-210643.mp3' },
  { key: 'tadaa',     label: 'Tadaa',     file: 'tadaa-47995.mp3' },
];

// helper to fetch the filename by key
export function getSoundFile(key?: string): string {
  return (SOUND_OPTIONS.find(s => s.key === key) ?? SOUND_OPTIONS[0]).file;
}
