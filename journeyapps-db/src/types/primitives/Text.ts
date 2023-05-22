import { TextType } from '@journeyapps/parser-schema';
import { DBTypeMixin } from '../Type';

type GConstructor<T extends TextType = TextType> = new (...args: any[]) => T;

export function DBTextTypeMixin<TBase extends GConstructor>(Base: TBase) {
  return class extends DBTypeMixin(Base) {
    cast(value: any) {
      return value.toString();
    }
  };
}

export class DBTextType extends DBTextTypeMixin(TextType) {}
