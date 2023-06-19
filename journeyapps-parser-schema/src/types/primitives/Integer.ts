import { Type } from '../Type';

export class IntegerType extends Type {
  static readonly TYPE = 'integer';
  constructor() {
    super(IntegerType.TYPE);
  }
}
