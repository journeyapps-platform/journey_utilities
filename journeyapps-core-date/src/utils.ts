// # date module
// Date/time utility functions

// Take a time in the local timezone, and the date portion as a pure UTC date.
export function dateFromTime(time: Date) {
  return new Date(Date.UTC(time.getFullYear(), time.getMonth(), time.getDate()));
}

// If it is already a pure date, return it.
// Otherwise, make it a pure date.
export function pureDate(time: Date) {
  if (isPureDate(time)) {
    return time;
  } else {
    return dateFromTime(time);
  }
}

export function isPureDate(date: Date) {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

export function parseDateTime(value): Date | null {
  if (typeof value == 'string') {
    const parsed = Date.parse(value);
    if (isNaN(parsed)) {
      return null;
    } else {
      return new Date(parsed);
    }
  } else {
    return null;
  }
}
