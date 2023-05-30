import { SingleChoiceType as SchemaSingleChoiceType } from '@journeyapps/parser-schema';
import { DBTypeMixin } from '../Type';

export class SingleChoiceType extends DBTypeMixin(SchemaSingleChoiceType) {
  valueToJSON(value: any) {
    if (typeof value == 'number') {
      return value;
    } else {
      return null;
    }
  }

  valueFromJSON(value: any) {
    if (typeof value == 'number') {
      return value;
    } else {
      return null;
    }
  }

  format(value: any): string {
    const option = this.options[value];
    if (option == null) {
      return '< invalid value >';
    } else {
      return option.label;
    }
  }
}
