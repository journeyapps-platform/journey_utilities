import * as xml from '@journeyapps/core-xml';
import { Parser as Parser1 } from './syncRules1Parser';
import { Parser as Parser2, Serializer as Serializer2 } from './syncRules2Parser';
import { Schema, ObjectType } from '@journeyapps/parser-schema';

// This is currently a validating parser only, and does not return useful
// information. The goal is just to provide some useful validation for the editor.

export function Parser(schema: Schema, userModelName?: string) {
  this.schema = schema;
  this.userModel = schema.objects[userModelName];
  this.errors = [];

  this.buckets = [];
  this.globalBuckets = [];
  this.syncAllBuckets = [];
}

Parser.prototype.pushErrors = function (errors: any[]) {
  for (let i = 0; i < errors.length; i++) {
    const err = errors[i];
    this.errors.push(err);
  }
};

Parser.prototype.pushError = function (element: xml.XMLPositional, message: string, type: xml.ErrorType) {
  this.errors.push(xml.error(element, message, type));
};

Parser.prototype.parse = function (text: string) {
  const document = xml.parse(text);
  this.errors.concat(document.errors);
  const root = document.documentElement;

  if (root.tagName != 'sync') {
    this.pushError(root, '<sync> root tag expected');
    // fatal error
    return this;
  }
  const parsedRoot = xml.parseElement(root, {
    sync: {
      version: xml.attribute.notBlank
    }
  });

  this.pushErrors(parsedRoot.errors);

  let version = parsedRoot.attributes.version;
  if (version == null) {
    version = '1';
  }
  this.version = version;

  let subParser;
  if (version === '2') {
    subParser = new (Parser2 as any)(this);
  } else if (version === '1') {
    subParser = new (Parser1 as any)(this);
  } else {
    this.pushError(root, `version must be "1" or "2"`, 'error');
    return this;
  }

  subParser.parseDocument(document);

  return this;
};

const SIMPLE_EXPRESSION = /^([\w\d_]+)\s+(\S+)\s+(-?\d+|null|true|false|'.*')$/;
const VALID_OPERATORS = ['==', '!=', '>', '<', '>=', '<=', 'lt', 'gt', 'lte', 'gte', 'eq', 'ne'];

/**
 * Normalize operators for serialization / migration.
 */
const NORMALIZE_OPERATOR: { [index: string]: string } = {
  '>': 'gt',
  '<': 'lt',
  '>=': 'gte',
  '<=': 'lte'
};

Parser.prototype.validateCondition = function (condition: string, model: ObjectType, node: xml.XMLPositional) {
  if (condition == null) {
    return;
  }
  const match = SIMPLE_EXPRESSION.exec(condition);
  if (!match) {
    this.pushError(node, 'Invalid condition: ' + condition, 'error');
    return;
  }
  const fieldName = match[1];
  if (model != null && (fieldName in model.attributes || fieldName in model.belongsTo)) {
    // Valid
  } else {
    this.pushError(node, `'${fieldName}' is not defined`, 'error');
  }

  const operator = match[2];
  if (VALID_OPERATORS.indexOf(operator) == -1) {
    this.pushError(node, `Invalid operator: '${operator}'`, 'error');
  }

  const rawValue = match[3];

  const normalizedOperator: string = NORMALIZE_OPERATOR[operator] || operator;

  return `${fieldName} ${normalizedOperator} ${rawValue}`;
};

export { Parser1, Parser2, Serializer2 };
