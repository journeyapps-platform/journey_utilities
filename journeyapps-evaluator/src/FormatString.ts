import { TokenExpression } from './token-expressions/TokenExpression';
import { compile, extract, formatValue } from './tools';
import { AttributeValidationError } from '@journeyapps/core-xml';
import { TypeInterface } from './TypeInterface';
import { FormatStringScope } from './FormatStringScope';
import { FunctionTokenExpression } from './token-expressions/FunctionTokenExpression';

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
    this.tokens = compile(this.expression);
    this.type = FormatString.TYPE;
  }

  static isInstanceOf(val: any): val is FormatString {
    return val?.type === FormatString.TYPE;
  }

  toString(): string {
    return this.expression;
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

    var result = into || {};

    var tokens = this.tokens;

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      if (token.isShorthand()) {
        var expression = token.expression;
        extract(type, expression, result, depth);
      }
    }
    return result;
  }

  validate(scopeType: TypeInterface): AttributeValidationError[] {
    var tokens = this.tokens;

    var results: AttributeValidationError[] = [];

    for (var i = 0; i < tokens.length; i++) {
      // validate all shorthand and function token expressions (ignore constant token expressions)
      var token = tokens[i];
      var expression = token.expression;
      if (token.isShorthand()) {
        var warnQuestionMark = false;
        if (expression.length > 0 && expression[0] == '?') {
          expression = expression.substring(1);
          warnQuestionMark = true;
        }

        var type = scopeType.getType(expression);
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
    var tokens = this.tokens;
    var recordings: {
      type: string;
      isPrimitiveType: boolean;
      name: string;
    }[][] = [];

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      if (!token.isConstant()) {
        var expression = token.expression;
        // We are interested in the type and name of the final two variables in the expression
        var arrayOfVariables = scopeType.getVariableTypeAndNameWithParent(expression);
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

  // This helps speed up dirty-checking.
  // With this, we can use "by reference" checking in watches.
  valueOf() {
    return this.expression;
  }

  evaluatePromise(scope: FormatStringScope): Promise<string> {
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

    return Promise.all(promises).then(function (results) {
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
    });
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
        result += token.valueOf();
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
}
