import { Type } from '../Type';

export class DatetimeType extends Type {
  static readonly TYPE = 'datetime';

  constructor() {
    super(DatetimeType.TYPE);
  }
}
