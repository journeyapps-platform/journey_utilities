import { Collection } from './Collection';

export interface GenericDatabase {
  [key: string]: Collection;
}
