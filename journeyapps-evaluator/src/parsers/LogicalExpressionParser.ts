import {
  LogicalExpression,
  UnaryExpression,
  isLogicalExpression,
  isBinaryExpression,
  BinaryExpression
} from '@babel/types';
import { FunctionTokenExpression, FunctionTokenExpressionOptions } from '../token-expressions';
import {
  AbstractExpressionParser,
  ExpressionParserFactory,
  ExpressionNodeParseEvent
} from './AbstractExpressionParser';

export type LogicalExpressionType = LogicalExpression | UnaryExpression | BinaryExpression;

export class LogicalExpressionParser extends AbstractExpressionParser<LogicalExpressionType, FunctionTokenExpression> {
  parse(event: ExpressionNodeParseEvent<LogicalExpressionType>) {
    const { node, source, parseNode } = event;

    const options: FunctionTokenExpressionOptions = {
      expression: source.slice(node.start, node.end)
    };

    if (isLogicalExpression(node) || isBinaryExpression(node)) {
      const { left, right, operator } = node;
      options.arguments = [left, right].map((arg) => parseNode({ node: arg, source }));
      options.name = `(function(left, right) { return left ${operator} right; })`;
    }

    return new FunctionTokenExpression(options);
  }
}

export class LogicalExpressionParserFactory extends ExpressionParserFactory<LogicalExpressionParser> {
  constructor() {
    super(['LogicalExpression', 'UnaryExpression', 'BinaryExpression']);
  }

  getParser() {
    return new LogicalExpressionParser();
  }
}
