// Unescape double closing braces to a single brace
import { TokenExpression } from './token-expressions/TokenExpression';
import { ConstantTokenExpression } from './token-expressions/ConstantTokenExpression';
import { FunctionTokenExpression } from './token-expressions/FunctionTokenExpression';
import { ShorthandTokenExpression } from './token-expressions/ShorthandTokenExpression';
import { FormatShorthandTokenExpression } from './token-expressions/FormatShorthandTokenExpression';
import { FormatString } from './format-string/FormatString';
import { TypeInterface } from './definitions/TypeInterface';
import { LegacyFunctionTokenExpression } from './token-expressions/LegacyFunctionTokenExpression';

export function unescape(s: string) {
  var start = 0;
  var result = '';
  var len = s.length;
  while (true) {
    var i = s.indexOf('}', start);
    if (i == -1 || i == len - 1) {
      result += s.substring(start);
      break;
    }
    result += s.substring(start, i + 1);
    // We assume that the character at i+1 is another right brace, but we don't do any checking.
    start = i + 2;
  }
  return result;
}

export function parseEnclosingBraces(format: string) {
  var i = format.indexOf('{');
  if (i == -1) {
    return null;
  }

  // We want to skip through these sections
  // i.e. do not match { in a string, e.g. "{"
  var SPECIAL_SECTIONS = ["'", '"'];

  for (var k = i + 1; k < format.length; k++) {
    var character = format[k];
    if (SPECIAL_SECTIONS.indexOf(character) != -1) {
      // This is the start of a string, jump to its end
      var endChar = format.indexOf(character, k + 1);
      if (endChar == -1) {
        // Unless the end doesn't exist. Error out.
        return null;
      }
      k = endChar;
      continue;
    }
    if (character == '{') {
      // Start of pair of inner braces,
      // recursively parse them
      var inner = parseEnclosingBraces(format.substring(k));
      if (!inner) {
        // Faulty inner, return null
        return null;
      }
      k += inner.length;
      continue;
    }
    if (character == '}') {
      // Found closing part for current level of braces
      // Return the length to the caller
      return {
        length: k - i
      };
    }
  }
  // Came to end of loop without a match. Faulty, return null
  return null;
}

/**
 * Compile a format string expression into tokens.
 * @param {string} format string expression
 * @return {TokenExpression[]} compiled tokens
 */
export function compile(format: string) {
  let start = 0;

  let tokens: TokenExpression[] = [];

  let len = format.length;
  while (true) {
    const i = format.indexOf('{', start);
    if (i < 0 || i == len - 1) {
      // end of string - everything is normal text
      tokens.push(new ConstantTokenExpression(unescape(format.substring(start)), start));
      break;
    }
    // normal text in the gaps between curly braces
    tokens.push(new ConstantTokenExpression(unescape(format.substring(start, i)), start));
    if (format[i + 1] == '{') {
      // Double left brace - escape and continue
      tokens.push(new ConstantTokenExpression('{', start));
      start = i + 2;
      continue;
    }

    const parsedBraces = parseEnclosingBraces(format.substring(i));
    if (!parsedBraces) {
      // Brace pair faulty (no closing brace), return as a constant
      tokens.push(new ConstantTokenExpression(format.substring(i), start));
      break;
    }

    // Next start is at the end of the currently parsed brace pair
    start = i + parsedBraces.length + 1;

    // `spec` is everything between the curly braces "{" and "}".
    const spec = format.substring(i + 1, i + parsedBraces.length);

    // test for function token prefix
    if (spec.trim().indexOf(FunctionTokenExpression.PREFIX) === 0) {
      // function token because the function name has "$:" as prefix (leading whitespace is ignored)
      tokens.push(new FunctionTokenExpression(spec, i));
    } else {
      // shorthand token
      const colon = spec.indexOf(':');
      if (colon == -1) {
        tokens.push(new ShorthandTokenExpression(spec, i));
      } else {
        tokens.push(new FormatShorthandTokenExpression(spec.substring(0, colon), spec.substring(colon + 1), i));
      }
    }
  }

  // concatenate any neighbouring constant token expressions
  let result: TokenExpression[] = [];
  let last: ConstantTokenExpression = null;
  for (var j = 0; j < tokens.length; j++) {
    var token = tokens[j];
    if (token instanceof ConstantTokenExpression) {
      if (last == null) {
        if (token.expression.length > 0) {
          last = token;
        }
      } else {
        last = last.concat(token);
      }
    } else {
      if (last != null) {
        result.push(last);
        last = null;
      }
      result.push(token);
    }
  }
  if (last != null) {
    result.push(last);
  }

  return result;
}

export function getObjectType(parent: any, name: string) {
  var variable = parent.getAttribute(name);

  if (variable != null) {
    var type = variable.type;
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

export function extract(type: any, expression: string, into: any, depth: number) {
  var dot = expression.indexOf('.');
  if (dot < 0) {
    var objectType = getObjectType(type, expression);
    if (objectType == null) {
      // Not an object - don't continue
    } else {
      var b: any = {};
      b[expression] = objectType.displayFormat.extractRelationshipStructure(objectType, depth + 1);
      deepMerge(into, b);
    }
  } else {
    var head = expression.substring(0, dot); // The first part of the expression
    var tail = expression.substring(dot + 1); // The rest of the expression

    var child = getObjectType(type, head);

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

/**
 * Create format string.
 */
export function formatString(expression: string): FormatString | null {
  if (expression == null) {
    return null;
  } else {
    return new FormatString(expression);
  }
}

/**
 # Construct a function token expression from a raw expression string.
 * @param {string} expression
 * @param {boolean} [allowLegacy=true] if legacy function token expressions are allowed (defaults to true)
 * @return {FunctionTokenExpression|LegacyFunctionTokenExpression|null}
 */
export function functionTokenExpression(expression: string, allowLegacy?: boolean) {
  if (typeof allowLegacy === 'undefined' || allowLegacy == null) {
    allowLegacy = true; // default value
  }
  if (expression == null) {
    return null;
  }
  if (expression.trim().indexOf(FunctionTokenExpression.PREFIX) === 0) {
    return new FunctionTokenExpression(expression);
  }
  if (allowLegacy) {
    // assume legacy function token expression (if allowed) at this point
    return new LegacyFunctionTokenExpression(expression);
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
    return new FunctionTokenExpression(expression);
  }
  var colon = expression.indexOf(':');
  if (colon == -1) {
    return new ShorthandTokenExpression(expression);
  }
  return new FormatShorthandTokenExpression(expression.substring(0, colon), expression.substring(colon + 1));
}

// Format an expression with a specific format.
// Return a promise resolving with the formatted value.
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

export async function formatValueAsync(value: any, type: TypeInterface, format: string): Promise<string> {
  if (value != null && typeof value._display == 'function') {
    // Object - recursive promise-based formatting.
    return value._display() as Promise<string>;
  } else {
    return formatValue(value, type, format);
  }
}

// Expose internal functions for tests
export { compile as _compile, deepMerge as _deepMerge };
