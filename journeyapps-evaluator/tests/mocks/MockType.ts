import { TypeInterface } from '../../src';
import { MockVariableType } from './MockVariableType';

export class MockType implements TypeInterface {
  name: string;
  options: object;
  isPrimitiveType: boolean;
  objectType?: TypeInterface;

  constructor(name: string, private variables: { [index: string]: MockVariableType } = {}) {
    this.name = name;
  }

  getVariable(expression: string) {
    if (expression == null || expression == 'null') {
      return null;
    }
    const dot = expression.indexOf('.');
    if (dot < 0) {
      return this.variables[expression];
    } else {
      const head = expression.substring(0, dot); // The first part of the expression
      const tail = expression.substring(dot + 1); // The rest of the expression
      const child = this.variables[head];
      if (child == null || child.type == null) {
        return null;
      } else {
        return child.type.getVariable(tail);
      }
    }
  }

  getType(expression: string): TypeInterface {
    const variable = this.getVariable(expression);
    if (variable == null) {
      return null;
    } else {
      return variable.type;
    }
  }

  getVariableTypeAndNameWithParent(expression: string) {
    throw new Error('Method not implemented.');
  }

  toJSON() {
    throw new Error('Method not implemented.');
  }
  stringify(): string {
    throw new Error('Method not implemented.');
  }
  format(value: any, format?: string): string {
    const result = `${value}`;
    if (format) {
      if (format.length >= 3 && format[0] == '.' && format[format.length - 1] == 'f') {
        const digits = parseInt(format.substring(1, format.length - 1), 10);
        if (digits >= 0 && digits < 20) {
          return value.toFixed(digits);
        } else {
          return value.toFixed(6);
        }
      }
    }
    return result;
  }
}
