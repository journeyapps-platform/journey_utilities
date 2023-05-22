import { SingleChoiceType } from '@journeyapps/parser-schema';
import { DBTypeInterface, DBTypeMixin } from '../Type';

type GConstructor<T extends SingleChoiceType = SingleChoiceType> = new (...args: any[]) => T;

export function DBSingleChoiceTypeMixin<TBase extends GConstructor>(Base: TBase) {
  return class extends DBTypeMixin(Base) implements DBTypeInterface {
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

export class DBSingleChoiceType extends DBSingleChoiceTypeMixin(SingleChoiceType) {}
