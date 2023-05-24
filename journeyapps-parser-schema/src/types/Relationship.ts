import { BaseType } from '@journeyapps/evaluator';
import { AbstractTypeFactory } from './AbstractTypeFactory';
import { ObjectType } from './ObjectType';

export class Relationship<O extends ObjectType = ObjectType> implements BaseType {
  static TYPE = 'relationship';

  /** one-to-many, many-to-many, one-to-one */
  type: string;

  /** local object type (containing the belongs_to) */
  objectType: O;

  /** foreign object type (containing the has_many) */
  foreignType: O;

  /** The name used on the local object to identify the relationship (singular) */
  name: string;

  /** The name used on the foreign object to identify the relationship (plural) */
  foreignName: string;

  constructor() {
    this.type = 'one-to-many';

    this.objectType = null;
    this.foreignType = null;

    this.name = null;
    this.foreignName = null;
  }

  toJSON() {
    return {
      type: this.type,
      name: this.name,
      foreignName: this.foreignName,
      foreignType: this.foreignType.name
    };
  }
}

export class RelationshipTypeFactory<
  O extends ObjectType = ObjectType,
  T extends Relationship<O> = Relationship<O>
> extends AbstractTypeFactory<T> {
  constructor() {
    super(Relationship.TYPE);
  }

  generate(): T {
    return new Relationship<O>() as T;
  }
}
