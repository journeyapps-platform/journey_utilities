import { BooleanType as SchemaBooleanType } from '@journeyapps/parser-schema';
import { DBTypeMixin } from '../Type';

export class BooleanType extends DBTypeMixin(SchemaBooleanType) {
  format(value: any) {
    const option = this.options[value];
    if (option == null) {
      return '< invalid value >';
    } else {
      return option.label;
    }
  }
}
