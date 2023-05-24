import { VariableTypeInterface } from './Variable';

export interface BaseType {
  name: string;
  toJSON(): any;
}

export interface TypeInterface extends BaseType {
  isPrimitiveType: boolean;
  isObject?: boolean;
  isCollection?: boolean;
  attributes: { [index: string]: VariableTypeInterface };
  getType<T extends TypeInterface = TypeInterface>(expression: string): T | null;
  getVariable<T extends TypeInterface = TypeInterface, V extends VariableTypeInterface<T> = VariableTypeInterface<T>>(
    expression: string
  ): V | null;
  getVariableTypeAndNameWithParent(expression: string);
  // Subclasses should override this to validate the value type. If the value is not a valid type, an Error must be thrown.
  // `value` must not be null or undefined.
  cast(value: any): any;
  format(value: any, format?: string): string;
  stringify(): string;
  valueToJSON(value: any, options?: any): any;
  valueFromJSON(value: any): any;
}
