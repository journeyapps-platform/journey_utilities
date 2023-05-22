import { PrimitiveType } from './PrimitiveType';

export class DatetimeType extends PrimitiveType {
  static TYPE = 'datetime';

  constructor() {
    super(DatetimeType.TYPE);
  }
}
