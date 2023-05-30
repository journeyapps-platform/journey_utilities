import { Schema, PrimitiveTypeNames, InferGetType } from '@journeyapps/parser-schema';
import { DBPrimitiveTypeMap } from './types/primitives';
import { ObjectType } from './types/ObjectType';
import { QueryType } from './types/QueryType';
import { ArrayType } from './types/ArrayType';

export class DBSchema extends Schema {
  constructor() {
    super();

    this.registerTypeFactory({
      name: ObjectType.TYPE,
      generate: (event) => new ObjectType(event?.name)
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

  getType<T extends string | PrimitiveTypeNames>(typeName: T): InferGetType<T, DBPrimitiveTypeMap> {
    return super.getType(typeName);
  }

  primitive<T extends string | PrimitiveTypeNames>(name: T): InferGetType<T, DBPrimitiveTypeMap> {
    return super.primitive(name);
  }
}
