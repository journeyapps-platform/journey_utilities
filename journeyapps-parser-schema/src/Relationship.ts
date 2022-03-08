import { ObjectType } from './ObjectType';

export class Relationship {
  /** one-to-many, many-to-many, one-to-one */
  type: string;

  /** local object type (containing the belongs_to) */
  objectType: ObjectType; // TODO

  /** foreign object type (containing the has_many) */
  foreignType: ObjectType; // TODO

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
