import { PrimitiveType } from './PrimitiveType';

export class NumberType extends PrimitiveType {
  static readonly TYPE = 'number';
  constructor() {
    super(NumberType.TYPE);
  }
}
