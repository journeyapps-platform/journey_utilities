import { ConditionalExpression } from '@babel/types';
import { FunctionTokenExpression } from '../token-expressions';
import {
  AbstractExpressionParser,
  ExpressionParserFactory,
  ExpressionNodeParseEvent
} from './AbstractExpressionParser';

export class ConditionalExpressionParser extends AbstractExpressionParser<
  ConditionalExpression,
  FunctionTokenExpression
> {
  parse(event: ExpressionNodeParseEvent<ConditionalExpression>): FunctionTokenExpression {
    const { node, source, parseNode } = event;
    const { test, consequent, alternate } = node;
    const args = [test, consequent, alternate].map((arg) => parseNode({ node: arg, source }));
    const argStrings = [
      source.slice(test.start, test.end),
      source.slice(consequent.start, consequent.end),
      source.slice(alternate.start, alternate.end)
    ];
    const fnName = `(function(test, consequent, alternate) { return test ? consequent : alternate; })`;
    const expression = `${fnName}(${argStrings.join(', ')})`;
    return new FunctionTokenExpression({ expression: expression, name: fnName, arguments: args });
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
