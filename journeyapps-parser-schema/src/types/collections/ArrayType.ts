import { Type } from '../Type';
import { ObjectType } from '../ObjectType';
import { TypeInterface } from '@journeyapps/evaluator';
import { CollectionType } from './CollectionType';

export class ArrayType extends CollectionType {
  static TYPE = 'array';

  static isInstanceOf(type: TypeInterface): type is ArrayType {
    return type.name === ArrayType.TYPE;
  }

  constructor(objectType: ObjectType) {
    super(ArrayType.TYPE, objectType);
  }
}
