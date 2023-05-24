import '@journeyapps/domparser/types';
import { GenericObjectTypeEvent, ObjectType, ObjectTypeFactory, Relationship } from '@journeyapps/parser-schema';
import { DBTypeMixin } from './primitives';

export class DBObjectType extends DBTypeMixin(ObjectType) {
  belongsTo: { [index: string]: Relationship<DBObjectType> };
  hasMany: { [index: string]: Relationship<DBObjectType> };

  format(value: any) {
    return value.toString();
  }

  cast(value: any) {
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

  clone(value: any) {
    return value._clone();
  }
}

export class DBObjectTypeFactory extends ObjectTypeFactory<DBObjectType> {
  generate(event: GenericObjectTypeEvent) {
    return new DBObjectType(event?.name);
  }
}
