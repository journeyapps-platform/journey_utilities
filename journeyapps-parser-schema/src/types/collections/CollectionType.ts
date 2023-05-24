import { GenerateTypeEvent } from '../AbstractTypeFactory';
import { ObjectType } from '../ObjectType';
import { Type } from '../Type';

export interface GenerateCollectionTypeEvent extends GenerateTypeEvent {
  objectType: ObjectType;
}

/**
 * Collection type base class.
 */
export class CollectionType extends Type {
  objectType: ObjectType;

  constructor(name: string, objectType: ObjectType) {
    super(name);
    this.isCollection = true;
    this.objectType = objectType;
  }

  stringify(): string {
    return `${super.stringify()}:${this.objectType.name}`;
  }

  toJSON() {
    return {
      type: this.name,
      object: this.objectType.name
    };
  }
}
