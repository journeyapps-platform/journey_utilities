export interface TypeInterface {
  name: string;
  isPrimitiveType: boolean;
  options: object;
  objectType?: TypeInterface;
  getType(expression: string): TypeInterface | null;
  getVariable(expression: string);
  getVariableTypeAndNameWithParent(expression: string);
  format(value: any, format?: string): string;
  stringify(): string;
  toJSON(): any;
}
