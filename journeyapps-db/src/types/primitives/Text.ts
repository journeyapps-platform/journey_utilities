import { TextType } from '@journeyapps/parser-schema';
import { DBTypeMixin } from '../Type';

export class DBTextType extends DBTypeMixin(TextType) {
  cast(value: any) {
    return value.toString();
  }
}
