import { EnumOption, SingleChoiceIntegerType } from '@journeyapps/parser-schema';
import { DBTypeMixin } from '../Type';

type GConstructor<T extends SingleChoiceIntegerType = SingleChoiceIntegerType> = new (...args: any[]) => T;

export function DBSingleChoiceIntegerTypeMixin<TBase extends GConstructor>(Base: TBase) {
  return class extends DBTypeMixin(Base) {
    format(value: any) {
      const option = this.options[value];
      if (option == null) {
        return '< invalid value >';
      } else {
        return option.label;
      }
    }

    cast(value: any) {
      let option: number = null;
      if (typeof value == 'number') {
        option = value;
      } else if (value instanceof EnumOption) {
        // We convert enums to a plain integer
        option = value.value as number;
      }
      if (this.options[option] == null) {
        throw new Error(value + ' is not a valid enum value');
      } else {
        return option;
      }
    }
  };
}

export class DBSingleChoiceIntegerType extends DBSingleChoiceIntegerTypeMixin(SingleChoiceIntegerType) {}
