import { TypeInterface } from '@journeyapps/evaluator';

export interface PrimitiveTypeOptions {}

// Create a base class for primitive types with a constructor creating a default instance of that type.
export abstract class PrimitiveType implements TypeInterface {
  name: string;
  isPrimitiveType: boolean;
  objectType?: TypeInterface;
  options: object;

  protected constructor(name: string) {
    this.name = name;
  }

  abstract getType(expression: string): TypeInterface;
  abstract getVariable(expression: string);
  abstract getVariableTypeAndNameWithParent(expression: string);
  abstract format(value: any, format?: string): string;
  abstract toJSON(): any;
  abstract stringify(): string;
}
