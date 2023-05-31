import { QueryType as SchemaQueryType, QueryTypeFactory as SchemaQueryTypeFactory } from '@journeyapps/parser-schema';
import { Query } from '../query/Query';
import { ObjectType } from './ObjectType';
import { DBTypeMixin } from './Type';

export class QueryType extends DBTypeMixin(SchemaQueryType) {
  clone = function (query: Query) {
    return query._clone();
  };
  cast = function (this: QueryType, value: any) {
    if (typeof value != 'object') {
      throw new Error(value + ' is not an object');
    }
    const thisTypeName = this.objectType.name;
    if (
      value.type != null &&
      value.type instanceof ObjectType &&
      value.type.name == thisTypeName &&
      typeof value._fetch == 'function'
    ) {
      // This implies that value is (likely) also an instance of Query.
      return value;
    } else {
      // We do not print the value here, since it may be a massive array.
      throw new Error('Expected value to have query type ' + thisTypeName);
    }
  };
}

export class QueryTypeFactory extends SchemaQueryTypeFactory {
  generate(event) {
    return new QueryType(event.objectType);
  }
}
