// # schema module
// This module contains the logic for parsing and representing a schema in memory.

import { Version, DEFAULT as DEFAULT_VERSION } from '@journeyapps/parser-common';
import * as parser from './schemaParser';
import { Variable } from '../types/Variable';
import { QueryType } from '../types/collections/QueryType';
import { ArrayType } from '../types/collections/ArrayType';
import { ObjectType } from '../types/ObjectType';
import { Type } from '../types/Type';
import { primitives, primitive } from '../types/primitives';
import { Relationship } from '../types/Relationship';
import { ValidationError } from '@journeyapps/core-xml';
import { XMLError, XMLElement } from '@journeyapps/domparser/types';
import { TypeInterface } from '@journeyapps/evaluator';

export class Schema {
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
    if (typeof type === 'string') {
      return new Variable<T>(name, this.getType(type));
    } else {
      return new Variable<T>(name, type);
    }
  }

  /** Helper function to assist in creating query variables */
  queryVariable(name: string, typeName: string) {
    var objectType = this.getType(typeName);
    var queryType = new QueryType(objectType);
    return new Variable(name, queryType);
  }

  /** Helper function to assist in creating array variables */
  arrayVariable(name: string, typeName: string) {
    var objectType = this.getType(typeName);
    var arrayType = new ArrayType(objectType);
    return new Variable(name, arrayType);
  }

  queryType(objectType: ObjectType) {
    return new QueryType(objectType);
  }

  arrayType(objectType: ObjectType) {
    return new ArrayType(objectType);
  }

  // Given a type name, return the specified type. Returns `undefined` if the type is not found.
  // The type name may refer to a primitive, or an object type defined in the schema.
  getType(typeName: string) {
    if (typeof primitives[typeName] === 'undefined') {
      // not a primitive - most likely an object
      return this.objects[typeName];
    } else {
      // primitive
      return new primitives[typeName]();
    }
  }

  newObjectType() {
    return new ObjectType();
  }

  newRelationship() {
    return new Relationship();
  }

  toJSON() {
    return {
      objects: this.objects
    };
  }

  primitive(name: string) {
    return primitive(name);
  }
}

export function parser2(schema: Schema) {
  return parser.parser(schema, { version: { v3: false } });
}

export function parser3(schema: Schema) {
  return parser.parser(schema, { version: { v3: true, v3_1: true } });
}
