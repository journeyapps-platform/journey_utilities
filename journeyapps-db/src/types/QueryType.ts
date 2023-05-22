import { QueryType } from '@journeyapps/parser-schema';
import { DBTypeMixin } from './primitives';
import { Query } from '../query/Query';

type GConstructor<T extends QueryType = QueryType> = new (...args: any[]) => T;

export function DBQueryTypeMixin<TBase extends GConstructor>(Base: TBase) {
  return class extends DBTypeMixin(Base) {
    clone(query: Query) {
      return query._clone();
    }
  };
}

export class DBQueryType extends DBQueryTypeMixin(QueryType) {}
