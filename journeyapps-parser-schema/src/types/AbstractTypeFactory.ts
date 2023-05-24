import { BaseType } from '@journeyapps/evaluator';

export interface GenerateTypeEvent {}

export abstract class AbstractTypeFactory<
  T extends BaseType = BaseType,
  E extends GenerateTypeEvent = GenerateTypeEvent
> {
  type: string;
  constructor(type: string) {
    this.type = type;
  }
  abstract generate(event?: E): T;
}
