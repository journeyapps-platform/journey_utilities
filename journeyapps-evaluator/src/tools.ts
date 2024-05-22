import { TypeInterface } from './definitions/TypeInterface';
import { FormatString } from './FormatString';
import {
  FormatShorthandTokenExpression,
  FunctionTokenExpression,
  LegacyFunctionTokenExpression,
  ShorthandTokenExpression
} from './token-expressions';

/**
 * Create format string.
 */
export function formatString(expression: string): FormatString | null {
  if (expression == null) {
    return null;
  } else {
    return new FormatString({ expression });
  }
}

/**
 # Construct a function token expression from a raw expression string.
 */
export function functionTokenExpression(expression: string, allowLegacy: boolean = true) {
  if (expression == null) {
    return null;
  }
  if (expression.trim().indexOf(FunctionTokenExpression.PREFIX) === 0) {
    return new FunctionTokenExpression({ expression });
  }
  if (allowLegacy) {
    // assume legacy function token expression (if allowed) at this point
    return new LegacyFunctionTokenExpression({ expression });
  }
  return null;
}

/**
 * Create a token expression that can be evaluated.
 */
export function actionableTokenExpression(
  expression: string
): FunctionTokenExpression | ShorthandTokenExpression | FormatShorthandTokenExpression {
  if (expression == null) {
    return null;
  }
  if (expression.trim().indexOf(FunctionTokenExpression.PREFIX) === 0) {
    return new FunctionTokenExpression({ expression });
  }
  const colon = expression.indexOf(':');
  if (colon == -1) {
    return new ShorthandTokenExpression({ expression });
  }
  return new FormatShorthandTokenExpression({
    expression: expression.substring(0, colon),
    format: expression.substring(colon + 1)
  });
}

/**
 * Format an expression with a specific format.
 */
export function formatValue(value: any, type: TypeInterface, format: string): string {
  if (value == null) {
    return '';
  } else if (type != null) {
    return type.format(value, format);
  } else {
    // This should generally not happen. However, we still try to handle it gracefully.
    // This is useful for tests where we don't want to define the type for every variable.
    return value.toString();
  }
}

export function extract(type: TypeInterface, expression: string, into: any, depth: number) {
  const dot = expression.indexOf('.');
  if (dot < 0) {
    const objectType = getObjectType(type, expression);
    if (objectType == null) {
      // Not an object - don't continue
    } else {
      const b: any = {};
      b[expression] = objectType.displayFormat.extractRelationshipStructure(objectType, depth + 1);
      deepMerge(into, b);
    }
  } else {
    const head = expression.substring(0, dot); // The first part of the expression
    const tail = expression.substring(dot + 1); // The rest of the expression

    const child = getObjectType(type, head);

    if (child == null) {
      // nothing
    } else {
      if (!(head in into)) {
        into[head] = {};
      }
      extract(child, tail, into[head], depth + 1);
    }
  }
}

export function getObjectType(parent: any, name: string) {
  const variable = parent.getAttribute(name);

  if (variable != null) {
    const type = variable.type;
    if (type.isObject) {
      return type;
    }
  }
  return null;
}

// Merge hashes of hashes (no non-hash values)
// Sample:
//   deepMerge({a: {}}, {b: {}}) => {a: {}, b: {}}
//   deepMerge({a: {b: {c: {}}}, d: {}}, {a: {e: {}}}) => {a: {b: {c: {}}, e: {}}, d: {}}
export function deepMerge(a: any, b: any) {
  if (typeof a != 'object' || typeof b != 'object') {
    throw new Error('Parameters must be objects only');
  }
  Object.keys(b).forEach(function (key) {
    if (!(key in a)) {
      // There are no actual "values" here, except for more nested hashes.
      // The presence of keys is the important part.
      a[key] = {};
    }
    deepMerge(a[key], b[key]);
  });
  return a;
}
