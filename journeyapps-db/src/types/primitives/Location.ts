import { LocationType } from '@journeyapps/parser-schema';
import { Location } from '../../Location';
import { DBTypeInterface, DBTypeMixin } from '../Type';

type GConstructor<T extends LocationType = LocationType> = new (...args: any[]) => T;

export function DBLocationTypeMixin<TBase extends GConstructor>(Base: TBase) {
  return class extends DBTypeMixin(Base) implements DBTypeInterface {
    valueFromJSON(value: any) {
      if (Array.isArray(value)) {
        // Array format
        const data = {
          latitude: value[0],
          longitude: value[1],
          altitude: value[2],
          horizontal_accuracy: value[3],
          vertical_accuracy: value[4],
          timestamp: value[5]
        };
        return new Location(data);
      } else {
        // Object format
        return new Location(value);
      }
    }

    cast(value: any) {
      if (value instanceof Location) {
        return value;
      } else if (typeof value == 'object') {
        return new Location(value);
      } else {
        throw new Error(value + ' is not a valid location');
      }
    }

    clone(value: any) {
      return new Location(value);
    }
  };
}

export class DBLocationType extends DBLocationTypeMixin(LocationType) {}
