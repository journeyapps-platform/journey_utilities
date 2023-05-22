import { TypeInterface } from './TypeInterface';

export interface IVariable<T extends TypeInterface = TypeInterface> {
  name: string;
  type: T;
  label?: string;
  toJSON(): Record<string, any>;
}
