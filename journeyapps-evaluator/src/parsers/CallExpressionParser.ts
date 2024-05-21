import { CallExpression, isCallExpression, Node } from '@babel/types';
import { FunctionTokenExpression } from '../token-expressions';
import {
  AbstractExpressionParser,
  AbstractExpressionParserFactory,
  ExpressionNodeEvent
} from './AbstractExpressionParser';

export class CallExpressionParser extends AbstractExpressionParser<CallExpression, FunctionTokenExpression> {
  parse(event: ExpressionNodeEvent) {
    const { node } = this;
    const { source, parseNode } = event;
    const name = source.slice(node.callee.start, node.callee.end);
    const args = node.arguments.map((arg) => parseNode(arg, source));
    return new FunctionTokenExpression(source.slice(node.start, node.end), {
      name: name,
      arguments: args
    });
  }
}

export class CallExpressionParserFactory extends AbstractExpressionParserFactory {
  getParser(node: Node) {
    if (isCallExpression(node)) {
      return new CallExpressionParser({ node });
    }
    return null;
  }
}
