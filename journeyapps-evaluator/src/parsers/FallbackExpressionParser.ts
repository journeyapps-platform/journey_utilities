import { FunctionTokenExpression } from '../token-expressions';
import { AbstractExpressionParser, ExpressionNodeParseEvent } from './AbstractExpressionParser';
import { Node } from '@babel/types';

export class FallbackExpressionParser extends AbstractExpressionParser<Node, FunctionTokenExpression> {
  parse(event: ExpressionNodeParseEvent): FunctionTokenExpression {
    const { node, source } = event;
    return new FunctionTokenExpression({
      expression: source.slice(node.start, node.end)
    });
  }
}
