import { LocationType } from '@journeyapps/parser-schema';
import { Location } from '../../Location';
import { DBTypeMixin } from '../Type';

export class DBLocationType extends DBTypeMixin(LocationType) {
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
}
