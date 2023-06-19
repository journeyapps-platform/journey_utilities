import { WebSQLAdapter } from '../../dist/database/adapters/WebSQLAdapter';

var _hasWebSQL = false;

if (typeof window == 'undefined') {
  // Support websql in NodeJS.
  var openDatabase = require('websql');
  WebSQLAdapter.prototype.openDatabase = function () {
    return openDatabase(':memory:', '1.0', 'Test database', 1);
  };

  _hasWebSQL = true;
} else if (typeof (window as any).openDatabase != 'undefined') {
  _hasWebSQL = true;
}

export function hasWebSQL() {
  return _hasWebSQL;
}
