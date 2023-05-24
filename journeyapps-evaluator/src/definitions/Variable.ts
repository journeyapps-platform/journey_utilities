import { BaseType, TypeInterface } from './TypeInterface';

export interface VariableTypeInterface<T extends TypeInterface = TypeInterface> extends BaseType {
  type: T;
  label?: string;
}
