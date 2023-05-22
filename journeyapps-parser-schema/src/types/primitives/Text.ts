import { TypeInterface } from '@journeyapps/evaluator';
import { PrimitiveType } from './PrimitiveType';

export class TextType extends PrimitiveType {
  static TYPE = 'text';

  static isInstanceOf(type: TypeInterface): type is TextType {
    return type.name === TextType.TYPE;
  }

  spec?: string;

  constructor() {
    super(TextType.TYPE);
  }

  toJSON() {
    const json = {} as any;
    if (this.spec != null) {
      json.spec = this.spec;
    }
    if (this.subType != null) {
      json.subType = this.subType;
    }
    return json;
  }
}
