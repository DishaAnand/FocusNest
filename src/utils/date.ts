export const toISODate = (d: Date) => d.toISOString().slice(0, 10); // YYYY-MM-DD

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const startOfWeekSun = (d: Date) => {
  const s = startOfDay(d);
  const diff = s.getDay(); // Sun=0
  s.setDate(s.getDate() - diff);
  return s;
};
export const endOfWeekSun = (d: Date) => {
  const s = startOfWeekSun(d);
  const e = new Date(s);
  e.setDate(s.getDate() + 6);
  return endOfDay(e);
};
export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
export const endOfMonth = (d: Date) => endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));

export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const addMonths = (d: Date, n: number) => {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
};
export const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

// Labels
export const weekdayShort = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
export const monthName = (d: Date) =>
  d.toLocaleString(undefined, { month: 'long' });
