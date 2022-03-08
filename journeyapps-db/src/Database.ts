// ## Database
// This is the external database interface, the `DB` object.
import { ApiCredentialOptions, ApiCredentials } from './credentials';
import { JourneyAPIAdapter } from './JourneyAPIAdapter';
import { Schema } from '@journeyapps/parser-schema';
import { DatabaseAdapter } from './DatabaseAdapter';
import { Collection, TypedCollection } from './Collection';
import { Batch } from './Batch';
import { GenericDatabase } from './GenericDatabase';
import { DatabaseObject } from './DatabaseObject';
import { Query } from './Query';

export class Database {
  /**
   * Convenience factory method for getting a Database Object
   */
  static async instance(options: ApiCredentialOptions) {
    var credentials = new ApiCredentials(options);
    let api = new JourneyAPIAdapter(credentials, null);

    await api.loadDataModel();

    // setup a database instance now that we have all the required components
    return new Database(api.schema, api);
  }

  Batch: new () => Batch;
  schema: Schema;

  /** @internal */
  _adapter: DatabaseAdapter; // tslint:disable-line

  static getTypedDatabase<T extends { [key: string]: {} }, U = { [K in keyof T]?: TypedCollection<T[K]> }>(
    schema: Schema,
    adapter: DatabaseAdapter
  ): Database & U {
    return new Database(schema, adapter) as Database & U;
  }

  constructor(schema: Schema, adapter: DatabaseAdapter) {
    for (var name in schema.objects) {
      if (schema.objects.hasOwnProperty(name)) {
        ((this as any) as GenericDatabase)[name] = new Collection(adapter, schema.objects[name]);
      }
    }

    this.schema = schema;
    this._adapter = adapter;

    // Extends batch.Batch, passing adapter as an argument to the constfructor.
    class DatabaseBatch extends Batch {
      constructor() {
        super(adapter);
      }
    }

    this.Batch = DatabaseBatch;
  }
}

export { Collection, DatabaseObject, Query };
