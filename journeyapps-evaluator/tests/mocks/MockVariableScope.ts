import { TypeInterface, VariableScope } from '../../src';

export class MockVariableScope implements VariableScope {
  [key: string]: any;
  constructor(public type: TypeInterface) {}

  _cached(field: string): any {
    const result = this[field];
    if (result === undefined) {
      return null;
    }
    return result;
  }
}
