export enum IndexDirection {
  ASCENDING = 1,
  DESCENDING = -1
}

export enum IndexDatabase {
  CLOUD = 'cloud',
  APP = 'app'
}

export interface ModelIndex {
  name: string;
  /** @deprecated Use `keys` instead. */
  on: string[];
  keys: ModelIndexKey[];
  databases: IndexDatabase[];
}

export interface ModelIndexKey {
  field: string;
  dir: IndexDirection;
}
