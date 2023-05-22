import { TypeInterface } from '../definitions/TypeInterface';

export interface FormatStringScope {
  /**
   * Get the type of an expression.
   *
   * @param expression An expression that may be chained, e.g. some.value.here.
   * @return The type, or null if not found.
   */
  getExpressionType(expression: string): TypeInterface;

  /**
   * Get the value of an expression.
   *
   * If the expression depends on a Promise that is not resolved yet, return `undefined`.
   *
   * @param expression An expression that may be chained, e.g. some.value.here.
   */
  getValue(expression: string): any;

  /**
   * Get the value of an expression as a Promise.
   *
   * @param expression An expression that may be chained, e.g. some.value.here.
   */
  getValuePromise(expression: string): Promise<any>;

  /**
   * Get the value of $: function expression, as a Promise.
   *
   * @param expression A JavaScript expression (everything after the $:).
   */
  evaluateFunctionExpression(expression: string): Promise<any>;
}
