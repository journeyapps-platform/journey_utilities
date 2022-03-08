import { BaseAdapter } from './BaseAdapter';
import { Query } from './Query';
import { ObjectData, PersistedObjectData } from './ObjectData';
import { DatabaseAdapter } from './DatabaseAdapter';
import { ExecuteBatchOperation } from './Batch';

var logQuery = BaseAdapter.logQuery;

function queryMessage(query: string, args: (string | number)[]) {
  if (args) {
    args.forEach(function (arg) {
      query = query.replace('?', JSON.stringify(arg));
    });
  }
  return query;
}

interface SqlResult {
  rows: {
    length: number;
    item(i: number): any;
  };
}

interface SqlError {}

export interface ExplainedResult {
  type: 'index' | 'full scan';
  results: number;
  scanned: number;
  data: ObjectData[];
  duration?: number;
}

interface SqlTransaction {
  executeSql(
    sqlStatement: string,
    args?: (number | string)[],
    callback?: (tx: SqlTransaction, r: SqlResult) => void,
    errorCallback?: (error: SqlError) => void
  ): void;
  loggedSql?(
    sqlStatement: string,
    args?: (number | string)[],
    callback?: (tx: SqlTransaction, r: SqlResult) => void,
    errorCallback?: (error: SqlError) => void
  ): void;
}

export class WebSQLAdapter extends BaseAdapter implements DatabaseAdapter {
  static adapterName = 'WebSQLAdapter';
  static supportsDiagnostics = true;

  /**
   * Clear the database. Returns a promise that is resolved when the database is cleared.
   */
  static clear(keepCrud?: boolean) {
    function clearDatabase(name: string) {
      return new Promise(function (resolve, reject) {
        var db = WebSQLAdapter.prototype.openDatabase(name);

        function onSuccess(tx: SqlTransaction, r: any) {
          resolve(true);
        }

        function onError(e: any) {
          resolve(false);
        }

        db.transaction(
          function (tx: SqlTransaction) {
            tx.executeSql('DROP INDEX IF EXISTS objects_type_id');
            tx.executeSql('DROP TABLE IF EXISTS objects');
            tx.executeSql('DROP TABLE IF EXISTS object_indexes');
            if (!keepCrud) {
              tx.executeSql('DROP TABLE IF EXISTS crud');
            }
            tx.executeSql('DROP TABLE IF EXISTS versions');
          },
          onError,
          onSuccess
        );
      });
    }

    return Promise.all([clearDatabase('objects'), clearDatabase('local-objects')]);
  }

  private db: any;
  batchLimit = 1000;

  constructor(options: any) {
    super();
    this.db = null;

    var dbName = options.name || 'objects';

    this.name = dbName;

    this.db = this.openDatabase(dbName);

    var version: number = null;

    function retrievedVersion(tx: SqlTransaction, rs: SqlResult) {
      if (rs.rows.length >= 1) {
        version = rs.rows.item(0).version;
      } else {
        version = 0;
      }
    }

    this.promise = this.promisedTransaction((tx) => {
      tx.loggedSql('CREATE TABLE IF NOT EXISTS versions(name TEXT PRIMARY KEY, version INTEGER)', []);
      tx.loggedSql('SELECT * FROM versions WHERE name=?', ['db'], retrievedVersion);
    }).then(() => {
      return this.promisedTransaction(function (tx) {
        if (version < 1) {
          tx.loggedSql('DROP TABLE IF EXISTS objects');
          tx.loggedSql('CREATE TABLE objects(id TEXT PRIMARY KEY, type TEXT, uid TEXT, hash INTEGER, data TEXT)', []);
          tx.loggedSql('CREATE INDEX IF NOT EXISTS objects_type_id ON objects(type, id)', []);
          tx.loggedSql('CREATE TABLE IF NOT EXISTS crud (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT)', []);
        }

        if (version < 2) {
          tx.loggedSql('CREATE INDEX IF NOT EXISTS objects_uid ON objects(uid)', []);
        }

        if (version < 6) {
          tx.loggedSql('DROP TABLE IF EXISTS object_indexes', []);
          tx.loggedSql('DROP INDEX IF EXISTS objects_by_index_version', []);
        }

        version = 6;
        tx.loggedSql('INSERT OR REPLACE INTO versions(name, version) VALUES(?, ?)', ['db', version]);
      });
    });
  }

  description() {
    return 'WebSQL';
  }

  applyCrud(crud: any[]) {
    this.ensureOpen();
    var ids: string[] = [];
    return this.promisedTransaction((tx) => {
      for (let i = 0; i < crud.length; i++) {
        const operation = crud[i];
        const action = Object.keys(operation)[0];
        const data = operation[action];
        if (action == 'put') {
          ids.push(data.id);

          this.transactionSaveData(tx, data.type, data.id, data, null);
        } else if (action == 'delete') {
          this.transactionDestroy(tx, data.type, data.id);
        } else {
          throw new Error('Unknown action: ' + action);
        }
      }
    }).then(function () {
      return { updatedIds: ids };
    });
  }

  /**
   * Apply a batch of operations in a single transaction.
   *
   * The entire batch is either successful or not - we don't return errors for
   * individual objects.
   */
  async applyBatch(crud: ExecuteBatchOperation[]): Promise<any[]> {
    this.ensureOpen();
    var results: any[] = [];
    await this.promisedTransaction((tx: SqlTransaction) => {
      for (var i = 0; i < crud.length; i++) {
        var operation = crud[i];
        var action = operation.op;
        if (action == 'put') {
          this.transactionSaveData(tx, operation.type, operation.id, operation.data, null);
        } else if (action == 'patch') {
          this.transactionSaveData(tx, operation.type, operation.id, operation.data, operation.patch);
        } else if (action == 'delete') {
          this.transactionDestroy(tx, operation.type, operation.id);
        } else {
          throw new Error('Unknown action: ' + action);
        }
        results.push({});
      }
    });
    return results;
  }

  /**
   * Perform a query.
   * Returns a promise that is resolved with the resultset.
   */
  async executeQuery(query: Query): Promise<ObjectData[]> {
    const skip = query.skipNumber;
    const limit = query.limitNumber;
    const { data } = await this.executeTableScan(query);
    let result: ObjectData[] = [];
    if (skip >= data.length) {
      return result;
    }
    const startIndex = !skip ? 0 : skip;

    for (
      let i = startIndex, recordCount = 0;
      i < data.length && (limit == null || recordCount < limit);
      i++, recordCount++
    ) {
      result.push(data[i]);
    }
    return result;
  }

  explain(query: Query): Promise<ExplainedResult> {
    const start = new Date();
    return this.executeTableScan(query).then(function (results) {
      results.duration = new Date().getTime() - start.getTime();
      return results;
    });
  }

  executeTableScan(query: Query): Promise<ExplainedResult> {
    this.ensureOpen();

    var typeName = query.type.name;

    return this.simpleQuery('SELECT * FROM objects WHERE type=?', [typeName]).then((rs) => {
      let all: ObjectData[] = [];
      for (let i = 0; i < rs.rows.length; i++) {
        const row = rs.rows.item(i);
        const data: PersistedObjectData = JSON.parse(row.data);
        const result: ObjectData = {
          ...data,
          type: row.type,
          id: row.id
        };
        all.push(result);
      }

      const filtered = query._filter(all);
      const sorted = query._sort(filtered);

      const result: ExplainedResult = {
        type: 'full scan',
        results: sorted.length,
        scanned: all.length,
        data: sorted
      };
      return result;
    });
  }

  // Lookup an object. Returns a promise that is resolved with the object data.
  async get(type: string, id: string): Promise<ObjectData> {
    this.ensureOpen();
    if (id == null) {
      return null;
    }
    if (typeof id != 'string') {
      throw new Error('id must be a string, got: ' + typeof id);
    }
    const rs = await this.simpleQuery('SELECT * FROM objects WHERE type=? AND id=? LIMIT 1', [type, id]);
    if (rs.rows.length >= 1) {
      const row = rs.rows.item(0);
      const data: PersistedObjectData = JSON.parse(row.data);
      const result = {
        ...data,
        type: row.type,
        id: row.id
      };
      return result;
    } else {
      return null;
    }
  }

  getAll(type: string, ids: string[]): Promise<ObjectData[]> {
    this.ensureOpen();
    // This implementation is an optimization that loads all the objects in a single transaction.
    let resultsets: SqlResult[] = [];

    function resultHandler(index: number) {
      return function (tx: SqlTransaction, rs: SqlResult) {
        resultsets[index] = rs;
      };
    }

    const startAt = new Date();

    return this.promisedTransaction(function (tx) {
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        tx.loggedSql('SELECT * FROM objects WHERE type=? AND id=? LIMIT 1', [type, id], resultHandler(i));
      }
    }).then(function () {
      let results: ObjectData[] = [];
      for (let i = 0; i < ids.length; i++) {
        const rs = resultsets[i];
        if (rs.rows.length >= 1) {
          const row = rs.rows.item(0);
          const data: PersistedObjectData = JSON.parse(row.data);

          results.push({
            ...data,
            type: row.type,
            id: row.id
          });
        } else {
          results.push(null);
        }
      }

      const endAt = new Date();
      const duration = endAt.getTime() - startAt.getTime();
      logQuery('Retrieved ' + ids.length + ' objects of type ' + type + ' in ' + duration + 'ms');

      return results;
    });
  }

  estimateBytesUsed() {
    // We only count the length of the dynamically-sized data here
    var dataSum = this.simpleQuery('SELECT SUM(LENGTH(data) + LENGTH(type)) as sum FROM objects').then(function (rs) {
      if (rs.rows.length >= 1) {
        var row = rs.rows.item(0);
        return row.sum;
      } else {
        return 0;
      }
    });

    var objectCount = this.simpleQuery('SELECT COUNT(id) as count FROM objects').then(function (rs) {
      if (rs.rows.length >= 1) {
        var row = rs.rows.item(0);
        return row.count;
      } else {
        return 0;
      }
    });

    return Promise.all([dataSum, objectCount]).then(function (results) {
      var sum = results[0];
      var count = results[1];

      // ID + UID take up 52 characters
      var stringCharacters = sum + 52 * count;

      // 20 bytes overhead per record (including the hash)
      var overhead = 20 * count;

      // 2 bytes per character
      return stringCharacters * 2 + overhead;
    });
  }

  openDatabase(name: string) {
    return (window as any).openDatabase(name, 'Objects', 20 * 1024 * 1024, function () {
      // Database opened.
    });
  }

  private promisedTransaction(fn: (tx: SqlTransaction) => void): Promise<void> {
    const self = this;
    return new Promise((resolve, reject) => {
      function onSuccess(tx: SqlTransaction, r: any) {
        resolve(r);
      }

      function onError(e: any) {
        if (!self.closed) {
          self.logError('Transaction error', e);
        } else {
          // When we're closed, we don't care about the error, so we don't log it.
        }
        reject(e);
      }

      this.db.transaction(
        (tx: SqlTransaction) => {
          tx.loggedSql = function (sqlStatement, args, callback, errorCallback) {
            logQuery(queryMessage(sqlStatement, args));
            tx.executeSql(sqlStatement, args, callback, errorCallback);
          };
          return fn(tx);
        },
        onError,
        onSuccess
      );
    });
  }

  private simpleQuery(query: string, parameters?: (string | number)[]): Promise<SqlResult> {
    var resultset: SqlResult = null;

    function handleResults(tx: SqlTransaction, rs: SqlResult) {
      resultset = rs;
    }

    var startAt = new Date();

    return this.promisedTransaction((tx) => {
      tx.executeSql(query, parameters, handleResults);
    }).then(
      function () {
        var endAt = new Date();
        var duration = endAt.getTime() - startAt.getTime();
        logQuery(queryMessage(query, parameters), ' in ' + duration + 'ms');
        return resultset;
      },
      (err) => {
        this.logError(query, parameters, ' failed with ', err);
        return Promise.reject(err);
      }
    );
  }

  private transactionSaveData(
    tx: SqlTransaction,
    type: string,
    id: string,
    data: PersistedObjectData,
    patch?: PersistedObjectData
  ) {
    tx.loggedSql('INSERT OR REPLACE INTO objects(id, type, data) VALUES (?,?,?)', [
      id,
      type,
      JSON.stringify({
        attributes: data.attributes ?? {},
        belongs_to: data.belongs_to ?? {}
      })
    ]);
  }

  private transactionDestroy(tx: SqlTransaction, type: string, id: string) {
    tx.loggedSql('DELETE FROM objects WHERE type=? AND id=?', [type, id]);
  }

  private logError(...args: any[]) {
    console.error(...args); // tslint:disable-line
  }
}

function queryIn(count: number) {
  var q = '';
  for (var i = 0; i < count; i++) {
    q += (q === '' ? '' : ', ') + '?';
  }
  return q;
}
