import { TextType as SchemaTextType } from '@journeyapps/parser-schema';
import { DBTypeMixin } from '../Type';

export class TextType extends DBTypeMixin(SchemaTextType) {
  cast(value: any) {
    return value.toString?.();
  }
}
