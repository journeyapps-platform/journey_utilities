export class Location {
  latitude: number;
  longitude: number;
  altitude: number;
  horizontal_accuracy: number; // tslint:disable-line
  vertical_accuracy: number; // tslint:disable-line
  timestamp: Date;

  constructor(attrs: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
    horizontal_accuracy?: number;
    vertical_accuracy?: number;
    timestamp?: string | Date;
  }) {
    attrs = attrs || {};
    // We default each attribute to `undefined` if either `null` or `undefined` is passed in.
    this.latitude = attrs.latitude || undefined;
    this.longitude = attrs.longitude || undefined;
    this.altitude = attrs.altitude || undefined;
    this.horizontal_accuracy = attrs.horizontal_accuracy || undefined;
    this.vertical_accuracy = attrs.vertical_accuracy || undefined;

    if (typeof attrs.timestamp == 'string') {
      // From JSON (ISO8601)
      this.timestamp = new Date(Date.parse(attrs.timestamp));
    } else {
      this.timestamp = attrs.timestamp || new Date();
    }

    // Make this read-only
    Object.freeze(this);
  }

  toString() {
    return '(' + this.latitude + ',' + this.longitude + ' ~' + this.horizontal_accuracy + ')';
  }

  toJSON() {
    return [
      this.latitude,
      this.longitude,
      this.altitude,
      this.horizontal_accuracy,
      this.vertical_accuracy,
      this.timestamp.toISOString()
    ];
  }
}
