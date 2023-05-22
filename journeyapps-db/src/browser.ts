import * as database from './database/Database';
import * as query from './query/queryOperations';

// Convenience export
export { Day } from '@journeyapps/core-date';

/**
 * @deprecated
 */
export { database, query };

export { Attachment } from './Attachment';
export * from './Location';
export * from './credentials/ApiCredentials';
export * from './credentials/MobileCredentials';
export * from './database/adapters/BaseAdapter';
export * from './database/Batch';
export * from './database/Collection';
export * from './database/DatabaseObject';
export * from './database/adapters/JourneyAPIAdapter';
export * from './database/adapters/WebSQLAdapter';
export * from './database/GenericDatabase';
export * from './database/GenericObject';
export * from './database/adapters/DatabaseAdapter';
export * from './database/ObjectData';

export * from './query/Query';
export * from './query/InternalQuery';

export * from './utils/base64';
export * from './utils/FunctionQueue';
export * from './utils/uuid';
export * from './database/Database';

export { Promise } from './JourneyPromise';
