import { TypeInterface } from '@journeyapps/evaluator';
import { EnumOption } from '../../schema/EnumOption';
import { PrimitiveType } from './PrimitiveType';

export interface ChoiceTypeConfig {
  multiple: boolean;
}

export abstract class ChoiceType extends PrimitiveType {
  static isInstanceOf(type: TypeInterface): type is ChoiceType {
    return 'options' in type && 'addOption' in type;
  }

  options: { [key: string]: EnumOption };
  multipleOptions?: boolean;

  constructor(name: string, config?: ChoiceTypeConfig) {
    super(name);
    this.options = {};
    this.multipleOptions = config?.multiple;
  }

  get hasOptions(): boolean {
    return Object.keys(this.options).length > 0;
  }

  addOption(value: any, label: string, index: number): EnumOption {
    if (value in this.options) {
      throw new Error("key '" + value + "' is already used");
    }
    this.options[value] = new EnumOption(value, label, index);
    return this.options[value];
  }

  values(obj: any) {
    return Object.keys(obj).map((key) => {
      return obj[key].toJSON();
    });
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      options: Object.keys(this.options).map((key) => {
        return this.options[key].toJSON();
      })
    };
  }
}
