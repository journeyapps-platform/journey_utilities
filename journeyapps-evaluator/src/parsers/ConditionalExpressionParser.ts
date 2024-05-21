import { ConditionalExpression, isConditionalExpression, Node } from '@babel/types';
import { FunctionTokenExpression } from '../token-expressions';
import {
  AbstractExpressionParser,
  AbstractExpressionParserFactory,
  ExpressionNodeEvent
} from './AbstractExpressionParser';

export class ConditionalExpressionParser extends AbstractExpressionParser<
  ConditionalExpression,
  FunctionTokenExpression
> {
  parse(event: ExpressionNodeEvent): FunctionTokenExpression {
    const { source, parseNode } = event;
    const { test, consequent, alternate } = this.node;
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

export class ConditionalExpressionParserFactory extends AbstractExpressionParserFactory {
  getParser(node: Node) {
    if (isConditionalExpression(node)) {
      return new ConditionalExpressionParser({ node });
    }
    return null;
  }
}
