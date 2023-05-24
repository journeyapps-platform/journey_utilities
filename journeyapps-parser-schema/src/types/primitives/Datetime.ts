import { PrimitiveType } from './PrimitiveType';

export class DatetimeType extends PrimitiveType {
  static readonly TYPE = 'datetime';

  constructor() {
    super(DatetimeType.TYPE);
  }
}
