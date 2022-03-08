import { Type } from './Type';
import { ObjectType } from './ObjectType';
import { TypeInterface } from '@journeyapps/evaluator';

export class QueryType extends Type {
  static TYPE = 'query';
  objectType: ObjectType;

  static isInstanceOf(type: TypeInterface): type is QueryType {
    return type.name === QueryType.TYPE;
  }

  constructor(objectType: ObjectType) {
    super(QueryType.TYPE);

    this.objectType = objectType;
    this.isCollection = true;
  }

  stringify(): string {
    return `${super.stringify()}:${this.objectType.name}`;
  }

  toJSON() {
    return {
      type: QueryType.TYPE,
      object: this.objectType.name
    };
  }
}
