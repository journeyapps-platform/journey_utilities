import { Type } from '../Type';

export class GeoTrackType extends Type {
  static readonly TYPE = 'track';

  constructor() {
    super(GeoTrackType.TYPE);
  }
}
