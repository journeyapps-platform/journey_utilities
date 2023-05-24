import { BooleanType } from '@journeyapps/parser-schema';
import { DBTypeMixin } from '../Type';

export class DBBooleanType extends DBTypeMixin(BooleanType) {
  format(value: any) {
    const option = this.options[value];
    if (option == null) {
      return '< invalid value >';
    } else {
      return option.label;
    }
  }
}
