import { LogicalExpression } from '@babel/types';
import { FunctionTokenExpression } from '../token-expressions';
import {
  AbstractExpressionParser,
  ExpressionParserFactory,
  ExpressionNodeParseEvent
} from './AbstractExpressionParser';

export class LogicalExpressionParser extends AbstractExpressionParser<LogicalExpression, FunctionTokenExpression> {
  parse(event: ExpressionNodeParseEvent<LogicalExpression>) {
    const { node, source, parseNode } = event;

    const { left, right, operator } = node;
    const args = [left, right].map((arg) => parseNode({ node: arg, source }));
    const fnName = `(function(left, right) { return left ${operator} right; })`;
    return new FunctionTokenExpression({
      expression: source.slice(node.start, node.end),
      name: fnName,
      arguments: args
    });
  }
}

export class LogicalExpressionParserFactory extends ExpressionParserFactory<LogicalExpressionParser> {
  constructor() {
    super('LogicalExpression');
  }

  getParser() {
    return new LogicalExpressionParser();
  }
}
