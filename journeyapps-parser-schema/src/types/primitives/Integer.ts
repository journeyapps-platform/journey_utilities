import { PrimitiveType } from './PrimitiveType';

export class IntegerType extends PrimitiveType {
  static readonly TYPE = 'integer';
  constructor() {
    super(IntegerType.TYPE);
  }
}
