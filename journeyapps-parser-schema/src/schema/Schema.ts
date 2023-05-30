import { Version, DEFAULT as DEFAULT_VERSION } from '@journeyapps/parser-common';
import * as parser from './schemaParser';
import { Variable } from '../types/Variable';
import { QueryType } from '../types/collections/QueryType';
import { ArrayType } from '../types/collections/ArrayType';
import { Relationship } from '../types/Relationship';
import { ObjectType } from '../types/ObjectType';
import { Type } from '../types/Type';
import { ValidationError } from '@journeyapps/core-xml';
import { XMLError, XMLElement } from '@journeyapps/domparser/types';
import { TypeInterface } from '@journeyapps/evaluator';
import { PrimitiveTypeMap, PrimitiveTypeNames } from '../types/primitives';

export type ObjectTypeFactoryName =
  | typeof Variable.TYPE
  | typeof ObjectType.TYPE
  | typeof ArrayType.TYPE
  | typeof QueryType.TYPE
  | typeof Relationship.TYPE;

export interface TypeFactory {
  name: PrimitiveTypeNames | ObjectTypeFactoryName;
  generate: <T>(event?: any) => any;
}

export type InferGetType<
  T extends string | PrimitiveTypeNames,
  MAP extends { [key in PrimitiveTypeNames]: typeof Type } = PrimitiveTypeMap
> = T extends PrimitiveTypeNames ? InstanceType<MAP[T]> : ObjectType;

export class Schema {
  typeFactories: { [key: string]: TypeFactory } = {};

  objects: { [index: string]: ObjectType };
  errors: (ValidationError | XMLError)[];

  sourceElement: XMLElement;

  // these are used by the tern defs (legacy editor)
  apiVersion?;
  mobileUserType?;

  // Create a new blank schema. Use schema.loadXml() to load from XML data.
  constructor() {
    this.objects = {};
    this.errors = [];

    this.registerTypeFactory({
      name: Variable.TYPE,
      generate: <T extends TypeInterface = Type>(event) => new Variable<T>(event.name, event.type)
    });
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
    this.registerTypeFactory({
      name: Relationship.TYPE,
      generate: () => new Relationship()
    });

    // Register all the primitive types
    for (const primitiveName of Object.keys(PrimitiveTypeMap)) {
      this.registerTypeFactory({
        name: primitiveName as PrimitiveTypeNames,
        generate: () => new PrimitiveTypeMap[primitiveName]()
      });
    }
  }

  registerTypeFactory(factory: TypeFactory) {
    this.typeFactories[factory.name] = factory;
  }

  getFactory(name: string) {
    return this.typeFactories[name];
  }

  loadXml(rawxml: string, options: { apiVersion?: Version; recordSource?: boolean } = {}) {
    const apiVersion = options.apiVersion || DEFAULT_VERSION; // Default to allowing only v2
    let myParser = parser.parser(this, {
      version: apiVersion,
      recordSource: options.recordSource
    });
    myParser.parse(rawxml);
    this.errors = myParser.getErrors();
    return this;
  }

  /** Helper function to assist in creating variables */
  variable<T extends TypeInterface = Type>(name?: string, type?: string): Variable<T>;
  variable<T extends TypeInterface = Type>(name?: string, type?: T): Variable<T>;
  variable<T extends TypeInterface = Type>(name?: string, type?: T | string): Variable<T> {
    const _type = typeof type === 'string' ? this.getType(type) : type;
    return this.getFactory(Variable.TYPE).generate<T>({ name, type: _type });
  }

  /** Helper function to assist in creating query variables */
  queryVariable(name: string, typeName: string) {
    const objectType = this.getType(typeName);
    const queryType = this.queryType(objectType);
    return this.variable(name, queryType);
  }

  /** Helper function to assist in creating array variables */
  arrayVariable(name: string, typeName: string) {
    const objectType = this.getType(typeName);
    const arrayType = this.arrayType(objectType);
    return this.variable(name, arrayType);
  }

  queryType(objectType: ObjectType) {
    return this.getFactory(QueryType.TYPE).generate({ objectType });
  }

  arrayType(objectType: ObjectType) {
    return this.getFactory(ArrayType.TYPE).generate({ objectType });
  }

  newObjectType(name?: string) {
    return this.getFactory(ObjectType.TYPE).generate({ name }) as ObjectType;
  }

  newRelationship() {
    return this.getFactory(Relationship.TYPE).generate() as Relationship;
  }

  // Given a type name, return the specified type. Returns `undefined` if the type is not found.
  // The type name may refer to a primitive, or an object type defined in the schema.
  getType<T extends string | PrimitiveTypeNames>(typeName: T): InferGetType<T> {
    if (typeName in PrimitiveTypeMap) {
      // primitive
      return this.primitive(typeName);
    }
    // not a primitive - most likely an object
    return this.objects[typeName] as InferGetType<T>;
  }

  primitive<T extends string | PrimitiveTypeNames>(name: T): InferGetType<T> {
    if (!(name in PrimitiveTypeMap)) {
      return null;
    }
    const factory = this.getFactory(name);
    if (factory) {
      return factory.generate();
    } else {
      return null;
    }
  }

  toJSON() {
    return {
      objects: this.objects
    };
  }
}

export function parser2(schema: Schema) {
  return parser.parser(schema, { version: { v3: false } });
}

export function parser3(schema: Schema) {
  return parser.parser(schema, { version: { v3: true, v3_1: true } });
}
