import { PrimitiveType } from './PrimitiveType';

export class GeoTrackType extends PrimitiveType {
  static TYPE = 'track';

  constructor() {
    super(GeoTrackType.TYPE);
  }
}
