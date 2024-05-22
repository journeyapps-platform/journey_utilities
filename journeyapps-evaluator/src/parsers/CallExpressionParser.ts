import { CallExpression } from '@babel/types';
import { FunctionTokenExpression } from '../token-expressions';
import { AbstractExpressionParser, ExpressionParserFactory, ExpressionNodeEvent } from './AbstractExpressionParser';

export class CallExpressionParser extends AbstractExpressionParser<CallExpression, FunctionTokenExpression> {
  parse(event: ExpressionNodeEvent<CallExpression>) {
    const { node, source, parseNode } = event;
    const name = source.slice(node.callee.start, node.callee.end);
    const args = node.arguments.map((arg) => parseNode(arg, source));
    return new FunctionTokenExpression(source.slice(node.start, node.end), {
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
