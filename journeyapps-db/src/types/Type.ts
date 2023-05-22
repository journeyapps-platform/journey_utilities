import { Type as SchemaType } from '@journeyapps/parser-schema';
import { TypeInterface } from '@journeyapps/evaluator';

export interface ValueSerializeOptions {
  inlineAttachments?: boolean;
}

export interface DBTypeInterface extends TypeInterface {
  valueToJSON(value: any, options?: ValueSerializeOptions): any;
}

type GConstructor<T extends SchemaType = SchemaType> = new (...args: any[]) => T;

export function DBTypeMixin<TBase extends GConstructor, T extends DBTypeInterface = DBTypeInterface>(Base: TBase) {
  return class innerTypeClass extends Base implements DBTypeInterface {
    valueToJSON(value: any, options?: ValueSerializeOptions) {
      return value;
    }
  };
}

export class DBType extends DBTypeMixin(SchemaType) {}
