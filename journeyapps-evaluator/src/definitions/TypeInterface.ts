export interface TypeInterface {
  name: string;
  options: object;
  isPrimitiveType: boolean;
  objectType?: TypeInterface;
  getVariable(expression: string);
  getVariableTypeAndNameWithParent(expression: string);
  getType(expression: string): TypeInterface | null;
  toJSON(): any;
  stringify(): string;
  format(value: any, format?: string): string;
}
