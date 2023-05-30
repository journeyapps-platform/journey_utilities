import { ObjectType as SchemaObjectType } from '@journeyapps/parser-schema';
import { DBTypeMixin } from './Type';

export class ObjectType extends DBTypeMixin(SchemaObjectType) {
  cast(value) {
    if (typeof value != 'object') {
      throw new Error(value + ' is not an object');
    }
    if (
      value.type != null &&
      value.type instanceof ObjectType &&
      value.type.name == this.name &&
      typeof value._save == 'function'
    ) {
      // This implies that value is (likely) also an instance of DatabaseObject.
      return value;
    } else {
      throw new Error('Expected ' + value + ' to have type ' + this.name);
    }
  }

  format(value: any): string {
    return value.toString();
  }

  clone(value) {
    return value._clone();
  }
}
