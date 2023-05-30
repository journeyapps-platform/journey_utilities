import { Day, pureDate } from '@journeyapps/core-date';
import { DateType as SchemaDateType } from '@journeyapps/parser-schema';
import { DBTypeMixin } from '../Type';
const moment = require('moment');

// Applies applies DBTypeMixin first and then DBDateTypeMixin to BaseClass.
export class DateType extends DBTypeMixin(SchemaDateType) {
  valueToJSON(value: any) {
    if (value instanceof Date) {
      return value.toISOString().substring(0, 10);
    } else if (value instanceof Day) {
      return value.toISOString();
    } else {
      return null;
    }
  }

  valueFromJSON(value: any) {
    if (typeof value != 'string') {
      return null;
    }
    try {
      var day = new Day(value.substring(0, 10));
      if (this.isDay) {
        return day;
      } else {
        return day.toDate();
      }
    } catch (err) {
      return null;
    }
  }

  clone(value: any) {
    if (this.isDay) {
      return new Day(value);
    } else {
      return new Date(value.getTime());
    }
  }

  format(value: any, format: string = 'MMMM D YYYY') {
    // Works for Date and Day objects.
    if (value instanceof Day) {
      value = value.toDate();
    }
    const d = moment(value).utc();
    return d.format(format);
  }

  cast(value: any) {
    if (this.isDay) {
      if (value instanceof Day) {
        return value;
      } else if (value instanceof Date) {
        // Convert from local timezone
        return new Day(value);
      } else {
        throw new Error(value + ' is not a Day');
      }
    } else {
      if (value instanceof Date) {
        // Assume UTC timezone
        return pureDate(value);
      } else if (value instanceof Day) {
        return value.toDate();
      } else {
        throw new Error(value + ' is not a Date');
      }
    }
  }
}
