import { PrimitiveType } from './PrimitiveType';

export class NumberType extends PrimitiveType {
  static TYPE = 'number';
  constructor() {
    super(NumberType.TYPE);
  }
}
