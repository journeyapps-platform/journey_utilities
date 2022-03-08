import { ComponentParseEvent } from './ComponentParseEvent';

export interface V5ViewInterface {
  config: any;
}

export enum ComponentSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

export enum ColorScheme {
  LIGHT = 'light',
  DARK = 'dark'
}

export interface ComponentParser {
  options: {
    name: string;
    key?: string;
  };
  parse(event: ComponentParseEvent);
  view: V5ViewInterface;
  setView(view: V5ViewInterface);
}
