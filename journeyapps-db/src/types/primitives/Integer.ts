import { IntegerType } from '@journeyapps/parser-schema';
import { DBTypeMixin } from '../Type';

type GConstructor<T extends IntegerType = IntegerType> = new (...args: any[]) => T;

export function DBIntegerTypeMixin<TBase extends GConstructor>(Base: TBase) {
  return class extends DBTypeMixin(Base) {
    cast = function (value: any) {
      if (typeof value == 'number') {
        return Math.floor(value);
      } else {
        throw new Error(value + ' is not a number');
      }
    };
  };
}

export class DBIntegerType extends DBIntegerTypeMixin(IntegerType) {}
