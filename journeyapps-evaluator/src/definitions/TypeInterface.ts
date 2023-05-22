import { IVariable } from './Variable';

export interface TypeInterface {
  name: string;
  isPrimitiveType: boolean;
  isObject?: boolean;
  isCollection?: boolean;
  attributes: { [index: string]: IVariable };
  getType<T extends TypeInterface = TypeInterface>(expression: string): T | null;
  getVariable<T extends TypeInterface = TypeInterface, V extends IVariable<T> = IVariable<T>>(
    expression: string
  ): V | null;
  getVariableTypeAndNameWithParent(expression: string);
  format(value: any, format?: string): string;
  stringify(): string;
  toJSON(): any;
}
