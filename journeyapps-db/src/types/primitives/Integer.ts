import { IntegerType } from '@journeyapps/parser-schema';
import { DBTypeMixin } from '../Type';

export class DBIntegerType extends DBTypeMixin(IntegerType) {
  cast = function (value: any) {
    if (typeof value == 'number') {
      return Math.floor(value);
    } else {
      throw new Error(value + ' is not a number');
    }
  };
}
