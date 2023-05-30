import { IntegerType as SchemaIntegerType } from '@journeyapps/parser-schema';
import { DBTypeMixin } from '../Type';

export class IntegerType extends DBTypeMixin(SchemaIntegerType) {
  cast = function (value: any) {
    if (typeof value == 'number') {
      return Math.floor(value);
    } else {
      throw new Error(value + ' is not a number');
    }
  };
}
