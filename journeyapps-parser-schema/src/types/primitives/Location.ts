import { Type } from '../Type';
import { Variable } from '../Variable';
import { NumberType } from './Number';

export class LocationType extends Type {
  static readonly TYPE = 'location';

  constructor() {
    super(LocationType.TYPE);
    this.addAttribute(new Variable('latitude', new NumberType()));
    this.addAttribute(new Variable('longitude', new NumberType()));
    this.addAttribute(new Variable('altitude', new NumberType()));
    this.addAttribute(new Variable('horizontal_accuracy', new NumberType()));
    this.addAttribute(new Variable('vertical_accuracy', new NumberType()));
  }
}
