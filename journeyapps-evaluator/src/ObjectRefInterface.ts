export interface ObjectRefJsonType {
  $object: {
    id: string;
    type: string;
    database: string;
  };
}

export interface ObjectRefInterface {
  id: string;
  type: string;
  database: string;
  toJSON(): ObjectRefJsonType;
}
