import { Type } from './Type';
import { FormatString, IVariable, TypeInterface } from '@journeyapps/evaluator';
import { Variable } from '../schema/Variable';
import { Relationship } from '../schema/Relationship';
import { Schema } from '../schema/Schema';
import { XMLElement } from '@journeyapps/domparser/types';
import { ModelIndex } from '../schema/ModelIndex';
import { TextType } from './primitives';

export class ObjectType extends Type {
  displayFormat: FormatString | null;
  displaySource?: XMLElement;
  label: string;

  belongsTo: { [index: string]: Relationship };
  hasMany: { [index: string]: Relationship };

  belongsToVars: { [index: string]: Variable };
  belongsToIdVars: { [index: string]: Variable };
  hasManyVars: { [index: string]: Variable };
  idVar: Variable<TextType>;

  /**
   * App and Cloud indexes.
   */
  allIndexes: ModelIndex[];
  /**
   * App indexes.
   */
  indexes: ModelIndex[];
  errors: any[]; // TODO
  webhooks: any[]; // TODO
  notifyUsers: NotificationConfig[];

  sourceElement: XMLElement;

  constructor(name?: string) {
    super(name);

    this.displayFormat = null;
    this.belongsTo = {};
    this.hasMany = {};
    this.belongsToVars = {};
    this.belongsToIdVars = {};
    this.hasManyVars = {};
    this.indexes = [];
    this.allIndexes = [];
    this.errors = [];
    this.webhooks = [];

    this.notifyUsers = [];

    this.idVar = new Variable('id', new TextType());
    this.isObject = true;
  }

  /**
   * Attribute or relationship variable.
   */
  getAttribute<T extends TypeInterface = TypeInterface, V extends IVariable<T> = Variable<T>>(name: string): V | null {
    if (name in this.attributes) {
      return super.getAttribute<T, V>(name);
    } else if (name in this.belongsToVars) {
      return this.belongsToVars[name] as unknown as V;
    } else if (name in this.belongsToIdVars) {
      return this.belongsToIdVars[name] as unknown as V;
    } else if (name in this.hasManyVars) {
      return this.hasManyVars[name] as unknown as V;
    } else if (name == 'id') {
      return this.idVar as unknown as V;
    } else {
      return null;
    }
  }

  getAttributes(): { [index: string]: Variable } {
    return {
      ...this.hasManyVars,
      ...this.belongsToIdVars,
      ...this.belongsToVars,
      ...this.attributes,
      id: this.idVar
    };
  }

  toJSON() {
    let belongsTo: {
      [index: string]: { type: string; foreignName: string };
    } = {};
    // hasMany is not populated yet
    const hasMany = {};

    for (let key in this.belongsTo) {
      if (this.belongsTo.hasOwnProperty(key)) {
        const rel = this.belongsTo[key];
        belongsTo[rel.name] = {
          type: rel.foreignType.name,
          foreignName: rel.foreignName
        };
      }
    }

    return {
      label: this.label,
      attributes: this.attributes,
      belongsTo: belongsTo,
      hasMany: hasMany,
      display: '' + this.displayFormat.toString()
    };
  }

  addBelongsTo(options: { schema: Schema; type?: string; foreignName?: string; name: string }) {
    const object = this;
    const schema = options.schema;
    let err;
    const rel = new Relationship();
    const typeName = options.type;
    const foreignName = options.foreignName;
    if (typeName != null) {
      let name = options.name;
      if (name == null || name === '') {
        name = typeName;
      }
      rel.name = name;
      rel.objectType = object;
      rel.foreignType = schema.objects[typeName];
      if (rel.foreignType == null) {
        err = new Error("Object '" + typeName + "' is not defined");
        (err as any).attribute = 'type';
        throw err;
      }

      if (object.belongsTo.hasOwnProperty(name)) {
        err = new Error("Relationship '" + name + "' is already defined");
        (err as any).attribute = 'name';
        throw err;
      } else {
        object.belongsTo[name] = rel;

        // For type lookups
        object.belongsToVars[name] = schema.variable(name, rel.foreignType);
        object.belongsToVars[name].relationship = name;

        const idVar = schema.variable<ObjectType>(name + '_id', 'text');
        idVar.relationship = name;
        idVar.isBelongsToId = true;
        object.belongsToIdVars[idVar.name] = idVar;
      }

      if (foreignName != null) {
        rel.foreignName = foreignName;
        rel.foreignType.hasMany[foreignName] = rel;
        rel.foreignType.hasManyVars[foreignName] = schema.variable(foreignName, schema.queryType(object));
      }
      return rel;
    }
    return null;
  }
}

export interface NotificationConfig {
  message: FormatString;
  recipient: string;
  received: string;
  badgeCount: string;
}
