export interface TypeInterface {
  name: string;
  isPrimitiveType: boolean;
  getVariable(expression: string);
  getVariableTypeAndNameWithParent(expression: string);
  getType(expression: string): TypeInterface | null;
  toJSON(): any;
  format(value: any, format?: string): string;
  options: object;
  stringify(): string;
  objectType?: TypeInterface;
}
