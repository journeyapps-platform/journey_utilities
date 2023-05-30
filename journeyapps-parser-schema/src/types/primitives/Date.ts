import { Type } from '../Type';

export class DateType extends Type {
  static readonly TYPE = 'date';
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
