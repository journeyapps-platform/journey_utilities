import { ConditionalExpression } from '@babel/types';
import { FunctionTokenExpression, TernaryFunctionTokenExpression } from '../token-expressions';
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
    return new TernaryFunctionTokenExpression({
      expression: source.slice(node.start, node.end),
      test: args[0],
      consequent: args[1],
      alternate: args[2]
    });
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
