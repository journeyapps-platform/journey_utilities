import { ConditionalExpression } from '@babel/types';
import { FunctionTokenExpression } from '../token-expressions';
import { AbstractExpressionParser, ExpressionParserFactory, ExpressionNodeEvent } from './AbstractExpressionParser';

export class ConditionalExpressionParser extends AbstractExpressionParser<
  ConditionalExpression,
  FunctionTokenExpression
> {
  parse(event: ExpressionNodeEvent<ConditionalExpression>): FunctionTokenExpression {
    const { node, source, parseNode } = event;
    const { test, consequent, alternate } = node;
    const args = [test, consequent, alternate].map((arg) => parseNode(arg, source));
    const argStrings = [
      source.slice(test.start, test.end),
      source.slice(consequent.start, consequent.end),
      source.slice(alternate.start, alternate.end)
    ];
    const expression = `(function(test, consequent, alternate) { return test ? consequent : alternate; })(${argStrings.join(
      ', '
    )})`;
    return new FunctionTokenExpression(expression, { arguments: args });
  }
}

export class ConditionalExpressionParserFactory extends ExpressionParserFactory<ConditionalExpressionParser> {
  constructor() {
    super('ConditionalExpression');
  }

  getParser() {
    return new ConditionalExpressionParser();
  }
}
