import { ObjectType } from '../ObjectType';
import { Type } from '../Type';

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
