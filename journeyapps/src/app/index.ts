// Entrypoint for bundled modules

// Modules
import * as evaluator from '@journeyapps/evaluator';
import * as xml from '@journeyapps/core-xml';
import * as schema from '@journeyapps/parser-schema';
import { view, applicationParser, globalviewParser, navParser } from '@journeyapps/core';
import * as date from '@journeyapps/core-date';
import * as version from '@journeyapps/parser-common';

// Shorter versions for convenience
import { Schema } from '@journeyapps/parser-schema';
import { View } from '@journeyapps/core';
import { Version } from '@journeyapps/parser-common';

export {
  evaluator,
  xml,
  schema,
  view,
  date,
  version,
  applicationParser,
  globalviewParser,
  navParser,
  Schema,
  View,
  Version
};

export { ComponentParserBank as V5ComponentBank } from '@journeyapps/parser-common';
