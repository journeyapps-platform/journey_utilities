import { Type } from './Type';
import { Variable, VariableJsonType } from './Variable';
import { TypeInterface } from '@journeyapps/evaluator';

export class Parameter<T extends Type | TypeInterface = Type> extends Variable<T> {
  required?: boolean;
  provideValue?: string;

  toJSON(): VariableJsonType {
    const result: VariableJsonType = { ...super.toJSON() };
    if (this.required !== null) {
      result.required = this.required;
    }
    if (this.provideValue !== null) {
      result.provideValue = this.provideValue;
    }
    return result;
  }
}
