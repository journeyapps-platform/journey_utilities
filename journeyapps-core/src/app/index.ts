// Entrypoint for bundled modules

// Modules
import * as view from './view';
import * as applicationParser from './applicationParser';
import * as globalviewParser from './globalviewParser';
import * as syncRulesParser from './syncRulesParser';
import * as navParser from './navParser';

export { view, applicationParser, globalviewParser, navParser, syncRulesParser };

// Shorter versions for convenience
export * from './view';
export { SUPPORTED_COMPONENT_TAGS } from './viewParser';
