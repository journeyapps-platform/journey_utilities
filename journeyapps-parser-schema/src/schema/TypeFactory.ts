import { TypeInterface } from '@journeyapps/evaluator';
import { ArrayType } from '../types/collections/ArrayType';
import { QueryType } from '../types/collections/QueryType';
import { ObjectType } from '../types/ObjectType';
import { PrimitiveTypeInstance, PrimitiveTypeMap, PrimitiveTypeName } from '../types/primitives';
import { Relationship } from '../types/Relationship';
import { Variable } from '../types/Variable';
import { Schema } from './Schema';

export interface TypeFactory<NAME extends string = string> {
  name: NAME;
  generate: <T>(event?: any) => any;
}

export interface GenerateTypeEvent {
  schema: Schema;
}

export type ObjectTypeInstance = Variable<any> | ObjectType | ArrayType | QueryType | Relationship;

export type ObjectTypeName =
  | typeof Variable.TYPE
  | typeof ObjectType.TYPE
  | typeof ArrayType.TYPE
  | typeof QueryType.TYPE
  | typeof Relationship.TYPE;

export abstract class AbstractObjectTypeFactory<
  R extends ObjectTypeInstance = ObjectTypeInstance,
  E extends GenerateTypeEvent = GenerateTypeEvent
> implements TypeFactory<ObjectTypeName>
{
  name: ObjectTypeName;

  constructor(name: ObjectTypeName) {
    this.name = name;
  }

  abstract generate<T>(event: E): R;
}

export class PrimitiveTypeFactory<T extends PrimitiveTypeInstance, E extends GenerateTypeEvent = GenerateTypeEvent>
  implements TypeFactory<PrimitiveTypeName>
{
  name: PrimitiveTypeName;
  constructor(name: PrimitiveTypeName) {
    this.name = name;
  }
  generate(event: E): T {
    const instance = new PrimitiveTypeMap[this.name]();
    instance.setupVariables(event.schema);
    return instance as T;
  }
}
