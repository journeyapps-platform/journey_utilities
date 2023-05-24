import { Query } from '../../query/Query';
import { ObjectData } from '../../types/ObjectData';
import { ExecuteBatchOperation } from '../Batch';
import { DatabaseAdapter } from './DatabaseAdapter';

// Enable for debugging
var LOG_QUERIES = false;

function logQuery(...args: any[]) {
  if (LOG_QUERIES) {
    console.log.apply(console, args);
  }
}

const DEFAULT_BATCH_LIMIT = 1000;

export abstract class BaseAdapter implements DatabaseAdapter {
  static logQuery(...args: any[]) {
    return logQuery.apply(null, args);
  }

  batchLimit = DEFAULT_BATCH_LIMIT;
  closed: boolean;
  adapterName: string;
  promise: Promise<void>;
  name: string;

  protected constructor() {
    this.closed = false;
    this.adapterName = (this.constructor as any).adapterName;
  }

  description() {
    return 'Unknown';
  }

  open(): Promise<void> {
    if (this.promise) {
      return this.promise;
    } else {
      return Promise.resolve(null);
    }
  }

  abstract get(type: string, id: string): Promise<ObjectData>;

  /**
   * Lookup a an array of IDs. Returns a promise that is resolved with an array of object data.
   */
  getAll(type: string, ids: string[]): Promise<ObjectData[]> {
    // Default (inefficient) implementation
    var promises = [];

    var startAt = new Date();

    for (var i = 0; i < ids.length; i++) {
      promises.push(this.get(type, ids[i]));
    }

    return Promise.all(promises).then(function (results) {
      var endAt = new Date();
      var duration = endAt.getTime() - startAt.getTime();
      logQuery('Retrieved ' + ids.length + ' objects of type ' + type + ' in ' + duration + 'ms');
      return results;
    });
  }

  async count(query: Query) {
    const data = await this.executeQuery(query);
    return data.length;
  }

  close() {
    this.closed = true;
  }

  ensureOpen() {
    if (this.closed) {
      throw new Error('Database closed');
    }
  }

  explain(query: Query): Promise<any> {
    throw new Error('Method not implemented.');
  }

  // These methods must be implemented by subclasses
  abstract applyBatch(ops: ExecuteBatchOperation[]): Promise<any[]>;
  abstract executeQuery(query: Query): Promise<ObjectData[]>;
}
