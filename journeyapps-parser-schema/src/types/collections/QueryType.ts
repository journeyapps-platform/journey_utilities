import { AbstractTypeFactory } from '../AbstractTypeFactory';
import { ObjectType } from '../ObjectType';
import { TypeInterface } from '@journeyapps/evaluator';
import { CollectionType, GenerateCollectionTypeEvent } from './CollectionType';

export class QueryType extends CollectionType {
  static TYPE = 'query';

  static isInstanceOf(type: TypeInterface): type is QueryType {
    return type.name === QueryType.TYPE;
  }

  constructor(objectType: ObjectType) {
    super(QueryType.TYPE, objectType);
  }
}

export class QueryTypeFactory<T extends QueryType = QueryType> extends AbstractTypeFactory<
  T,
  GenerateCollectionTypeEvent
> {
  constructor() {
    super(QueryType.TYPE);
  }

  generate(event: GenerateCollectionTypeEvent): T {
    return new QueryType(event.objectType) as T;
  }
}
