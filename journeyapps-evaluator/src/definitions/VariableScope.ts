import { TypeInterface } from './TypeInterface';

export interface VariableScope {
  type: TypeInterface;
  _display?(): Promise<string>;
  _cached?(field: string): any;
  _get?(field: string): Promise<any>;
  [key: string]: any;
}
