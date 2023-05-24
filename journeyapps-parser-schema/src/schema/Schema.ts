// # schema module
import { ValidationError } from '@journeyapps/core-xml';
import { XMLElement, XMLError } from '@journeyapps/domparser/types';
import { TypeInterface } from '@journeyapps/evaluator';
// This module contains the logic for parsing and representing a schema in memory.
import { DEFAULT as DEFAULT_VERSION, Version } from '@journeyapps/parser-common';
import { AbstractTypeFactory } from '../types/AbstractTypeFactory';
import { ArrayType, ArrayTypeFactory } from '../types/collections/ArrayType';
import { QueryType, QueryTypeFactory } from '../types/collections/QueryType';
import { ObjectType, ObjectTypeFactory } from '../types/ObjectType';
import { PrimitiveTypeMap, PrimitiveTypeName } from '../types/primitives';
import { Relationship, RelationshipTypeFactory } from '../types/Relationship';
import { Type } from '../types/Type';
import { Variable, VariableTypeFactory } from '../types/Variable';
import * as parser from './schemaParser';

export class Schema {
  factories: { [index: string]: AbstractTypeFactory }; // Type registry
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
    this.factories = {}; // Initialize the factory registry

    this.registerTypeFactory(new ObjectTypeFactory());
    this.registerTypeFactory(new ArrayTypeFactory());
    this.registerTypeFactory(new QueryTypeFactory());
    this.registerTypeFactory(new VariableTypeFactory());
    this.registerTypeFactory(new RelationshipTypeFactory());

    // Register all primitive type
    Object.keys(PrimitiveTypeMap).forEach((key) => {
      this.registerTypeFactory({
        type: key,
        generate: () => new PrimitiveTypeMap[key]()
      });
    });
  }

  // Register a factory for a specific class
  registerTypeFactory(factory: AbstractTypeFactory) {
    this.factories[factory.type] = factory;
  }

  // Factory method for creating Variable instances
  variable<T extends TypeInterface = Type>(name?: string, type?: string): Variable<T>;
  variable<T extends TypeInterface = Type>(name?: string, type?: T): Variable<T>;
  variable<T extends TypeInterface = Type>(name?: string, type?: T | string): Variable<T> {
    const variableFactory = this.factories[Variable.TYPE] as VariableTypeFactory<T>; // Retrieve the factory from the registry
    if (variableFactory) {
      const variableType = typeof type === 'string' ? this.getType(type) : type;
      return variableFactory.generate({ name, type: variableType as T });
    } else {
      throw new Error('Variable factory is not registered');
    }
  }

  /** Helper function to assist in creating query variables */
  queryVariable<T extends ObjectType = ObjectType>(name: string, typeName: string) {
    const objectType = this.getType(typeName) as T;
    const queryType = this.queryType(objectType);
    return this.variable(name, queryType);
  }

  /** Helper function to assist in creating array variables */
  arrayVariable<T extends ObjectType = ObjectType>(name: string, typeName: string) {
    const objectType = this.getType(typeName) as T;
    const arrayType = this.arrayType(objectType);
    return this.variable(name, arrayType);
  }

  queryType<T extends ObjectType = ObjectType>(objectType: T) {
    const queryTypeFactory = this.factories[QueryType.TYPE] as QueryTypeFactory; // Retrieve the factory from the registry
    if (queryTypeFactory) {
      return queryTypeFactory.generate({ objectType }); // Invoke the factory function
    } else {
      throw new Error('QueryType factory is not registered');
    }
  }

  // Factory method for creating ArrayType instances
  arrayType<T extends ObjectType = ObjectType>(objectType: T) {
    const arrayTypeFactory = this.factories[ArrayType.TYPE] as ArrayTypeFactory; // Retrieve the factory from the registry
    if (arrayTypeFactory) {
      return arrayTypeFactory.generate({ objectType }); // Invoke the factory function
    } else {
      throw new Error('ArrayType factory is not registered');
    }
  }

  // Factory method for creating ObjectType instances
  newObjectType() {
    const objectTypeFactory = this.factories[ObjectType.TYPE] as ObjectTypeFactory; // Retrieve the factory from the registry
    if (objectTypeFactory) {
      return objectTypeFactory.generate(); // Invoke the factory function
    } else {
      throw new Error('ObjectType factory is not registered');
    }
  }

  // Factory method for creating Relationship instances
  newRelationship() {
    const relationshipFactory = this.factories[Relationship.TYPE]; // Retrieve the factory from the registry
    if (relationshipFactory) {
      return relationshipFactory.generate();
    } else {
      throw new Error('Relationship factory is not registered');
    }
  }

  // Given a type name, return the specified type. Returns `undefined` if the type is not found.
  // The type name may refer to a primitive, or an object type defined in the schema.
  getType(typeName: string) {
    // not a primitive - most likely an object
    return this.primitive(typeName as PrimitiveTypeName) ?? this.objects[typeName];
  }

  // Return a new instance of the primitive type with the given name and return type from the mapping above
  primitive<T extends PrimitiveTypeName>(name: T | string): InstanceType<typeof PrimitiveTypeMap[T]> | null {
    const factory = this.factories[name];
    if (factory) {
      return factory.generate() as InstanceType<typeof PrimitiveTypeMap[T]>;
    } else {
      return null;
    }
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
