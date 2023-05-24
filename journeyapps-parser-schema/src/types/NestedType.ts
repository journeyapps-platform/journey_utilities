import { TypeInterface } from '@journeyapps/evaluator';
import { Schema } from '../schema/Schema';
import { parseJsonVariable } from '../schema/schemaParser';
import { Type } from './Type';

export class NestedType extends Type {
  static TYPE = 'scope';
  static fromJSON(schema: Schema, parent: Type, data: any) {
    var type = new NestedType(parent);
    for (let name in data) {
      // Include parent keys
      if (true) {
        const varData = data[name];
        const variable = parseJsonVariable(schema, name, varData);
        type.addAttribute(variable);
      }
    }
    return type;
  }

  static isInstanceOf(type: TypeInterface) {
    return type.name === NestedType.TYPE;
  }

  constructor(parent: Type) {
    super(NestedType.TYPE);

    if (parent) {
      this.attributes = Object.create(parent.attributes);
    }
  }

  toJSON() {
    let result: { [index: string]: any } = {};
    for (var key in this.attributes) {
      // Don't include parent keys
      if (this.attributes.hasOwnProperty(key)) {
        result[key] = this.attributes[key].toJSON();
      }
    }
    return result;
  }
}
