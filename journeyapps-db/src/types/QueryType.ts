import { GenerateCollectionTypeEvent, QueryType, QueryTypeFactory } from '@journeyapps/parser-schema';
import { Query } from '../query/Query';
import { DBObjectType } from './ObjectType';
import { DBTypeMixin } from './primitives';

export class DBQueryType extends DBTypeMixin(QueryType) {
  objectType: DBObjectType;
  clone(query: Query) {
    return query._clone();
  }
}

export class DBQueryTypeFactory extends QueryTypeFactory {
  generate(event: GenerateCollectionTypeEvent) {
    return new DBQueryType(event.objectType);
  }
}
