import { DatabaseAdapter } from '../database/adapters/DatabaseAdapter';
import { ObjectType } from '@journeyapps/parser-schema';
import { Query } from './Query';
import { Expression } from './queryOperations';
import { DatabaseObject } from '../database/DatabaseObject';
import { ObjectData } from '../database/ObjectData';

export interface InternalQuery<T extends DatabaseObject = DatabaseObject> extends Query<T> {
  readonly adapter: DatabaseAdapter;
  readonly type: ObjectType;

  expression: Expression;

  ordering: any[];
  limitNumber: number;
  skipNumber: number;

  _fetch(): Promise<T[]>;
  _filter(data: ObjectData[]): ObjectData[];
  _sort(data: ObjectData[]): ObjectData[];
}
