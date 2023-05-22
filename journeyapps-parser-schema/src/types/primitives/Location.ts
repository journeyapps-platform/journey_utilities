import { Variable } from '../../schema/Variable';
import { NumberType } from './Number';
import { PrimitiveType } from './PrimitiveType';

export class LocationType extends PrimitiveType {
  static TYPE = 'location';

  constructor() {
    super(LocationType.TYPE);
    this.addAttribute(new Variable('latitude', new NumberType()));
    this.addAttribute(new Variable('longitude', new NumberType()));
    this.addAttribute(new Variable('altitude', new NumberType()));
    this.addAttribute(new Variable('horizontal_accuracy', new NumberType()));
    this.addAttribute(new Variable('vertical_accuracy', new NumberType()));
  }
}
