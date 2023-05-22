import { ObjectType } from '../types/ObjectType';

export class Relationship<O extends ObjectType = ObjectType> {
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
}
