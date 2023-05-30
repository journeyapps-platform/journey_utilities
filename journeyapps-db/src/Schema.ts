import { Schema, PrimitiveTypeNames } from '@journeyapps/parser-schema';
import { DBPrimitiveTypeMap } from './types/primitives';
import { ObjectType } from './types/ObjectType';
import { QueryType } from './types/QueryType';
import { ArrayType } from './types/ArrayType';
import { Type } from './types/Type';

type InferReturnType<T> = T extends PrimitiveTypeNames ? Type : ObjectType;

export class DBSchema extends Schema {
  constructor() {
    super();

    this.registerTypeFactory({
      name: ObjectType.TYPE,
      generate: () => new ObjectType()
    });
    this.registerTypeFactory({
      name: ArrayType.TYPE,
      generate: (event) => new ArrayType(event.objectType)
    });
    this.registerTypeFactory({
      name: QueryType.TYPE,
      generate: (event) => new QueryType(event.objectType)
    });

    // Register all the primitive types
    for (const primitiveName of Object.keys(DBPrimitiveTypeMap)) {
      this.registerTypeFactory({
        name: primitiveName as PrimitiveTypeNames,
        generate: () => new DBPrimitiveTypeMap[primitiveName]()
      });
    }
  }

  getType<T extends string | PrimitiveTypeNames>(typeName: T): InferReturnType<T> {
    return super.getType(typeName) as InferReturnType<T>;
  }
}
