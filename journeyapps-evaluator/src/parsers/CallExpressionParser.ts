import { CallExpression } from '@babel/types';
import { FunctionTokenExpression } from '../token-expressions';
import {
  AbstractExpressionParser,
  ExpressionParserFactory,
  ExpressionNodeParseEvent
} from './AbstractExpressionParser';

export class CallExpressionParser extends AbstractExpressionParser<CallExpression, FunctionTokenExpression> {
  parse(event: ExpressionNodeParseEvent<CallExpression>) {
    const { node, source, parseNode } = event;
    const name = source.slice(node.callee.start, node.callee.end);
    const args = node.arguments.map((arg) => parseNode({ node: arg, source: source }));
    return new FunctionTokenExpression({
      expression: source.slice(node.start, node.end),
      name: name,
      arguments: args
    });
  }
}

export class CallExpressionParserFactory extends ExpressionParserFactory<CallExpressionParser> {
  constructor() {
    super('CallExpression');
  }

  getParser() {
    return new CallExpressionParser();
  }
}
