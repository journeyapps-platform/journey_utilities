import { Type } from '../Type';

// Create a base class for primitive types with a constructor creating a default instance of that type.
export class PrimitiveType extends Type {
  isPrimitiveType: boolean;
  subType?: string;

  constructor(name: string) {
    super(name);
    this.isPrimitiveType = true;
  }
}
