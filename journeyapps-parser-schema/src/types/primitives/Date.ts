import { PrimitiveType } from './PrimitiveType';

export class DateType extends PrimitiveType {
  static TYPE = 'date';
  isDay?: boolean;

  constructor() {
    super(DateType.TYPE);
  }

  // Return either {} or {isDay: true}.
  // For consistency, we never return {isDay: undefined} or {isDay: false}.
  toJSON(): any {
    const json = super.toJSON();
    if (this.isDay) {
      json.isDay = true;
    }
    return json;
  }
}
