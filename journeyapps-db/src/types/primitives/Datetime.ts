import { DatetimeType } from '@journeyapps/parser-schema';
import { DBTypeInterface, DBTypeMixin } from '../Type';
import moment = require('moment');

type GConstructor<T extends DatetimeType = DatetimeType> = new (...args: any[]) => T;

export function DBDatetimeTypeMixin<TBase extends GConstructor>(Base: TBase) {
  return class extends DBTypeMixin(Base) implements DBTypeInterface {
    valueToJSON(value: any) {
      if (value instanceof Date) {
        return value.toISOString();
      } else {
        return null;
      }
    }

    valueFromJSON(value: string) {
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

    format(value: any, format: string) {
      return moment(value).format('MMMM D YYYY h:mm A');
    }

    cast(value: any): any {
      if (value instanceof Date) {
        return value;
      } else {
        throw new Error(value + ' is not a Date');
      }
    }

    clone(value: any) {
      return new Date(value.getTime());
    }
  };
}

export class DBDatetimeType extends DBDatetimeTypeMixin(DatetimeType) {}
