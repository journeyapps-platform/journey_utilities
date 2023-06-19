import { Type } from '../Type';

export class NumberType extends Type {
  static readonly TYPE = 'number';
  constructor() {
    super(NumberType.TYPE);
  }
}
