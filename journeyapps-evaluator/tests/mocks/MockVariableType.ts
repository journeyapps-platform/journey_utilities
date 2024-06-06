import { MockType } from './MockType';

export class MockVariableType extends MockType {
  constructor(name: string, public type: MockType) {
    super(name);
  }
}
