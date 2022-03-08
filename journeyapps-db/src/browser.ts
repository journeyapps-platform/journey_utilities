import * as database from './Database';
import * as query from './queryOperations';

// Convenience export
export { Day } from '@journeyapps/core-date';

/**
 * @deprecated
 */
export { database, query };

export * from './credentials/ApiCredentials';
export * from './credentials/MobileCredentials';
export { Attachment } from './Attachment';
export * from './BaseAdapter';
export * from './Batch';
export * from './Collection';
export * from './DatabaseObject';
export * from './JourneyAPIAdapter';
export * from './Location';
export * from './Query';
export * from './WebSQLAdapter';
export * from './GenericDatabase';
export * from './GenericObject';
export * from './DatabaseAdapter';
export * from './InternalQuery';
export * from './ObjectData';

export * from './utils/base64';
export * from './utils/FunctionQueue';
export * from './utils/uuid';
export * from './Database';

export { Promise } from './JourneyPromise';
