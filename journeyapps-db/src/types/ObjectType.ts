import '@journeyapps/domparser/types';
import { ObjectType, Relationship } from '@journeyapps/parser-schema';
import { DBTypeInterface, DBTypeMixin } from './primitives';

type GConstructor<T extends ObjectType = ObjectType> = new (...args: any[]) => T;

export type DBObjectTypeInterface = DBTypeInterface &
  ObjectType & {
    belongsTo: { [index: string]: Relationship<DBObjectTypeInterface> };
    hasMany: { [index: string]: Relationship<DBObjectTypeInterface> };
  };

export function DBObjectTypeMixin<TBase extends GConstructor>(Base: TBase) {
  return class extends DBTypeMixin(Base) implements DBObjectTypeInterface {
    belongsTo: { [index: string]: Relationship<DBObjectTypeInterface> };
    hasMany: { [index: string]: Relationship<DBObjectTypeInterface> };

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
  };
}

export class DBObjectType extends DBObjectTypeMixin(ObjectType) {}
