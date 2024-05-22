import { AttributeValidationError } from '@journeyapps/core-xml';
import { FormatStringScope } from './definitions/FormatStringScope';
import { TypeInterface } from './definitions/TypeInterface';
import { ConstantTokenExpression, FunctionTokenExpression, TokenExpression } from './token-expressions';
import { TokenExpressionParser } from './TokenExpressionParser';
import { extract, formatValue } from './tools';

/**
 * Construct a new format string expression.
 */
export class FormatString {
  static TYPE = 'format-string';
  type: string;
  expression: string;
  tokens: TokenExpression[];

  constructor(expression: string) {
    this.expression = expression || '';
    this.tokens = FormatString.compile(this.expression);
    this.type = FormatString.TYPE;
  }

  static isInstanceOf(val: any): val is FormatString {
    return val?.type === FormatString.TYPE;
  }

  /**
   * Compile a format string expression into tokens.
   */
  static compile(expression: string): TokenExpression[] {
    const parser = TokenExpressionParser.get();

    let start = 0;
    const tokens: TokenExpression[] = [];
    const len = expression.length;

    while (true) {
      const i = expression.indexOf('{', start);
      if (i < 0 || i == len - 1) {
        // end of string - everything is normal text
        const rest = FormatString.unescape(expression.substring(start));
        if (rest.length > 0) {
          tokens.push(new ConstantTokenExpression(rest, { start }));
        }
        break;
      }
      // normal text in the gaps between curly braces
      const text = FormatString.unescape(expression.substring(start, i));
      if (text.length > 0) {
        tokens.push(new ConstantTokenExpression(text, { start }));
      }
      if (expression[i + 1] == '{') {
        // Double left brace - escape and continue
        tokens.push(new ConstantTokenExpression('{', { start }));
        start = i + 2;
        continue;
      }

      const parsedBraces = FormatString.parseEnclosingBraces(expression.substring(i));
      if (!parsedBraces) {
        // Brace pair faulty (no closing brace), return as a constant
        tokens.push(new ConstantTokenExpression(expression.substring(i), { start }));
        break;
      }

      // Next start is at the end of the currently parsed brace pair
      start = i + parsedBraces.length + 1;

      // `spec` is everything between the curly braces "{" and "}".
      const spec = expression.substring(i + 1, i + parsedBraces.length);

      if (spec.indexOf('?') === 0) {
        throw new Error('Usage of ? in expressions is not supported.');
      }

      const parsedToken = parser.parse(spec);
      if (parsedToken) {
        parsedToken.start = i;
        tokens.push(parsedToken);
      }

      // // test for function token prefix
      // if (spec.trim().indexOf(FunctionTokenExpression.PREFIX) === 0) {
      //   // function token because the function name has "$:" as prefix (leading whitespace is ignored)
      //   tokens.push(new FunctionTokenExpression(spec, { start: i }));
      // } else {
      //   // shorthand token
      //   const colon = spec.indexOf(':');
      //   if (colon == -1) {
      //     tokens.push(new ShorthandTokenExpression(spec, i));
      //   } else {
      //     tokens.push(new FormatShorthandTokenExpression(spec.substring(0, colon), spec.substring(colon + 1), i));
      //   }
      // }
    }

    // concatenate any neighbouring constant token expressions
    const result: TokenExpression[] = [];
    let last: ConstantTokenExpression = null;
    for (let j = 0; j < tokens.length; j++) {
      const token = tokens[j];
      if (token instanceof ConstantTokenExpression) {
        if (last == null) {
          last = token;
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

  /**
   * If the format string is constant (i.e. no values need to be evaluated).
   */
  isConstant(): boolean {
    // constants format strings will only contain a single constant token
    return this.tokens.length == 1 && this.tokens[0].isConstant();
  }

  // Example on an asset:
  // '{room} {room.name} {room.building.name}' => {'room' => {'building' => {}}}
  // This will recursively evaluate format strings where required.
  extractRelationshipStructure(type: TypeInterface, depth?: number, into?: any) {
    if (depth == null) {
      depth = 0;
    } else if (depth > 5) {
      return {};
    }

    const result = into || {};

    const tokens = this.tokens;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.isShorthand()) {
        const expression = token.expression;
        extract(type, expression, result, depth);
      }
    }
    return result;
  }

  validate(scopeType: TypeInterface): AttributeValidationError[] {
    const tokens = this.tokens;

    const results: AttributeValidationError[] = [];

    for (let i = 0; i < tokens.length; i++) {
      // validate all shorthand and function token expressions (ignore constant token expressions)
      const token = tokens[i];
      let expression = token.expression;
      if (token.isShorthand()) {
        let warnQuestionMark = false;
        if (expression.length > 0 && expression[0] == '?') {
          expression = expression.substring(1);
          warnQuestionMark = true;
        }

        const type = scopeType.getType(expression);
        if (type == null) {
          results.push({
            start: token.start + 1,
            end: token.start + 1 + token.expression.length,
            type: 'error',
            message: "'" + token.expression + "' is not defined"
          });
        } else if (warnQuestionMark) {
          results.push({
            start: token.start + 1,
            end: token.start + 2,
            type: 'warning',
            message: 'Usage of ? in expressions is deprecated.'
          });
        }
      }
      if (token.isFunction()) {
        // TODO: validate that function exists in view
      }
    }
    return results;
  }

  validateAndReturnRecordings(scopeType: TypeInterface) {
    const tokens = this.tokens;
    const recordings: {
      type: string;
      isPrimitiveType: boolean;
      name: string;
    }[][] = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (!token.isConstant()) {
        const expression = token.expression;
        // We are interested in the type and name of the final two variables in the expression
        const arrayOfVariables = scopeType.getVariableTypeAndNameWithParent(expression);
        if (arrayOfVariables[0] == null && scopeType.name != 'view') {
          // This can happen in, e.g., an object table where the attribute is on its own as a property
          arrayOfVariables[0] = {
            // Override to the scopeType
            type: scopeType.name,
            isPrimitiveType: scopeType.isPrimitiveType,
            name: 'n/a'
          };
        }
        recordings.push(arrayOfVariables);
      }
    }
    return recordings;
  }

  getConstantValue(): any {
    if (!this.isConstant()) {
      throw new Error('Not constant!');
    }
    return this.tokens[0].valueOf();
  }

  async evaluatePromise(scope: FormatStringScope): Promise<string> {
    const tokens = this.tokens;
    let promises = [];
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.isConstant()) {
        // Constant tokens are skipped here (nothing to evaluate).
      } else {
        const promise = token.tokenEvaluatePromise(scope);
        promises.push(promise);
      }
    }

    let results = await Promise.all(promises);
    let result = '';
    let promiseIndex = 0;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.isConstant()) {
        result += token.valueOf();
      } else {
        result += results[promiseIndex];
        promiseIndex += 1;
      }
    }
    return result;
  }

  /**
   * If not all values are loaded yet, null is returned.
   */
  evaluate(scope: FormatStringScope): string {
    const tokens = this.tokens;

    let result = '';
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.isConstant()) {
        result += `${token.valueOf()}`;
      } else if (token.isFunction()) {
        // Not supported - return the original expression
        result += (token as FunctionTokenExpression).toConstant(true).valueOf();
      } else {
        let expression = token.expression;
        if (expression.length > 0 && expression[0] == '?') {
          expression = expression.substring(1);
        }
        const value = scope.getValue(expression);
        if (value === undefined) {
          // Still loading
          return null;
        } else {
          const type = scope.getExpressionType(expression);
          const text = formatValue(value, type, token.format);
          result += text;
        }
      }
    }
    return result;
  }

  // This helps speed up dirty-checking.
  // With this, we can use "by reference" checking in watches.
  valueOf() {
    return this.expression;
  }

  toString(): string {
    return this.expression;
  }

  static parseEnclosingBraces(format: string) {
    const i = format.indexOf('{');
    if (i === -1) {
      return null;
    }
    // We want to skip through these sections
    // i.e. do not match { in a string, e.g. "{"
    const SPECIAL_SECTIONS = ["'", '"'];

    for (let k = i + 1; k < format.length; k++) {
      const character = format[k];

      if (SPECIAL_SECTIONS.indexOf(character) !== -1) {
        // This is the start of a string, jump to its end
        const endChar = format.indexOf(character, k + 1);
        if (endChar === -1) {
          // Unless the end doesn't exist. Error out.
          return null;
        }
        k = endChar;
        continue;
      }

      if (character === '{') {
        // Start of a pair of inner braces,
        // recursively parse them
        const inner = FormatString.parseEnclosingBraces(format.substring(k));
        if (!inner) {
          // Faulty inner, return null
          return null;
        }
        k += inner.length;
        continue;
      }

      if (character === '}') {
        // Found closing part for current level of braces
        // Return the length to the caller
        return { length: k - i };
      }
    }
    // Came to end of loop without a match. Faulty, return null
    return null;
  }

  static unescape(s: string) {
    let start = 0;
    let result = '';
    const len = s.length;
    while (true) {
      const i = s.indexOf('}', start);
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
}

export const parseEnclosingBraces = FormatString.parseEnclosingBraces;
