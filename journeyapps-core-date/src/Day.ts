import { DayConstructor } from './DayConstructorInterface';
import { Day as DayInterface } from './DayInterface';

// Important: Day must be both a type (interface) and value (constructor).
// This gives the equivalent of having `class Day`.
export type Day = DayInterface;

export const Day: DayConstructor = function (...args: any[]) {
  var date, dateString, t;
  if (args.length == 3) {
    // new Day(year, month, day);
    // month is 0-11.
    this._time = new Date(Date.UTC(args[0], args[1], args[2]));
  } else if (args.length == 1 && args[0] instanceof Date) {
    // new Day(new Date());
    // Assume local timezone
    date = args[0];
    this._time = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  } else if (args.length == 1 && Day.isDay(args[0])) {
    // new Day(new Date());
    this._time = args[0].toDate();
  } else if (args.length == 1 && typeof args[0] == 'string') {
    // new Day("2014-02-15")
    // new Day("2014-02-15T13:15")
    // new Day("2014-02-15T13:15:11+02")
    // new Day("2014-02-15T11:15:11Z")
    dateString = args[0];
    if (/^\d\d\d\d-\d\d-\d\d/.test(dateString)) {
      this._time = new Date(dateString.substring(0, 10) + 'T00:00Z');
    } else {
      throw new Error('Invalid date format');
    }
  } else if (args.length == 1 && typeof args[0] == 'number') {
    // Assume UTC timestamp.
    t = new Date(args[0]);
    if (t.getUTCHours() !== 0 || t.getUTCMinutes() !== 0 || t.getUTCSeconds() !== 0 || t.getUTCMilliseconds() !== 0) {
      throw new Error('Invalid Day');
    }
    this._time = t;
  } else if (args.length === 0) {
    // Today in local timezone
    date = new Date();
    this._time = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  } else {
    throw new Error('Invalid args for Day()');
  }
} as any;

Day.today = function (): DayInterface {
  return new Day();
};

Day.fromUTCDate = function (date: Date): DayInterface {
  return new Day(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

Day.isDay = function (obj: any): obj is DayInterface {
  if (obj == null) {
    return false;
  } else if (obj instanceof Day) {
    return true;
  } else if (typeof obj == 'object') {
    // This covers other implementations of the Day class, e.g. in the case
    // of duplicate imports.
    return typeof obj.startOfDay == 'function' && typeof obj.endOfDay == 'function';
  } else {
    return false;
  }
};

let DayPrototype = Day.prototype as DayInterface;

DayPrototype.toDate = function () {
  // Clone the date, to prevent modifications from affecting us.
  return new Date(this._time.getTime());
};

DayPrototype.toString = function () {
  return this._time.toISOString().substring(0, 10);
};

DayPrototype.toJSON = function () {
  return this.toString();
};

DayPrototype.toISOString = function () {
  return this.toString();
};

DayPrototype.valueOf = function () {
  return this._time.getTime();
};

DayPrototype.startOfDay = function () {
  var t = this._time;
  var d = new Date(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
  return d;
};

DayPrototype.endOfDay = function () {
  var t = this._time;
  var d = new Date(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), 23, 59, 59, 999);
  return d;
};

DayPrototype.getYear = function () {
  return this._time.getUTCFullYear();
};

DayPrototype.getMonth = function () {
  return this._time.getUTCMonth();
};

DayPrototype.getDay = function () {
  return this._time.getUTCDate();
};

DayPrototype.getDayOfWeek = function () {
  return this._time.getUTCDay();
};
