import { DBTypeMixin } from '../Type';
import { GeoTrackType as SchemaGeoTrackType } from '@journeyapps/parser-schema';

export class GeoTrackType extends DBTypeMixin(SchemaGeoTrackType) {}
