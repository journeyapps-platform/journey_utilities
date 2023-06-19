import { Schema } from '../../schema/Schema';
import { Type } from '../Type';
import { PrimitiveType } from './index';

export class LocationType extends Type {
  static readonly TYPE = 'location';

  constructor() {
    super(LocationType.TYPE);
  }

  setupVariables(schema: Schema) {
    this.addAttribute(schema.variable('latitude', PrimitiveType.TEXT));
    this.addAttribute(schema.variable('longitude', PrimitiveType.TEXT));
    this.addAttribute(schema.variable('altitude', PrimitiveType.TEXT));
    this.addAttribute(schema.variable('horizontal_accuracy', PrimitiveType.TEXT));
    this.addAttribute(schema.variable('vertical_accuracy', PrimitiveType.TEXT));
  }
}
