import { AbstractTypeFactory } from '../AbstractTypeFactory';
import { ObjectType } from '../ObjectType';
import { TypeInterface } from '@journeyapps/evaluator';
import { CollectionType, GenerateCollectionTypeEvent } from './CollectionType';

export class ArrayType extends CollectionType {
  static TYPE = 'array';

  static isInstanceOf(type: TypeInterface): type is ArrayType {
    return type.name === ArrayType.TYPE;
  }

  constructor(objectType: ObjectType) {
    super(ArrayType.TYPE, objectType);
  }
}

export class ArrayTypeFactory<T extends ArrayType = ArrayType> extends AbstractTypeFactory<
  T,
  GenerateCollectionTypeEvent
> {
  constructor() {
    super(ArrayType.TYPE);
  }

  generate(event: GenerateCollectionTypeEvent): T {
    return new ArrayType(event.objectType) as T;
  }
}
