import { Type as SchemaType, ValueSerializeOptions, Variable } from '@journeyapps/parser-schema';
import { IVariable, TypeInterface } from '@journeyapps/evaluator';

export interface DBTypeInterface extends TypeInterface {
  attributes: { [index: string]: IVariable<DBTypeInterface> };
  valueToJSON(value: any, options?: ValueSerializeOptions): any;
  valueFromJSON(value: any): any;
  clone(value: any): any;
  // Subclasses should override this to validate the value type. If the value is not a valid type, an Error must be thrown.
  // `value` must not be null or undefined.
  cast(value: any): any;
}

type GConstructor<T extends SchemaType = SchemaType> = new (...args: any[]) => T;

export function DBTypeMixin<TBase extends GConstructor, T extends DBTypeInterface = DBTypeInterface>(Base: TBase) {
  return class innerTypeClass extends Base implements DBTypeInterface {
    attributes: { [index: string]: Variable<DBTypeInterface> };

    valueToJSON(value: any, options?: ValueSerializeOptions) {
      return value;
    }

    valueFromJSON(value: any) {
      return value;
    }

    clone(value: any) {
      return value;
    }

    cast(value: any) {
      return value;
    }
  };
}

export class DBType extends DBTypeMixin(SchemaType) {}
