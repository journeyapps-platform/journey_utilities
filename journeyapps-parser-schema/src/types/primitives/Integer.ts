import { PrimitiveType } from './PrimitiveType';

export class IntegerType extends PrimitiveType {
  static TYPE = 'integer';
  constructor() {
    super(IntegerType.TYPE);
  }
}
