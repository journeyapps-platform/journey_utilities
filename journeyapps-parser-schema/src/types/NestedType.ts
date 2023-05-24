import { TypeInterface } from '@journeyapps/evaluator';
import { Schema } from '../schema/Schema';
import { parseJsonVariable } from '../schema/schemaParser';
import { AbstractTypeFactory, GenerateTypeEvent } from './AbstractTypeFactory';
import { Type } from './Type';

export class NestedType<T extends TypeInterface = Type> extends Type {
  static TYPE = 'scope';

  static isInstanceOf(type: TypeInterface) {
    return type.name === NestedType.TYPE;
  }

  static fromJSON(schema: Schema, parent: Type, data: any) {
    const type = new NestedType(parent);
    for (let name in data) {
      // Include parent keys
      const varData = data[name];
      const variable = parseJsonVariable(schema, name, varData);
      type.addAttribute(variable);
    }
    return type;
  }

  constructor(public parent?: T) {
    super(NestedType.TYPE);

    if (this.parent) {
      this.attributes = Object.create(parent.attributes);
    }
  }

  toJSON() {
    let result: { [index: string]: any } = {};
    for (let key in this.attributes) {
      // Don't include parent keys
      if (this.attributes.hasOwnProperty(key)) {
        result[key] = this.attributes[key].toJSON();
      }
    }
    return result;
  }
}

export interface GenerateNestedTypeEvent<T extends Type> extends GenerateTypeEvent {
  parent?: T;
}

export class NestedTypeFactory<T extends Type = Type> extends AbstractTypeFactory<
  NestedType,
  GenerateNestedTypeEvent<T>
> {
  constructor() {
    super(NestedType.TYPE);
  }

  generate(event: GenerateNestedTypeEvent<T>) {
    return new NestedType(event?.parent);
  }
}
