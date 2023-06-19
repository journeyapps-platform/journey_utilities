import { QueryType as SchemaQueryType, QueryTypeFactory as SchemaQueryTypeFactory } from '@journeyapps/parser-schema';
import { Query } from '../query/Query';
import { DBTypeMixin } from './Type';

export class QueryType extends DBTypeMixin(SchemaQueryType) {
  clone(query: Query) {
    return this.objectType.clone(query);
  }

  cast(value: any): any {
    return this.objectType.cast(value);
  }
}

export class QueryTypeFactory extends SchemaQueryTypeFactory {
  generate(event) {
    return new QueryType(event.objectType);
  }
}
