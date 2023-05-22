import { ObjectType } from '../ObjectType';
import { TypeInterface } from '@journeyapps/evaluator';
import { CollectionType } from './CollectionType';

export class QueryType extends CollectionType {
  static TYPE = 'query';

  static isInstanceOf(type: TypeInterface): type is QueryType {
    return type.name === QueryType.TYPE;
  }

  constructor(objectType: ObjectType) {
    super(QueryType.TYPE, objectType);
  }
}
