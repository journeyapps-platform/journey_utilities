import { BooleanType } from '@journeyapps/parser-schema';
import { DBTypeMixin } from '../Type';

type GConstructor<T extends BooleanType = BooleanType> = new (...args: any[]) => T;
export function DBBooleanTypeMixin<TBase extends GConstructor>(Base: TBase) {
  return class extends DBTypeMixin(Base) {
    format(value: any) {
      const option = this.options[value];
      if (option == null) {
        return '< invalid value >';
      } else {
        return option.label;
      }
    }
  };
}

export class DBBooleanType extends DBBooleanTypeMixin(BooleanType) {}
