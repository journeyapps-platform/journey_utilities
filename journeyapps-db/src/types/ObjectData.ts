export interface PersistedObjectData {
  attributes: { [index: string]: any };
  belongs_to: { [index: string]: string };
}

export interface ObjectData extends PersistedObjectData {
  id: string;
  type: string;
}
